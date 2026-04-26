import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";

export const POST = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin") {
      return errorResponse("Unauthorized: Admin role required", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedBucket = formData.get("bucket") as string | null;
    const customFileName = formData.get("fileName") as string | null;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const category = formData.get("category") as string | null;
    let mimeType = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";

    if (!mimeType || mimeType === "application/octet-stream") {
      const mimeMap: Record<string, string> = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        txt: "text/plain",
      };
      mimeType = mimeMap[ext] || "application/octet-stream";
    }

    const name = customFileName || `media-${Date.now()}.${ext}`;
    const finalName = category ? `${category}/${name}` : name;
    let bucket = requestedBucket || "letterheads";

    console.log(`[Upload] Attempting upload to: ${bucket}, File: ${name}`);
    let { data, error } = (await db.storage
      .from(bucket)
      .upload(finalName, buffer, {
        contentType: mimeType,
        upsert: true,
      })) as any;

    if (error) {
      console.warn(`[Upload] First attempt failed for bucket ${bucket}: ${error.message}`);
      if (
        error.message.includes("bucket not found") ||
        error.status === 400 ||
        error.status === 404 ||
        error.statusCode === "404"
      ) {
        try {
          const { data: buckets } = await db.storage.listBuckets();
          if (buckets && buckets.length > 0) {
            bucket = buckets[0].name;
            console.log(`[Upload] Self-healing: Found existing bucket "${bucket}". Retrying upload...`);
            const retry = (await db.storage.from(bucket).upload(finalName, buffer, {
                contentType: mimeType,
                upsert: true,
              })) as any;
            data = retry.data;
            error = retry.error;
          } else {
            console.log(`[Upload] Self-healing: No buckets found. Attempting to create "letterheads"...`);
            const { error: createError } = await db.storage.createBucket("letterheads", { public: true });
            if (!createError) {
              bucket = "letterheads";
              const retry = (await db.storage.from(bucket).upload(finalName, buffer, {
                  contentType: mimeType,
                  upsert: true,
                })) as any;
              data = retry.data;
              error = retry.error;
            } else {
              console.error("[Upload] Self-healing: Failed to create bucket:", createError);
              return errorResponse(`Storage bucket missing and auto-creation failed: ${createError.message}`, 500);
            }
          }
        } catch (e: any) {
          console.error("[Upload] Exception during self-healing:", e);
        }
      }
    }

    if (error || !data) {
      console.error(`[Upload] Final upload failure:`, error || "No data returned");
      return errorResponse(error?.message || "Upload failed", 500);
    }

    if (!data.path) {
      return errorResponse("Upload succeeded but file path is missing", 500);
    }

    const publicUrl = db.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
    console.log(`[Upload] Success! URL: ${publicUrl}`);

    return successResponse({
      url: publicUrl,
      key: finalName,
      bucket_used: bucket,
    });
  } catch (e: any) {
    console.error("[Upload] API Exception:", e);
    return errorResponse(e.message || "Critical upload failure", 500);
  }
});

export const DELETE = withApiHandler(async (request, { db, actorRole }) => {
  try {
    if (actorRole !== "admin") {
      return errorResponse("Unauthorized: Admin role required", 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const fileName = searchParams.get("fileName");
    const requestedBucket = searchParams.get("bucket") || "letterheads";

    if (!id && !fileName) {
      return errorResponse("ID or fileName required for deletion", 400);
    }

    const pathToDelete = id || (fileName ? `gallery/${fileName}` : "");
    if (!pathToDelete) return errorResponse("Invalid path", 400);

    console.log(`[Delete] Attempting to delete from: ${requestedBucket}, Path: ${pathToDelete}`);
    const { error } = await db.storage.from(requestedBucket).remove([pathToDelete]);

    if (error) {
      console.error("[Delete] Supabase error:", error);
      return errorResponse(error.message, 500);
    }

    return successResponse({ success: true });
  } catch (e: any) {
    console.error("[Delete] API Exception:", e);
    return errorResponse(e.message || "Critical delete failure", 500);
  }
});

