#!/usr/bin/env python3
"""V069.0 HTTP checks. Python 3.11+, standard library only; does not deploy."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORG_ID = "https://www.ridanip.com/#organization"
PERSON_ID = "https://www.ridanip.com/#ritchie-daniel"


def same_content(actual, expected, file):
    # Git may normalise Windows line endings between an uploaded ZIP and Pages.
    # This is not a content change; binary assets must still match byte for byte.
    text_extensions = {".html", ".md", ".txt", ".xml", ".css", ".js", ".svg", ".json", ".webmanifest"}
    if file.suffix in text_extensions:
        return actual.replace(b"\r\n", b"\n") == expected.replace(b"\r\n", b"\n")
    return actual == expected


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts, self.current = [], None

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("type") == "application/ld+json":
            self.current = []

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.current is not None:
            self.scripts.append(json.loads("".join(self.current)))
            self.current = None


def objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child)


def check_schema(body):
    page = Page()
    page.feed(body.decode("utf-8"))
    for node in objects(page.scripts):
        types = node.get("@type", [])
        types = [types] if isinstance(types, str) else types
        if node.get("@id") == ORG_ID and types:
            assert "Organization" in types and "LegalService" in types, "RIDAN organisation types"
            address = node.get("address", {})
            assert address.get("@type") == "PostalAddress", "PostalAddress missing"
            assert all(address.get(k) for k in ("streetAddress", "addressLocality", "postalCode", "addressCountry")), "Incomplete address"
            contact = node.get("contactPoint", {})
            assert contact.get("@type") == "ContactPoint", "ContactPoint missing"
            assert all(contact.get(k) for k in ("contactType", "email", "telephone")), "Incomplete contactPoint"
        if node.get("@id") == PERSON_ID and "Person" in types:
            assert len(node.get("description", "").strip()) >= 20, "Person description missing"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://www.ridanip.com")
    parser.add_argument("--alias", action="append", default=[])
    parser.add_argument("--timeout", type=float, default=15)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    bases = [args.base_url.rstrip("/"), *[a.rstrip("/") for a in args.alias]]
    if args.base_url.rstrip("/") == "https://www.ridanip.com" and not args.alias:
        bases.append("https://ridanip.com")

    def fetch(path, accept="*/*", method="GET", base=None):
        url = (base or bases[0]) + path
        request = urllib.request.Request(url, method=method, headers={
            "Accept": accept, "User-Agent": "RIDAN-IP-Agent-Readiness-Verification/1.0"
        })
        try:
            response = urllib.request.urlopen(request, timeout=args.timeout)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, response.read(), response.geturl()

    def markdown(body):
        text = body.decode("utf-8")
        assert text.startswith("# ") and len(text.strip()) >= 20, "Nonempty Markdown body missing"
        assert not re.search(r"<!doctype\s+html|<html\b", text, re.I), "HTML body returned as Markdown"

    def varied(headers):
        assert "accept" in [x.strip().lower() for x in headers.get("Vary", "").split(",")], "Vary: Accept missing"

    jobs = []

    def add(name, callback):
        jobs.append((name, callback))

    # All existing public files, including every sitemap route, assets,
    # domain-verification files and machine-readable files. Tooling is excluded.
    excluded = {"agent-support", "scripts", "tests"}
    for file in sorted(ROOT.rglob("*")):
        if not file.is_file():
            continue
        relative = file.relative_to(ROOT)
        if relative.parts[0] in excluded or any(p.startswith(".") for p in relative.parts) or file.name == "README.md":
            continue
        if file.name == "CNAME":  # GitHub Pages configuration, not website content.
            continue
        path = "/" + relative.as_posix()
        if file.name == "index.html":
            path = "/" + relative.parent.as_posix().replace(".", "").strip("/")
            path = path.rstrip("/") + "/"

        def public_file(path=path, file=file):
            status, headers, body, _ = fetch(path)
            assert status == 200, f"Expected 200, got {status}"
            # With */*, content must match the release, including browser pages.
            assert same_content(body, file.read_bytes(), file), "Published content differs from V069.0 files"
            if file.suffix == ".html":
                assert headers.get_content_type() == "text/html", "HTML Content-Type missing"
                check_schema(body)
            elif file.name == "sitemap.xml":
                tree = ET.fromstring(body)
                assert tree.tag == "{http://www.sitemaps.org/schemas/sitemap/0.9}urlset", "Sitemap namespace"
            elif file.name == "site.webmanifest":
                assert json.loads(body)["name"] == "RIDAN IP", "Invalid webmanifest"
            elif file.name == "llms.txt":
                text = body.decode("utf-8")
                assert text.startswith("# RIDAN IP\n\n> "), "llms.txt opening format"
                assert "## When to use this" in text and "## How an agent should contact RIDAN IP" in text, "Agent instructions missing"
        add(f"GET {path}", public_file)

    sitemap = ET.parse(ROOT / "sitemap.xml")
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_paths = {urllib.parse.urlsplit(n.text).path for n in sitemap.findall("sm:url/sm:loc", ns)}
    source_paths = {"/" if p.parent == ROOT else "/" + p.parent.relative_to(ROOT).as_posix() + "/" for p in ROOT.rglob("index.html")}
    assert sitemap_paths == source_paths, "Sitemap and public pages differ"

    # Every local destination advertised by either new machine-readable file.
    links = set()
    for file in (ROOT / "llms.txt", ROOT / "index.md"):
        for link in re.findall(r"\]\(([^)]+)\)", file.read_text()):
            parsed = urllib.parse.urlsplit(link)
            if parsed.hostname in ("www.ridanip.com", "ridanip.com"):
                links.add(parsed.path or "/")
    for path in sorted(links):
        def linked(path=path):
            status, _, body, _ = fetch(path)
            assert status == 200 and body, f"Advertised link failed: HTTP {status}"
        add(f"Guidance link {path}", linked)

    cases = [
        ("text/markdown", 200, "text/markdown"),
        ("text/html", 200, "text/html"),
        ("text/markdown, text/html;q=0.8", 200, "text/markdown"),
        ("text/markdown;q=0.5, text/html;q=0.9", 200, "text/html"),
        ("text/markdown;q=0, */*;q=0.5", 200, "text/html"),
        ("text/html;q=0, */*;q=0.5", 200, "text/markdown"),
        ("text/*", 200, "text/html"),
        ("*/*", 200, "text/html"),
        ("application/json", 406, "text/plain"),
        ("text/html;q=0, text/markdown;q=0", 406, "text/plain"),
    ]
    for base in bases:
        for accept, expected_status, expected_type in cases:
            def home(base=base, accept=accept, expected_status=expected_status, expected_type=expected_type):
                status, headers, body, final_url = fetch("/", accept, base=base)
                assert status == expected_status, f"Expected {expected_status}, got {status}"
                assert urllib.parse.urlsplit(final_url).path in ("", "/"), "Homepage redirected to a different resource"
                assert headers.get_content_type() == expected_type, f"Wrong Content-Type: {headers.get('Content-Type')}"
                varied(headers)
                if expected_type == "text/markdown":
                    markdown(body)
                    assert same_content(body, (ROOT / "index.md").read_bytes(), ROOT / "index.md"), "Wrong Markdown homepage"
                elif expected_type == "text/html":
                    assert same_content(body, (ROOT / "index.html").read_bytes(), ROOT / "index.html"), "Homepage HTML changed"
                else:
                    assert "text/html" in body.decode() and "text/markdown" in body.decode(), "406 alternatives missing"
            add(f"{base}/ Accept: {accept}", home)

        for path in ("/__ora-404-probe-pnnsuelp", "/__ridan-agent-probe__/missing.html"):
            for accept in ("text/markdown", "text/html"):
                def missing(base=base, path=path, accept=accept):
                    status, headers, body, _ = fetch(path, accept, base=base)
                    assert status == 404, f"Expected final 404, got {status}"
                    assert headers.get_content_type() == accept, f"Wrong 404 Content-Type: {headers.get('Content-Type')}"
                    varied(headers)
                    if accept == "text/markdown":
                        markdown(body)
                        assert "https://www.ridanip.com/llms.txt" in body.decode(), "404 recovery link missing"
                add(f"{base}{path} Accept: {accept}", missing)

        for path, status in (("/", 200), ("/__ora-404-probe-pnnsuelp", 404)):
            def head(base=base, path=path, expected_status=status):
                status, headers, body, _ = fetch(path, "text/markdown", "HEAD", base)
                assert status == expected_status and not body, "HEAD status/body mismatch"
                assert headers.get_content_type() == "text/markdown", "HEAD Markdown Content-Type"
                varied(headers)
            add(f"HEAD {base}{path}", head)

        def repeat(base=base):
            for accept in ("text/markdown", "text/html", "text/markdown", "text/html"):
                status, headers, body, _ = fetch("/", accept, base=base)
                assert status == 200 and headers.get_content_type() == accept, "Representation cache collision"
                expected = ROOT / ("index.md" if accept == "text/markdown" else "index.html")
                assert same_content(body, expected.read_bytes(), expected), "Representation content changed after alternating requests"
        add(f"Alternating representations {base}/", repeat)

    def run(job):
        name, callback = job
        try:
            callback()
            return {"check": name, "passed": True}
        except Exception as error:
            return {"check": name, "passed": False, "error": str(error)}

    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(run, jobs))
    failed = [r for r in results if not r["passed"]]
    report = {"bases": bases, "passed": len(results) - len(failed), "failed": len(failed), "results": results}
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + "\n")
    print(f"{report['passed']}/{len(results)} checks passed; {len(failed)} failed.")
    for result in failed:
        print(f"FAIL {result['check']}: {result['error']}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
