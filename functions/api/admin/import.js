export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { password, items } = body;

  if (password !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });
  if (!Array.isArray(items)) return new Response("items harus array", { status: 400 });

  // insert banyak (simple, one-by-one). cukup buat ukuran normal.
  for (const v of items) {
    const title = String(v.title || "").trim();
    if (!title) continue;

    // ambil main type/url (kolom NOT NULL)
    const pairs = [
      { t: (v.server1_type||v.type||"").trim().toLowerCase(), u: (v.server1_url||v.url||"").trim() },
      { t: (v.server2_type||"").trim().toLowerCase(), u: (v.server2_url||"").trim() },
      { t: (v.server3_type||"").trim().toLowerCase(), u: (v.server3_url||"").trim() },
      { t: (v.server4_type||"").trim().toLowerCase(), u: (v.server4_url||"").trim() },
    ].filter(x => x.t && x.u);

    if (!pairs.length) continue;
    const main = pairs[0];

    await env.DB.prepare(`
      INSERT INTO videos (
        title, type, url, thumbnail_url, genre,
        server1_type, server1_url,
        server2_type, server2_url,
        server3_type, server3_url,
        server4_type, server4_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      main.t, main.u,
      v.thumbnail_url || null,
      v.genre || null,
      v.server1_type || null, v.server1_url || null,
      v.server2_type || null, v.server2_url || null,
      v.server3_type || null, v.server3_url || null,
      v.server4_type || null, v.server4_url || null
    ).run();
  }

  return Response.json({ success: true, imported: items.length });
}
