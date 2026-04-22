import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
    return errorResponse("Unauthorized: admin only", 403);
  }

  const { data, error } = await db
    .from("admissions")
    .select("id, fullName, email, phone, grade, gender, status, submitted_at")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching admissions:", error);
    return successResponse([]);
  }

  return successResponse(data || []);
});

export const POST = withApiHandler(async (request, { db }) => {
  const body = await request.json();

  const { data, error } = await db
    .from("admissions")
    .insert([body])
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating admission:", error);
    return errorResponse(error.message, 500);
  }

  return successResponse(data);
});

export const DELETE = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
    return errorResponse("Unauthorized: Admin role required", 403);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return errorResponse("ID required", 400);
  }

  const { error } = await db.from("admissions").delete().eq("id", id);

  if (error) {
    console.error("Supabase error deleting admission:", error);
    return errorResponse(error.message, 500);
  }

  return successResponse({ success: true });
});
