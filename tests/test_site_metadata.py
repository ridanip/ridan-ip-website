"""Homepage metadata and sitemap regression checks. No network access required."""
from copy import deepcopy
from datetime import date, timedelta
import importlib.util
import json
from pathlib import Path
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("readiness", ROOT / "scripts/verify-agent-readiness.py")
readiness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(readiness)
HOME = (ROOT / "index.html").read_bytes()
SITEMAP = (ROOT / "sitemap.xml").read_bytes()
NS = readiness.SITEMAP_NS


def changed_graph(change):
    text = HOME.decode("utf-8")
    match = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', text, re.S)
    data = json.loads(match[2])
    change(data["@graph"])
    return (text[:match.start(2)] + json.dumps(data) + text[match.end(2):]).encode("utf-8")


def changed_sitemap(change):
    tree = ET.fromstring(SITEMAP)
    change(tree)
    return ET.tostring(tree, encoding="utf-8")


def webpage(graph):
    return next(node for node in graph if node.get("@type") == "WebPage")


class HomepageMetadataTests(unittest.TestCase):
    def test_homepage_metadata_and_existing_entities_are_valid(self):
        readiness.check_schema(HOME)
        readiness.check_homepage(HOME)

    def test_missing_or_inconsistent_descriptions_are_rejected(self):
        for attribute in (b'name="description"', b'property="og:description"', b'name="twitter:description"'):
            with self.subTest(attribute=attribute), self.assertRaises(AssertionError):
                readiness.check_homepage(HOME.replace(attribute, attribute.replace(b'description', b'unused'), 1))

    def test_missing_webpage_is_rejected(self):
        with self.assertRaisesRegex(AssertionError, "one WebPage"):
            readiness.check_homepage(changed_graph(lambda graph: graph.remove(webpage(graph))))

    def test_webpage_identity_language_and_description_must_match_the_page(self):
        for key, value in (("url", "https://www.ridanip.com/about/"), ("inLanguage", "en-US"), ("description", "Unrelated description")):
            with self.subTest(key=key), self.assertRaises(AssertionError):
                readiness.check_homepage(changed_graph(lambda graph: webpage(graph).update({key: value})))

    def test_webpage_references_must_resolve_to_the_existing_organisation(self):
        for key in ("mainEntity", "publisher"):
            with self.subTest(key=key), self.assertRaisesRegex(AssertionError, "existing organisation"):
                readiness.check_homepage(changed_graph(lambda graph: webpage(graph).update({key: {"@id": "https://www.ridanip.com/#missing"}})))

    def test_duplicate_identity_definitions_are_rejected(self):
        with self.assertRaisesRegex(AssertionError, "missing or duplicated"):
            readiness.check_homepage(changed_graph(lambda graph: graph.append(deepcopy(next(node for node in graph if node.get("@id") == readiness.ORG_ID)))))


class SitemapMetadataTests(unittest.TestCase):
    def test_every_public_page_has_a_valid_sitemap_date(self):
        readiness.check_sitemap(SITEMAP)
        tree = ET.fromstring(SITEMAP)
        locations = {entry.find(NS + "loc").text for entry in tree}
        pages = {"https://www.ridanip.com/" + ("" if file.parent == ROOT else file.parent.relative_to(ROOT).as_posix() + "/") for file in ROOT.rglob("index.html") if not any(part.startswith(".") for part in file.relative_to(ROOT).parts)}
        self.assertEqual(locations, pages)

    def test_missing_and_duplicate_lastmod_are_rejected(self):
        def remove(tree):
            tree[0].remove(tree[0].find(NS + "lastmod"))

        def duplicate(tree):
            tree[0].append(deepcopy(tree[0].find(NS + "lastmod")))

        for change in (remove, duplicate):
            with self.subTest(change=change.__name__), self.assertRaisesRegex(AssertionError, "one lastmod"):
                readiness.check_sitemap(changed_sitemap(change))

    def test_invalid_and_future_dates_are_rejected(self):
        for value in ("17/10/2026", "2026-02-30", (date.today() + timedelta(days=1)).isoformat()):
            with self.subTest(value=value), self.assertRaises(AssertionError):
                readiness.check_sitemap(changed_sitemap(lambda tree: setattr(tree[0].find(NS + "lastmod"), "text", value)))

    def test_duplicate_or_noncanonical_urls_are_rejected(self):
        def duplicate(tree):
            tree.append(deepcopy(tree[0]))

        def noncanonical(tree):
            tree[0].find(NS + "loc").text = "https://ridanip.com/"

        for change in (duplicate, noncanonical):
            with self.subTest(change=change.__name__), self.assertRaises(AssertionError):
                readiness.check_sitemap(changed_sitemap(change))


if __name__ == "__main__":
    unittest.main()
