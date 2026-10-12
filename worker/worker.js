// jobbmatch – fetch a job ad from a link
//
// Runs as a Cloudflare Worker (a small server function).
// Why it is needed: browsers block one website from reading another website's
// page (CORS). This worker fetches the job page on the server side and returns
// only the job description as plain text.
//
// Call it like this:  GET https://<worker-url>/?url=<link to job ad>
// It returns JSON:    { "title": "...", "text": "..." }  or  { "error": "..." }

// Only these sites can be fetched. Without this list anyone could use the
// worker to fetch any address on the internet (an "open proxy").
const ALLOWED_HOSTS = ['www.finn.no', 'finn.no', 'arbeidsplassen.nav.no'];

// Only these websites may call the worker from the browser.
const ALLOWED_ORIGINS = ['https://ulaskorhan.github.io', 'http://localhost:8000'];

const MAX_HTML_LENGTH = 2_000_000; // ignore pages larger than about 2 MB
const MAX_TEXT_LENGTH = 20_000;    // never return more than 20 000 characters

export default {
    async fetch(request) {
        const origin = request.headers.get('Origin') || '';

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }
        if (request.method !== 'GET') {
            return jsonResponse({ error: 'Kun GET er tillatt.' }, 405, origin);
        }

        // 1. Read and check the link
        const link = new URL(request.url).searchParams.get('url');
        const target = parseAllowedUrl(link);
        if (!target) {
            return jsonResponse({ error: 'Lenken må være en annonse på finn.no eller arbeidsplassen.nav.no.' }, 400, origin);
        }

        // 2. Fetch the job page
        let page;
        try {
            page = await fetch(target.href, {
                headers: { 'User-Agent': 'jobbmatch/1.0 (+https://github.com/ulaskorhan/jobb_match)' },
                signal: AbortSignal.timeout(8000),
            });
        } catch {
            return jsonResponse({ error: 'Klarte ikke å hente siden. Prøv igjen, eller lim inn teksten.' }, 502, origin);
        }

        // A redirect could lead to another site, so check the final address too
        if (!parseAllowedUrl(page.url)) {
            return jsonResponse({ error: 'Siden sendte oss videre til et annet nettsted.' }, 400, origin);
        }
        if (!page.ok) {
            return jsonResponse({ error: `Siden svarte med feil (${page.status}). Er annonsen fortsatt aktiv?` }, 502, origin);
        }

        const html = (await page.text()).slice(0, MAX_HTML_LENGTH);

        // 3. Pull out the job description
        const result = extractJobAd(html);
        if (!result.text) {
            return jsonResponse({ error: 'Fant ingen annonsetekst på siden. Lim inn teksten i stedet.' }, 422, origin);
        }

        return jsonResponse({
            title: result.title.slice(0, 300),
            text: result.text.slice(0, MAX_TEXT_LENGTH),
        }, 200, origin);
    },
};

// Returns a URL object if the link is https and on an allowed site, otherwise null
export function parseAllowedUrl(link) {
    try {
        const url = new URL(link);
        if (url.protocol !== 'https:') return null;
        if (!ALLOWED_HOSTS.includes(url.hostname)) return null;
        return url;
    } catch {
        return null; // not a valid URL at all
    }
}

// Finds the job title and description in the page's HTML.
// Method 1: many job sites include a hidden, machine-readable block
//   (<script type="application/ld+json">) with "@type": "JobPosting".
//   That gives exactly the job description, so we try it first.
// Method 2: if there is no such block, use all visible text on the page.
export function extractJobAd(html) {
    const jsonBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonBlocks) {
        try {
            const posting = findJobPosting(JSON.parse(match[1]));
            if (posting && posting.description) {
                // The description is often HTML written as codes (&lt;p&gt;),
                // so turn the codes back into tags first, then remove the tags.
                return {
                    title: htmlToText(decodeEntities(String(posting.title || ''))),
                    text: htmlToText(decodeEntities(String(posting.description))),
                };
            }
        } catch {
            // Invalid JSON: ignore this block and try the next one
        }
    }

    // No JobPosting block: use the visible text and remove known page clutter
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    return {
        title: titleMatch ? htmlToText(titleMatch[1]) : '',
        text: removeClutter(htmlToText(mainMatch ? mainMatch[1] : html)),
    };
}

// Buttons and labels from finn.no and arbeidsplassen.nav.no that are not part of the ad.
// A line is removed if it starts with one of these.
const CLUTTER_LINE_STARTS = [
    'FINN Jobb', 'Legg til som favoritt', 'Del annonse', 'Del på', 'Kopier lenke',
    'Fristen er utløpt', 'JobbMatch', 'Søk på jobben', 'Gå til søknad', 'Annonsedata',
    'Rapporter annonse', 'Sist endret', 'Hentet fra', 'Referanse', 'Annonsenummer', '?%',
];

export function removeClutter(text) {
    // Everything after "Lignende annonser" is a list of other jobs
    const cut = text.indexOf('Lignende annonser');
    if (cut !== -1) text = text.slice(0, cut);

    return text
        .split('\n')
        .filter(line => !CLUTTER_LINE_STARTS.some(start => line.startsWith(start)))
        .filter(line => !line.includes('god match for denne stillingen'))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// The JSON can be one object, a list, or an object with a "@graph" list
function findJobPosting(data) {
    if (Array.isArray(data)) {
        for (const item of data) {
            const found = findJobPosting(item);
            if (found) return found;
        }
        return null;
    }
    if (data && typeof data === 'object') {
        const type = data['@type'];
        if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return data;
        if (data['@graph']) return findJobPosting(data['@graph']);
    }
    return null;
}

// Turns HTML into readable plain text
export function htmlToText(html) {
    return decodeEntities(
        html
            // remove parts that are never job text
            .replace(/<(script|style|noscript|svg|nav|header|footer|form|button)\b[\s\S]*?<\/\1>/gi, ' ')
            // keep line breaks where the page had blocks or list items
            .replace(/<(br|\/p|\/div|\/h[1-6]|\/tr|\/section|\/article)\b[^>]*>/gi, '\n')
            .replace(/<li\b[^>]*>/gi, '\n• ')
            // remove all remaining tags
            .replace(/<[^>]+>/g, ' ')
    )
        .replace(/[ \t ]+/g, ' ')       // many spaces -> one space
        .replace(/ *\n */g, '\n')            // trim spaces around line breaks
        .replace(/\n{3,}/g, '\n\n')          // at most one empty line
        .trim();
}

// Turns codes like &amp; &oslash; &#229; into the real characters
const NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    aring: 'å', Aring: 'Å', oslash: 'ø', Oslash: 'Ø', aelig: 'æ', AElig: 'Æ',
    eacute: 'é', ndash: '–', mdash: '—', hellip: '…', bull: '•',
    laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
};

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
        if (code[0] === '#') {
            const number = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(number) && number > 0 && number < 0x110000 ? String.fromCodePoint(number) : whole;
        }
        return NAMED_ENTITIES[code] ?? whole;
    });
}

function corsHeaders(origin) {
    const headers = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
    if (ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    return headers;
}

function jsonResponse(body, status, origin) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
    });
}
