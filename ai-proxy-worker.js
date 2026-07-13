// Roast Controller — AI label-reading proxy Worker (Cloudflare Workers)
//
// Purpose: keep your AI API key OFF the browser. The app posts the vision
// request here; this Worker adds the secret key and forwards it to Claude
// (Anthropic) or Gemini (Google). The key lives only as a Worker secret.
//
// Deploy:
//   Cloudflare dashboard → Workers & Pages → Create Worker → paste this file →
//   Settings → Variables & Secrets → add secret(s):
//     ANTHROPIC_API_KEY   (for the Claude provider)
//     GEMINI_API_KEY      (for the Gemini provider)
//   You only need the secret for the provider(s) you'll use. Deploy, then paste
//   the *.workers.dev URL into the app's "Proxy Worker URL" field.
//
// Routes (POST): /anthropic and /gemini. The request body is the provider's
// own JSON payload (the app builds it); this Worker only injects auth.
//
// NOTE: this proxy is unauthenticated — anyone with the URL can spend your API
// credit. Keep the URL private. If you expose it publicly, add your own gate
// (a shared secret header, Cloudflare Access, rate limiting, etc.).

const MAX_BYTES = 12_000_000;                 // ~12 MB body cap (base64 image + prompt)
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Max-Age': '86400',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

async function passthrough(upstream) {
  const body = await upstream.text();          // provider returns JSON; relay verbatim
  return new Response(body, {
    status: upstream.status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(req, env) {
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      if (req.method !== 'POST') return json({ error: 'POST to /anthropic or /gemini' }, 405);

      const url = new URL(req.url);
      const body = await req.text();
      if (body.length > MAX_BYTES) return json({ error: 'too large' }, 413);

      if (url.pathname.endsWith('/anthropic')) {
        if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY secret not set on the Worker' }, 500);
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body,
        });
        return passthrough(r);
      }

      if (url.pathname.endsWith('/gemini')) {
        if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY secret not set on the Worker' }, 500);
        const model = url.searchParams.get('model') || 'gemini-2.5-flash';
        const r = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
            body,
          },
        );
        return passthrough(r);
      }

      return json({ error: 'not found — POST to /anthropic or /gemini' }, 404);
    } catch (e) {
      return json({ error: 'worker error: ' + (e && e.message ? e.message : String(e)) }, 500);
    }
  },
};
