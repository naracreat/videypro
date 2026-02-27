export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, title, type, url, thumbnail_url, created_at FROM videos ORDER BY id DESC"
    ).all();

    return Response.json(results);
  } catch (err) {
    return new Response("DB Error: " + err.message, { status: 500 });
  }
}
