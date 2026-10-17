import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { handleRequest, negotiate } from '../agent-support/worker.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const homeBytes = await readFile(resolve(root, 'index.html'));
const markdownBytes = await readFile(resolve(root, 'index.md'));

const cases = [
  [null, 'html'], ['', null], ['*/*', 'html'], ['text/*', 'html'],
  ['text/markdown', 'markdown'], ['text/html', 'html'],
  ['TEXT/MARKDOWN; Q=1', 'markdown'],
  ['text/markdown, text/html', 'markdown'], ['text/html, text/markdown', 'html'],
  ['text/markdown;q=0.9,text/html;q=0.1', 'markdown'],
  ['text/markdown;q=0.1,text/html;q=0.9', 'html'],
  ['text/markdown;q=0,text/html', 'html'],
  ['text/markdown;q=0,*/*;q=1', 'html'],
  ['text/html;q=0,*/*;q=1', 'markdown'],
  ['text/markdown;q=0,text/*;q=0.8,*/*;q=1', 'html'],
  ['text/markdown;q=0.2,text/*;q=0.8', 'html'],
  ['text/html;q=0,text/markdown;q=0,*/*;q=1', null],
  ['text/markdown;q=0', null], ['*/*;q=0', null],
  ['application/json', null], ['application/markdown', null],
  ['text/markdownx', null], ['application/x-text/markdown', null],
  ['text/markdown;charset=utf-8', 'markdown'],
  ['text/markdown;CHARSET="UTF-8"', 'markdown'],
  ['text/markdown;', 'markdown'], ['text/markdown;;charset=utf-8;q=1;', 'markdown'],
  ['text/markdown;charset=iso-8859-1,text/html;q=0.5', 'html'],
  ['text/markdown;variant=unknown,text/html', 'html'],
  ['text/markdown;variant="a,b;c",text/html', 'html'],
  ['text/markdown;q=1.1,text/html', 'html'],
  ['text/markdown;q=-1,text/html', 'html'],
  ['text/markdown;q=0.1234,text/html', 'html'],
  ['text/markdown;q=invalid,text/html', 'html'],
  ['text/markdown;q=1;q=0,text/html', 'html'],
  ['text/markdown;charset=utf-8;q=0,text/markdown;q=1,text/html;q=0.5', 'html'],
  ['text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 'html'],
];
for (const [accept, expected] of cases) {
  test(`Accept ${JSON.stringify(accept)} selects ${expected}`, () => assert.equal(negotiate(accept), expected));
}

async function origin(request) {
  const url = new URL(request.url);
  if (url.hostname === 'ridanip.com') {
    url.hostname = 'www.ridanip.com';
    return new Response(null, { status: 301, headers: { Location: url.href } });
  }
  const path = resolve(root, '.' + decodeURIComponent(url.pathname));
  if (path !== root && !path.startsWith(root + sep)) return new Response('Forbidden', { status: 403 });
  let target = path;
  try {
    if ((await stat(target)).isDirectory()) {
      if (!url.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { Location: url.pathname + '/' + url.search } });
      target = resolve(target, 'index.html');
    }
    const bytes = await readFile(target);
    const type = target.endsWith('.html') ? 'text/html; charset=utf-8' :
      target.endsWith('.xml') ? 'application/xml' : 'text/plain; charset=utf-8';
    return new Response(request.method === 'HEAD' ? null : bytes, {
      status: 200, headers: { 'Content-Type': type, 'Vary': 'Accept-Encoding',
        'Cache-Control': 'max-age=600', 'ETag': '"origin-html"', 'Last-Modified': 'Sat, 17 Oct 2026 19:00:00 GMT' }
    });
  } catch {
    return new Response(request.method === 'HEAD' ? null : '<!DOCTYPE html><html><body>File not found</body></html>', {
      status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Vary': 'Accept-Encoding',
        'ETag': '"html-error"', 'Content-Encoding': 'identity',
        'Content-Length': String(Buffer.byteLength('<!DOCTYPE html><html><body>File not found</body></html>')) }
    });
  }
}

const request = (path = '/', accept = 'text/markdown', method = 'GET', headers = {}) =>
  new Request('https://www.ridanip.com' + path, { method, headers: { Accept: accept, ...headers } });
const vary = (response) => {
  const values = response.headers.get('Vary').toLowerCase().split(',').map((s) => s.trim());
  assert(values.includes('accept') && values.includes('accept-encoding'));
  assert.equal(values.filter((v) => v === 'accept').length, 1);
};

