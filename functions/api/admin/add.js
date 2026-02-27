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

    if (!title) {
      return new Response("Title wajib diisi", { status: 400 });
    }

    const servers = [
      { type: server1_type, url: server1_url },
      { type: server2_type, url: server2_url },
      { type: server3_type, url: server3_url },
      { type: server4_type, url: server4_url },
    ].map(s => ({
      type: s.type?.trim().toLowerCase(),
      url: s.url?.trim()
    })).filter(s => s.type && s.url);

    if (!servers.length) {
      return new Response("Minimal isi 1 server", { status: 400 });
    }

    // 🔥 ambil server pertama sebagai default
    const main = servers[0];

    await env.DB.prepare(`
      INSERT INTO videos (
        title,
        type,
        url,
        thumbnail_url,
        genre,
        server1_type, server1_url,
        server2_type, server2_url,
        server3_type, server3_url,
        server4_type, server4_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      main.type,          // isi kolom lama
      main.url,           // isi kolom lama
      thumbnail_url || null,
      genre || null,

      server1_type || null, server1_url || null,
      server2_type || null, server2_url || null,
      server3_type || null, server3_url || null,
      server4_type || null, server4_url || null
    ).run();

    return Response.json({ success: true });

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}
