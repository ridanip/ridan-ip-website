#!/usr/bin/env python3
"""Check the static website without dependencies, a build step or network access."""
from collections import Counter, defaultdict
from datetime import date
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.ridanip.com/'
RESTRICTIVE = re.compile(r'\b(?:noindex|nofollow|noai|noimageai|none)\b', re.I)
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.url = BASE + ('' if path.parent == ROOT else path.parent.relative_to(ROOT).as_posix() + '/')
        self.meta = defaultdict(list)
        self.links, self.images, self.scripts, self.headings = [], [], [], []
        self.ids, self.labels = [], []
        self.title, self.language, self.h1, self.mains = '', None, 0, 0
        self.in_title, self.script = False, None
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'): self.ids.append(attrs['id'])
        if tag == 'html': self.language = attrs.get('lang')
        if tag == 'main': self.mains += 1
        if tag == 'h1': self.h1 += 1
        if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']: self.headings.append(int(tag[1]))
        if tag == 'title': self.in_title = True
        if tag == 'meta':
            key = attrs.get('name') or attrs.get('property') or attrs.get('http-equiv')
            if key: self.meta[key.lower()].append(attrs.get('content', ''))
        if tag in ['a', 'link', 'script', 'img']:
            if 'href' in attrs or 'src' in attrs: self.links.append((tag, attrs))
        if tag == 'img':
            self.images.append(attrs)
            for item in attrs.get('srcset', '').split(','):
                if item.strip(): self.links.append(('img', {'src': item.strip().split()[0]}))
        if tag == 'label' and attrs.get('for'): self.labels.append(attrs['for'])
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.script = []

    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.script is not None: self.script.append(data)

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script' and self.script is not None:
            self.scripts.append(json.loads(''.join(self.script)))
            self.script = None


def objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values(): yield from objects(child)
    elif isinstance(value, list):
        for child in value: yield from objects(child)


