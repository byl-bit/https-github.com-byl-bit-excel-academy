import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";
import { promises as fs } from "fs";
import path from "path";
import { logActivity } from "@/lib/utils/activityLog";

export const POST = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    if (actorRole !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    console.info("Starting full system reset initiated by:", actorId);

    const tablesToClear = [
      "results",
      "results_pending",
      "admissions",
      "allocations",
      "announcements",
      "attendance",
      "notifications",
      "password_reset_requests",
    ];

    for (const table of tablesToClear) {
      const { error } = await db
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) console.error(`Error clearing table ${table}:`, error);
    }

    const { error: userError } = await db
      .from("users")
      .delete()
      .neq("role", "admin");
    if (userError) console.error("Error clearing users:", userError);

    const defaultAssessments = [
      { id: "test1", label: "Test 1", weight: 10, maxMarks: 100 },
      { id: "mid", label: "Mid", weight: 30, maxMarks: 100 },
      { id: "test2", label: "Test 2", weight: 10, maxMarks: 100 },
      { id: "assessment", label: "Assessment", weight: 10, maxMarks: 100 },
      { id: "final", label: "Final Exam", weight: 40, maxMarks: 100 },
    ];

    await db.from("settings").upsert({ key: "assessmentTypes", value: defaultAssessments });
    await db.from("settings").upsert({ key: "letterheadUrl", value: "" });

    await db.from("subjects").delete().neq("name", "___");
    const defaultSubjects = [
      { name: "Mathematics" },
      { name: "English" },
      { name: "Science" },
      { name: "Social Studies" },
    ];
    await db.from("subjects").insert(defaultSubjects);

    const BOOKS_FILE = path.join(process.cwd(), "data", "books.json");
    try {
      await fs.writeFile(BOOKS_FILE, "[]");
      console.info("Library JSON cleared.");
    } catch (e) {
      console.warn("Failed to clear library JSON (might not exist):", e);
    }

    logActivity({
      userId: actorId,
      userName: "Admin",
      action: "FULL SYSTEM RESET",
      category: "system",
      details: "All data cleared. Settings reset to defaults. Admin accounts preserved.",
    });

    return successResponse({
      success: true,
      message: "System has been reset to defaults.",
    });
  } catch (e) {
    console.error("System reset failed:", e);
    return errorResponse("Reset failed", 500);
  }
});
