import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/utils/activityLog';
import { calculateRanks } from '@/lib/utils/excelCalculations';
import { calculatePassStatus, calculatePromotionStatus, calculateConduct } from '@/lib/utils/gradingLogic';
import { normalizeGender } from '@/lib/utils';
import type { User, PendingResult, PublishedResult, Allocation, Subject, AssessmentType } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';
        const gradeFilter = searchParams.get('grade');
        const sectionFilter = searchParams.get('section');
        const studentIdFilter = searchParams.get('studentId');
        const limit = searchParams.get('limit');

        // Fetch published and pending results with optional filters
        let publishedQuery = supabase.from('results').select('student_id, student_name, grade, section, subjects, total, average, rank, conduct, result, promoted_or_detained, roll_number, gender, published_at');
        let pendingQuery = supabase.from('results_pending').select('student_id, student_name, grade, section, subjects, total, average, rank, conduct, result, promoted_or_detained, roll_number, gender, status, submission_level');

        if (gradeFilter) {
            publishedQuery = publishedQuery.eq('grade', gradeFilter);
            pendingQuery = pendingQuery.eq('grade', gradeFilter);
        }
        if (sectionFilter) {
            publishedQuery = publishedQuery.eq('section', sectionFilter);
            pendingQuery = pendingQuery.eq('section', sectionFilter);
        }
        if (studentIdFilter) {
            publishedQuery = publishedQuery.eq('student_id', studentIdFilter);
            pendingQuery = pendingQuery.eq('student_id', studentIdFilter);
        }

        if (limit) {
            const l = parseInt(limit);
            publishedQuery = publishedQuery.limit(l);
            pendingQuery = pendingQuery.limit(l);
        }

        const [publishedRes, pendingRes] = await Promise.all([
            publishedQuery,
            pendingQuery
        ]);

        const published = publishedRes.data;
        const pending = pendingRes.data;

        const publishedObj: Record<string, PublishedResult> = {};
        const pendingObj: Record<string, PendingResult> = {};

        (published || []).forEach((r) => { const rr = r as PublishedResult; publishedObj[String(rr.student_id)] = rr; });
        (pending || []).forEach((r) => { const rr = r as PendingResult; pendingObj[String(rr.student_id)] = rr; });

        if (role === 'admin' || !role) {
            return NextResponse.json({ published: publishedObj, pending: pendingObj });
        }

        // Fetch allocations and users
        const { data: allocations } = await supabase.from('allocations').select('id, teacher_id, grade, section') as { data: Allocation[] };
        const { data: users } = await supabase.from('users').select('id, student_id, teacher_id, name, grade, section, gender, roll_number') as { data: User[] };

        const resolveGradeSection = (entry: PendingResult | PublishedResult | undefined) => {
            if (!entry) return { grade: '', section: '' };
            if (entry.grade && entry.section) return { grade: String(entry.grade), section: String(entry.section) };
            if (entry.student_id) {
                const s = (users || []).find(u => u.student_id === entry.student_id || u.id === entry.student_id);
                if (s) return { grade: String(s.grade), section: String(s.section) };
            }
            return { grade: '', section: '' };
        };

        if (role === 'teacher') {
            if (!actorId) {
                return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 });
            }

            const teacher = (users || []).find(u =>
                u.id === actorId ||
                u.teacher_id === actorId ||
                String(u.id).toLowerCase() === String(actorId).toLowerCase() ||
                String(u.teacher_id).toLowerCase() === String(actorId).toLowerCase()
            );

            if (!teacher) {
                // Return empty results instead of 403 - teacher might not have allocations yet
                console.warn(`Teacher not found for actorId: ${actorId}`);
                return NextResponse.json({ published: {}, pending: {} });
            }

            const teacherAllocations = (allocations || []).filter(a => a.teacher_id === teacher.id || a.teacher_id === teacher.teacher_id);
            const isHomeroomOfClass = (grade: string, section: string) =>
                String(teacher.grade) === grade && String(teacher.section) === section;

            const isAllocated = (grade: string, section: string) => {
                if (teacherAllocations.some(a => String(a.grade) === grade && String(a.section) === section)) return true;
                if (isHomeroomOfClass(grade, section)) return true;
                return false;
            };

            const filteredPublished: Record<string, PublishedResult> = {};
            Object.keys(publishedObj).forEach(key => {
                const entry = publishedObj[key];
                const { grade, section } = resolveGradeSection(entry);
                if (isAllocated(grade, section)) {
                    filteredPublished[key] = entry;
                }
            });

            const filteredPending: Record<string, PendingResult> = {};
            Object.keys(pendingObj).forEach(key => {
                const entry = pendingObj[key];
                const { grade, section } = resolveGradeSection(entry);
                if (isAllocated(grade, section)) {
                    // For homeroom teachers viewing their own class, show all pending results (they need to review before submitting roster)
                    // For subject teachers, show all their pending results
                    filteredPending[key] = entry;
                }
            });

            return NextResponse.json({ published: filteredPublished, pending: filteredPending });
        }

        if (role === 'student') {
            if (!actorId) {
                return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
            }

            const student = (users || []).find(u =>
                u.id === actorId ||
                u.student_id === actorId ||
                String(u.id).toLowerCase() === String(actorId).toLowerCase() ||
                String(u.student_id).toLowerCase() === String(actorId).toLowerCase()
            );

            if (!student) {
                console.warn(`Student not found for actorId: ${actorId}`);
                return NextResponse.json({});
            }

            const found: Record<string, PublishedResult> = {};
            const studentIdKey = String(student.id);

            const processEntry = (entry: any, key: string) => {
                if (!entry) return;

                const isMatch = key === student.id ||
                    entry.student_id === student.student_id ||
                    entry.student_id === student.id ||
                    entry.student_id === actorId;

                if (!isMatch) return;

                const approvedSubjects = (entry.subjects || []).filter((s: Subject) =>
                    s.status === 'published' || s.status === 'approved'
                ).map((s: Subject) => ({
                    ...s,
                    name: s.name || '',
                    marks: Number(s.marks || 0),
                    status: s.status || 'published',
                    assessments: s.assessments ? Object.fromEntries(Object.entries(s.assessments).map(([k, v]) => [k, Number(v || 0)])) : undefined
                }));

                if (approvedSubjects.length === 0) return;

                if (!found[studentIdKey]) {
                    found[studentIdKey] = {
                        ...entry,
                        studentId: entry.student_id || entry.studentId || key,
                        studentName: entry.student_name || entry.studentName || '',
                        subjects: approvedSubjects,
                        total: Number(entry.total || 0),
                        average: Number(entry.average || 0),
                        promotedOrDetained: entry.promoted_or_detained || entry.promotedOrDetained || ''
                    } as unknown as PublishedResult;
                } else {
                    // Merge subjects if already exists (prefer published table over pending)
                    const existingSubjects = found[studentIdKey].subjects || [];
                    const approvedNames = new Set(existingSubjects.map((s: Subject) => s.name));
                    const newApproved = approvedSubjects.filter((s: Subject) => !approvedNames.has(s.name));
                    found[studentIdKey].subjects = [...existingSubjects, ...newApproved];
                }
            };

            // Process published first, then pending to fill gaps
            Object.keys(publishedObj).forEach(key => processEntry(publishedObj[key], key));
            Object.keys(pendingObj).forEach(key => processEntry(pendingObj[key], key));

            return NextResponse.json(found);
        }

        return NextResponse.json({});
    } catch (err) {
        console.error('Error fetching results', err);
        return NextResponse.json({}, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const role = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';

        if (!['admin', 'teacher'].includes(role)) {
            return NextResponse.json({ error: 'Unauthorized: role not allowed' }, { status: 403 });
        }

        const resultsObj = typeof body === 'object' ? body : {};

        // Fetch current data
        const { data: currentResultsArr } = await supabase.from('results').select('student_id, grade, section, subjects, total, average, rank, conduct, result, promoted_or_detained');
        const { data: pendingResultsArr } = await supabase.from('results_pending').select('student_id, grade, section, subjects, total, average, rank, conduct, result, promoted_or_detained, status');
        const { data: allocations } = await supabase.from('allocations').select('id, teacher_id, grade, section');
        const { data: users } = await supabase.from('users').select('id, student_id, teacher_id, name, grade, section, gender, roll_number');
        const { data: settingsArr } = await supabase.from('settings').select('key, value');

        const currentResults: Record<string, PublishedResult> = {};
        const pendingResults: Record<string, PendingResult> = {};
        (currentResultsArr || []).forEach(r => { currentResults[String(((r as Record<string, unknown>).student_id) ?? '')] = r as PublishedResult; });
        (pendingResultsArr || []).forEach(r => { pendingResults[String(((r as Record<string, unknown>).student_id) ?? '')] = r as PendingResult; });

        const settings: Record<string, unknown> = {};
        (settingsArr || []).forEach(s => { settings[String(s.key)] = s.value; });
        const assessmentTypes = (settings['assessmentTypes'] ?? []) as AssessmentType[];

        if (role === 'teacher') {
            const teacher = (users || []).find(u => u.id === actorId || u.teacher_id === actorId);
            if (!teacher) {
                return NextResponse.json({ error: 'Unauthorized: teacher not found' }, { status: 403 });
            }

            const teacherAllocations = (allocations || []).filter(a => a.teacher_id === teacher.id || a.teacher_id === teacher.teacher_id);

            const firstKey = Object.keys(resultsObj)[0];
            const submissionLevel = resultsObj[firstKey]?.submissionLevel || 'subject';

            for (const key of Object.keys(resultsObj)) {
                const resEntry = resultsObj[key];
                if (!resEntry) continue;

                const studentIdFromEntry = resEntry.studentId || resEntry.student || key;
                let resolvedGrade = resEntry.grade;
                let resolvedSection = resEntry.section;

                if (!resolvedGrade || !resolvedSection) {
                    const studentUser = (users || []).find(u => u.student_id === studentIdFromEntry || u.id === studentIdFromEntry || u.id === key);
                    if (studentUser) {
                        resolvedGrade = studentUser.grade;
                        resolvedSection = studentUser.section;
                    }
                }

                if (!resolvedGrade || !resolvedSection) {
                    return NextResponse.json({ error: `Could not resolve grade/section for student ${studentIdFromEntry}` }, { status: 400 });
                }

                const isSubjectTeacher = teacherAllocations.some(a => String(a.grade) === String(resolvedGrade) && String(a.section) === String(resolvedSection));
                const isHomeRoomTeacher = String(teacher.grade) === String(resolvedGrade) && String(teacher.section) === String(resolvedSection);

                if (!isSubjectTeacher && !isHomeRoomTeacher) {
                    return NextResponse.json({ error: `Permission denied for Class ${resolvedGrade}-${resolvedSection}` }, { status: 403 });
                }

                if (submissionLevel === 'roster' && !isHomeRoomTeacher) {
                    return NextResponse.json({ error: 'Only Home Room teachers can submit the final roster.' }, { status: 403 });
                }

                const processedSubjects = (resEntry.subjects || []).map((sub: Subject) => {
                    if (sub.assessments && assessmentTypes.length > 0) {
                        let calculatedTotal = 0;
                        for (const type of assessmentTypes) {
                            const key = String(type.id);
                            const val = (sub.assessments || {})[key];
                            if (val !== undefined && val !== null) {
                                calculatedTotal += (Number(val) / (Number(type.maxMarks) || 100)) * Number(type.weight);
                            }
                        }
                        sub.marks = Math.round(calculatedTotal * 10) / 10;
                    }

                    let subStatus = 'draft';
                    if (submissionLevel === 'subject-pending') subStatus = 'pending_admin';
                    if (submissionLevel === 'roster') subStatus = 'pending_roster_final';

                    return {
                        ...sub,
                        submittedAt: new Date().toISOString(),
                        submittedBy: actorId,
                        status: subStatus
                    };
                });

                // Use the actual student_id (STU-001) not the key (UUID)
                const actualStudentId = resEntry.studentId || studentIdFromEntry;
                const existingPending = pendingResults[actualStudentId];
                let mergedSubjects = [...processedSubjects];
                if (existingPending && Array.isArray(existingPending.subjects)) {
                    const subMap = new Map<string, Subject>();
                    existingPending.subjects.forEach((s: Subject) => subMap.set(s.name, s));
                    processedSubjects.forEach((s: Subject) => subMap.set(s.name, s));
                    mergedSubjects = Array.from(subMap.values());
                }

                const totalMarks = mergedSubjects.reduce((sum: number, s: Subject) => sum + (s.marks || 0), 0);
                // Keep totals and averages to one decimal place (out of 100)
                const totalRounded = Math.round(totalMarks * 10) / 10;
                const average = Math.round((totalRounded / (mergedSubjects.length || 1)) * 10) / 10;
                const resultStatus = calculatePassStatus(average);
                const promoStatus = calculatePromotionStatus(resultStatus === 'PASS');
                const conductRemark = calculateConduct(average);

                // Determine status: 'pending' when submitted for approval, 'draft' for local saves
                let resultStatusValue = 'draft';
                if (submissionLevel === 'subject-pending' || submissionLevel === 'roster') {
                    resultStatusValue = 'pending';
                }

                pendingResults[actualStudentId] = {
                    ...resEntry,
                    student_id: actualStudentId,
                    student_name: resEntry.studentName || resEntry.student_name || '',
                    subjects: mergedSubjects,
                    total: totalRounded,
                    average: average,
                    result: resultStatus,
                    promoted_or_detained: promoStatus,
                    conduct: conductRemark,
                    grade: String(resolvedGrade),
                    section: String(resolvedSection),
                    status: resultStatusValue,
                    submitted_by: actorId,
                    submitted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }

            // Track which students we're actually updating in this submission
            const studentsToUpdate: string[] = [];

            // Rank calculation for roster submission
            const firstEntry = resultsObj[firstKey];
            if (firstEntry?.submissionLevel === 'roster') {
                const grade = String(firstEntry.grade);
                const section = String(firstEntry.section);

                const classPending = Object.keys(pendingResults)
                    .filter(k => String(pendingResults[k].grade) === grade && String(pendingResults[k].section) === section)
                    .map(k => ({ studentId: k, ...pendingResults[k] }));

                if (classPending.length > 0) {
                    const ranks = calculateRanks(classPending, true);
                    classPending.forEach(p => {
                        pendingResults[p.studentId].rank = ranks[p.studentId] || 1;
                    });
                }
            }

            // Collect student IDs that are being updated in this submission
            for (const key of Object.keys(resultsObj)) {
                const resEntry = resultsObj[key];
                if (!resEntry) continue;
                const actualStudentId = resEntry.studentId || resEntry.student || key;
                if (actualStudentId && !studentsToUpdate.includes(actualStudentId)) {
                    studentsToUpdate.push(actualStudentId);
                }
            }

            // Save to Supabase - only update the students submitted in this request
            if (studentsToUpdate.length > 0) {
                // Get all pending results to preserve ones we're not updating
                const allPendingResultsToSave: PendingResult[] = [];

                // Add the updated ones
                studentsToUpdate.forEach(studentId => {
                    if (pendingResults[studentId]) {
                        allPendingResultsToSave.push(pendingResults[studentId]);
                    }
                });

                // Delete only the ones we're updating (will re-insert them)
                await supabase.from('results_pending').delete().in('student_id', studentsToUpdate);

                // Map only the updated results to the proper format
                const pendingArray = allPendingResultsToSave.map((r: PendingResult) => {
                    // Ensure all required fields are present
                    return {
                        student_id: r.student_id,
                        student_name: r.student_name || r.studentName || '',
                        grade: r.grade,
                        section: r.section,
                        roll_number: r.roll_number || r.rollNumber || null,
                        gender: normalizeGender(r.gender ?? (r as any)['sex'] ?? null) || null,
                        subjects: r.subjects || [],
                        total: r.total || 0,
                        average: r.average || 0,
                        rank: r.rank || null,
                        conduct: r.conduct || null,
                        result: r.result || null,
                        promoted_or_detained: r.promoted_or_detained || null,
                        status: r.status || 'pending',
                        submission_level: r.submission_level || r.submissionLevel || null,
                        submitted_by: r.submitted_by || actorId,
                        submitted_at: r.submitted_at || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                });

                if (pendingArray.length > 0) {
                    await supabase.from('results_pending').insert(pendingArray);
                }
            }

            logActivity({
                userId: actorId,
                userName: teacher?.name || 'Teacher',
                action: submissionLevel === 'roster' ? 'Submitted Full Roster' : 'Submitted Subject Marks',
                category: 'result',
                details: `${submissionLevel === 'roster' ? 'Full roster' : 'Marks'} for ${Object.keys(resultsObj).length} students`
            });

            return NextResponse.json({ success: true, message: submissionLevel === 'roster' ? 'Roster submitted for admin approval' : 'Subject marks submitted' });
        }

        // Admin publication logic
        const resultsToPublish: Array<{ key: string; entry: PendingResult }> = [];
        for (const key of Object.keys(resultsObj)) {
            const resEntry = resultsObj[key];
            if (!resEntry) continue;
            resultsToPublish.push({ key, entry: { ...resEntry, student_id: key } });
        }

        const classGroups: { [gs: string]: PendingResult[] } = {};
        resultsToPublish.forEach(({ entry }) => {
            const gs = `${entry.grade}_${entry.section}`;
            if (!classGroups[gs]) classGroups[gs] = [];
            classGroups[gs].push(entry);
        });

        Object.keys(classGroups).forEach(gs => {
            const classResults = classGroups[gs];
            const existing = Object.values(currentResults).filter((r: PublishedResult) => `${r.grade}_${r.section}` === gs);
            const all = [...existing, ...classResults];
            // Map to expected shape for rank calculation and ensure studentId is string
            const rankInput = all.map(r => {
                const rr = r as unknown as Record<string, unknown>;
                const studentId = String(rr['student_id'] ?? rr['studentId'] ?? '');
                const total = typeof rr['total'] === 'number' ? (rr['total'] as number) : undefined;
                const average = typeof rr['average'] === 'number' ? (rr['average'] as number) : undefined;
                return { studentId, total, average };
            });
            const ranks = calculateRanks(rankInput, true);
            classResults.forEach(e => { e.rank = ranks[String(e.student_id)] || 1; });
        });

        const toInsert = resultsToPublish.map(({ entry }) => ({
            ...entry,
            status: 'published',
            published_at: new Date().toISOString()
        }));

        if (toInsert.length > 0) {
            await supabase.from('results').delete().in('student_id', toInsert.map(r => r.student_id));
            await supabase.from('results').insert(toInsert);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error saving results:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const role = request.headers.get('x-actor-role') || '';
        const actorId = request.headers.get('x-actor-id') || '';
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await request.json();

        // Fetch data
        const { data: publishedArr } = await supabase.from('results').select('student_id, student_name, grade, section, roll_number, gender, subjects, total, average, rank, conduct, result, promoted_or_detained, status, submission_level, published_at, approved_by, approved_at');
        const { data: pendingArr } = await supabase.from('results_pending').select('student_id, student_name, grade, section, roll_number, gender, subjects, total, average, rank, conduct, result, promoted_or_detained, status, submission_level, submitted_by, submitted_at');
        const { data: settingsArr } = await supabase.from('settings').select('key, value');

        // Build settings map and assessmentTypes
        const settings: Record<string, unknown> = {};
        (settingsArr || []).forEach(s => { settings[String(s.key)] = s.value; });
        const assessmentTypes = (settings['assessmentTypes'] ?? []) as AssessmentType[];

        const published: Record<string, PublishedResult> = {};
        const pending: Record<string, PendingResult> = {};
        (publishedArr || []).forEach(r => { published[String(((r as Record<string, unknown>).student_id) ?? '')] = r as PublishedResult; });
        (pendingArr || []).forEach(r => { pending[String(((r as Record<string, unknown>).student_id) ?? '')] = r as PendingResult; });

        // Full Row Approval
        if (Array.isArray(body.approve)) {
            const toPublish = [];
            for (const key of body.approve) {
                if (pending[key]) {
                    const entry = pending[key];

                    // If subjects exist, compute marks from assessments (if assessmentTypes are defined) and mark them as published
                    if (entry.subjects) {
                        entry.subjects = entry.subjects.map((s: Subject) => {
                            const subj = { ...s } as Subject & Record<string, any>;
                            if (subj.assessments && Array.isArray(assessmentTypes) && assessmentTypes.length > 0) {
                                let calculatedTotal = 0;
                                for (const type of assessmentTypes) {
                                    const keyId = String(type.id);
                                    const val = (subj.assessments || {})[keyId];
                                    if (val !== undefined && val !== null) {
                                        calculatedTotal += (Number(val) / (Number(type.maxMarks) || 100)) * Number(type.weight);
                                    }
                                }
                                subj.marks = Math.round(calculatedTotal * 10) / 10;
                            }
                            subj.status = 'published';
                            return subj;
                        });
                    }

                    // Recompute totals and averages to ensure published values are consistent
                    const subjectsArr = (entry.subjects || []) as Subject[];
                    const totalMarks = subjectsArr.reduce((sum: number, s: Subject) => sum + (Number((s as any).marks) || 0), 0);
                    const totalRounded = Math.round(totalMarks * 10) / 10;
                    const average = Math.round((totalRounded / (subjectsArr.length || 1)) * 10) / 10;

                    // Properly map all fields for results table
                    toPublish.push({
                        student_id: entry.student_id,
                        student_name: entry.student_name || entry.studentName || '',
                        grade: entry.grade,
                        section: entry.section,
                        roll_number: entry.roll_number || entry.rollNumber || null,
                        gender: normalizeGender(entry.gender ?? (entry as any)['sex'] ?? null) || null,
                        subjects: subjectsArr,
                        total: totalRounded,
                        average: average,
                        rank: entry.rank || null,
                        conduct: entry.conduct || null,
                        result: entry.result || null,
                        promoted_or_detained: entry.promoted_or_detained || entry.promotedOrDetained || null,
                        status: 'published',
                        submission_level: entry.submission_level || entry.submissionLevel || null,
                        published_at: new Date().toISOString(),
                        approved_by: actorId,
                        approved_at: new Date().toISOString()
                    });
                }
            }
            if (toPublish.length > 0) {
                // Delete existing published results for these students before inserting
                const studentIds = toPublish.map(r => r.student_id);
                await supabase.from('results').delete().in('student_id', studentIds);
                await supabase.from('results').insert(toPublish);
                // Remove from pending after successful publish
                await supabase.from('results_pending').delete().in('student_id', body.approve);
            }
        }

        // Individual Subject Approval
        if (body.approveSubject) {
            const { studentKey, subjectName } = body.approveSubject;
            if (pending[studentKey]) {
                const entry = pending[studentKey];
                const subIndex = (entry.subjects || []).findIndex((s: Subject) => s.name === subjectName);
                if (entry.subjects && subIndex !== -1) {
                    entry.subjects[subIndex].status = 'published';
                    entry.subjects[subIndex].approvedBy = actorId;
                    entry.subjects[subIndex].approvedAt = new Date().toISOString();

                    await supabase
                        .from('results_pending')
                        .update(entry)
                        .eq('student_id', studentKey);
                }
            }
        }

        // Reject - Now sets status to draft instead of deleting, so teacher can see it's rejected/editable
        if (Array.isArray(body.reject)) {
            // Move back to draft status in pending table
            await supabase
                .from('results_pending')
                .update({ status: 'draft', updated_at: new Date().toISOString() })
                .in('student_id', body.reject);

            // ALSO delete from the public results table so it disappears from the student portal
            await supabase
                .from('results')
                .delete()
                .in('student_id', body.reject);
        }

        // Unlock for Edit (from Published)
        if (Array.isArray(body.unlock)) {
            for (const key of body.unlock) {
                if (published[key]) {
                    const entry = published[key];
                    // Move back to results_pending as draft
                    const { published_at, approved_at, approved_by, ...rest } = entry as any;
                    await supabase.from('results_pending').insert({
                        ...rest,
                        status: 'draft',
                        updated_at: new Date().toISOString()
                    });
                    await supabase.from('results').delete().eq('student_id', key);
                }
            }
        }

        // Delete published
        if (Array.isArray(body.deletePublished)) {
            // Delete from published results
            await supabase.from('results').delete().in('student_id', body.deletePublished);

            // ALSO delete from pending results to ensure it disappears everywhere
            await supabase.from('results_pending').delete().in('student_id', body.deletePublished);

            logActivity({
                userId: actorId,
                userName: 'Admin',
                action: 'DELETED PUBLISHED RESULTS',
                category: 'result',
                details: `Deleted ${body.deletePublished.length} results from all portals`
            });
        }

        logActivity({
            userId: actorId,
            userName: 'Admin',
            action: body.approve ? 'Approved Results' : 'Rejected Results',
            category: 'result',
            details: `${body.approve ? 'Approved' : 'Rejected'} results for ${body.approve?.length || body.reject?.length || 0} students`
        });

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        console.error('Results approval error:', e);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
