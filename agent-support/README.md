# V069.0: Agent readiness

This is a twelve-file patch over V068.1. Apply the ZIP contents at the existing
repository root, preserving the paths. It does not contain the unchanged site
or Git history. No stylesheet, browser JavaScript, visible HTML body, existing
URL, sitemap, robots file, CNAME or IndexNow workflow is changed.

## What works on GitHub Pages after uploading the patch

- `/llms.txt`: specific service-selection guidance, contact instructions and
  links, following the published llms.txt H1/summary/H2 file-list structure.
- `/index.md`: a standalone Markdown representation of the homepage.
- Existing homepage HTML: invisible `alternate` and `describedby` discovery links.
- Business schema: the same RIDAN entity explicitly retains `LegalService`
  and adds `Organization`, a `ContactPoint` with email, telephone and contact
  type, and its existing `PostalAddress` wherever the business is defined.
- Ritchie's five typed `Person` definitions: the same factual description.

The only existing files changed are:

1. `index.html`
2. `about/index.html`
3. `mechanical-engineering-patent-attorney/index.html`
4. `articles/can-i-use-ai-to-draft-my-patent-application/index.html`
5. `articles/ip-audit-funding-for-uk-smes/index.html`

The seven new files are `llms.txt`, `index.md`, the three files in
`agent-support/`, `tests/agent-readiness.test.mjs` and
`scripts/verify-agent-readiness.py`.

## What also requires the proxy to be enabled

GitHub Pages cannot choose responses using `Accept` or configure these response
headers from repository files. Uploading this ZIP alone does **not** implement
the two HTTP audit requirements. No `_headers`, `.htaccess` or browser script
can provide them on GitHub Pages.

The supplied Cloudflare Worker is a small proxy in front of GitHub Pages:

- `GET /` and `/index.html`: negotiate HTML or Markdown, including quality
  values, wildcard matches, UTF-8 parameters and explicit `q=0` exclusions.
- Missing `Accept`, `*/*`, ordinary browser preferences: preserve HTML.
- No acceptable homepage representation: return 406 with available types.
- Nonexistent paths: retain the origin's 404; return a Markdown explanation
  and recovery links when Markdown is preferred. HTML 404 bodies are preserved.
- Negotiated responses include `Vary: Accept`, merged with existing `Vary`
  values. HEAD has the same status and type as GET, without a body.
- Generated Markdown and 406 responses use `Cache-Control: no-store`. Origin
  fetches for HTML and `/index.md` remain on separate URLs. HTML validators,
  ranges, lengths and compression metadata are never reused for Markdown.
- Canonical/HTTPS/slash redirects, successful non-homepage content, other
  request methods and upstream failures pass through. Existing service and
  article pages continue serving HTML. This patch does not add a public API.
- A missing, empty or HTML `/index.md` produces an explicit 503 rather than
  silently returning an incorrect representation.

## Deployment decision and credentials

The proxy configuration is prepared but is not deployed by applying the ZIP.
Enabling it requires control of the domain's DNS and a Cloudflare account with
the active `ridanip.com` zone. Domain registration can remain at Porkbun.

1. Apply the patch to the GitHub Pages repository and let its normal publication
   complete. Confirm `/llms.txt` and `/index.md` are accessible before enabling
   the proxy. Keep `CNAME` and the GitHub Pages custom domain unchanged.
2. If DNS is moved to Cloudflare, reproduce all existing records first,
   including Microsoft 365 MX, SPF, DKIM, DMARC and domain-verification records.
   The website origin records for apex and `www` must continue pointing to
   GitHub Pages, and both website hostnames must be proxied by Cloudflare.
3. Use Full (strict) TLS to the existing HTTPS origin. Disable any separate
   automatic HTML-to-Markdown conversion on these routes; this Worker supplies
   the representation. Use **Worker Routes**, not Worker Custom Domains:
   `fetch(request)` on a Route reaches the existing DNS origin.
