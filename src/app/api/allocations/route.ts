import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db }) => {
  const { data, error } = await db
    .from("allocations")
    .select("id, teacher_id, teacher_name, grade, section, subject, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching allocations:", error);
    return successResponse([]);
  }

  return successResponse(data || []);
});

export const POST = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin") return errorResponse("Unauthorized", 403);

    const body = await request.json();

    if (Array.isArray(body)) {
      await db
        .from("allocations")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      const mapped = body.map((a: any) => ({
        teacher_id: a.teacherId || a.teacher_id,
        teacher_name: a.teacherName || a.teacher_name,
        grade: a.grade,
        section: a.section,
        subject: a.subject,
        created_at: a.createdAt || a.created_at || new Date().toISOString(),
      }));
      
      const { error } = await db.from("allocations").insert(mapped);
      if (error) throw error;
      return successResponse({ success: true });
    }

    const record = {
      teacher_id: body.teacherId,
      teacher_name: body.teacherName,
      grade: body.grade,
      section: body.section,
      subject: body.subject,
    };

    const { data, error } = await db
      .from("allocations")
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating allocation:", error);
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (e) {
    return errorResponse("Failed to create allocation", 500);
  }
});

export const DELETE = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") return errorResponse("Unauthorized", 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return errorResponse("ID required", 400);

  const { error } = await db.from("allocations").delete().eq("id", id);

  if (error) {
    console.error("Supabase error deleting allocation:", error);
    return errorResponse(error.message, 500);
  }

  return successResponse({ success: true });
});
