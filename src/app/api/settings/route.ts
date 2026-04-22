import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db }) => {
  const { data, error } = await db.from("settings").select("key, value");

  if (error) {
    console.error("Supabase error fetching settings:", error);
    return errorResponse("Failed to fetch settings", 500);
  }

  // Convert to object format
  const settings: Record<string, unknown> = {};
  if (Array.isArray(data)) {
    data.forEach((row: Record<string, unknown>) => {
      const key = row["key"];
      if (typeof key === "string") {
        settings[key] = row["value"];
      }
    });
  }

  // Inject defaults
  const defaultAssessments = [
    { id: "test1", label: "Test", weight: 10, maxMarks: 100, semester: "all" },
    { id: "mid", label: "Mid Exam", weight: 15, maxMarks: 100, semester: "all" },
    { id: "test2", label: "test-2", weight: 10, maxMarks: 100, semester: "all" },
    { id: "assignment", label: "Assignments", weight: 5, maxMarks: 100, semester: "all" },
    { id: "final", label: "Final Exam", weight: 60, maxMarks: 100, semester: "all" },
  ];

  if (settings["assessmentTypes"] == null) {
    settings["assessmentTypes"] = defaultAssessments;
  }
  if (!settings["principalName"]) settings["principalName"] = "Desalegn";
  if (!settings["homeroomName"]) settings["homeroomName"] = "Class Teacher";
  if (settings["letterheadUrl"] === undefined) settings["letterheadUrl"] = "";

  const boolKeys = [
    "allowLibraryDownload",
    "allowTeacherEditAfterSubmission",
    "reportCardDownload",
    "certificateDownload",
    "maintenanceMode",
  ];
  boolKeys.forEach((k) => {
    if (settings[k] !== undefined) {
      settings[k] = String(settings[k]) === "true";
    }
  });

  // Default booleans
  const defaults: Record<string, boolean> = {
    allowLibraryDownload: false,
    allowTeacherEditAfterSubmission: false,
    reportCardDownload: true,
    certificateDownload: true,
    maintenanceMode: false,
  };

  Object.keys(defaults).forEach(k => {
    if (settings[k] === undefined) settings[k] = defaults[k];
  });

  return new Response(JSON.stringify(settings), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
});

export const POST = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
    return errorResponse("Unauthorized: Admin role required", 403);
  }

  const body = await request.json();

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return errorResponse("Invalid payload", 400);
  }

  // Update each setting key
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    await db.from("settings").upsert({ key, value }, { onConflict: "key" });
  }

  // Fetch updated settings
  const { data } = await db.from("settings").select("key, value");

  const settings: Record<string, unknown> = {};
  if (Array.isArray(data)) {
    data.forEach((row: Record<string, unknown>) => {
      const k = row["key"];
      if (typeof k === "string") settings[k] = row["value"];
    });
  }

  return successResponse(settings);
});

