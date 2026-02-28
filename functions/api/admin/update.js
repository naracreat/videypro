export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const {
    password, id,
    title, genre, thumbnail_url,
    server1_type, server1_url,
    server2_type, server2_url,
    server3_type, server3_url,
    server4_type, server4_url,
  } = body;

  if (password !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });
  if (!id) return new Response("Missing id", { status: 400 });
  if (!title) return new Response("Title wajib", { status: 400 });

  // pilih main type/url dari server pertama yang valid (buat kolom type/url NOT NULL)
  const pickMain = () => {
    const pairs = [
      { t: (server1_type||"").trim().toLowerCase(), u: (server1_url||"").trim() },
      { t: (server2_type||"").trim().toLowerCase(), u: (server2_url||"").trim() },
      { t: (server3_type||"").trim().toLowerCase(), u: (server3_url||"").trim() },
      { t: (server4_type||"").trim().toLowerCase(), u: (server4_url||"").trim() },
    ].filter(x => x.t && x.u);

    return pairs[0] || null;
  };

  const main = pickMain();
  if (!main) return new Response("Minimal isi 1 server (type+url)", { status: 400 });

  await env.DB.prepare(`
    UPDATE videos SET
      title=?,
      genre=?,
      thumbnail_url=?,
      type=?,
      url=?,
      server1_type=?, server1_url=?,
      server2_type=?, server2_url=?,
      server3_type=?, server3_url=?,
      server4_type=?, server4_url=?
    WHERE id=?
  `).bind(
    title.trim(),
    genre ? String(genre).trim() : null,
    thumbnail_url ? String(thumbnail_url).trim() : null,
    main.t, main.u,
    server1_type || null, server1_url || null,
    server2_type || null, server2_url || null,
    server3_type || null, server3_url || null,
    server4_type || null, server4_url || null,
    id
  ).run();

  return Response.json({ success: true });
}
