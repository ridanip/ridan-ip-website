// V069.0: attach as Worker Routes in front of the existing GitHub Pages origin.
// Do not use Worker Custom Domains: fetch(request) must reach the DNS origin.
const GUIDANCE = '<https://www.ridanip.com/llms.txt>; rel="describedby"';
const ALTERNATE = '<https://www.ridanip.com/index.md>; rel="alternate"; type="text/markdown"';
const NOT_FOUND = '# 404: Page not found\n\nThe requested page does not exist on the RIDAN IP website.\n\nSee [agent guidance](https://www.ridanip.com/llms.txt), the [sitemap](https://www.ridanip.com/sitemap.xml) or the [homepage](https://www.ridanip.com/).\n';

// Delimiters inside quoted media-type parameters are not list separators.
function splitQuoted(value, delimiter) {
  const parts = [];
  let start = 0, quoted = false, escaped = false;
  for (let i = 0; i < value.length; i++) {
    if (escaped) { escaped = false; continue; }
    if (quoted && value[i] === '\\') { escaped = true; continue; }
    if (value[i] === '"') quoted = !quoted;
    if (!quoted && value[i] === delimiter) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (quoted || escaped) return [];
  parts.push(value.slice(start).trim());
  return parts;
}

const TOKEN = /^[!#$%&'*+\-.^_`|~0-9a-z]+$/i;

function parseAccept(value) {
  return splitQuoted(value, ',').flatMap((entry, index) => {
    const [media, ...rawParams] = splitQuoted(entry, ';');
    if (!media) return [];
    const [type, subtype, extra] = media.toLowerCase().split('/');
    if (!type || !subtype || extra || !TOKEN.test(type) || !TOKEN.test(subtype) ||
        (type === '*' && subtype !== '*') ||
        (type.includes('*') && type !== '*') || (subtype.includes('*') && subtype !== '*')) return [];
    const params = new Map();
    let q = 1, hasQ = false;
    for (const parameter of rawParams) {
      if (!parameter) continue; // RFC 9110 parameters allows an empty ';' member.
      const equal = parameter.indexOf('=');
      if (equal < 1) return [];
      const key = parameter.slice(0, equal).trim().toLowerCase();
      let val = parameter.slice(equal + 1).trim();
      if (!TOKEN.test(key)) return [];
      if (key === 'q') {
        // RFC 9110 quality values: 0..1 and at most three decimal places.
        if (hasQ || !/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(val)) return [];
        hasQ = true; q = Number(val); continue;
      }
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/\\(.)/g, '$1');
      } else if (!TOKEN.test(val)) return [];
      if (params.has(key)) return [];
      params.set(key, val);
    }
    return [{ type, subtype, params, q, index }];
  });
}

// For each representation the most specific matching range determines its q.
// Thus text/markdown;q=0 cannot be overridden by a positive text/* or */*.
export function negotiate(accept) {
  if (accept === null) return 'html';
  const ranges = parseAccept(accept);
  const options = ['html', 'markdown'].map((subtype) => {
    const matches = ranges.filter((r) =>
      (r.type === '*' || r.type === 'text') &&
      (r.subtype === '*' || r.subtype === subtype) &&
      [...r.params].every(([k, v]) => k === 'charset' && v.toLowerCase() === 'utf-8')
    ).map((r) => ({ ...r, specificity: r.type === '*' ? 0 : r.subtype === '*' ? 1 : 2 }));
    matches.sort((a, b) => b.specificity - a.specificity ||
      b.params.size - a.params.size || b.q - a.q || a.index - b.index);
    return { representation: subtype, ...(matches[0] || { q: 0, specificity: -1, params: new Map(), index: Infinity }) };
  });
  options.sort((a, b) => b.q - a.q || b.specificity - a.specificity ||
    b.params.size - a.params.size || a.index - b.index);
  return options[0].q > 0 ? options[0].representation : null;
}

