// functions/api/admin/import.js
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = body.password || "";
    const items = Array.isArray(body.items) ? body.items : body; // jaga-jaga kalau langsung array

    if (!env.ADMIN_PASSWORD) return new Response("Server not configured", { status: 500 });
    if (password !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });

    if (!Array.isArray(items)) return new Response("items harus array", { status: 400 });
    if (!items.length) return Response.json({ success: true, imported: 0 });

    const statements = [];

    for (const raw of items) {
      const id = raw?.id != null && raw?.id !== "" ? Number(raw.id) : null;

      const title = clean(raw?.title);
      if (!title) continue; // skip item rusak

      const genre = clean(raw?.genre);
      const thumbnail_url = clean(raw?.thumbnail_url);
      const poster_wide_url = clean(raw?.poster_wide_url);
      const views = Number.isFinite(Number(raw?.views)) ? Number(raw.views) : 0;

      const servers = readServers(raw);
      const pairErr = validateServerPairs(servers);
      if (pairErr) continue;

      const primary = pickPrimaryServer(servers);
      if (!primary) continue;

      const type = primary.type;
      const url = primary.url;

      // UPSERT by id kalau id ada, kalau gak ada -> insert biasa tanpa id
      if (id) {
        statements.push(
          env.DB.prepare(
            `
            INSERT INTO videos (
              id,
              title, genre, thumbnail_url, poster_wide_url, views,
              type, url,
              server1_type, server1_url,
              server2_type, server2_url,
              server3_type, server3_url,
              server4_type, server4_url
            ) VALUES (
              ?,
              ?, ?, ?, ?, ?,
              ?, ?,
              ?, ?,
              ?, ?,
              ?, ?,
              ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
              title=excluded.title,
              genre=excluded.genre,
              thumbnail_url=excluded.thumbnail_url,
              poster_wide_url=excluded.poster_wide_url,
              views=excluded.views,
              type=excluded.type,
              url=excluded.url,
              server1_type=excluded.server1_type,
              server1_url=excluded.server1_url,
              server2_type=excluded.server2_type,
              server2_url=excluded.server2_url,
              server3_type=excluded.server3_type,
              server3_url=excluded.server3_url,
              server4_type=excluded.server4_type,
              server4_url=excluded.server4_url
            `
          ).bind(
            id,
            title, genre || null, thumbnail_url || null, poster_wide_url || null, views,
            type, url,
            servers[0].type || null, servers[0].url || null,
            servers[1].type || null, servers[1].url || null,
            servers[2].type || null, servers[2].url || null,
            servers[3].type || null, servers[3].url || null
          )
        );
      } else {
        statements.push(
          env.DB.prepare(
            `
            INSERT INTO videos (
              title, genre, thumbnail_url, poster_wide_url, views,
              type, url,
              server1_type, server1_url,
              server2_type, server2_url,
              server3_type, server3_url,
              server4_type, server4_url
            ) VALUES (
              ?, ?, ?, ?, ?,
              ?, ?,
              ?, ?,
              ?, ?,
              ?, ?,
              ?, ?
            )
            `
          ).bind(
            title, genre || null, thumbnail_url || null, poster_wide_url || null, views,
            type, url,
            servers[0].type || null, servers[0].url || null,
            servers[1].type || null, servers[1].url || null,
            servers[2].type || null, servers[2].url || null,
            servers[3].type || null, servers[3].url || null
          )
        );
      }
    }

    if (!statements.length) return Response.json({ success: true, imported: 0 });

    // batch execute
    await env.DB.batch(statements);

    return Response.json({ success: true, imported: statements.length });
  } catch (err) {
    return new Response("Error: " + (err?.message || err), { status: 500 });
  }
}

function clean(v) {
  const s = (v ?? "").toString().trim();
  return s ? s : "";
}

function readServers(raw) {
  return [1,2,3,4].map(i => ({
    type: clean(raw?.[`server${i}_type`]),
    url: clean(raw?.[`server${i}_url`]),
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
