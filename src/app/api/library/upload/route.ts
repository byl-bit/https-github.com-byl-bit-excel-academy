import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Increase payload size limit if possible? No, App Router default is usually 4MB.
// We handle that in client.

export async function POST(request: Request) {
    try {
        console.log('[Library Upload] Starting upload request...');

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            console.error('[Library Upload] No file provided');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`[Library Upload] Processing file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

        // Bucket Name
        const bucketName = 'library-files';

        // Use Admin client if available (bypasses RLS), otherwise standard client
        const client = supabaseAdmin || supabase;
        if (!client) {
            console.error('[Library Upload] No Supabase client available');
            return NextResponse.json({ error: 'Server configuration error: Database client unavailable.' }, { status: 500 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Sanitize filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${timestamp}-${cleanName}`;

        const mimeType = file.type || 'application/octet-stream';

        // 1. Attempt Upload
        console.log(`[Library Upload] Uploading to bucket: ${bucketName}`);
        let { data, error } = await client.storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true
            });

        // 2. Handle Bucket Not Found -> Create it (only possible with Admin)
        if (error && (error.message.includes('bucket not found') || error.message.includes('The resource was not found'))) {
            console.warn(`[Library Upload] Bucket ${bucketName} not found. Attempting to create...`);

            if (supabaseAdmin) {
                const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                    public: true,
                    fileSizeLimit: 10485760, // 10MB
                    allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
                });

                if (createError) {
                    console.error('[Library Upload] Failed to create bucket:', createError);
                    // Fallback to 'public' or 'images' if standard buckets exist?
                    // Return error for now.
                    return NextResponse.json({ error: 'Storage bucket missing and creation failed.' }, { status: 500 });
                }

                // Retry upload
                console.log('[Library Upload] Bucket created. Retrying upload...');
                const retry = await client.storage
                    .from(bucketName)
                    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

                data = retry.data;
                error = retry.error;
            } else {
                console.error('[Library Upload] Bucket missing and no Admin key to create it.');
                return NextResponse.json({ error: 'Storage bucket not found. Please contact admin to configure storage.' }, { status: 500 });
            }
        }

        if (error) {
            console.error('[Library Upload] Upload failed:', error);
            return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
        }

        if (!data?.path) {
            console.error('[Library Upload] Upload succeeded but path missing');
            return NextResponse.json({ error: 'Upload verification failed' }, { status: 500 });
        }

        // 3. Get Public URL
        const { data: urlData } = client.storage.from(bucketName).getPublicUrl(data.path);

        console.log(`[Library Upload] Success. URL: ${urlData.publicUrl}`);
        return NextResponse.json({
            url: urlData.publicUrl,
            path: data.path,
            fileName: file.name
        });

    } catch (e: any) {
        console.error('[Library Upload] Exception:', e);
        return NextResponse.json({ error: e.message || 'Server error during upload' }, { status: 500 });
    }
}
