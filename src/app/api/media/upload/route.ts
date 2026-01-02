import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const requestedBucket = formData.get('bucket') as string | null;
    const customFileName = formData.get('fileName') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Better mime type detection
    let mimeType = file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    
    // Fallback mime types if browser doesn't provide them
    if (!mimeType || mimeType === 'application/octet-stream') {
        const mimeMap: Record<string, string> = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'txt': 'text/plain',
            'csv': 'text/csv'
        };
        mimeType = mimeMap[ext] || 'application/octet-stream';
    }

    const name = customFileName || `media-${Date.now()}.${ext}`;

    let bucket = requestedBucket || 'letterheads';

    // Check if Supabase placeholder is used
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return NextResponse.json({ error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' }, { status: 500 });
    }

    // Use admin client for upload if available, as these are admin-level uploads
    const uploadClient = supabaseAdmin || supabase;

    // Attempt upload to the preferred bucket
    console.log(`[Upload] Attempting upload to: ${bucket}, File: ${name}`);
    let { data, error } = (await uploadClient.storage.from(bucket).upload(name, buffer, {
      contentType: mimeType,
      upsert: true
    })) as any;

    if (error) {
      console.warn(`[Upload] First attempt failed for bucket ${bucket}: ${error.message}`);

      // If bucket not found, try self-healing
      if (error.message.includes('bucket not found') || error.status === 400 || error.status === 404 || error.statusCode === '404') {
        try {
          const adminClient = supabaseAdmin || supabase;
          const { data: buckets, error: listError } = await adminClient.storage.listBuckets();

          if (listError) {
            console.error('[Upload] listBuckets error:', listError);
          }

          if (buckets && buckets.length > 0) {
            bucket = buckets[0].name;
            console.log(`[Upload] Self-healing: Found existing bucket "${bucket}". Retrying upload...`);

            const retry = (await uploadClient.storage.from(bucket).upload(name, buffer, {
              contentType: mimeType,
              upsert: true
            })) as any;
            data = retry.data;
            error = retry.error;
          } else {
            console.log(`[Upload] Self-healing: No buckets found. Attempting to create "letterheads"...`);
            if (!supabaseAdmin) {
              console.error('[Upload] Self-healing: supabaseAdmin not available. Cannot create bucket.');
              return NextResponse.json({
                error: 'Storage bucket missing and auto-creation failed: SUPABASE_SERVICE_ROLE_KEY is not configured.'
              }, { status: 500 });
            }
            const { error: createError } = await supabaseAdmin.storage.createBucket('letterheads', { public: true });

            if (!createError) {
              bucket = 'letterheads';
              console.log('[Upload] Self-healing: Bucket "letterheads" created. Retrying upload...');
              const retry = (await uploadClient.storage.from(bucket).upload(name, buffer, {
                contentType: mimeType,
                upsert: true
              })) as any;
              data = retry.data;
              error = retry.error;
            } else {
              console.error('[Upload] Self-healing: Failed to create bucket:', createError);
              return NextResponse.json({
                error: `Storage bucket missing and auto-creation failed: ${createError.message}. Please create a public bucket manually in Supabase.`
              }, { status: 500 });
            }
          }
        } catch (e: any) {
          console.error('[Upload] Exception during self-healing:', e);
        }
      }
    }

    if (error || !data) {
      console.error(`[Upload] Final upload failure:`, error || 'No data returned');
      return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
    }

    // Defensive check before getPublicUrl
    if (!data.path) {
      console.error('[Upload] Success but data.path is missing:', data);
      return NextResponse.json({ error: 'Upload succeeded but file path is missing' }, { status: 500 });
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
    console.log(`[Upload] Success! URL: ${publicUrl}`);

    return NextResponse.json({ url: publicUrl, key: data.path, bucket_used: bucket });
  } catch (e: any) {
    console.error('[Upload] API Exception:', e);
    return NextResponse.json({ error: e.message || 'Critical upload failure' }, { status: 500 });
  }
}
