// functions/api/admin/update.js
export async function onRequestPut({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));

    // auth
    if (!env.ADMIN_PASSWORD) return new Response("Server not configured", { status: 500 });
    if ((body.password || "") !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });

    const id = Number(body.id);
    if (!id) return new Response("Missing id", { status: 400 });

    const title = clean(body.title);
    const genre = clean(body.genre);
    const thumbnail_url = clean(body.thumbnail_url);
    const poster_wide_url = clean(body.poster_wide_url);

    if (!title) return new Response("Title kosong", { status: 400 });

    const servers = readServers(body);
    const pairErr = validateServerPairs(servers);
    if (pairErr) return new Response(pairErr, { status: 400 });

    const primary = pickPrimaryServer(servers);
    if (!primary) return new Response("Minimal isi 1 server", { status: 400 });

    // legacy NOT NULL
    const type = primary.type;
    const url = primary.url;

    await env.DB.prepare(
      `
      UPDATE videos SET
        title=?,
        genre=?,
        thumbnail_url=?,
        poster_wide_url=?,
        type=?,
        url=?,
        server1_type=?, server1_url=?,
        server2_type=?, server2_url=?,
        server3_type=?, server3_url=?,
        server4_type=?, server4_url=?
      WHERE id=?
      `
    )
      .bind(
        title,
        genre || null,
        thumbnail_url || null,
        poster_wide_url || null,
        type,
        url,
        servers[0].type || null, servers[0].url || null,
        servers[1].type || null, servers[1].url || null,
        servers[2].type || null, servers[2].url || null,
        servers[3].type || null, servers[3].url || null,
        id
      )
      .run();

    return Response.json({ success: true });
  } catch (err) {
    return new Response("Error: " + (err?.message || err), { status: 500 });
  }
}

function clean(v) {
  const s = (v ?? "").toString().trim();
  return s ? s : "";
}

function readServers(body) {
  return [1,2,3,4].map(i => ({
    type: clean(body[`server${i}_type`]),
    url: clean(body[`server${i}_url`]),
  }));
}

function validateServerPairs(servers) {
  for (let i = 0; i < servers.length; i++) {
    const t = servers[i].type;
    const u = servers[i].url;
    if ((t && !u) || (!t && u)) return `Server ${i+1} type/url harus berpasangan`;
  }
  return "";
}

function pickPrimaryServer(servers) {
  for (const s of servers) {
    if (s.type && s.url) return s;
  }
  return null;
}
