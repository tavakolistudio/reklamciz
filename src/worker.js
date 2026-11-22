// Reklamcız worker: serves the static site and validates discount codes.
// Codes live in the DISCOUNTS KV namespace: key = code in UPPERCASE, value = percent (1–99).
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/discount') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
      let code = '';
      try {
        code = String((await request.json()).code || '');
      } catch {
        return json({ ok: false, error: 'bad_request' }, 400);
      }
      const typed = code.trim().replace(/\s+/g, '');
      // Normalise Turkish dotted/dotless i so "indirim" and "INDIRIM" match.
      code = typed.toUpperCase().replace(/İ/g, 'I');
      if (!code || code.length > 40) return json({ ok: false, error: 'invalid' }, 400);
      const raw = (await env.DISCOUNTS.get(code)) ?? (typed !== code ? await env.DISCOUNTS.get(typed) : null);
      const percent = raw == null ? NaN : parseFloat(String(raw).replace('%', '').replace(',', '.'));
      if (!(percent > 0 && percent < 100)) return json({ ok: false, error: 'not_found' }, 404);
      return json({ ok: true, code, percent });
    }
    return env.ASSETS.fetch(request);
  },
};
