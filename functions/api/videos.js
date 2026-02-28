export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        id, title, genre, thumbnail_url, created_at,
        views,
        type, url,
        server1_type, server1_url,
        server2_type, server2_url,
        server3_type, server3_url,
        server4_type, server4_url
      FROM videos
      ORDER BY id DESC
    `).all();

    return Response.json(results);
  } catch (err) {
    return new Response("DB Error: " + err.message, { status: 500 });
  }
}