test('homepage Markdown has its actual body, media type, Vary and discovery links', async () => {
  for (const path of ['/', '/?source=test', '/index.html']) {
    const response = await handleRequest(request(path), origin);
    assert.equal(response.status, 200); vary(response);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(await response.text(), markdownBytes.toString());
    assert.match(response.headers.get('Link'), /rel="alternate"/);
    assert.match(response.headers.get('Link'), /llms.txt.*rel="describedby"/);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    for (const header of ['ETag', 'Last-Modified', 'Content-Length', 'Content-Encoding']) assert.equal(response.headers.get(header), null);
  }
});

test('browser and wildcard requests preserve the exact homepage body', async () => {
  for (const accept of ['text/html', '*/*', 'text/markdown;q=0,text/html']) {
    const response = await handleRequest(request('/', accept), origin);
    assert.equal(response.status, 200); vary(response);
    assert.equal(await response.text(), homeBytes.toString());
    assert.equal(response.headers.get('ETag'), '"origin-html"');
  }
});

test('HTML validators and ranges cannot turn a Markdown request into 304 or 206', async () => {
  const calls = [];
  const fetchOrigin = async (r) => {
    calls.push(r);
    if (r.headers.has('If-None-Match')) return new Response(null, { status: 304 });
    if (r.headers.has('Range')) return new Response('partial', { status: 206 });
    return origin(r);
  };
  const response = await handleRequest(request('/', 'text/markdown', 'GET', {
    'If-None-Match': '"origin-html"', 'If-Modified-Since': 'Sat, 17 Oct 2026 19:00:00 GMT', Range: 'bytes=0-10'
  }), fetchOrigin);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), markdownBytes.toString());
  assert.equal(new URL(calls[1].url).pathname, '/index.md');
  assert.equal(calls[1].headers.has('If-None-Match'), false);
});

test('HTML conditional requests keep 304 and the negotiation metadata', async () => {
  const response = await handleRequest(request('/', 'text/html'), async () =>
    new Response(null, { status: 304, headers: { Vary: 'Accept-Encoding', ETag: '"html"' } }));
  assert.equal(response.status, 304); vary(response);
  assert.equal(await response.text(), '');
});

test('Markdown 404s keep the status and give explanatory text and recovery links', async () => {
  for (const path of ['/__ora-404-probe-pnnsuelp', '/nested/missing.html', '/missing.css', '/<script>']) {
    const response = await handleRequest(request(path), origin);
    assert.equal(response.status, 404); vary(response);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    const body = await response.text();
    assert(body.length >= 20); assert.match(body, /^# 404/); assert.match(body, /\]\(https:\/\/www.ridanip.com\/llms.txt\)/);
    assert.equal(body.includes('<script>'), false);
    for (const header of ['ETag', 'Content-Length', 'Content-Encoding']) assert.equal(response.headers.get(header), null);
  }
});

test('HTML 404 body remains unchanged; q=0 excludes the Markdown error', async () => {
  const response = await handleRequest(request('/missing', 'text/markdown;q=0,text/html'), origin);
  const upstream = await origin(request('/missing', 'text/html'));
  assert.equal(response.status, 404); vary(response);
  assert.equal(await response.text(), await upstream.text());
});

test('HEAD has the same negotiated type and status with no response body', async () => {
  for (const [path, status] of [['/', 200], ['/missing', 404]]) {
    const response = await handleRequest(request(path, 'text/markdown', 'HEAD'), origin);
    assert.equal(response.status, status); vary(response);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(await response.text(), '');
  }
});

test('unsupported homepage types receive 406 and available representations', async () => {
  const response = await handleRequest(request('/', 'application/json'), origin);
  assert.equal(response.status, 406); vary(response);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(await response.text(), /text\/html or text\/markdown/);
});

test('canonical and slash redirects keep status, location and query', async () => {
  let response = await handleRequest(new Request('https://ridanip.com/?source=test', { headers: { Accept: 'text/markdown' } }), origin);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://www.ridanip.com/?source=test');
  response = await handleRequest(request('/contact?source=test'), origin);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), '/contact/?source=test');
});

