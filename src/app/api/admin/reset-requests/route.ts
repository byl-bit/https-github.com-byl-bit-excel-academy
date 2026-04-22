import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";
import { logActivity } from "@/lib/utils/activityLog";
import bcrypt from "bcryptjs";

export const GET = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    let { data, error } = await db
      .from("password_reset_requests")
      .select("id, user_id, token, expires_at, used, created_at, users(name, role, email, grade, section, roll_number, gender, photo, student_id, teacher_id)")
      .eq("used", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reset requests with join:", error);
      const { data: fallbackData, error: fbError } = await db
        .from("password_reset_requests")
        .select("id, user_id, token, expires_at, used, created_at")
        .eq("used", false)
        .order("created_at", { ascending: false });

      if (fbError) {
        console.error("Fatal error fetching reset requests:", fbError);
        return successResponse([]);
      }
      data = fallbackData as any;
    }

    if (data && data.length > 0) {
      const requestsWithMissingUser = data.filter((r: any) => !r.users);

      if (requestsWithMissingUser.length > 0) {
        console.info(`[reset-requests] ${requestsWithMissingUser.length} records missing user data. Stitching manually...`);
        const userIds = requestsWithMissingUser.map((r: any) => r.user_id);

        const { data: users, error: userError } = await db
          .from("users")
          .select("*")
          .in("id", userIds);

        if (!userError && users) {
          console.info(`[reset-requests] Manually fetched ${users.length} users for stitching.`);
          const userMap = users.reduce((acc: any, u: any) => {
            acc[u.id] = u;
            return acc;
          }, {});

          data = data.map((r: any) => ({
            ...r,
            users: r.users || userMap[r.user_id] || null,
          }));
        } else if (userError) {
          console.error("[reset-requests] Manual user fetch failed:", userError);
        }
      }
    }

    console.info(`[reset-requests] Returning ${(data || []).length} requests (synchronized)`);
    return successResponse(data || []);
  } catch (e) {
    console.error("Reset requests GET error:", e);
    return errorResponse("Error processing requests", 500);
  }
});

export const POST = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    if (actorRole !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    const { requestId, action } = await request.json();
    console.log(`[API] Processing reset request: ${requestId}, action: ${action}`);

    let { data: resetReq, error: fetchError } = await db
      .from("password_reset_requests")
      .select("id, user_id, token, expires_at, used, created_at, users(name)")
      .eq("id", requestId)
      .single();

    if (fetchError || !resetReq) {
      console.error("[API] Initial fetch failed, trying fallback:", fetchError);
      const { data: fallbackReq, error: fbError } = await db
        .from("password_reset_requests")
        .select("id, user_id, token, expires_at, used, created_at")
        .eq("id", requestId)
        .single();

      if (fbError || !fallbackReq) {
        console.error("[API] Fallback fetch error:", fbError);
        return errorResponse("Reset request not found in system", 404);
      }
      resetReq = fallbackReq as any;
    }

    const currentReq = resetReq;
    if (!currentReq) return errorResponse("Reset request not found", 404);

    if (action === "approve") {
      const hashedPassword = currentReq.token;

      const { error: updateError } = await db
        .from("users")
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentReq.user_id);

      if (updateError) {
        console.error("Error approving password reset:", updateError);
        return errorResponse("Failed to update password", 500);
      }

      logActivity({
        userId: actorId,
        userName: "Admin",
        action: "APPROVED PASSWORD RESET",
        category: "user",
        details: `Approved reset for user ${currentReq.user_id}`,
      });

      try {
        const reqAny = currentReq as any;
        const userData = Array.isArray(reqAny.users) ? reqAny.users[0] : reqAny.users;
        const uName = userData?.name || "User";
        await db.from("notifications").insert({
          type: "account",
          category: "user",
          user_id: currentReq.user_id,
          user_name: uName,
          action: "Password Reset Approved",
          details: `Admin approved password reset for user ${currentReq.user_id}`,
          target_id: currentReq.user_id,
          target_name: uName,
        });
      } catch (nErr) {
        console.error("Failed to insert notification for approve", nErr);
      }
    } else {
      logActivity({
        userId: actorId,
        userName: "Admin",
        action: "REJECTED PASSWORD RESET",
        category: "user",
        details: `Rejected reset for user ${currentReq.user_id}`,
      });

      try {
        const reqAny = currentReq as any;
        const userData = Array.isArray(reqAny.users) ? reqAny.users[0] : reqAny.users;
        const uName = userData?.name || "User";
        await db.from("notifications").insert({
          type: "account",
          category: "user",
          user_id: currentReq.user_id,
          user_name: uName,
          action: "Password Reset Rejected",
          details: `Admin rejected password reset for user ${currentReq.user_id}`,
          target_id: currentReq.user_id,
          target_name: uName,
        });
      } catch (nErr) {
        console.error("Failed to insert notification for reject", nErr);
      }
    }

    await db.from("password_reset_requests").delete().eq("id", requestId);

    return successResponse({ success: true });
  } catch (e) {
    console.error("Admin reset request error:", e);
    return errorResponse("Error", 500);
  }
});
