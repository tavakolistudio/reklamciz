// Reklamcız worker: serves the static site and validates discount codes.
//
// Codes live in the DISCOUNTS KV namespace. Key = code in UPPERCASE. Value formats:
//   "20"                              → 20% on every package
//   "20|dogum-gunu"                   → 20% only on the listed package/section IDs
//   "20|dogum-gunu,sosyal-medya"      → several IDs, comma-separated
//   "20|*|2026-12-31"                 → every package, valid until the end of that day (Istanbul time)
//   "20|dogum-gunu|2026-12-31"        → scoped + expiry
//
// Package IDs:  video-essential, marka-filmi, portatif-studyo, gorsel-kampanya, havadan-signature,
//               fuar-1-gun, fuar-3-gun, dogum-gunu, sosyal-standart
// Section IDs:  reklam-filmi, reklam-fotografi, heli-shot, fuar, ozel-gunler, sosyal-medya

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const ID = /^[a-z0-9-]{1,40}$/;

function parseValue(raw) {
  const [p, scope = '*', expires = ''] = String(raw).split('|').map((s) => s.trim());
  const percent = parseFloat(p.replace('%', '').replace(',', '.'));
  const ids = scope === '' || scope === '*' ? null : scope.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  return { percent, ids, expires };
}

function isExpired(expires) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expires)) return false;
  // End of the given day in Europe/Istanbul (UTC+3).
  const end = Date.parse(expires + 'T23:59:59+03:00');
  return Number.isFinite(end) && Date.now() > end;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/discount') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: 'bad_request' }, 400);
      }
      const typed = String(body.code || '').trim().replace(/\s+/g, '');
      // Normalise Turkish dotted/dotless i so "indirim" and "INDIRIM" match.
      const code = typed.toUpperCase().replace(/İ/g, 'I');
      if (!code || code.length > 40) return json({ ok: false, error: 'invalid' }, 400);
      const pkg = ID.test(String(body.pkg || '')) ? String(body.pkg) : '';
      const group = ID.test(String(body.group || '')) ? String(body.group) : '';

      const raw = (await env.DISCOUNTS.get(code)) ?? (typed !== code ? await env.DISCOUNTS.get(typed) : null);
      if (raw == null) return json({ ok: false, error: 'not_found' }, 404);
      const { percent, ids, expires } = parseValue(raw);
      if (!(percent > 0 && percent < 100)) return json({ ok: false, error: 'not_found' }, 404);
      if (isExpired(expires)) return json({ ok: false, error: 'expired' }, 410);
      if (ids && !(ids.includes(pkg) || ids.includes(group))) return json({ ok: false, error: 'scope' }, 403);
      return json({ ok: true, code, percent, ...(expires ? { expires } : {}) });
    }
    return env.ASSETS.fetch(request);
  },
};
