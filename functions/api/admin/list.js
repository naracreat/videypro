// functions/api/admin/list.js
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const password = url.searchParams.get("password") || "";

    if (!env.ADMIN_PASSWORD) return new Response("Server not configured", { status: 500 });
    if (password !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });

    const { results } = await env.DB.prepare(
      `
      SELECT
        id, title, genre, thumbnail_url, poster_wide_url,
        views, created_at,
        server1_type, server1_url,
        server2_type, server2_url,
        server3_type, server3_url,
        server4_type, server4_url
      FROM videos
      ORDER BY id DESC
      `
    ).all();

    return Response.json(results || []);
  } catch (err) {
    return new Response("Error: " + (err?.message || err), { status: 500 });
  }
}
