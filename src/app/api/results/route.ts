import { withApiHandler, successResponse, errorResponse } from "@/lib/api-handler";
import { logActivity } from "@/lib/utils/activityLog";
import { calculateRanks } from "@/lib/utils/excelCalculations";
import {
  calculatePassStatus,
  calculatePromotionStatus,
  calculateConduct,
} from "@/lib/utils/gradingLogic";
import { normalizeGender } from "@/lib/data-utils";
import type {
  PendingResult,
  PublishedResult,
  Subject,
  AssessmentType,
} from "@/lib/types";

export const GET = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const gradeFilter = searchParams.get("grade");
    const sectionFilter = searchParams.get("section");
    const studentIdFilter = searchParams.get("studentId");
    const limit = searchParams.get("limit");

    // Helper to prepare base queries
    const buildQuery = (table: string) => {
      let q = db.from(table).select("*");
      if (gradeFilter) q = q.eq("grade", gradeFilter);
      if (sectionFilter) q = q.eq("section", sectionFilter);
      if (studentIdFilter) q = q.eq("student_id", studentIdFilter);
      if (limit) q = q.limit(parseInt(limit));
      return q;
    };

    // --- ADMIN / PUBLIC FLOW ---
    if (actorRole === "admin" || actorRole === "guest") {
      const [publishedRes, pendingRes] = await Promise.all([
        buildQuery("results"),
        buildQuery("results_pending"),
      ]);

      const publishedObj: Record<string, PublishedResult> = {};
      const pendingObj: Record<string, PendingResult> = {};

      (publishedRes.data || []).forEach((r: any) => {
        publishedObj[String(r.student_id)] = r;
      });
      (pendingRes.data || []).forEach((r: any) => {
        pendingObj[String(r.student_id)] = r;
      });

      return successResponse({
        published: publishedObj,
        pending: pendingObj,
      });
    }

    // --- TEACHER FLOW ---
    if (actorRole === "teacher") {
      if (!actorId) return errorResponse("Teacher ID required", 400);

      // 1. Identify Teacher
      const { data: teacher } = await db
        .from("users")
        .select("id, teacher_id, grade, section, name")
        .or(`id.eq.${actorId},teacher_id.eq.${actorId}`)
        .single();

      if (!teacher) return successResponse({ published: {}, pending: {} });

      // 2. Get Allocations & Relevant Students
      let userQuery = db
        .from("users")
        .select("id, student_id, name, grade, section, roll_number, gender")
        .eq("role", "student");
      if (gradeFilter) userQuery = userQuery.eq("grade", gradeFilter);
      if (sectionFilter) userQuery = userQuery.eq("section", sectionFilter);

      const [allocRes, usersRes, pubRes, penRes] = await Promise.all([
        db
          .from("allocations")
          .select("id, teacher_id, grade, section")
          .or(`teacher_id.eq.${teacher.id},teacher_id.eq.${teacher.teacher_id}`),
        userQuery,
        buildQuery("results"),
        buildQuery("results_pending"),
      ]);

      const allocations = allocRes.data || [];
      const users = usersRes.data || [];
      const published = pubRes.data || [];
      const pending = penRes.data || [];

      // Permission Logic
      const isHomeroomOfClass = (g: string, s: string) =>
        String(teacher.grade) === g && String(teacher.section) === s;
      const isAllocated = (g: string, s: string) => {
        if (allocations.some((a: any) => String(a.grade) === g && String(a.section) === s)) return true;
        if (isHomeroomOfClass(g, s)) return true;
        return false;
      };

      const resolveGradeSection = (entry: any) => {
        if (entry.grade && entry.section) return { grade: String(entry.grade), section: String(entry.section) };
        const s = users.find((u: any) => u.student_id === entry.student_id || u.id === entry.student_id);
        if (s) return { grade: String(s.grade), section: String(s.section) };
        return { grade: "", section: "" };
      };

      const filteredPublished: Record<string, any> = {};
      const filteredPending: Record<string, any> = {};

      published.forEach((entry: any) => {
        const { grade, section } = resolveGradeSection(entry);
        if (grade && section && isAllocated(grade, section)) {
          filteredPublished[String(entry.student_id)] = entry;
        }
      });

      pending.forEach((entry: any) => {
        const { grade, section } = resolveGradeSection(entry);
        if (grade && section && isAllocated(grade, section)) {
          filteredPending[String(entry.student_id)] = entry;
        }
      });

      return successResponse({
        published: filteredPublished,
        pending: filteredPending,
      });
    }

    // --- STUDENT FLOW ---
    if (actorRole === "student") {
      if (!actorId) return errorResponse("Student ID required", 400);

      const { data: student } = await db
        .from("users")
        .select("id, student_id, name")
        .or(`id.eq.${actorId},student_id.eq.${actorId}`)
        .single();

      if (!student) return successResponse({});

      const [pubRes, penRes] = await Promise.all([
        db.from("results").select("*").eq("student_id", student.student_id),
        db.from("results_pending").select("*").eq("student_id", student.student_id),
      ]);

      const published = pubRes.data || [];
      const pending = penRes.data || [];
      const found: Record<string, any> = {};
      const studentIdKey = String(student.id);

      const processEntry = (entry: any) => {
        const approvedSubjects = (entry.subjects || [])
          .filter((s: Subject) => s.status === "published" || s.status === "approved")
          .map((s: Subject) => ({
            ...s,
            name: s.name || "",
            marks: Number(s.marks || 0),
            status: s.status || "published",
            assessments: s.assessments
              ? Object.fromEntries(Object.entries(s.assessments).map(([k, v]) => [k, Number(v || 0)]))
              : undefined,
          }));

        if (approvedSubjects.length === 0) return;

        if (!found[studentIdKey]) {
          found[studentIdKey] = {
            ...entry,
            studentId: entry.student_id,
            studentName: entry.student_name || student.name,
            subjects: approvedSubjects,
            total: Number(entry.total || 0),
            average: Number(entry.average || 0),
            promotedOrDetained: entry.promoted_or_detained || "",
          };
        } else {
          const existingSubjects = found[studentIdKey].subjects || [];
          const existingSubMap = new Map<string, any>();
          existingSubjects.forEach((s: any) => existingSubMap.set(s.name, s));
          
          approvedSubjects.forEach((newSub: any) => {
            const existing = existingSubMap.get(newSub.name);
            if (existing) {
              existingSubMap.set(newSub.name, {
                ...existing,
                ...newSub,
                sem1: newSub.sem1 || existing.sem1 || 0,
                sem2: newSub.sem2 || existing.sem2 || 0,
                marks: newSub.marks > existing.marks ? newSub.marks : existing.marks,
                assessments: { ...(existing.assessments || {}), ...(newSub.assessments || {}) }
              });
            } else {
              existingSubMap.set(newSub.name, newSub);
            }
          });
          found[studentIdKey].subjects = Array.from(existingSubMap.values());
        }
      };

      published.forEach(processEntry);
      pending.forEach(processEntry);

      return successResponse(found);
    }

    return successResponse({});
  } catch (err) {
    console.error("Error fetching results", err);
    return errorResponse("Failed to fetch results", 500);
  }
});


