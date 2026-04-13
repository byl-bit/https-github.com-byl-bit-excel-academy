import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const role = req.headers.get("x-actor-role") || "";
  const db = supabaseAdmin || supabase;
  
  const { data, error } = await db
    .from("allocations")
    .select("id, teacher_id, teacher_name, grade, section, subject, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching allocations:", error);
    return NextResponse.json([]);
  }

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  try {
    const role = req.headers.get("x-actor-role") || "";
    // Allow both admin and teacher to POST allocations if needed, 
    // but typically only admin should manage them. 
    // We'll stick to admin for safety unless requested otherwise.
    if (role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const db = supabaseAdmin || supabase;

    if (Array.isArray(body)) {
      // Full replace: delete all and insert new
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
      return NextResponse.json({ success: true });
    }

    // Single create
    const record = {
      teacher_id: body.teacherId, // Map to snake_case
      teacher_name: body.teacherName, // Map to snake_case
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create allocation" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const role = req.headers.get("x-actor-role") || "";
  if (role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const db = supabaseAdmin || supabase;
  const { error } = await db.from("allocations").delete().eq("id", id);

  if (error) {
    console.error("Supabase error deleting allocation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
