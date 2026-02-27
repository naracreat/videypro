export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { password, title, type, url, thumbnail_url } = body;

    if (password !== env.ADMIN_PASSWORD) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!title || !type || !url) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (!["mp4", "hls", "iframe"].includes(type)) {
      return new Response("Invalid type", { status: 400 });
    }

    await env.DB.prepare(
      "INSERT INTO videos (title, type, url, thumbnail_url) VALUES (?, ?, ?, ?)"
    )
      .bind(title, type, url, thumbnail_url || null)
      .run();

    return Response.json({ success: true });

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}
