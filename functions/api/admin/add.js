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

    if (password !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });
    if (!title || typeof title !== "string") return new Response("Title wajib diisi", { status: 400 });

    const normType = (t) => {
      const x = String(t || "").toLowerCase().trim();
      if (!x) return null;
      if (!["mp4","hls","iframe"].includes(x)) return "__invalid__";
      return x;
    };
    const normUrl = (u) => {
      const x = String(u || "").trim();
      return x ? x : null;
    };

    const s = [
      { t: normType(server1_type), u: normUrl(server1_url) },
      { t: normType(server2_type), u: normUrl(server2_url) },
      { t: normType(server3_type), u: normUrl(server3_url) },
      { t: normType(server4_type), u: normUrl(server4_url) },
    ];

    // validasi pasangan
    for (let i=0;i<4;i++){
      const name = `server${i+1}`;
      if (s[i].u && s[i].t === "__invalid__") return new Response(`${name}_type invalid`, { status: 400 });
      if (s[i].u && !s[i].t) return new Response(`${name}_type wajib kalau url diisi`, { status: 400 });
      if (!s[i].u && s[i].t) return new Response(`${name}_url wajib kalau type diisi`, { status: 400 });
    }

    // pilih main type/url dari server pertama yang kepake
    const main = s.find(x => x.t && x.u);
    if (!main) return new Response("Minimal isi 1 server (type + url)", { status: 400 });

    await env.DB.prepare(`
      INSERT INTO videos (
        title, genre, thumbnail_url,
        type, url,
        server1_type, server1_url,
        server2_type, server2_url,
        server3_type, server3_url,
        server4_type, server4_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title.trim(),
      (genre ? String(genre).trim() : null),
      (thumbnail_url ? String(thumbnail_url).trim() : null),

      main.t, main.u,                 -- INI FIX UTAMA (buat kolom lama NOT NULL)
      s[0].t, s[0].u,
      s[1].t, s[1].u,
      s[2].t, s[2].u,
      s[3].t, s[3].u
    ).run();

    return Response.json({ success: true });
  } catch (err) {
    return new Response("Error: " + (err?.message || String(err)), { status: 500 });
  }
}
