import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    let bucket = 'letterheads';

    // Attempt to list from 'letterheads'
    console.log(`[List] Attempting to list from: ${bucket}`);
    let { data, error } = await supabase.storage.from(bucket).list('', { limit: 100 });

    if (error && (error.message.includes('bucket not found') || (error as any).status === 400 || (error as any).status === 404)) {
      console.warn(`[List] Bucket "${bucket}" not found. Attempting self-healing...`);
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (buckets && buckets.length > 0) {
          bucket = buckets[0].name;
          console.log(`[List] Self-healing: Using existing bucket "${bucket}"`);
          const retry = await supabase.storage.from(bucket).list('', { limit: 100 });
          data = retry.data;
          error = retry.error;
        } else {
          console.log('[List] Self-healing: No buckets found.');
        }
      } catch (e: any) {
        console.error('[List] Exception during self-healing:', e);
      }
    }

    if (error) {
      console.error('[List] Final list failure:', error);
      return NextResponse.json({ error: error.message || 'Failed to list files' }, { status: 500 });
    }

    const items = (data || []).map(item => ({ name: item.name, path: item.name }));
    // Build public URLs
    const urls = items.map(i => ({
      name: i.name,
      url: supabase.storage.from(bucket).getPublicUrl(i.path).data.publicUrl
    }));

    console.log(`[List] Success! Found ${urls.length} items in bucket "${bucket}"`);
    return NextResponse.json(urls);
  } catch (e: any) {
    console.error('[List] API Exception:', e);
    return NextResponse.json({ error: e.message || 'Critical list failure' }, { status: 500 });
  }
}