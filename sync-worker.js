// Roast Controller — cloud sync Worker (Cloudflare Workers + KV)
//
// Deploy: Cloudflare dashboard → Workers & Pages → Create Worker → paste this
// file → Settings → Variables & Secrets → KV Namespace Bindings → add binding
// name "SYNC" pointing at a new KV namespace → Deploy. Copy the *.workers.dev
// URL into the app's Cloud sync panel.
//
// One KV value per sync code holds the whole dataset:
//   { v:1, rev:<int>, profiles:[...], logs:[...], inventory:[...], tombs:{id:mtime} }
// The code is a bearer secret: whoever has it can read and write that dataset.

const MAX_BYTES = 2_000_000;                 // ~2 MB body cap
const CODE_RE = /^[A-Za-z0-9_-]{16,64}$/;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Max-Age': '86400',
};
const EMPTY = { v: 1, rev: 0, profiles: [], logs: [], inventory: [], tombs: {} };

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(req, env) {
    // Everything is wrapped so even an internal error returns CORS headers
    // (otherwise the browser reports a confusing "No Access-Control-Allow-Origin").
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

      const url = new URL(req.url);
      const m = url.pathname.match(/^\/d\/([^/]+)$/);
      if (!m) return json({ error: 'not found — use /d/<code>' }, 404);
      const code = m[1];
      if (!CODE_RE.test(code)) return json({ error: 'bad code' }, 400);
      if (!env.SYNC) return json({ error: 'KV binding "SYNC" missing' }, 500);

      const key = 'd:' + code;

      if (req.method === 'GET') {
        const cur = await env.SYNC.get(key);
        return json(cur ? JSON.parse(cur) : EMPTY);
      }

      if (req.method === 'PUT') {
        const raw = await req.text();
        if (raw.length > MAX_BYTES) return json({ error: 'too large' }, 413);
        let body;
        try { body = JSON.parse(raw); } catch (e) { return json({ error: 'bad json' }, 400); }

        const curRaw = await env.SYNC.get(key);
        const cur = curRaw ? JSON.parse(curRaw) : EMPTY;
        const base = body.base | 0;
        if (base !== cur.rev) return json({ conflict: true, ...cur }, 409);   // optimistic CAS

        const next = {
          v: 1,
          rev: cur.rev + 1,
          profiles: Array.isArray(body.profiles) ? body.profiles : [],
          logs: Array.isArray(body.logs) ? body.logs : [],
          inventory: Array.isArray(body.inventory) ? body.inventory : [],
          tombs: (body.tombs && typeof body.tombs === 'object') ? body.tombs : {},
        };
        await env.SYNC.put(key, JSON.stringify(next));
        return json({ rev: next.rev });
      }

      return json({ error: 'method' }, 405);
    } catch (e) {
      return json({ error: 'worker error: ' + (e && e.message ? e.message : String(e)) }, 500);
    }
  },
};
