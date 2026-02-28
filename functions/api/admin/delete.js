export async function onRequestDelete({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { password, id } = body;

  if (password !== env.ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });
  if (!id) return new Response("Missing id", { status: 400 });

  await env.DB.prepare("DELETE FROM videos WHERE id=?").bind(id).run();
  return Response.json({ success: true });
}