4. In an authenticated terminal, from the repository root:

   ```sh
   npx wrangler@4.151.1 login
   npx wrangler@4.151.1 deploy --config agent-support/wrangler.toml
   ```

   The account must be authorised to deploy Workers and edit routes for
   `ridanip.com`. If the account has multiple Cloudflare accounts, select the
   account holding that zone. No account ID, API token or secret belongs in the
   website ZIP. `workers.dev` and preview URLs are disabled in the configuration.
5. Purge any old homepage/error cache entries, then run the public verification
   command below. Check both `www.ridanip.com` and `ridanip.com`. DNS routing,
   certificates, Cloudflare settings and the final public audit cannot be
   verified until the proxy has actually been enabled.

To remove the proxy, remove its two Worker Routes. GitHub Pages continues
serving the site. The new guidance, schema and standalone Markdown file remain
usable, but the two negotiated HTTP requirements will no longer pass.

## Verification

Requirements: Node.js 22 or later and Python 3.11 or later. The tests and HTTP
verifier use only their standard libraries; there is no application package
installation or site build step.

```sh
node --test tests/agent-readiness.test.mjs
python3 scripts/verify-agent-readiness.py
```

The test suite checks request preferences, bodies, redirects, response metadata,
HEAD, 404, 406, missing Markdown, origin failures, existing content and llms.txt
format. It also runs the full HTTP verifier against a local HTTP adapter of the
actual handler and release files. The adapter emulates the static origin; it
does not emulate Cloudflare DNS, TLS, caching rules or its deployed runtime.

Release validation also included a Wrangler 4.151.1 deployment dry run and the
same 116 HTTP checks against the unmodified Worker in Cloudflare's local runtime,
using a static-origin binding. These passed. The Node suite contains 53 tests.
The live production site was inspected but has not been changed by this patch.

The public verifier defaults to both production hostnames. It checks every
public release file, every sitemap page and internal guidance destination,
schema definitions, new machine-readable files, negotiation, error bodies,
HEAD and alternating HTML/Markdown responses. It exits nonzero on any failed
check. It checks **bodies as well as headers**. A 200 or 404 status by itself
is insufficient. It compares published content to the release to detect
incomplete or stale deployment. Text comparisons allow Git's CRLF-to-LF line
ending normalisation; binary comparisons are exact.

```sh
# Optional JSON report, saved outside the website:
python3 scripts/verify-agent-readiness.py --report ../ridan-agent-checks.json

# Focused manual checks: inspect final headers AND body after redirects.
curl -sS -L -i -H 'Accept: text/markdown' https://www.ridanip.com/
curl -sS -L -i -H 'Accept: text/html' https://www.ridanip.com/
curl -sS -L -i -H 'Accept: text/markdown' https://ridanip.com/__ora-404-probe-pnnsuelp
```

Expected final responses: 200 `text/markdown` and `Vary: Accept` with a real
Markdown homepage; 200 `text/html` with the existing homepage; and 404
`text/markdown` with an explanation and guidance/sitemap links.

The release has not been published merely because local checks pass. Do not
claim a new Is Agentic score until the deployed site has been rescanned.

## Future maintenance

When changing homepage copy or service/contact details, keep `index.md`,
`llms.txt` and the relevant JSON-LD consistent. Run the tests before publication
and the public verifier afterwards. The supplied HTTP script expects to run
from this full repository after applying the patch, not from the patch ZIP in
isolation.

## Protocol references

- [llms.txt specification](https://llmstxt.org/)
- [Markdown negotiation](https://acceptmarkdown.com/start)
- [HTTP Accept and Vary semantics: RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Markdown media type: RFC 7763](https://www.rfc-editor.org/rfc/rfc7763.html)
- [Schema.org Organization](https://schema.org/Organization),
  [LegalService](https://schema.org/LegalService) and [Person](https://schema.org/Person)
- [Cloudflare Worker Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
