import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
    return errorResponse("Unauthorized", 403);
  }

  try {
    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: pendingStudents },
      { count: totalTeachers },
      { count: activeTeachers },
      { count: pendingTeachers },
      { count: totalResults },
      { count: totalPendingResults },
      { count: totalAnnouncements },
      { count: totalBooks },
    ] = await Promise.all([
      db.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
      db.from("users").select("*", { count: "exact", head: true }).eq("role", "student").eq("status", "active"),
      db.from("users").select("*", { count: "exact", head: true }).eq("role", "student").eq("status", "pending"),
      db.from("users").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      db.from("users").select("*", { count: "exact", head: true }).eq("role", "teacher").eq("status", "active"),
      db.from("users").select("*", { count: "exact", head: true }).eq("role", "teacher").eq("status", "pending"),
      db.from("results").select("*", { count: "exact", head: true }),
      db.from("results_pending").select("*", { count: "exact", head: true }),
      db.from("announcements").select("*", { count: "exact", head: true }),
      db.from("books").select("*", { count: "exact", head: true }),
    ]);

    const { data: resultAggs } = await db.from("results").select("average");

    let topAverage = 0;
    let passRate = 0;
    if (resultAggs && resultAggs.length > 0) {
      topAverage = Math.max(...resultAggs.map((r) => r.average || 0));
      passRate = (resultAggs.filter((r) => (r.average || 0) >= 50).length / resultAggs.length) * 100;
    }

    const { data: usersForGrades } = await db
      .from("users")
      .select("grade, section")
      .eq("role", "student");
      
    const studentsByGrade: Record<string, number> = {};
    const studentsBySection: Record<string, number> = {};

    (usersForGrades || []).forEach((u) => {
      if (u.grade) studentsByGrade[u.grade] = (studentsByGrade[u.grade] || 0) + 1;
      if (u.section) studentsBySection[u.section] = (studentsBySection[u.section] || 0) + 1;
    });

    return successResponse({
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      pendingStudents: pendingStudents || 0,
      totalTeachers: totalTeachers || 0,
      activeTeachers: activeTeachers || 0,
      pendingTeachers: pendingTeachers || 0,
      publishedResults: totalResults || 0,
      resultsCount: totalResults || 0,
      pendingResults: totalPendingResults || 0,
      totalAnnouncements: totalAnnouncements || 0,
      totalBooks: totalBooks || 0,
      studentsByGrade,
      studentsBySection,
      topAverage,
      passRate: Math.round(passRate * 10) / 10,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return errorResponse("Failed to fetch statistics", 500);
  }
});