test('existing pages, assets, contact form and POST behaviour pass through', async () => {
  for (const path of ['/contact/', '/services/patents/', '/assets/site.css', '/assets/site.js', '/favicon.ico', '/robots.txt', '/sitemap.xml', '/site.webmanifest', '/llms.txt']) {
    const response = await handleRequest(request(path, 'text/html'), origin);
    const expected = await origin(request(path, 'text/html'));
    assert.equal(response.status, expected.status);
    assert.deepEqual(await response.arrayBuffer(), await expected.arrayBuffer());
  }
  const post = new Request('https://www.ridanip.com/contact/', { method: 'POST', body: 'unchanged' });
  let received;
  const response = await handleRequest(post, async (r) => { received = r; return new Response(null, { status: 405 }); });
  assert.equal(response.status, 405); assert.equal(received, post);
  assert.equal(await received.text(), 'unchanged');
});

test('direct Markdown is labelled correctly without changing its bytes', async () => {
  const response = await handleRequest(request('/index.md'), origin);
  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  assert.equal(await response.text(), markdownBytes.toString());
});

test('missing, empty or HTML Markdown source produces an honest 503', async () => {
  for (const bad of [null, '', '   ', '<!DOCTYPE html><html>wrong</html>', '# Mislabelled\n<html>wrong</html>']) {
    const response = await handleRequest(request(), async (r) => {
      if (new URL(r.url).pathname === '/index.md') return new Response(bad, { status: bad === null ? 404 : 200 });
      return origin(r);
    });
    assert.equal(response.status, 503);
    assert.match(await response.text(), /temporarily unavailable/);
  }
});

test('origin outages retain their actual error status', async () => {
  for (const status of [403, 500, 502, 503]) {
    const response = await handleRequest(request(), async () => new Response('origin unavailable', { status }));
    assert.equal(response.status, status); assert.equal(await response.text(), 'origin unavailable');
  }
});

test('Vary merging is case-insensitive and preserves a wildcard', async () => {
  for (const value of ['accept-encoding, aCcEpT', '*']) {
    const response = await handleRequest(request('/', 'text/html'), async () =>
      new Response(homeBytes, { headers: { Vary: value } }));
    assert.equal(response.headers.get('Vary'), value);
  }
});

test('llms.txt follows the ordered H1, summary and linked H2 file-list format', async () => {
  const text = await readFile(resolve(root, 'llms.txt'), 'utf8');
  assert.match(text, /^# RIDAN IP\n\n> [^\n]+\n\n/);
  assert.equal((text.match(/^# /gm) || []).length, 1);
  const sections = text.split(/^## /m).slice(1);
  assert(sections[0].startsWith('When to use this\n'));
  for (const section of sections) {
    const lines = section.split('\n').slice(1).filter(Boolean);
    assert(lines.length > 0);
    for (const line of lines) assert.match(line, /^- \[[^\]]+\]\(https:\/\/[^)]+\)(?:: .+)?$/);
  }
  assert.match(text, /conflict checks/); assert.match(text, /user's authorisation/);
  assert.match(text, /website does not submit/);
});

test('all local pages and machine files pass the full HTTP verifier through the handler', async () => {
  // Simulate GitHub's text line-ending normalisation; leave binary bytes exact.
  const deployedOrigin = async (request) => {
    const upstream = await origin(request);
    const path = new URL(request.url).pathname;
    if (request.method === 'HEAD' || !(path.endsWith('/') || /\.(html|md|txt|xml|css|js|svg|webmanifest)$/.test(path))) return upstream;
    const headers = new Headers(upstream.headers);
    headers.delete('Content-Length');
    return new Response((await upstream.text()).replace(/\r\n/g, '\n'), {
      status: upstream.status, headers
    });
  };
  const server = createServer(async (req, res) => {
    try {
      const response = await handleRequest(new Request('http://' + req.headers.host + req.url,
        { method: req.method, headers: req.headers }), deployedOrigin);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { res.writeHead(500); res.end(error.message); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  try {
    const result = await new Promise((done, reject) => {
      const child = spawn('python3', [resolve(root, 'scripts/verify-agent-readiness.py'),
        '--base-url', `http://127.0.0.1:${server.address().port}`], { cwd: root });
      let output = '';
      child.stdout.on('data', (data) => { output += data; });
      child.stderr.on('data', (data) => { output += data; });
      child.on('error', reject); child.on('close', (code) => done({ code, output }));
    });
    assert.equal(result.code, 0, result.output);
    console.log(result.output.trim());
  } finally { await new Promise((done) => server.close(done)); }
});
