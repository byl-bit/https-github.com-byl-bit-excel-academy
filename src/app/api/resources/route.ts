import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request, { db }) => {
  try {
    const { data, error } = await db
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("API: Error fetching resources:", error);
      return successResponse([]);
    }

    return successResponse(data || [], {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    console.error("API: Exception fetching resources:", e);
    return successResponse([]);
  }
});

export const POST = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin") return errorResponse("Unauthorized", 403);

    const body = await request.json();
    const { data, error } = await db
      .from("resources")
      .insert([
        {
          title: body.title,
          author: body.author || "",
          description: body.description || "",
          file_url: body.file_url,
          video_url: body.video_url || "",
          grade: body.grade || "All",
          subject: body.subject || "General",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("API: Error creating resource:", error);
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (e) {
    return errorResponse("Server error", 500);
  }
});

export const DELETE = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin") return errorResponse("Unauthorized", 403);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID required", 400);

    const { error } = await db.from("resources").delete().eq("id", id);
    if (error) return errorResponse(error.message, 500);
    
    return successResponse({ success: true });
  } catch (e) {
    return errorResponse("Server error", 500);
  }
});
