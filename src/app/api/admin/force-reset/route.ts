import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/utils/activityLog";

export const POST = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    if (actorRole !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    const { userId, studentId, newPassword } = await request.json();
    const identifier = studentId || userId;
    
    if (!identifier || !newPassword) {
      return errorResponse("Missing fields", 400);
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);

    const { data, error: updateError } = await db
      .from("users")
      .update({ password: hashed, updated_at: new Date().toISOString() })
      .or(`id.eq.${identifier},student_id.eq.${identifier}`)
      .select()
      .single();

    if (updateError || !data) {
      console.error("Force reset error:", updateError);
      return errorResponse("Failed to update password", 500);
    }

    logActivity({
      userId: actorId,
      userName: "Admin",
      action: "FORCE RESET PASSWORD",
      category: "user",
      details: `Admin forced password reset for user ${identifier}`,
    });

    return successResponse({ success: true });
  } catch (e) {
    console.error("Force reset exception:", e);
    return errorResponse("Server error", 500);
  }
});
