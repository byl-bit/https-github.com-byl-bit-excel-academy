import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db, actorRole, actorId }) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const grade = searchParams.get("grade");
  const section = searchParams.get("section");
  const studentId = searchParams.get("studentId");

  const headers = {
    "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
  };

  if (studentId) {
    if (actorRole === "student" && actorId !== studentId) {
      return errorResponse("Unauthorized", 403, undefined, headers);
    }

    const { data: studentData, error: studentError } = await db
      .from("attendance")
      .select("id, student_id, date, status, marked_by")
      .eq("student_id", studentId)
      .order("date", { ascending: false });

    if (studentError) {
      console.error("Supabase error fetching attendance:", studentError);
      return successResponse([], { headers });
    }

    return successResponse(studentData || [], { headers });
  } 
  
  if (date && grade && section) {
    if (actorRole !== "teacher" && actorRole !== "admin") {
       return errorResponse("Unauthorized: teacher or admin role required", 403, undefined, headers);
    }

    const splitGrade = grade ? (grade.split(" ")[1] || grade) : "";

    const { data: students, error: studentsError } = await db
      .from("users")
      .select("id, student_id")
      .eq("role", "student")
      .eq("grade", splitGrade)
      .eq("section", section)
      .eq("status", "active");

    if (studentsError) {
      console.error("Supabase error fetching students:", studentsError);
      return successResponse([], { headers });
    }

    if (!students || students.length === 0) {
      return successResponse([], { headers });
    }

    const studentIds = students
      .map((s: any) => s.student_id || s.id)
      .filter(Boolean);

    const { data: classData, error: classError } = await db
      .from("attendance")
      .select("id, student_id, date, status, marked_by")
      .eq("date", date)
      .in("student_id", studentIds);

    if (classError) {
      console.error("Supabase error fetching attendance:", classError);
      return successResponse([], { headers });
    }

    return successResponse(classData || [], { headers });
  }

  return successResponse([], { headers });
});

export const POST = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    if (actorRole !== "teacher" && actorRole !== "admin") {
      return errorResponse("Unauthorized: teacher or admin role required", 403);
    }

    const body = await request.json();
    const { date, grade, section, presentStudentIds, teacherId } = body;

    if (!date || !grade || !section || !Array.isArray(presentStudentIds)) {
      return errorResponse("Missing required fields", 400);
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return errorResponse("Invalid date format. Expected YYYY-MM-DD", 400);
    }

    const splitGrade = grade.split(" ")[1] || grade;
    const { data: students, error: studentsError } = await db
      .from("users")
      .select("id, student_id")
      .eq("role", "student")
      .eq("grade", splitGrade)
      .eq("section", section)
      .eq("status", "active");

    if (studentsError) {
      console.error("Supabase error fetching students:", studentsError);
      return errorResponse(studentsError.message, 500);
    }

    if (!students || students.length === 0) {
      return successResponse({
        success: true,
        message: "No students found for this grade and section",
      });
    }

    const allStudentIds = students
      .map((s) => s.student_id || s.id)
      .filter(Boolean) as string[];

    if (allStudentIds.length === 0) {
      return successResponse({
        success: true,
        message: "No valid student IDs found",
      });
    }

    const validPresentStudentIds = presentStudentIds.filter((id) =>
      allStudentIds.includes(id),
    );

    const { error: deleteError } = await db
      .from("attendance")
      .delete()
      .eq("date", date)
      .in("student_id", allStudentIds);

    if (deleteError) {
      console.error("Supabase error deleting attendance:", deleteError);
      return errorResponse(deleteError.message, 500);
    }

    if (validPresentStudentIds.length > 0) {
      const presentRecords = validPresentStudentIds.map((student_id) => ({
        student_id,
        date,
        status: "present",
        marked_by: teacherId || actorId,
      }));

      const { error: insertError } = await db
        .from("attendance")
        .insert(presentRecords);

      if (insertError) {
        console.error("Supabase error saving attendance:", insertError);
        const batchSize = 50;
        for (let i = 0; i < presentRecords.length; i += batchSize) {
          const batch = presentRecords.slice(i, i + batchSize);
          const { error: batchError } = await db
            .from("attendance")
            .insert(batch);

          if (batchError) {
            console.error(`Batch insert error:`, batchError);
            return errorResponse(`Failed to save attendance records: ${batchError.message}`, 500);
          }
        }
      }
    }

    try {
      const { logActivity } = await import("@/lib/utils/activityLog");
      logActivity({
        userId: teacherId || actorId || "teacher-001",
        userName: actorRole === "admin" ? "Admin" : "Teacher",
        action: "Updated Attendance",
        category: "attendance",
        details: `Updated attendance for ${validPresentStudentIds.length} students present on ${date} (${grade}-${section})`,
      });
    } catch (le) {
      console.error("Logging failed", le);
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error("Unexpected error in attendance POST:", error);
    return errorResponse("Failed to save attendance", 500);
  }
});

