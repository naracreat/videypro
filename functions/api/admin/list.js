export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const password = url.searchParams.get("password") || "";
  if (password !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });

  const { results } = await env.DB.prepare(`
    SELECT
      id, title, type, url, thumbnail_url, genre, created_at,
      server1_type, server1_url,
      server2_type, server2_url,
      server3_type, server3_url,
      server4_type, server4_url
    FROM videos
    ORDER BY id DESC
  `).all();

  return Response.json(results);
}
