import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";
import { isRecord, getString } from "@/lib/data-utils";

export const GET = withApiHandler(async (request, { db, actorRole }) => {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");

  let query = db
    .from("announcements")
    .select(
      "id, title, content, date, type, urgency, image_url, media, target_audience, created_at",
    )
    .order("created_at", { ascending: false });

  if (limit) {
    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit)) query = query.limit(parsedLimit);
  }

  if (actorRole === "admin") {
    // Admins see everything
  } else if (actorRole === "student" || actorRole === "teacher") {
    const targetAudienceValue = actorRole === "student" ? "students" : "teachers";
    // Match 'all', the specific role, OR null
    query = query.or(
      `target_audience.cs.{all},target_audience.cs.{${targetAudienceValue}},target_audience.is.null`,
    );
  } else {
    // Public/Home page: only show 'all'
    query = query.or("target_audience.cs.{all},target_audience.is.null");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error fetching announcements:", error);
    return successResponse([]);
  }

  const mappedData = (data || [])
    .map((item: unknown) => {
      if (!isRecord(item)) return null;

      const id = getString(item, "id") || "";
      const title = getString(item, "title") || "";
      const bodyContent =
        getString(item, "content") || getString(item, "body") || "";
      const date =
        getString(item, "date") ||
        getString(item, "created_at")?.split("T")[0] ||
        new Date().toISOString().split("T")[0];
      const type =
        getString(item, "type") || getString(item, "urgency") || "general";
      const imageUrl =
        getString(item, "image_url") || getString(item, "imageUrl") || null;

      let audience = "all";
      const rawAudience = item["target_audience"];
      if (Array.isArray(rawAudience) && rawAudience.length > 0) {
        audience = rawAudience[0];
      } else if (typeof rawAudience === "string") {
        audience = rawAudience;
      }

      // Process media array efficiently
      let mediaArr: Array<Record<string, any>> = [];
      const mediaRaw = item["media"];

      if (Array.isArray(mediaRaw)) {
        mediaArr = mediaRaw.map((m: any) => ({
          type:
            m.type ||
            (m.url && m.url.match(/\.mp4|\.webm/) ? "video" : "image"),
          url: m.url || "",
          name: m.name || null,
        }));
      } else if (typeof mediaRaw === "string") {
        try {
          const parsed = JSON.parse(mediaRaw || "[]");
          if (Array.isArray(parsed)) mediaArr = parsed;
        } catch {
          mediaArr = [];
        }
      }

      if (!mediaArr.length && imageUrl) {
        mediaArr = [{ type: "image", url: imageUrl, name: null }];
      }

      return {
        id,
        title,
        body: bodyContent,
        date,
        type,
        imageUrl,
        media: mediaArr,
        audience,
      };
    })
    .filter(Boolean);

  return successResponse(mappedData, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=50",
    },
  });
});

export const POST = withApiHandler(async (request, { db, actorRole }) => {
  if (actorRole !== "admin") {
    return errorResponse("Unauthorized: admin role required", 403);
  }

  const bodyRaw = await request.json();

  // Fast-path: Clear and return if empty
  const { error: deleteError } = await db
    .from("announcements")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) {
    return errorResponse("Failed to clear existing announcements: " + deleteError.message, 500);
  }

  if (Array.isArray(bodyRaw) && bodyRaw.length > 0) {
    const mappedAnnouncements = bodyRaw.map((item: unknown) => {
      if (!isRecord(item)) return { title: "", content: "" };

      const title = getString(item, "title") || "";
      const content =
        getString(item, "body") || getString(item, "content") || "";
      const typeVal = getString(item, "type") || undefined;
      const dateVal = getString(item, "date") || undefined;
      const imageVal =
        getString(item, "imageUrl") ||
        getString(item, "image_url") ||
        undefined;
      const audienceVal = getString(item, "audience") || "all";

      let mediaVal = item["media"];
      if (typeof mediaVal === "string") {
        try {
          mediaVal = JSON.parse(mediaVal || "[]");
        } catch {
          mediaVal = undefined;
        }
      }

      const payload: Record<string, any> = {
        title,
        content,
        target_audience: [audienceVal],
      };
      if (typeVal) {
        payload.urgency = typeVal;
        payload.type = typeVal;
      }
      if (dateVal) payload.date = dateVal;
      if (Array.isArray(mediaVal) && mediaVal.length) {
        payload.media = mediaVal;
      } else if (imageVal) {
        payload.image_url = imageVal;
      }

      return payload;
    });

    const { error: insertError } = await db
      .from("announcements")
      .insert(mappedAnnouncements);
    if (insertError) {
      console.error("Supabase error saving announcements:", insertError);
      return errorResponse("Failed to save: " + insertError.message, 500);
    }

    // Create notification for all students
    try {
      await db.from("notifications").insert({
        type: "broadcast",
        category: "announcement",
        action: "New Announcements Posted",
        details: `${mappedAnnouncements.length} new announcements have been published.`,
        user_name: "Admin",
      });
    } catch (nErr) {
      console.error("Failed to create notification for announcements:", nErr);
    }
  }

  return successResponse({ success: true });
});