export const POST = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    const body = await request.json().catch(() => ({}));

    if (!["admin", "teacher"].includes(actorRole)) {
      return errorResponse("Unauthorized: role not allowed", 403);
    }

    const resultsObj = body && typeof body === "object" ? body : {};

    // 1. Common Data: Settings (Small enough to fetch all)
    const { data: settingsArr } = await db
      .from("settings")
      .select("key, value");
    const settings: Record<string, unknown> = {};
    (settingsArr || []).forEach((s) => {
      settings[String(s.key)] = s.value;
    });
    const assessmentTypes = (settings["assessmentTypes"] ??
      []) as AssessmentType[];

    // 2. Identify keys to act upon
    const inputKeys = Object.keys(resultsObj);
      if (inputKeys.length === 0)
      return errorResponse("No results provided", 400);

    // Extract student IDs (either from key or body) to optimize fetches
    const targetStudentIds = new Set<string>();
    // Also track internal IDs if mixed usage
    const potentialInternalIds = new Set<string>();

    inputKeys.forEach((k) => {
      const entry = resultsObj[k];
      if (entry) {
        const sid = entry.studentId || entry.student_id || entry.student || k;
        targetStudentIds.add(String(sid));
        potentialInternalIds.add(String(sid));
      }
    });

    const targetIdsArray = Array.from(targetStudentIds);

    // --- TEACHER SUBMISSION FLOW ---
    if (actorRole === "teacher") {
      // A. Verify Teacher
      const { data: teacher } = await db
        .from("users")
        .select("id, teacher_id, grade, section, name")
        .or(`id.eq.${actorId},teacher_id.eq.${actorId}`)
        .single();

      if (!teacher)
        return errorResponse("Unauthorized: teacher profile not found", 403);

      // B. Allocations
      const { data: allocations } = await db
        .from("allocations")
        .select("id, teacher_id, grade, section")
        .or(`teacher_id.eq.${teacher.id},teacher_id.eq.${teacher.teacher_id}`);

      // C. Fetch Relevant Users (Students)
      // We fetch users matching the target IDs to resolve names/grades
      // Using 'or' to match either id or student_id column is a bit complex with a large list,
      // but for a class submission (~50 students), it's fine.
      // Optimized: Fetch users where student_id IN list OR id IN list
      const { data: relevantUsers } = await db
        .from("users")
        .select("id, student_id, name, grade, section, gender, roll_number")
        .or(
          `student_id.in.(${targetIdsArray.join(",")}),id.in.(${targetIdsArray.join(",")})`,
        );

      const users = relevantUsers || [];

      // D. Fetch Pending Results (Only for these students, to merge)
      // We assume key in pending_results is student_id.
      const { data: pendingArr } = await db
        .from("results_pending")
        .select("*")
        .in("student_id", targetIdsArray);

      const pendingResults: Record<string, PendingResult> = {};
      (pendingArr || []).forEach((r: any) => {
        pendingResults[String(r.student_id)] = r;
      });

      const firstKey = inputKeys[0];
      const submissionLevel =
        resultsObj[firstKey]?.submissionLevel ||
        resultsObj[firstKey]?.submission_level ||
        "subject";

      const pendingArray: any[] = [];
      const processedStudentIds = new Set<string>();

      const teacherAllocations = allocations || [];

      for (const key of inputKeys) {
        const resEntry = resultsObj[key];
        if (!resEntry) continue;

        const inputId =
          resEntry.studentId ||
          resEntry.student_id ||
          resEntry.student ||
          String(key);

        const studentUser = users.find(
          (u: any) =>
            String(u.student_id).toLowerCase() ===
              String(inputId).toLowerCase() ||
            String(u.id).toLowerCase() === String(inputId).toLowerCase(),
        );

        const actualStudentId = studentUser?.student_id || inputId;
        if (processedStudentIds.has(actualStudentId)) continue;

        const resolvedGrade = String(resEntry.grade || studentUser?.grade || "");
        const resolvedSection = String(
          resEntry.section || studentUser?.section || "",
        );

        if (!resolvedGrade || !resolvedSection) {
          if (!studentUser)
            return errorResponse(`Could not resolve grade/section for student ${inputId}`, 400);
        }

        // Permission
        const isSubjectTeacher = teacherAllocations.some(
          (a: any) =>
            String(a.grade) === resolvedGrade &&
            String(a.section) === resolvedSection,
        );
        const isHomeRoomTeacher =
          String(teacher.grade) === resolvedGrade &&
          String(teacher.section) === resolvedSection;

        if (!isSubjectTeacher && !isHomeRoomTeacher) {
          return errorResponse(`Permission denied for Class ${resolvedGrade}-${resolvedSection}`, 403);
        }
        if (submissionLevel === "roster" && !isHomeRoomTeacher) {
          return errorResponse("Only Home Room teachers can submit the final roster.", 403);
        }

        // Process (Logic preserved from original)
        const incomingSubjects = Array.isArray(resEntry.subjects)
          ? resEntry.subjects
          : [];
        const processedSubjects = incomingSubjects.map((sub: Subject) => {
          const s = { ...sub };
          if (s.assessments && assessmentTypes.length > 0) {
            let calculatedTotal = 0;
            for (const type of assessmentTypes) {
              const val = (s.assessments || {})[String(type.id)];
              if (val !== undefined && val !== null) {
                calculatedTotal +=
                  (Number(val) / (Number(type.maxMarks) || 100)) *
                  Number(type.weight);
              }
            }
            s.marks = Math.round(calculatedTotal * 10) / 10;
          }
          let subStatus = s.status || "draft";
          if (submissionLevel === "subject-pending")
            subStatus = "pending_admin";
          if (submissionLevel === "roster") subStatus = "pending_roster_final";
          return {
            ...s,
            submittedAt: new Date().toISOString(),
            submittedBy: actorId,
            status: subStatus,
          };
        });

        // Merge
        let existingPending = pendingResults[actualStudentId];
        // Try finding by internal ID if mismatch
        if (!existingPending && studentUser)
          existingPending = pendingResults[String(studentUser.id)]; // DB uses student_id as key mainly

        const subMap = new Map<string, Subject>();
        // 1. Start with existing subjects
        if (existingPending && Array.isArray(existingPending.subjects)) {
          existingPending.subjects.forEach((s: Subject) => subMap.set(s.name, s));
        }

        // 2. Merge incoming subjects
        processedSubjects.forEach((s: Subject) => {
          const existing = subMap.get(s.name);
          if (existing) {
            subMap.set(s.name, {
              ...existing,
              ...s,
              assessments: {
                ...(existing.assessments || {}),
                ...(s.assessments || {}),
              },
            });
          } else {
            subMap.set(s.name, s);
          }
        });

        const mergedSubjects = Array.from(subMap.values());

        // 3. Recalculate marks from merged assessments
        mergedSubjects.forEach((s: Subject) => {
          if (s.assessments && assessmentTypes.length > 0) {
            let totalMarks = 0;
            let s1Total = 0;
            let s2Total = 0;

            for (const type of assessmentTypes) {
              const val = (s.assessments || {})[String(type.id)];
              if (val !== undefined && val !== null) {
                const contribution = (Number(val) / (Number(type.maxMarks) || 100)) * Number(type.weight);
                totalMarks += contribution;
                if (type.semester === "1") s1Total += contribution;
                else if (type.semester === "2") s2Total += contribution;
                else {
                  // If type has no semester or 'all', it contributes to the annual average directly
                  // but we might want to split it or handle it as 'both'.
                  // For now, follow the logic that totalMarks is the direct sum.
                }
              }
            }
            s.marks = Math.round(totalMarks * 10) / 10;
            if (s1Total > 0) s.sem1 = Math.round(s1Total * 10) / 10;
            if (s2Total > 0) s.sem2 = Math.round(s2Total * 10) / 10;
            
            // Special annual average handling if both semesters are active
            if (s1Total > 0 && s2Total > 0) {
                s.marks = Math.round(((s1Total + s2Total) / 2) * 10) / 10;
            }
          }
        });

        const totalMarks = mergedSubjects.reduce(
          (sum: number, s: Subject) => sum + (Number(s.marks) || 0),
          0,
        );
        const totalRounded = Math.round(totalMarks * 10) / 10;
        const average =
          Math.round((totalRounded / (mergedSubjects.length || 1)) * 10) / 10;

        const resStatus = calculatePassStatus(average);
        const promoStatus = calculatePromotionStatus(resStatus === "PASS");
        const conductRemark = calculateConduct(average);

        const overallStatus =
          submissionLevel === "subject-pending" || submissionLevel === "roster"
            ? "pending"
            : resEntry.status || "draft";

        pendingArray.push({
          student_id: actualStudentId,
          student_name:
            resEntry.studentName ||
            resEntry.student_name ||
            studentUser?.name ||
            "",
          grade: resolvedGrade,
          section: resolvedSection,
          roll_number:
            resEntry.rollNumber ||
            resEntry.roll_number ||
            studentUser?.roll_number ||
            null,
          gender:
            normalizeGender(
              resEntry.gender || resEntry.sex || studentUser?.gender || null,
            ) || null,
          subjects: mergedSubjects,
          total: totalRounded,
          average: average,
          rank: Number(resEntry.rank || 0),
          conduct: resEntry.conduct || conductRemark,
          result: resEntry.result || resStatus,
          promoted_or_detained:
            resEntry.promoted_or_detained ||
            resEntry.promotedOrDetained ||
            promoStatus,
          status: overallStatus,
          submission_level: submissionLevel,
          submitted_by: actorId,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        processedStudentIds.add(actualStudentId);
      }

      // Ranking for Roster: Need ALL students in the class.
      // If submissionLevel is roster, we need to fetch established pending results for the whole class to rank correctly.
      // Use the grade/section from the first entry to fetch the class's pending table.
      if (submissionLevel === "roster" && pendingArray.length > 0) {
        const grade = pendingArray[0].grade;
        const section = pendingArray[0].section;
        const { data: classPendingArr } = await db
          .from("results_pending")
          .select("*")
          .eq("grade", grade)
          .eq("section", section);

        const classPendingMap: Record<string, any> = {};
        (classPendingArr || []).forEach(
          (r: any) => (classPendingMap[r.student_id] = r),
        );
        pendingArray.forEach((p) => (classPendingMap[p.student_id] = p)); // Overlay new ones

        const classRows = Object.values(classPendingMap);
        if (classRows.length > 0) {
          const rankInput = classRows.map((r: any) => ({
            studentId: String(r.student_id),
            total: Number(r.total || 0),
            average: Number(r.average || 0),
          }));
          const ranks = calculateRanks(rankInput, true);
          pendingArray.forEach((p) => (p.rank = ranks[p.student_id] || 1));
        }
      }

      if (pendingArray.length > 0) {
        const studentIds = pendingArray.map((p) => p.student_id);
        // Clean up old drafts
        await db.from("results_pending").delete().in("student_id", studentIds);
        const { error: insError } = await db
          .from("results_pending")
          .insert(pendingArray);
        if (insError)
          return errorResponse(`Failed to save results: ${insError.message}`, 500);

        logActivity({
          userId: actorId,
          userName: teacher?.name || "Teacher",
          action:
            submissionLevel === "roster"
              ? "Submitted Full Roster"
              : "Submitted Marks",
          category: "result",
          details: `${submissionLevel === "roster" ? "Full roster" : "Marks"} for ${pendingArray.length} students`,
        });
      }

      return successResponse({
        success: true,
        message: "Saved successfully",
        count: pendingArray.length,
      });
    }

    // --- ADMIN PUBLICATION FLOW ---
    // ... logic remains same ...
    const { data: relevantUsers } = await db
      .from("users")
      .select("id, student_id, name, grade, section, gender, roll_number")
      .or(
        `student_id.in.(${targetIdsArray.join(",")}),id.in.(${targetIdsArray.join(",")})`,
      );

    const users = relevantUsers || [];

    // Fetch current published results for these students to merge/replace
    const { data: currentResultsArr } = await db
      .from("results")
      .select("*")
      .in("student_id", targetIdsArray);

    const resultsToPublish: any[] = [];
    for (const key of inputKeys) {
      const resEntry = resultsObj[key];
      if (!resEntry) continue;

      const studentId =
        resEntry.studentId || resEntry.student_id || String(key);
      const studentUser = users.find(
        (u: any) =>
          String(u.student_id).toLowerCase() ===
            String(studentId).toLowerCase() ||
          String(u.id).toLowerCase() === String(studentId).toLowerCase(),
      );

      const avg = Number(resEntry.average || 0);
      const resStatus = calculatePassStatus(avg);
      const promo = calculatePromotionStatus(resStatus === "PASS");
      const cond = calculateConduct(avg);

      resultsToPublish.push({
        student_id: studentId,
        student_name:
          resEntry.studentName ||
          resEntry.student_name ||
          studentUser?.name ||
          "",
        grade: String(resEntry.grade || studentUser?.grade || ""),
        section: String(resEntry.section || studentUser?.section || ""),
        roll_number:
          resEntry.rollNumber ||
          resEntry.roll_number ||
          studentUser?.roll_number ||
          null,
        gender:
          normalizeGender(
            resEntry.gender || resEntry.sex || studentUser?.gender || null,
          ) || null,
        subjects: resEntry.subjects || [],
        total: Number(resEntry.total || 0),
        average: avg,
        rank: Number(resEntry.rank || 0),
        conduct: resEntry.conduct || cond,
        result: resEntry.result || resStatus,
        promoted_or_detained:
          resEntry.promotedOrDetained || resEntry.promoted_or_detained || promo,
        status: "published",
        published_at: new Date().toISOString(),
        approved_by: actorId,
        approved_at: new Date().toISOString(),
      });
    }

    // Group by grade/section for ranking
    const classGroups: { [gs: string]: any[] } = {};
    resultsToPublish.forEach((entry) => {
      const gs = `${entry.grade}_${entry.section}`;
      if (!classGroups[gs]) classGroups[gs] = [];
      classGroups[gs].push(entry);
    });

    for (const gs of Object.keys(classGroups)) {
      const classResults = classGroups[gs];
      const [g, s] = gs.split("_");
      const { data: existingClassResults } = await db
        .from("results")
        .select("student_id, total, average")
        .eq("grade", g)
        .eq("section", s);

      const combinedRankInput = (existingClassResults || []).map((r: any) => ({
        studentId: r.student_id,
        total: r.total,
        average: r.average,
      }));

      classResults.forEach((newR) => {
        const idx = combinedRankInput.findIndex(
          (r) => r.studentId === newR.student_id,
        );
        if (idx >= 0)
          combinedRankInput[idx] = {
            studentId: newR.student_id,
            total: newR.total,
            average: newR.average,
          };
        else
          combinedRankInput.push({
            studentId: newR.student_id,
            total: newR.total,
            average: newR.average,
          });
      });

      const ranks = calculateRanks(combinedRankInput, true);
      classResults.forEach((e) => (e.rank = ranks[String(e.student_id)] || 1));
    }

    if (resultsToPublish.length > 0) {
      const studentIds = resultsToPublish.map((r) => r.student_id);
      await db.from("results").delete().in("student_id", studentIds);
      const { error: insError } = await db
        .from("results")
        .insert(resultsToPublish);

      if (insError) {
        console.error("Admin insert error:", insError);
        return errorResponse("Failed to publish results", 500, insError.message);
      }
    }

    return successResponse({ success: true, count: resultsToPublish.length });
  } catch (err: any) {
    console.error("Critical internal error in /api/results POST:", err);
    return errorResponse("Internal Server Error", 500, err?.message);
  }
});


