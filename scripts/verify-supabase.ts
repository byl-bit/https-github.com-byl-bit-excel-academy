import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Find .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn("⚠️ .env.local not found. Using current environment variables.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials. Have you configured .env.local?");
  process.exit(1);
}

console.log(`🔌 Attempting to connect to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string, requiredColumns: string[] = []) {
  process.stdout.write(`   Checking ${tableName}... `);
  
  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ FAILED: Table does not exist.`);
      } else {
        console.log(`❌ FAILED: ${error.message}`);
      }
      return false;
    }
    
    // Check required columns if any
    let missingColumns: string[] = [];
    if (requiredColumns.length > 0) {
      for (const col of requiredColumns) {
         const { error: colErr } = await supabase.from(tableName).select(col).limit(1);
         if (colErr && (colErr.message.includes("Could not find the") || colErr.code === 'PGRST200')) {
             missingColumns.push(col);
         }
      }
    }
    
    if (missingColumns.length > 0) {
        console.log(`⚠️ WARNING: Missing columns: ${missingColumns.join(", ")}`);
        return false;
    }
    
    console.log(`✅ OK`);
    return true;
  } catch (err: any) {
    console.log(`❌ ERROR: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("==========================================");
  console.log(" SUPABASE DATABASE CONNECTIVITY VERIFIER");
  console.log("==========================================\n");
  
  let allPass = true;
  
  const tablesToCheck = [
    { name: "users", columns: ["id", "email", "role", "photo", "gender", "admin_id", "status"] },
    { name: "results", columns: ["id", "student_id", "student_name", "total", "average", "result", "promoted_or_detained", "subjects"] },
    { name: "results_pending", columns: ["id"] },
    { name: "admissions", columns: ["id", "student_name", "file_name", "grade", "gender"] },
    { name: "allocations", columns: ["id", "teacher_id", "subject", "section"] },
    { name: "announcements", columns: ["id", "title", "content", "type", "image_url"] },
    { name: "settings", columns: ["key", "value"] },
    { name: "subjects", columns: ["name"] },
    { name: "attendance", columns: ["id", "student_id", "date", "status"] },
    { name: "password_reset_requests", columns: ["id", "user_id", "token"] },
    { name: "books", columns: ["id", "title", "file_name", "category", "file_url"] }
  ];

  for (const t of tablesToCheck) {
      const passed = await checkTable(t.name, t.columns);
      if (!passed) allPass = false;
  }
  
  console.log("\n==========================================");
  if (allPass) {
      console.log("✅ ALL DATABASE CHECKS PASSED!");
      console.log("   The system is fully configured and ready.");
  } else {
      console.log("❌ SOME DB CHECKS FAILED!");
      console.log("   Check the required SQL schema or environment variables.");
  }
  console.log("==========================================");
}

main().catch(e => {
  console.error("\n💥 Unexpected fatal error:", e.message);
  process.exit(1);
});