def main():
    failures, checks = [], 0

    def check(condition, message):
        nonlocal checks
        checks += 1
        if not condition: failures.append(message)

    pages = {}
    for path in sorted(ROOT.rglob('index.html')):
        if any(p.startswith('.') for p in path.relative_to(ROOT).parts): continue
        page = Page(path)
        pages[page.url] = page
    definitions = defaultdict(list)
    for url, page in pages.items():
        label = str(page.path.relative_to(ROOT))
        check(page.h1 == 1 and page.mains == 1, f'{label}: needs one H1 and one main')
        check(page.language == 'en-GB', f'{label}: language differs')
        check(page.title.strip() and len(page.meta['description']) == 1 and page.meta['description'][0].strip(), f'{label}: missing title or description')
        check(len(page.ids) == len(set(page.ids)), f'{label}: duplicate IDs')
        for before, after in zip(page.headings, page.headings[1:]):
            check(after <= before + 1, f'{label}: heading level jumps from {before} to {after}')
        for key, values in page.meta.items():
            if 'robots' in key or key.endswith('bot') or key in ['noai', 'noimageai']:
                check(key not in ['noai', 'noimageai'] and not RESTRICTIVE.search(' '.join(values)), f'{label}: restrictive meta directive in {key}')
        canonical = [a.get('href') for t, a in page.links if t == 'link' and a.get('rel') == 'canonical']
        check(canonical == [url], f'{label}: incorrect canonical')
        for key, expected in [('og:title', page.title), ('twitter:title', page.title), ('og:url', url), ('og:locale', 'en_GB'), ('og:description', page.meta['description'][0]), ('twitter:description', page.meta['description'][0])]:
            check(page.meta[key] == [expected], f'{label}: inconsistent {key}')
        check(any(t == 'link' and a.get('rel') == 'manifest' for t, a in page.links), f'{label}: manifest link missing')
        check(any(t == 'link' and a.get('rel') == 'icon' for t, a in page.links), f'{label}: favicon missing')
        for image in page.images: check('alt' in image, f'{label}: image alt missing')
        for target in page.labels: check(target in page.ids, f'{label}: label target {target} missing')
        for tag, attrs in page.links:
            target = attrs.get('href', attrs.get('src', ''))
            parsed = urlsplit(urljoin(url, target))
            if parsed.scheme not in ['http', 'https'] or parsed.netloc not in ['www.ridanip.com', 'ridanip.com']: continue
            path = ROOT / unquote(parsed.path).lstrip('/')
            if path.is_dir(): path = path / 'index.html'
            check(path.is_file(), f'{label}: missing local target {target}')
            if parsed.fragment and path.name == 'index.html':
                target_page = pages.get(BASE + ('' if path.parent == ROOT else path.parent.relative_to(ROOT).as_posix() + '/'))
                check(target_page and unquote(parsed.fragment) in target_page.ids, f'{label}: missing fragment {target}')
        all_nodes = list(objects(page.scripts))
        webpages = [n for n in all_nodes if n.get('@type') == 'WebPage']
        check(len(webpages) == 1, f'{label}: needs one WebPage entity')
        if webpages:
            wp = webpages[0]
            check(wp.get('@id') == url+'#webpage' and wp.get('url') == url, f'{label}: WebPage identity differs')
            check(wp.get('name') == page.title and wp.get('description') == page.meta['description'][0], f'{label}: WebPage metadata differs')
            check(wp.get('isPartOf') == {'@id':BASE+'#website'} and wp.get('inLanguage') == 'en-GB', f'{label}: website/language relationship differs')
        for node in all_nodes:
            if node.get('@id') and node.get('@type'): definitions[node['@id']].append(node)
            if node.get('@type') == 'BreadcrumbList':
                items = node.get('itemListElement', [])
                check([x.get('position') for x in items] == list(range(1, len(items)+1)), f'{label}: breadcrumb positions')
                check(items and items[-1].get('item') == url, f'{label}: breadcrumb URL differs')
            if node.get('@type') == 'Service':
                # Offers may contain a reference plus a name; the full service is on its page.
                if node.get('provider'): check(node['provider'] == {'@id':BASE+'#organization'}, f'{label}: Service provider differs')
            if node.get('@type') == 'Article':
                check(node.get('author', {}).get('@id') == BASE+'#ritchie-daniel', f'{label}: article author differs')
                check(node.get('mainEntityOfPage') == {'@id':url+'#webpage'}, f'{label}: Article page differs')
    for field in ['title', 'description']:
        values = [p.title if field == 'title' else p.meta['description'][0] for p in pages.values()]
        check(len(set(values)) == len(values), f'Duplicate {field}')
    for identifier, copies in definitions.items():
        for key in ['name', 'legalName', 'url', 'description', 'jobTitle', 'address', 'telephone', 'email', 'contactPoint', 'honorificPrefix']:
            values = {json.dumps(n[key], sort_keys=True) for n in copies if key in n}
            check(len(values) <= 1, f'Conflicting {key} definitions: {identifier}')
    for page in pages.values():
        for node in objects(page.scripts):
            identifier = node.get('@id', '')
            if identifier.startswith(BASE): check(identifier in definitions, f'Undefined entity reference: {identifier}')
    tree = ET.parse(ROOT/'sitemap.xml')
    urls = [entry.find(NS+'loc').text for entry in tree.getroot()]
    check(len(urls) == len(set(urls)) and set(urls) == set(pages), 'Sitemap must contain exactly the canonical public pages')
    for entry in tree.getroot():
        modified = date.fromisoformat(entry.find(NS+'lastmod').text)
        check(modified <= date.today(), 'Future sitemap date')
    for filename in ['llms.txt', 'index.md']:
        for target in re.findall(r'\]\((https://www\.ridanip\.com/[^)]*)\)', (ROOT/filename).read_text()):
            path = ROOT/urlsplit(target).path.lstrip('/')
            check(path.is_file() or (path/'index.html').is_file(), f'{filename}: missing target {target}')
    robottext = (ROOT/'robots.txt').read_text()
    check('Sitemap: '+BASE+'sitemap.xml' in robottext, 'Robots sitemap link differs')
    manifest = json.loads((ROOT/'site.webmanifest').read_text())
    for icon in manifest['icons']: check((ROOT/icon['src'].lstrip('/')).is_file(), 'Manifest icon missing')
    check((ROOT/'CNAME').read_text().strip() == 'www.ridanip.com', 'GitHub Pages domain differs')
    check((ROOT/'.nojekyll').is_file(), 'Static GitHub Pages deployment marker missing')
    print(f'{checks-len(failures)}/{checks} checks passed across {len(pages)} public pages; {len(failures)} failed.')
    print('Checked metadata, indexability directives, headings, links, assets, JSON-LD syntax and relationships, sitemap, guidance and deployment files.')
    for failure in failures: print('FAIL:', failure)
    return bool(failures)


if __name__ == '__main__':
    sys.exit(main())
