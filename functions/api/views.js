export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = Number(body.id);

    if (!id) return new Response("Missing id", { status: 400 });

    await env.DB.prepare(`UPDATE videos SET views = COALESCE(views,0) + 1 WHERE id=?`)
      .bind(id).run();

    const row = await env.DB.prepare(`SELECT views FROM videos WHERE id=?`).bind(id).first();
    return Response.json({ success: true, views: row?.views ?? 0 });
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}
