import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const DELETE = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
    return errorResponse("Unauthorized: admin role required", 403);
  }

  try {
    const { error } = await db
      .from("announcements")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error("Error clearing announcements:", error);
      return errorResponse("Failed to clear announcements", 500, error.message);
    }

    const { data: remaining } = await db
      .from("announcements")
      .select("id")
      .limit(1);

    return successResponse({
      success: true,
      message: "All announcements cleared successfully",
      remaining: remaining?.length || 0,
    });
  } catch (err: any) {
    console.error("Fatal error clearing announcements:", err);
    return errorResponse("Internal server error", 500, err.message);
  }
});

export const GET = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
     return errorResponse("Unauthorized: admin role required", 403);
  }

  try {
    const { data, error } = await db
      .from("announcements")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse(error.message, 500);
    }

    return successResponse({
      count: data?.length || 0,
      announcements: data || [],
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
});
