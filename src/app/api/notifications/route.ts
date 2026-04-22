import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    if (!["admin", "teacher", "student"].includes(actorRole)) {
      return errorResponse("Unauthorized", 403);
    }

    let query = db
      .from("notifications")
      .select(
        "id, user_id, user_name, action, category, details, target_id, target_name, type, is_read, created_at",
      );

    if (actorRole !== "admin") {
      if (!actorId) return errorResponse("Actor ID required", 400);
      query = query.or(`user_id.eq.${actorId},target_id.eq.${actorId},type.eq.broadcast`);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return errorResponse("Failed to fetch notifications", 500);
    }

    const unreadCount = (data || []).filter((n: any) => !n.is_read).length;
    return successResponse({ notifications: data || [], unreadCount });
  } catch (e) {
    console.error("GET /api/notifications error", e);
    return errorResponse("Failed to fetch notifications", 500);
  }
});

export const DELETE = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (!id && all !== "true") return errorResponse("ID or all=true required", 400);

    let query = db.from("notifications").delete();

    if (all === "true") {
      if (actorRole !== "admin") {
        if (!actorId) return errorResponse("Actor ID required", 400);
        query = query.or(`user_id.eq.${actorId},target_id.eq.${actorId}`);
      }
    } else {
      query = query.eq("id", id);
    }

    const { error } = await query;
    if (error) throw error;

    return successResponse({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/notifications catch block:", e);
    return errorResponse("Failed to delete", 500, e.message);
  }
});

export const POST = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    if (!["admin", "teacher", "student"].includes(actorRole)) {
      return errorResponse("Unauthorized", 403);
    }

    const body = await request.json();
    if (!body || (!body.id && !body.all)) return errorResponse("Notification id or all:true required", 400);

    let query = db.from("notifications").update({ is_read: true });

    if (body.all) {
      if (actorRole !== "admin") {
        if (!actorId) return errorResponse("Actor ID required", 400);
        query = query.or(`user_id.eq.${actorId},target_id.eq.${actorId}`);
      }
    } else {
      query = query.eq("id", body.id);
    }

    const { error } = await query;
    if (error) {
      console.error("Failed to mark notification read:", error);
      return errorResponse("Failed to update notification", 500, error.message);
    }

    return successResponse({ success: true });
  } catch (e: any) {
    console.error("POST /api/notifications error", e);
    return errorResponse("Failed to update notification", 500, e.message);
  }
});

