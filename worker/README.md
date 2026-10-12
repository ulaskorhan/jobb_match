# Worker: fetch a job ad from a link

A small [Cloudflare Worker](https://developers.cloudflare.com/workers/) that lets jobbmatch fetch a job ad from a link.

**Why it exists:** browsers block one website from reading another website's page (CORS), so the app cannot fetch finn.no or arbeidsplassen.nav.no directly. The worker fetches the page on the server side and returns only the job title and description as plain text.

**How it finds the text:** it first looks for the page's machine-readable `JobPosting` block (`application/ld+json`). If there is none, it uses the visible text on the page.

**Security:**
- Only `https` links on `finn.no` and `arbeidsplassen.nav.no` are fetched, including after redirects, so the worker cannot be used as an open proxy.
- Only `https://ulaskorhan.github.io` can call it from the browser (CORS allow-list).
- The worker stores nothing. Pages are capped at 2 MB, and the returned text at 20 000 characters.

## Deploy
1. Create a free account at cloudflare.com, then go to **Workers & Pages → Create → Create Worker**.
2. Give it a name, click **Deploy**, then **Edit code**. Replace the code with `worker.js`, and click **Deploy** again.
3. Copy the worker's address (`https://<name>.<account>.workers.dev`) into `FETCH_API_URL` at the top of the link section in `script.js`.
