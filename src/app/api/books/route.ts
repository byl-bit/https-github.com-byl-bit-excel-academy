import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

const mapToFrontend = (book: any) => ({
  id: book.id,
  title: book.title,
  author: book.author,
  grade: book.grade,
  subject: book.subject,
  description: book.description,
  downloadUrl: book.file_url || book.download_url,
  videoUrl: book.video_url,
  uploadedAt: book.created_at,
});

export const GET = withApiHandler(async (request, { db }) => {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const grade = searchParams.get("grade");
  const subject = searchParams.get("subject");

  let query = db
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (grade && grade !== "All") query = query.eq("grade", grade);
  if (subject && subject !== "All") query = query.eq("subject", subject);
  if (limit) query = query.limit(parseInt(limit));

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching books from Supabase:", error);
    return successResponse([]);
  }

  return successResponse(data.map(mapToFrontend));
});

export const POST = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin") return errorResponse("Unauthorized", 403);

    const body = await request.json();
    if (!body.title) return errorResponse("Title is required", 400);

    const dbPayload = {
      title: body.title,
      author: body.author,
      grade: body.grade,
      subject: body.subject,
      description: body.description,
      file_url: body.downloadUrl,
      video_url: body.videoUrl,
    };

    const { data, error } = await db
      .from("books")
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error("Error adding book:", error);
      return errorResponse("Failed to save book to database", 500);
    }

    try {
      await db.from("notifications").insert({
        type: "broadcast",
        category: "library",
        action: "New Resource Uploaded",
        details: `New book added: ${body.title} for Grade ${body.grade}`,
        target_id: data.id,
        target_name: body.title,
      });
    } catch (nErr) {
      console.error("Failed to create notification for book:", nErr);
    }

    return successResponse(mapToFrontend(data));
  } catch (e) {
    return errorResponse("Failed to process request", 500);
  }
});

export const DELETE = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") return errorResponse("Unauthorized", 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return errorResponse("Missing ID", 400);

  const { error } = await db.from("books").delete().eq("id", id);

  if (error) {
    console.error("Error deleting book:", error);
    return errorResponse("Failed to delete book", 500);
  }

  return successResponse({ success: true });
});