function addVary(headers) {
  const tokens = (headers.get('Vary') || '').split(',').map((v) => v.trim()).filter(Boolean);
  if (!tokens.some((v) => v === '*' || v.toLowerCase() === 'accept')) tokens.push('Accept');
  headers.set('Vary', tokens.join(', '));
}

function described(response, { vary = false, alternate = false } = {}) {
  const headers = new Headers(response.headers);
  if (vary) addVary(headers);
  const additions = [GUIDANCE, ...(alternate ? [ALTERNATE] : [])];
  for (const link of additions) {
    if (!(headers.get('Link') || '').includes(link)) headers.append('Link', link);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function generated(request, body, status, type = 'text/markdown', baseHeaders) {
  // Never reuse HTML entity validators, compression or length for new bytes.
  const headers = new Headers(baseHeaders);
  for (const name of ['ETag', 'Last-Modified', 'Content-Encoding', 'Content-Length',
    'Content-Range', 'Accept-Ranges', 'Content-Location', 'Age', 'Expires']) headers.delete(name);
  headers.set('Content-Type', `${type}; charset=utf-8`);
  // Small, infrequent agent responses need no second shared representation cache.
  headers.set('Cache-Control', 'no-store');
  return described(new Response(request.method === 'HEAD' ? null : body, { status, headers }),
    { vary: true, alternate: status !== 404 });
}

export async function handleRequest(request, fetchOrigin = fetch) {
  if (!['GET', 'HEAD'].includes(request.method)) return fetchOrigin(request);
  const url = new URL(request.url);
  const home = url.pathname === '/' || url.pathname === '/index.html';
  const selected = negotiate(request.headers.get('Accept'));
  const originHeaders = new Headers(request.headers);
  if (home && selected !== 'html') {
    // A validator/range from an HTML visit must not suppress a Markdown body.
    for (const name of ['If-None-Match', 'If-Modified-Since', 'If-Match',
      'If-Unmodified-Since', 'If-Range', 'Range']) originHeaders.delete(name);
  }
  const upstream = await fetchOrigin(new Request(request, { headers: originHeaders, redirect: 'manual' }));

  // Preserve canonical, HTTPS and trailing-slash redirects and upstream errors.
  if (upstream.status >= 300 && upstream.status < 400 && upstream.status !== 304) return upstream;
  if (upstream.status === 404) {
    if (selected === 'markdown') {
      if (upstream.body) await upstream.body.cancel();
      return generated(request, NOT_FOUND, 404, 'text/markdown', upstream.headers);
    }
    return described(upstream, { vary: true });
  }
  if (home && [200, 304].includes(upstream.status)) {
    if (selected === 'html') return described(upstream, { vary: true, alternate: true });
    if (upstream.body) await upstream.body.cancel();
    if (!selected) return generated(request,
      'This homepage is available as text/html or text/markdown. Please request one of these representations.\n',
      406, 'text/plain', upstream.headers);
    const markdownURL = new URL('/index.md', url);
    // Worker Routes send this same-zone subrequest to GitHub Pages, not back to this handler.
    const markdown = await fetchOrigin(new Request(markdownURL, {
      headers: { Accept: 'text/plain' }, redirect: 'manual'
    }));
    const body = markdown.status === 200 ? await markdown.text() : '';
    if (!body.trim().startsWith('# ') || /<!doctype\s+html|<html\b/i.test(body)) {
      return generated(request,
        '# Markdown temporarily unavailable\n\nPlease retry later or read [agent guidance](https://www.ridanip.com/llms.txt).\n',
        503, 'text/markdown', upstream.headers);
    }
    return generated(request, body, 200, 'text/markdown', upstream.headers);
  }
  if (url.pathname === '/index.md' && upstream.status === 200) {
    const result = described(upstream);
    result.headers.set('Content-Type', 'text/markdown; charset=utf-8');
    return result;
  }
  return upstream;
}

export default { fetch: (request) => handleRequest(request) };
