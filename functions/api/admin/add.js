export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      password,
      title,
      genre,
      thumbnail_url,

      server1_type, server1_url,
      server2_type, server2_url,
      server3_type, server3_url,
      server4_type, server4_url,
    } = body;

    if (password !== env.ADMIN_PASSWORD) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!title || typeof title !== "string") {
      return new Response("Title wajib diisi", { status: 400 });
    }

    // helper: normalisasi + validasi tipe
    function normType(t) {
      const x = String(t || "").toLowerCase().trim();
      if (!x) return null;
      if (!["mp4", "hls", "iframe"].includes(x)) return "__invalid__";
      return x;
    }
    function normUrl(u) {
      const x = String(u || "").trim();
      return x ? x : null;
    }

    const s1t = normType(server1_type), s1u = normUrl(server1_url);
    const s2t = normType(server2_type), s2u = normUrl(server2_url);
    const s3t = normType(server3_type), s3u = normUrl(server3_url);
    const s4t = normType(server4_type), s4u = normUrl(server4_url);

    // kalau ada url tapi type invalid -> error
    const pairs = [
      ["server1", s1t, s1u],
      ["server2", s2t, s2u],
      ["server3", s3t, s3u],
      ["server4", s4t, s4u],
    ];

    for (const [name, t, u] of pairs) {
      if (u && t === "__invalid__") return new Response(`${name}_type invalid`, { status: 400 });
      if (u && !t) return new Response(`${name}_type wajib kalau url diisi`, { status: 400 });
      if (!u && t) return new Response(`${name}_url wajib kalau type diisi`, { status: 400 });
    }

    // minimal harus ada 1 server
    if (!s1u && !s2u && !s3u && !s4u) {
      return new Response("Minimal isi 1 server (url + type)", { status: 400 });
    }

    await env.DB.prepare(`
      INSERT INTO videos (
        title, genre, thumbnail_url,
        server1_type, server1_url,
        server2_type, server2_url,
        server3_type, server3_url,
        server4_type, server4_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title.trim(),
      (genre ? String(genre).trim() : null),
      (thumbnail_url ? String(thumbnail_url).trim() : null),

      s1t, s1u,
      s2t, s2u,
      s3t, s3u,
      s4t, s4u,
    ).run();

    return Response.json({ success: true });
  } catch (err) {
    return new Response("Error: " + (err?.message || String(err)), { status: 500 });
  }
}
