import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const GET = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin" && actorRole !== "teacher") {
      return errorResponse("Unauthorized", 403);
    }

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || "";
    
    let bucket = "letterheads";

    console.log(`[List] Attempting to list from: ${bucket}, Prefix: ${prefix}`);
    let { data, error } = await db.storage
      .from(bucket)
      .list(prefix, { limit: 100 });

    if (
      error &&
      (error.message.includes("bucket not found") ||
        (error as any).status === 400 ||
        (error as any).status === 404)
    ) {
      console.warn(`[List] Bucket "${bucket}" not found. Attempting self-healing...`);
      try {
        const { data: buckets } = await db.storage.listBuckets();
        if (buckets && buckets.length > 0) {
          bucket = buckets[0].name;
          console.log(`[List] Self-healing: Using existing bucket "${bucket}"`);
          const retry = await db.storage.from(bucket).list(prefix, { limit: 100 });
          data = retry.data;
          error = retry.error;
        }
      } catch (e: any) {
        console.error("[List] Exception during self-healing:", e);
      }
    }

    if (error) {
      console.error("[List] Final list failure:", error);
      return errorResponse(error.message || "Failed to list files", 500);
    }

    const items = (data || []).map((item) => {
      const cleanPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
      const path = prefix ? `${cleanPrefix}/${item.name}` : item.name;
      return { name: item.name, path: path };
    });

    const urls = items.map((i) => ({
      name: i.name,
      id: i.path,
      url: db.storage.from(bucket).getPublicUrl(i.path).data.publicUrl,
    }));

    console.log(`[List] Success! Found ${urls.length} items in bucket "${bucket}"`);
    return successResponse(urls);
  } catch (e: any) {
    console.error("[List] API Exception:", e);
    return errorResponse(e.message || "Critical list failure", 500);
  }
});
