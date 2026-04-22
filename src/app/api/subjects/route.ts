import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db }) => {
  const { data, error } = await db
    .from("subjects")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase error fetching subjects:", error);
    return errorResponse(error.message, 500);
  }

  const subjects = data?.map((s) => s.name) || [];

  if (subjects.length === 0) {
    return successResponse([
      "Amharic", "Afan Oromo", "Maths", "Physics", "Biology", "History",
      "Citizenship", "ICT", "Economics", "Agriculture", "WDD", "HPE",
    ]);
  }

  return successResponse(subjects, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
});

export const POST = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
    return errorResponse("Unauthorized", 403);
  }

  const body = await request.json();

  if (!Array.isArray(body)) {
    return errorResponse("Body must be an array of subject names", 400);
  }

  // Delete all existing subjects
  await db.from("subjects").delete().neq("name", "");

  const subjectsToInsert = body.map((name) => ({ name }));
  const { error } = await db.from("subjects").insert(subjectsToInsert);

  if (error) {
    console.error("Supabase error updating subjects:", error);
    return errorResponse(error.message, 500);
  }

  return successResponse({ success: true });
});