export const PUT = withApiHandler(async (request, { db, actorRole, actorId }) => {
  try {
    if (actorRole !== "admin") {
      return errorResponse("Unauthorized: admin only", 403);
    }

    const body = await request.json().catch(() => ({}));

    // Collect all target IDs to fetch only what's needed
    const targetIds = new Set<string>();
    if (Array.isArray(body.approve))
      body.approve.forEach((id: string) => targetIds.add(id));
    if (Array.isArray(body.reject))
      body.reject.forEach((id: string) => targetIds.add(id));
    if (Array.isArray(body.unlock))
      body.unlock.forEach((id: string) => targetIds.add(id));
    if (Array.isArray(body.deletePublished))
      body.deletePublished.forEach((id: string) => targetIds.add(id));
    if (body.approveSubject && body.approveSubject.studentKey)
      targetIds.add(body.approveSubject.studentKey);

    const targetIdsArray = Array.from(targetIds);

    if (targetIdsArray.length === 0) {
      return successResponse({
        success: true,
        message: "No targets specified",
      });
    }

    // Fetch data defensibly - Only relevant rows
    const { data: publishedArr, error: pubErr } = await db
      .from("results")
      .select("*")
      .in("student_id", targetIdsArray);
    if (pubErr)
      console.warn("Error fetching relevant results:", pubErr.message);

    const { data: pendingArr, error: penErr } = await db
      .from("results_pending")
      .select("*")
      .in("student_id", targetIdsArray);
    if (penErr)
      console.warn("Error fetching relevant pending results:", penErr.message);

    const { data: settingsArr } = await db
      .from("settings")
      .select("key, value");

    // Build settings map and assessmentTypes
    const settings: Record<string, unknown> = {};
    (settingsArr || []).forEach((s) => {
      settings[String(s.key)] = s.value;
    });
    const assessmentTypes = (settings["assessmentTypes"] ??
      []) as AssessmentType[];

    const published: Record<string, PublishedResult> = {};
    const pending: Record<string, PendingResult> = {};
    (publishedArr || []).forEach((r) => {
      published[String((r as Record<string, unknown>).student_id ?? "")] =
        r as PublishedResult;
    });
    (pendingArr || []).forEach((r) => {
      pending[String((r as Record<string, unknown>).student_id ?? "")] =
        r as PendingResult;
    });

    // Full Row Approval
    if (Array.isArray(body.approve)) {
      const toPublish = [];
      for (const key of body.approve) {
        if (pending[key]) {
          const entry = pending[key];
          const existingPub = published[key];

          // If subjects exist, compute marks from assessments (if assessmentTypes are defined) and mark them as published
          let mergedSubjects = (entry.subjects || []) as Subject[];
          if (existingPub && Array.isArray(existingPub.subjects)) {
            const subMap = new Map<string, Subject>();
            existingPub.subjects.forEach((s: Subject) => subMap.set(s.name, s));
            mergedSubjects.forEach((s: Subject) => {
              const existing = subMap.get(s.name);
              const updatedSub = {
                ...(existing || {}),
                ...s,
                status: "published",
                approvedBy: actorId,
                approvedAt: new Date().toISOString(),
              } as Subject & Record<string, any>;

              // Recalculate marks from assessments if applicable
              if (
                updatedSub.assessments &&
                Array.isArray(assessmentTypes) &&
                assessmentTypes.length > 0
              ) {
                let calculatedTotal = 0;
                for (const type of assessmentTypes) {
                  const val = (updatedSub.assessments || {})[String(type.id)];
                  if (val !== undefined && val !== null) {
                    calculatedTotal +=
                      (Number(val) / (Number(type.maxMarks) || 100)) *
                      Number(type.weight);
                  }
                }
                updatedSub.marks = Math.round(calculatedTotal * 10) / 10;
              }
              subMap.set(s.name, updatedSub);
            });
            mergedSubjects = Array.from(subMap.values());
          } else {
            // No existing published, just process pending
            mergedSubjects = mergedSubjects.map((s: Subject) => {
              const subj = { ...s } as Subject & Record<string, any>;
              if (
                subj.assessments &&
                Array.isArray(assessmentTypes) &&
                assessmentTypes.length > 0
              ) {
                let calculatedTotal = 0;
                for (const type of assessmentTypes) {
                  const val = (subj.assessments || {})[String(type.id)];
                  if (val !== undefined && val !== null) {
                    calculatedTotal +=
                      (Number(val) / (Number(type.maxMarks) || 100)) *
                      Number(type.weight);
                  }
                }
                subj.marks = Math.round(calculatedTotal * 10) / 10;
              }
              subj.status = "published";
              subj.approvedBy = actorId;
              subj.approvedAt = new Date().toISOString();
              return subj;
            });
          }

          // Recompute totals and averages to ensure published values are consistent
          const totalMarks = mergedSubjects.reduce(
            (sum: number, s: Subject) => sum + (Number((s as any).marks) || 0),
            0,
          );
          const totalRounded = Math.round(totalMarks * 10) / 10;
          const average =
            Math.round((totalRounded / (mergedSubjects.length || 1)) * 10) / 10;

          // Properly map all fields for results table
          toPublish.push({
            student_id: entry.student_id,
            student_name: entry.student_name || entry.studentName || "",
            grade: entry.grade,
            section: entry.section,
            roll_number: entry.roll_number || entry.rollNumber || null,
            gender:
              normalizeGender(entry.gender ?? (entry as any)["sex"] ?? null) ||
              null,
            subjects: mergedSubjects,
            total: totalRounded,
            average: average,
            rank: entry.rank || null,
            conduct: entry.conduct || null,
            result: entry.result || null,
            promoted_or_detained:
              entry.promoted_or_detained || entry.promotedOrDetained || null,
            status: "published",
            submission_level:
              entry.submission_level || entry.submissionLevel || null,
            published_at: new Date().toISOString(),
            approved_by: actorId,
            approved_at: new Date().toISOString(),
          });
        }
      }
      if (toPublish.length > 0) {
        // Delete existing published results for these students before inserting
        const studentIds = toPublish.map((r) => r.student_id);
        const { error: delError } = await db
          .from("results")
          .delete()
          .in("student_id", studentIds);
        if (delError) {
          console.error("Approval delete error:", delError);
          return errorResponse("Failed to clear old results", 500, delError.message);
        }

        const { error: insError } = await db.from("results").insert(toPublish);
        if (insError) {
          console.error("Approval insert error:", insError);
          return errorResponse("Failed to publish approved results", 500, insError.message);
        }

        // --- GLOBAL RANK RECALCULATION ---
        try {
          // Identify unique grade/sections impacted
          const impactedClasses = new Set<string>();
          toPublish.forEach(p => impactedClasses.add(`${p.grade}_${p.section}`));

          for (const classKey of impactedClasses) {
            const [g, s] = classKey.split("_");
            const { data: classResults } = await db
              .from("results")
              .select("student_id, total, average, grade, section")
              .eq("grade", g)
              .eq("section", s);

            if (classResults && classResults.length > 1) {
              const rankInput = classResults.map(r => ({
                studentId: String(r.student_id),
                total: Number(r.total || 0),
                average: Number(r.average || 0)
              }));
              const ranks = calculateRanks(rankInput, true);

              // Update each record with its new rank
              for (const row of classResults) {
                const newRank = ranks[String(row.student_id)];
                if (newRank) {
                  await db.from("results").update({ rank: newRank }).eq("student_id", row.student_id);
                }
              }
            }
          }
        } catch (rankErr) {
          console.error("Failed to recalculate class ranks after approval:", rankErr);
        }

        // Remove from pending after successful publish
        const { error: penDelError } = await db
          .from("results_pending")
          .delete()
          .in("student_id", body.approve);
        if (penDelError) {
          console.error("Approval pending-delete error:", penDelError);
          // Not fatal for the operation success since results are already published, but good to log
        }

        // Notify students - Resolve UUIDs first for reliable delivery
        try {
          const { data: userUUIDs } = await db
            .from("users")
            .select("id, student_id")
            .in("student_id", studentIds);

          const uuidMap: Record<string, string> = {};
          (userUUIDs || []).forEach((u) => {
            if (u.student_id) uuidMap[u.student_id] = u.id;
          });

          const notifications = toPublish.map((r) => ({
            type: "result",
            category: "result",
            user_id: uuidMap[String(r.student_id)] || r.student_id, // Prefer UUID
            user_name: r.student_name,
            action: "Results Published",
            details: `Your results for Grade ${r.grade} have been officially approved and published.`,
            target_id: uuidMap[String(r.student_id)] || r.student_id,
            target_name: r.student_name,
          }));
          await db.from("notifications").insert(notifications);
        } catch (nErr) {
          console.error("Failed to create result notifications in PUT:", nErr);
        }
      }
    }

    // Individual Subject Approval
    if (body.approveSubject) {
      const { studentKey, subjectName } = body.approveSubject;
      if (pending[studentKey]) {
        const entry = pending[studentKey];
        const subIndex = (entry.subjects || []).findIndex(
          (s: Subject) => s.name === subjectName,
        );
        if (entry.subjects && subIndex !== -1) {
          entry.subjects[subIndex].status = "published";
          entry.subjects[subIndex].approvedBy = actorId;
          entry.subjects[subIndex].approvedAt = new Date().toISOString();

          await db
            .from("results_pending")
            .update(entry)
            .eq("student_id", studentKey);

          // Notify student of individual subject approval
          try {
            const { data: studentUser } = await db
              .from("users")
              .select("id, name")
              .or(`student_id.eq.${studentKey},id.eq.${studentKey}`)
              .single();

            if (studentUser) {
              await db.from("notifications").insert({
                type: "result",
                category: "result",
                user_id: studentUser.id,
                user_name: studentUser.name,
                action: "Subject Approved",
                details: `Your marks for ${subjectName} have been approved.`,
                target_id: studentUser.id,
                target_name: studentUser.name,
              });
            }
          } catch (e) {
            console.error("Failed to notify subject approval:", e);
          }
        }
      }
    }

    // Reject - Now sets status to draft instead of deleting, so teacher can see it's rejected/editable
    if (Array.isArray(body.reject)) {
      // Move back to draft status in pending table
      await db
        .from("results_pending")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .in("student_id", body.reject);

      // ALSO delete from the public results table so it disappears from the student portal
      await db.from("results").delete().in("student_id", body.reject);
    }

    // Unlock for Edit (from Published)
    if (Array.isArray(body.unlock)) {
      for (const key of body.unlock) {
        if (published[key]) {
          const entry = published[key];
          // Move back to results_pending as draft
          const { published_at, approved_at, approved_by, ...rest } =
            entry as any;
          await db.from("results_pending").upsert({
            ...rest,
            status: "draft",
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id' });
          await db.from("results").delete().eq("student_id", key);
        }
      }
    }

    // Delete published
    if (Array.isArray(body.deletePublished)) {
      // Delete from published results
      await db.from("results").delete().in("student_id", body.deletePublished);

      // ALSO delete from pending results to ensure it disappears everywhere
      await db
        .from("results_pending")
        .delete()
        .in("student_id", body.deletePublished);

      logActivity({
        userId: actorId,
        userName: "Admin",
        action: "DELETED PUBLISHED RESULTS",
        category: "result",
        details: `Deleted ${body.deletePublished.length} results from all portals`,
      });
    }

    logActivity({
      userId: actorId,
      userName: "Admin",
      action: body.approve ? "Approved Results" : "Rejected Results",
      category: "result",
      details: `${body.approve ? "Approved" : "Rejected"} results for ${body.approve?.length || body.reject?.length || 0} students`,
    });

    return successResponse({ success: true });
  } catch (e: any) {
    console.error("Results approval error:", e);
    return errorResponse("Internal Server Error", 500, e?.message);
  }
});
