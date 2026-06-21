"use client";

import { useState, useEffect, Fragment } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  Shield,
  Clock,
  Users,
  Edit,
  Eye,
  FileText,
} from "lucide-react";
import { StudentProfileDialog } from "@/components/StudentProfileDialog";

import { useToast } from "@/contexts/ToastContext";
import { excelSum, excelAverage } from "@/lib/utils/excelCalculations";
import type {
  User,
  PendingResult,
  PublishedResult,
  Subject,
  AssessmentType,
} from "@/lib/types";
import { cn, normalizeGender } from "@/lib/utils";
import { 
  exportToCSV, 
  parseCSV, 
  generateClassResultsCSV, 
  generateReportCardPDF 
} from "@/lib/utils/export";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertModal } from "@/components/ui/alert-modal";
import { Card } from "@/components/ui/card";
import {
  calculatePassStatus,
  calculatePromotionStatus,
  calculateConduct,
} from "@/lib/utils/gradingLogic";

interface ResultTableProps {
  students: User[];
  subjects: string[];
  classResults: Array<PublishedResult | PendingResult>;
  user: User;
  onRefresh: () => void;
  settings?: {
    assessmentTypes?: AssessmentType[];
    allowTeacherEditAfterSubmission?: boolean;
  };
  isHomeroomView?: boolean;
}

export function ResultTable({
  students,
  subjects,
  classResults,
  user,
  onRefresh,
  settings,
  isHomeroomView,
}: ResultTableProps) {
  const isSubjectPortal = !isHomeroomView && subjects.length === 1 && user?.role === "teacher";

  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  const toggleEditRow = (studentId: string) => {
    setEditingRows((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const [activeSemester, setActiveSemester] = useState<"1" | "2" | "average">(
    isSubjectPortal ? "average" : "1"
  );

  // Subject portal view: which semester tab is active
  const [subjectView, setSubjectView] = useState<"sem1" | "sem2" | "annual">("sem1");

  // Helper to compute stats for a single subject on the subject portal
  const getSubjectStats = (studentId: string) => {
    const marks = tableMarks[studentId] || {};
    const sub = subjects[0];
    
    const sem1Config: any[] = (settings as any)?.resultConfig?.["1"] || [];
    let s1 = 0;
    let hasS1 = false;
    if (sem1Config.length > 0) {
      let hasAllComps = true;
      let sumComps = 0;
      sem1Config.forEach((comp) => {
        const val = marks[`${sub}_sem1_${comp.id}`];
        if (val !== undefined && val !== null) {
          sumComps += val;
        } else {
          hasAllComps = false;
        }
      });
      s1 = sumComps;
      hasS1 = hasAllComps && sem1Config.length > 0;
    } else {
      const valS1 = marks[`${sub}_sem1`];
      hasS1 = valS1 !== undefined && valS1 !== null;
      s1 = hasS1 ? valS1 : 0;
    }

    const sem2Config: any[] = (settings as any)?.resultConfig?.["2"] || [];
    let s2 = 0;
    let hasS2 = false;
    if (sem2Config.length > 0) {
      let hasAllComps = true;
      let sumComps = 0;
      sem2Config.forEach((comp) => {
        const val = marks[`${sub}_sem2_${comp.id}`];
        if (val !== undefined && val !== null) {
          sumComps += val;
        } else {
          hasAllComps = false;
        }
      });
      s2 = sumComps;
      hasS2 = hasAllComps && sem2Config.length > 0;
    } else {
      const valS2 = marks[`${sub}_sem2`];
      hasS2 = valS2 !== undefined && valS2 !== null;
      s2 = hasS2 ? valS2 : 0;
    }

    const average = (hasS1 && hasS2) ? (s1 + s2) / 2 : (hasS1 ? s1 : (hasS2 ? s2 : 0));
    return { s1, s2, average, hasS1, hasS2 };
  };

  // Validate that all students have marks for a given semester
  const validateResults = (semester: "sem1" | "sem2" | "both" = "both") => {
    const missingStudents: string[] = [];
    const sub = subjects[0];
    // Get resultConfig for admin-defined components
    const semKey = semester === "sem1" ? "1" : "2";
    const resultConfig: Array<{id: string; label: string; maxMarks: number; weight: number}> =
      (settings as any)?.resultConfig?.[semKey] || [];

    students.forEach((student) => {
      const sid = String(student.id || student.student_id || student.studentId);
      const marks = tableMarks[sid] || {};
      let missing = false;

      if (semester === "both") {
        // Check both semesters
        const s1 = resultConfig.length > 0
          ? resultConfig.every((c) => marks[`${sub}_sem1_${c.id}`] !== undefined)
          : marks[`${sub}_sem1`] !== undefined;
        const s2 = resultConfig.length > 0
          ? resultConfig.every((c) => marks[`${sub}_sem2_${c.id}`] !== undefined)
          : marks[`${sub}_sem2`] !== undefined;
        missing = !s1 || !s2;
      } else {
        const semMark = resultConfig.length > 0
          ? resultConfig.every((c) => marks[`${sub}_${semester}_${c.id}`] !== undefined)
          : marks[`${sub}_${semester}`] !== undefined;
        missing = !semMark;
      }

      if (missing) {
        missingStudents.push(student.fullName || student.name || sid);
      }
    });
    return missingStudents;
  };

  const handleTeacherSubjectSubmit = (sem: "sem1" | "sem2") => {
    const missing = validateResults(sem);
    const semLabel = sem === "sem1" ? "1st Semester" : "2nd Semester";
    if (missing.length > 0) {
      notifyError(
        `Please fill in ${semLabel} results for all students before submitting. Missing: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`
      );
      return;
    }
    setConfirmSubmit({
      open: true,
      level: "subject-pending",
      description: `Are you sure you want to submit the ${semLabel} results to Admin for approval? This will lock ${semLabel} editing once approved.`,
    });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const normalizeGrade = (g: any) => {
    if (!g) return "all";
    const str = String(g).toLowerCase();
    if (str === "all" || str === "undefined") return "all";
    const match = str.match(/\d+/);
    return match ? match[0] : str;
  };

  const currentGrade = normalizeGrade(students[0]?.grade || user?.grade || "all");

  const gradeAssessmentTypes = (settings?.assessmentTypes || []).filter(
    (type: AssessmentType) => {
      const typeGrade = normalizeGrade(type.grade);
      // Ensure we match the grade and also consider 'all'
      return typeGrade === "all" || typeGrade === currentGrade;
    }
  );

  const activeAssessmentTypes = gradeAssessmentTypes.filter(
    (type: AssessmentType) => {
      // If semester is not specified or set to 'all', show in both semesters
      if (!type.semester || type.semester === "all") return activeSemester !== "average";
      return type.semester === activeSemester;
    }
  );

  const isDynamic = gradeAssessmentTypes.length > 0;

  const [tableMarks, setTableMarks] = useState<{
    [studentId: string]: { [key: string]: number };
  }>({});
  const { success, error: notifyError } = useToast();
  const [submitStatus, setSubmitStatus] = useState<{
    [studentId: string]: "saving" | "saved" | "error" | "";
  }>({});
  const [loadingFull, setLoadingFull] = useState(false);

  // Dialog States
  const [confirmSubmit, setConfirmSubmit] = useState<{
    open: boolean;
    level: "subject-pending" | "roster";
    description: string;
  }>({ open: false, level: "subject-pending", description: "" });
  const [alert, setAlert] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  }>({ open: false, title: "", description: "", variant: "info" });
  const [viewingStudent, setViewingStudent] = useState<any>(null);


  // Load existing results into table format
  useEffect(() => {
    if (
      classResults.length >= 0 &&
      students.length >= 0 &&
      subjects.length > 0
    ) {
      const marksMap: { [studentId: string]: { [key: string]: number } } = {};
      classResults.forEach((result) => {
        const r = result as unknown as Record<string, unknown>;
        const rid = String(
          r["student_id"] ??
            r["studentId"] ??
            r["id"] ??
            r["studentName"] ??
            "",
        );
        const student = students.find(
          (s) =>
            String(s.student_id) === rid ||
            String(s.id) === rid ||
            String(s.studentId) === rid ||
            String(s.name) === rid,
        );
        if (student) {
          const studentId = String(
            student.id || student.student_id || student.studentId || "",
          );
          if (!marksMap[studentId]) {
            marksMap[studentId] = {};
            const rSubjects = r["subjects"] as Subject[] | undefined;
            (rSubjects || []).forEach((sub: Subject) => {
              if (sub.sem1 !== undefined && sub.sem1 !== null) {
                marksMap[studentId][`${sub.name}_sem1`] = sub.sem1;
              }
              if (sub.sem2 !== undefined && sub.sem2 !== null) {
                marksMap[studentId][`${sub.name}_sem2`] = sub.sem2;
              }
              if (sub.assessments) {
                Object.keys(sub.assessments).forEach((compKey) => {
                  const isSem1Comp = ((settings as any)?.resultConfig?.["1"] || []).some((c: any) => c.id === compKey);
                  const isSem2Comp = ((settings as any)?.resultConfig?.["2"] || []).some((c: any) => c.id === compKey);
                  if (isSem1Comp) {
                    marksMap[studentId][`${sub.name}_sem1_${compKey}`] = sub.assessments?.[compKey] as number;
                  } else if (isSem2Comp) {
                    marksMap[studentId][`${sub.name}_sem2_${compKey}`] = sub.assessments?.[compKey] as number;
                  }
                });
              }
            });
          }
        }
      });
      setTableMarks((prev) => ({ ...prev, ...marksMap }));
    }
  }, [classResults, students, subjects, isDynamic, activeSemester, settings]);

  const calculateRowStats = (studentId: string) => {
    const marks = tableMarks[studentId] || {};
    
    // Calculate Subject-wise S1, S2 and Annual marks
    const processedSubjects = subjects.map((sub) => {
      let s1 = 0;
      let s2 = 0;
      let hasS1 = false;
      let hasS2 = false;

      if (isDynamic) {
        gradeAssessmentTypes.forEach((type: AssessmentType) => {
          const val = marks[`${sub}__${type.id}`];
          if (val !== undefined && typeof val === "number") {
            const contribution = (val / (Number(type.maxMarks) || 100)) * Number(type.weight);
            if (type.semester === "1") {
              s1 += contribution;
              hasS1 = true;
            } else if (type.semester === "2") {
              s2 += contribution;
              hasS2 = true;
            } else {
              // If no semester specified, contribute to both or annual directly? 
              // Typically these are annual assessments. We'll add them to both for now to ensure visibility.
              s1 += contribution;
              s2 += contribution;
              hasS1 = true;
              hasS2 = true;
            }
          }
        });
      } else {
        const sem1Config: any[] = (settings as any)?.resultConfig?.["1"] || [];
        if (sem1Config.length > 0) {
          let hasAllComps = true;
          let sumComps = 0;
          sem1Config.forEach((comp) => {
            const val = marks[`${sub}_sem1_${comp.id}`];
            if (val !== undefined && val !== null) {
              sumComps += val;
            } else {
              hasAllComps = false;
            }
          });
          s1 = sumComps;
          hasS1 = hasAllComps && sem1Config.length > 0;
        } else {
          const valS1 = marks[`${sub}_sem1`];
          hasS1 = valS1 !== undefined && valS1 !== null;
          s1 = hasS1 ? valS1 : 0;
        }

        const sem2Config: any[] = (settings as any)?.resultConfig?.["2"] || [];
        if (sem2Config.length > 0) {
          let hasAllComps = true;
          let sumComps = 0;
          sem2Config.forEach((comp) => {
            const val = marks[`${sub}_sem2_${comp.id}`];
            if (val !== undefined && val !== null) {
              sumComps += val;
            } else {
              hasAllComps = false;
            }
          });
          s2 = sumComps;
          hasS2 = hasAllComps && sem2Config.length > 0;
        } else {
          const valS2 = marks[`${sub}_sem2`];
          hasS2 = valS2 !== undefined && valS2 !== null;
          s2 = hasS2 ? valS2 : 0;
        }
      }

      const divisor = (hasS1 && hasS2) ? 2 : 1;
      const annualMarks = Math.round(((s1 + s2) / divisor) * 10) / 10;
      
      return {
        name: sub,
        s1: Math.round(s1 * 10) / 10,
        s2: Math.round(s2 * 10) / 10,
        annualMarks,
        hasS1,
        hasS2
      };
    });

    const annualTotal = processedSubjects.reduce((sum, s) => sum + s.annualMarks, 0);
    const annualAverage = subjects.length > 0 ? annualTotal / subjects.length : 0;

    // Current view stats (based on activeSemester)
    const currentSubjectMarks = processedSubjects.map(s => {
      if (activeSemester === "1") return s.s1;
      if (activeSemester === "2") return s.s2;
      return s.annualMarks;
    });

    const total = currentSubjectMarks.reduce((sum, m) => sum + m, 0);
    const average = subjects.length > 0 ? total / subjects.length : 0;

    return { total, average, annualTotal, annualAverage, subjectMarks: currentSubjectMarks, processedSubjects };
  };

  const isHomeRoom =
    String(user.grade) === String(students[0]?.grade) &&
    String(user.section) === String(students[0]?.section);

  const handleSubmitRow = async (
    studentId: string,
    level: "subject" | "roster" | "subject-pending" = "subject",
  ) => {
    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      const marks = tableMarks[studentId] || {};
      setSubmitStatus((prev) => ({ ...prev, [studentId]: "saving" }));

      const { processedSubjects, annualAverage, annualTotal } = calculateRowStats(studentId);

      const resultObj = {
        studentId: student.studentId || student.student_id || studentId,
        studentName: student.name || student.fullName,
        grade: student.grade,
        section: student.section,
        gender: normalizeGender(student.gender ?? student.sex ?? null) || null,
        rollNumber: student.rollNumber,
        subjects: processedSubjects.map(ps => ({
          name: ps.name,
          marks: ps.annualMarks,
          sem1: ps.s1,
          sem2: ps.s2,
          assessments: {
            ...Object.fromEntries(
              gradeAssessmentTypes
                .filter(t => marks[`${ps.name}__${t.id}`] !== undefined)
                .map(t => [t.id, marks[`${ps.name}__${t.id}`]])
            ),
            ...Object.fromEntries(
              ((settings as any)?.resultConfig?.["1"] || [])
                .filter((c: any) => marks[`${ps.name}_sem1_${c.id}`] !== undefined)
                .map((c: any) => [c.id, marks[`${ps.name}_sem1_${c.id}`]])
            ),
            ...Object.fromEntries(
              ((settings as any)?.resultConfig?.["2"] || [])
                .filter((c: any) => marks[`${ps.name}_sem2_${c.id}`] !== undefined)
                .map((c: any) => [c.id, marks[`${ps.name}_sem2_${c.id}`]])
            ),
          }
        })),
        total: Math.round(annualTotal * 10) / 10,
        average: Math.round(annualAverage * 10) / 10,
        rank: 0,
        conduct: calculateConduct(annualAverage),
        result: calculatePassStatus(annualAverage),
        promotedOrDetained: calculatePromotionStatus(calculatePassStatus(annualAverage) === "PASS"),
        submissionLevel: level,
        actorId: user?.id || user?.teacherId,
      };

      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-actor-role": String(user?.role || "teacher"),
          "x-actor-id": String(user?.id || user?.teacherId || ""),
        },
        body: JSON.stringify({ [studentId]: resultObj }),
      });

      if (response.ok) {
        setSubmitStatus((prev) => ({ ...prev, [studentId]: "saved" }));
        success("Marks submitted to Admin");
        onRefresh();
        setEditingRows((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
        setTimeout(() => {
          setSubmitStatus((prev) => ({ ...prev, [studentId]: "" }));
        }, 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setSubmitStatus((prev) => ({ ...prev, [studentId]: "error" }));
        notifyError(errData.error || "Failed to save marks");
      }
    } catch (e) {
      console.error("Submit error:", e);
      setSubmitStatus((prev) => ({ ...prev, [studentId]: "error" }));
      notifyError("Critical error while saving results");
    }
  };

  const handleSubmitRoster = async (
    level: "subject-pending" | "roster" = "subject-pending",
  ) => {
    const msg =
      level === "subject-pending"
          ? `submit ${activeSemester === "1" ? "First Semester" : "Second Semester"} marks to the Admin for approval`
          : "submit the final class roster to the Admin (this will calculate ranks and publish results)";

    setConfirmSubmit({
      open: true,
      level,
      description: `Are you sure you want to ${msg}?`,
    });
  };

  const confirmFullSubmission = async () => {
    const level = confirmSubmit.level;
    setConfirmSubmit({ ...confirmSubmit, open: false });

    setLoadingFull(true);
    try {
      const batch: Record<string, unknown> = {};
      const subjectStatus = "pending";

      // Mark all relevant rows as saving for UI feedback
      const affectedIds: string[] = [];

      students.forEach((student) => {
        const sid = String(
          student.id || student.student_id || student.studentId,
        );
        const marks = tableMarks[sid] || {};

        // Only include students who have some marks entered (professional skip empty)
        if (Object.keys(marks).length === 0) return;

        affectedIds.push(sid);
        const { processedSubjects, annualAverage, annualTotal } = calculateRowStats(sid);

        batch[sid] = {
          studentId: student.studentId || student.student_id || sid,
          studentName: student.name || student.fullName || "",
          grade: student.grade,
          section: student.section,
          gender: normalizeGender(student.gender ?? student.sex ?? null) || null,
          rollNumber: student.rollNumber || null,
          subjects: processedSubjects.map(ps => ({
            name: ps.name,
            marks: ps.annualMarks,
            sem1: ps.s1,
            sem2: ps.s2,
            assessments: {
              ...Object.fromEntries(
                gradeAssessmentTypes
                  .filter(t => marks[`${ps.name}__${t.id}`] !== undefined)
                  .map(t => [t.id, marks[`${ps.name}__${t.id}`]])
              ),
              ...Object.fromEntries(
                ((settings as any)?.resultConfig?.["1"] || [])
                  .filter((c: any) => marks[`${ps.name}_sem1_${c.id}`] !== undefined)
                  .map((c: any) => [c.id, marks[`${ps.name}_sem1_${c.id}`]])
              ),
              ...Object.fromEntries(
                ((settings as any)?.resultConfig?.["2"] || [])
                  .filter((c: any) => marks[`${ps.name}_sem2_${c.id}`] !== undefined)
                  .map((c: any) => [c.id, marks[`${ps.name}_sem2_${c.id}`]])
              ),
            }
          })),
          total: Math.round(annualTotal * 10) / 10,
          average: Math.round(annualAverage * 10) / 10,
          rank: 0,
          conduct: calculateConduct(annualAverage),
          result: calculatePassStatus(annualAverage),
          promotedOrDetained: calculatePromotionStatus(calculatePassStatus(annualAverage) === "PASS"),
          submissionLevel: level,
          actorId: user?.id || user?.teacherId,
        };
      });

      if (Object.keys(batch).length === 0) {
        setLoadingFull(false);
        notifyError("No marks found to submit.");
        return;
      }

      // Set UI to saving state
      setSubmitStatus((prev) => {
        const next = { ...prev };
        affectedIds.forEach((id) => {
          next[id] = "saving";
        });
        return next;
      });

      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-actor-role": String(user?.role || "teacher"),
          "x-actor-id": String(user?.id || user?.teacherId || ""),
        },
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        // Set UI to saved state
        setSubmitStatus((prev) => {
          const next = { ...prev };
          affectedIds.forEach((id) => {
            next[id] = "saved";
          });
          return next;
        });

        success(
          level === "roster"
            ? "Final roster submitted successfully!"
            : `${activeSemester === "1" ? "First Semester" : "Second Semester"} marks submitted successfully!`,
        );

        setTimeout(() => {
          onRefresh();
          setEditingRows(new Set());
          setSubmitStatus({});
        }, 1500);
      } else {
        const errData = await response.json().catch(() => ({}));
        setSubmitStatus((prev) => {
          const next = { ...prev };
          affectedIds.forEach((id) => {
            next[id] = "error";
          });
          return next;
        });
        notifyError(errData.error || "Failed to process batch submission");
      }
    } catch (e) {
      console.error(e);
      notifyError("Critical error during batch processing");
    } finally {
      setLoadingFull(false);
    }
  };

  // Autosave logic - only fires when user explicitly edits a row that is being actively edited
  // We track a separate "dirty" flag to avoid continuous re-saving on every render
  const [autosaveDirty, setAutosaveDirty] = useState(false);

  // Autosave logic removed as per requirement to disable draft saving
  useEffect(() => {
    if (autosaveDirty) {
        setAutosaveDirty(false);
    }
  }, [autosaveDirty]);

  const handleMarkChange = (
    studentId: string,
    key: string,
    value: string,
    max: number = 100,
  ) => {
    // Allow empty string for clearing
    if (value === "") {
      setTableMarks((prev) => {
        const updated = { ...(prev[studentId] || {}) };
        delete (updated as any)[key];
        return { ...prev, [studentId]: updated as any };
      });
      return;
    }

    let num = parseFloat(value);
    if (isNaN(num)) return;
    num = Math.min(max, Math.max(0, num));

    setTableMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [key]: num,
      },
    }));

    // Trigger autosave for actively editing rows
    setAutosaveDirty(true);

    if (submitStatus[studentId] === "saved") {
      setSubmitStatus((prev) => ({ ...prev, [studentId]: "" }));
    }
  };

  // ── CSV helpers scoped to subject portal ──────────────────────────────
  /** Build the CSV header + per-student row arrays that exactly mirror the
   *  columns currently visible in the subject portal table.               */
  const buildSubjectPortalCSVData = () => {
    const sub = subjects[0];
    const sem1Config: any[] = (settings as any)?.resultConfig?.["1"] || [];
    const sem2Config: any[] = (settings as any)?.resultConfig?.["2"] || [];

    // ── header columns that depend on the active view ─────────────────
    const subjectHeaders: string[] = [];
    // These are the exact tableMarks keys the teacher inputs go into.
    // We use them both as CSV headers (display) and as the raw key map.
    const subjectKeyMap: Array<{ header: string; key: string; readOnly?: boolean }> = [];

    if (subjectView === "sem1") {
      if (sem1Config.length > 0) {
        sem1Config.forEach((comp: any) => {
          const h = `${sub} SEM1: ${comp.label} (Max ${comp.maxMarks})`;
          subjectHeaders.push(h);
          subjectKeyMap.push({ header: h, key: `${sub}_sem1_${comp.id}` });
        });
        // Total column is read-only calculated
        subjectHeaders.push(`${sub} SEM1 Total`);
        subjectKeyMap.push({ header: `${sub} SEM1 Total`, key: `${sub}_sem1`, readOnly: true });
      } else {
        const h = `${sub} SEM1`;
        subjectHeaders.push(h);
        subjectKeyMap.push({ header: h, key: `${sub}_sem1` });
      }
    } else if (subjectView === "sem2") {
      if (sem2Config.length > 0) {
        sem2Config.forEach((comp: any) => {
          const h = `${sub} SEM2: ${comp.label} (Max ${comp.maxMarks})`;
          subjectHeaders.push(h);
          subjectKeyMap.push({ header: h, key: `${sub}_sem2_${comp.id}` });
        });
        subjectHeaders.push(`${sub} SEM2 Total`);
        subjectKeyMap.push({ header: `${sub} SEM2 Total`, key: `${sub}_sem2`, readOnly: true });
      } else {
        const h = `${sub} SEM2`;
        subjectHeaders.push(h);
        subjectKeyMap.push({ header: h, key: `${sub}_sem2` });
      }
    } else { // annual – all cols are read-only
      subjectHeaders.push(`${sub} SEM1`, `${sub} SEM2`, `${sub} Annual Avg`);
      subjectKeyMap.push(
        { header: `${sub} SEM1`,       key: `${sub}_sem1`,   readOnly: true },
        { header: `${sub} SEM2`,       key: `${sub}_sem2`,   readOnly: true },
        { header: `${sub} Annual Avg`, key: `${sub}_annual`,  readOnly: true },
      );
    }

    const headers = ["StudentID", "FullName", "Gender", "RollNumber", ...subjectHeaders];
    if (subjectView !== "annual") headers.push("[DO NOT EDIT]");

    const rows = [...students]
      .sort((a, b) => {
        const ra = parseInt(String(a.rollNumber || "0"));
        const rb = parseInt(String(b.rollNumber || "0"));
        return ra - rb;
      })
      .map(student => {
        const sid = String(student.id || student.student_id || student.studentId);
        const marks = tableMarks[sid] || {};
        const { processedSubjects } = calculateRowStats(sid);
        const subStat = processedSubjects.find(ps => ps.name === sub) || { s1: 0, s2: 0, annualMarks: 0, hasS1: false, hasS2: false };

        const row: string[] = [
          String(student.studentId || student.student_id || sid),
          String(student.name || student.fullName || ""),
          String(student.gender || (student as any).sex || ""),
          String(student.rollNumber || ""),
        ];

        subjectKeyMap.forEach(({ key, readOnly }) => {
          if (readOnly) {
            // Derive read-only values from processedSubjects
            if (key === `${sub}_sem1`)   row.push(subStat.hasS1 ? String(subStat.s1.toFixed(1)) : "-");
            else if (key === `${sub}_sem2`) row.push(subStat.hasS2 ? String(subStat.s2.toFixed(1)) : "-");
            else if (key === `${sub}_annual`) row.push((subStat.hasS1 && subStat.hasS2) ? String(subStat.annualMarks.toFixed(1)) : "-");
            else row.push("-");
          } else {
            const v = marks[key];
            row.push(v !== undefined ? String(v) : "");
          }
        });

        if (subjectView !== "annual") {
          row.push("Columns to the left are editable. DO NOT edit this column.");
        }

        return row;
      });

    return { headers, rows, subjectKeyMap };
  };

  const exportDataCSV = () => {
    const grade = students[0]?.grade || user.grade;
    const section = students[0]?.section || user.section;
    const viewLabel = subjectView === "sem1" ? "Sem1" : subjectView === "sem2" ? "Sem2" : "Annual";
    const filename = isSubjectPortal
      ? `Results_${subjects[0]}_Grade${grade}${section}_${viewLabel}_${new Date().toISOString().split("T")[0]}`
      : `Results_Grade_${grade}_${section}_${new Date().toISOString().split("T")[0]}`;

    if (isSubjectPortal) {
      // ── Subject portal: export exactly what's on screen ──────────────
      const { headers, rows } = buildSubjectPortalCSVData();
      exportToCSV(rows, filename, headers);
    } else {
      // ── Homeroom / multi-subject view: legacy full-roster export ──────
      const resultsToExport = students.map(student => {
        const sid = String(student.id || student.student_id || student.studentId);
        const { processedSubjects, annualTotal, annualAverage } = calculateRowStats(sid);
        const subjectsArr = processedSubjects.map(ps => ({
          name: ps.name,
          sem1: ps.hasS1 ? ps.s1 : "",
          sem2: ps.hasS2 ? ps.s2 : "",
          marks: ps.annualMarks
        }));
        return {
          ...student,
          studentId: student.studentId || student.student_id || sid,
          studentName: student.name || student.fullName,
          subjects: subjectsArr,
          total: Math.round(annualTotal * 10) / 10,
          average: Math.round(annualAverage * 10) / 10,
          rank: 0,
          result: annualAverage >= 35 ? "PASS" : "FAIL",
          promotedOrDetained: annualAverage >= 35 ? "PROMOTED" : "DETAINED"
        };
      });
      generateClassResultsCSV(resultsToExport, filename, subjects);
    }
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be re-imported
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setAlert({ open: true, title: "Import Failed",
          description: "The CSV file appears to be empty or in an invalid format.",
          variant: "error" });
        return;
      }

      const headers = rows[0].map((h) => h.trim());
      const newMarksMap = { ...tableMarks };
      let imported = 0;

      if (isSubjectPortal) {
        // ── Subject portal: resolve headers back to tableMarks keys ──────
        const { subjectKeyMap } = buildSubjectPortalCSVData();
        // Build a header→key lookup (skip read-only and meta columns)
        const headerToKey: Record<string, string> = {};
        subjectKeyMap.forEach(({ header, key, readOnly }) => {
          if (!readOnly) headerToKey[header] = key;
        });

        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].map((v) => v.trim());
          if (!values[0]) continue;
          const studentIdInput = values[0];
          const student = students.find(
            (s) => String(s.studentId || s.student_id || s.id).toLowerCase() === studentIdInput.toLowerCase(),
          );
          if (!student) continue;
          const sid = String(student.id || student.student_id || student.studentId || "");
          const studentMarks: Record<string, number> = { ...(newMarksMap[sid] || {}) } as Record<string, number>;

          headers.forEach((header, idx) => {
            const markKey = headerToKey[header];
            if (!markKey) return; // skip StudentID, FullName, read-only, meta columns
            const val = parseFloat(values[idx]);
            if (!isNaN(val)) {
              studentMarks[markKey] = val;
            }
          });

          newMarksMap[sid] = studentMarks;
          imported++;
        }
      } else {
        // ── Homeroom / multi-subject: legacy import by raw header key ────
        const SKIP = new Set(["StudentID", "FullName", "RollNumber", "Total", "Average",
          "Grand Total", "Average %", "Rank", "Status", "Decision", "Gender",
          "[DO NOT EDIT]"]);
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].map((v) => v.trim());
          if (!values[0]) continue;
          const student = students.find(
            (s) => String(s.studentId || s.student_id || s.id).toLowerCase() === values[0].toLowerCase(),
          );
          if (!student) continue;
          const sid = String(student.id || student.student_id || student.studentId || "");
          const studentMarks: Record<string, number> = { ...(newMarksMap[sid] || {}) } as Record<string, number>;
          headers.forEach((header, index) => {
            if (SKIP.has(header)) return;
            const val = parseFloat(values[index]);
            if (!isNaN(val)) studentMarks[header] = val;
          });
          newMarksMap[sid] = studentMarks;
          imported++;
        }
      }

      setTableMarks(newMarksMap);
      success(`${imported} student record${imported !== 1 ? "s" : ""} imported successfully.`);
    };
    reader.readAsText(file);
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-cyan-400 bg-cyan-50/50 rounded-lg border border-dashed border-cyan-200">
        <p className="font-semibold mb-2">No students found in your class</p>
        <p className="text-sm">
          Grade {user.grade} - Section {user.section} has no active students
          yet.
        </p>
      </div>
    );
  }

  const getRowInfo = (student: User) => {
    const sid = String(
      student.id || student.student_id || student.studentId || "",
    );
    const existingResult = classResults.find((r) => {
      const rr = r as unknown as Record<string, unknown>;
      const rid = String(rr["studentId"] ?? rr["student_id"] ?? "");
      return rid === String(student.studentId || student.student_id);
    });

    const resStatus = (existingResult?.status || "") as any;
    const isPublished = resStatus === "published";
    const isPendingAdmin =
      resStatus === "pending" ||
      resStatus === "pending_admin" ||
      resStatus === "subject-pending";
    const isGrade12 = String(student.grade) === "12";
    const allowEditSubmitted =
      settings?.allowTeacherEditAfterSubmission === true || isGrade12;

    // Subject-aware locking
    let isSubjectLocked = false;
    if (!isHomeroomView && subjects.length === 1) {
      const mySubject = subjects[0];
      const subData = (existingResult?.subjects || []).find(
        (s: any) => s.name === mySubject,
      );
      if (subData) {
        const subStatus = subData.status || "";
        isSubjectLocked =
          subStatus === "published" ||
          subStatus === "approved" ||
          (subStatus === "pending_admin" && !allowEditSubmitted);
      }
    }

    const isLocalEditing = editingRows.has(sid);

    // DEEP LOGIC: We relax locking if the teacher is switching to a semester that hasn't been "finalized" yet.
    // If activeSemester is '2', and the overall status is 'pending' (likely from sem 1), we allow editing for sem 2.
    const isSemesterLockBypassed = 
      ((activeSemester === "2") || (isSubjectPortal && subjectView === "sem2")) && 
      resStatus === "pending" && 
      !isPublished;

    const isLocked =
      ((isPublished && !allowEditSubmitted) ||
        (isPendingAdmin && !allowEditSubmitted)) &&
      !isLocalEditing &&
      !isSemesterLockBypassed &&
      resStatus !== "draft" &&
      resStatus !== "" &&
      (isHomeroomView || isSubjectLocked);

    return {
      sid,
      existingResult,
      resStatus,
      isPublished,
      isPendingAdmin,
      isLocked,
      isLocalEditing,
      allowEditSubmitted,
      isGrade12,
      adminNote: (existingResult as any)?.admin_note || (existingResult as any)?.adminNote || null,
    };
  };
  return (
    <>
      <div className="space-y-6 animate-fade-in-up">

        {/* Professional Toolbar */}
        <div className="card-premium p-4 sm:p-6 flex flex-col gap-4 border-none ring-1 ring-slate-200/50 shadow-xl bg-white/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-cyan-50 flex items-center justify-center shadow-inner ring-4 ring-cyan-50/50 transition-transform hover:rotate-6">
                <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  Academic Ledger
                </h3>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 hidden sm:block">
                  Precision grading • Real-time synchronization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportDataCSV}
                className="h-9 w-9 p-0 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                title="Export CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={importFromCSV}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                  title="Import CSV"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>          {/* Semester controls row - wraps naturally on small screens */}
          <div className="flex flex-wrap items-center gap-2">
            {!isSubjectPortal && (
              <select
                title="Active Semester"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                value={activeSemester}
                onChange={(e) => {
                  const nextSemester = e.target.value as any;
                  setActiveSemester(nextSemester);
                }}
              >
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="average">Annual Average</option>
              </select>
            )}
            {!isHomeroomView &&
              (settings?.allowTeacherEditAfterSubmission ||
                classResults.some((r) => r.status === "draft") ||
                students.some((s) => String(s.grade) === "12")) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editingRows.size > 0) {
                      setEditingRows(new Set());
                    } else {
                      const allEditableIds = students
                        .filter((s) => {
                          const { resStatus, allowEditSubmitted, isGrade12 } =
                            getRowInfo(s);
                          return (
                            resStatus === "draft" ||
                            (resStatus === "pending" && allowEditSubmitted) ||
                            isGrade12 ||
                            resStatus === ""
                          );
                        })
                        .map((s) =>
                          String(s.id || s.student_id || s.studentId || ""),
                        );

                      if (allEditableIds.length === 0) {
                        setAlert({
                          open: true,
                          title: "Permission Denied",
                          description:
                            "Admin has not granted permission to edit these results or no editable rows found.",
                          variant: "error",
                        });
                      } else {
                        setEditingRows(new Set(allEditableIds));
                      }
                    }
                  }}
                  className={cn(
                    "h-9 px-3 text-xs font-bold transition-all flex items-center gap-2 shadow-sm rounded-lg border",
                    editingRows.size > 0
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-200"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-cyan-600",
                  )}
                >
                  <Edit className="h-4 w-4" />
                  {editingRows.size > 0 ? "Finish" : "Edit"}
                </Button>
              )}
            {/* Subject Portal: View Dropdown + Per-Semester Submit */}
            {isSubjectPortal && (
              <>
                <select
                  title="Semester View"
                  className="h-10 rounded-xl border-2 border-cyan-200 bg-white px-4 text-sm font-black text-cyan-800 shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-colors"
                  value={subjectView}
                  onChange={(e) => setSubjectView(e.target.value as "sem1" | "sem2" | "annual")}
                >
                  <option value="sem1">📝 1st Semester</option>
                  <option value="sem2">📝 2nd Semester</option>
                  <option value="annual">📊 Annual (Avg)</option>
                </select>
                {subjectView === "sem1" && (
                  <Button
                    onClick={() => handleTeacherSubjectSubmit("sem1")}
                    disabled={loadingFull}
                    className="h-10 px-5 rounded-xl font-black text-xs uppercase tracking-widest bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Submit 1st Semester
                  </Button>
                )}
                {subjectView === "sem2" && (
                  <Button
                    onClick={() => handleTeacherSubjectSubmit("sem2")}
                    disabled={loadingFull}
                    className="h-10 px-5 rounded-xl font-black text-xs uppercase tracking-widest bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Submit 2nd Semester
                  </Button>
                )}
              </>
            )}
            {!isHomeroomView && !isSubjectPortal && activeSemester !== "average" && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setActiveSemester("1");
                    handleSubmitRoster("subject-pending");
                  }}
                  disabled={loadingFull}
                  className={cn(
                    "h-10 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    activeSemester === "1" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  )}
                >
                  Submit Sem-1
                </Button>
                <Button
                  onClick={() => {
                    setActiveSemester("2");
                    handleSubmitRoster("subject-pending");
                  }}
                  disabled={loadingFull}
                  className={cn(
                    "h-10 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    activeSemester === "2" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  )}
                >
                  Submit Sem-2
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="card-premium rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border-none ring-1 ring-slate-200/50 bg-white/40 backdrop-blur-sm">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-sm border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-md">
                  <th className="p-5 text-left font-black text-slate-500 sticky left-0 bg-slate-50/95 backdrop-blur-md z-30 min-w-[80px] text-[10px] uppercase tracking-[0.2em]">
                    Roll
                  </th>
                  <th className="p-5 text-left font-black text-slate-500 sticky left-[80px] bg-slate-50/95 backdrop-blur-md z-30 min-w-[120px] text-[10px] uppercase tracking-[0.2em] border-r border-slate-200/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                    Identity
                  </th>
                  <th className="p-5 text-left font-black text-slate-700 sticky left-[200px] bg-slate-50/95 backdrop-blur-md z-30 min-w-[200px] text-[10px] uppercase tracking-[0.2em] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                    Student Full Name
                  </th>
                  <th className="p-5 text-center font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] min-w-[100px]">
                    Sex
                  </th>
                  {subjects.map((subject) => {
                    if (isDynamic && activeSemester !== "average" && !isSubjectPortal) {
                      if (activeAssessmentTypes.length === 0) {
                        return (
                          <th key={subject} className="p-5 text-center font-black text-slate-400 text-[10px] border-r border-slate-200/50 last:border-0 min-w-[150px]">
                            {subject} - No assessments setup
                          </th>
                        );
                      }
                      return activeAssessmentTypes.map((type: AssessmentType) => (
                        <th
                          key={`${subject}-${type.id}`}
                          className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 last:border-0 min-w-[110px]"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="uppercase tracking-widest text-slate-900 truncate" title={subject}>
                              {subject}
                            </span>
                            <span className="uppercase tracking-widest text-slate-600">
                              {type.label}
                            </span>
                            <span className="text-[9px] font-bold text-cyan-500 bg-cyan-50 px-2 py-0.5 rounded-full inline-block mx-auto">
                              Weight {type.weight}%
                            </span>
                          </div>
                        </th>
                      ));
                    } else if (isSubjectPortal) {
                      // ── Subject Portal: per-view header ──
                      const sem1Config = (settings as any)?.resultConfig?.["1"] || [];
                      const sem2Config = (settings as any)?.resultConfig?.["2"] || [];

                      if (subjectView === "annual") {
                        return (
                          <Fragment key={subject}>
                            <th className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[100px] uppercase tracking-[0.15em]">
                              SEM-1 /100
                            </th>
                            <th className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[100px] uppercase tracking-[0.15em]">
                              SEM-2 /100
                            </th>
                            <th className="p-5 text-center font-black text-cyan-700 bg-cyan-50/30 text-[10px] border-r border-slate-200/50 min-w-[120px] uppercase tracking-[0.15em]">
                              ANNUAL AVG
                            </th>
                          </Fragment>
                        );
                      } else if (subjectView === "sem1") {
                        if (sem1Config.length > 0) {
                          return (
                            <Fragment key={subject}>
                              {sem1Config.map((comp: any) => (
                                <th key={`${subject}-sem1-${comp.id}`} className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[120px] uppercase tracking-[0.1em]">
                                  SEM-1: {comp.label} (Max {comp.maxMarks})
                                </th>
                              ))}
                              <th className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[120px] uppercase tracking-[0.1em] bg-slate-50">
                                SEM-1 Total /100
                              </th>
                            </Fragment>
                          );
                        } else {
                          return (
                            <th key={subject} className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[150px] uppercase tracking-[0.2em]">
                              SEM-1 /100
                            </th>
                          );
                        }
                      } else { // sem2
                        if (sem2Config.length > 0) {
                          return (
                            <Fragment key={subject}>
                              {sem2Config.map((comp: any) => (
                                <th key={`${subject}-sem2-${comp.id}`} className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[120px] uppercase tracking-[0.1em]">
                                  SEM-2: {comp.label} (Max {comp.maxMarks})
                                </th>
                              ))}
                              <th className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[120px] uppercase tracking-[0.1em] bg-slate-50">
                                SEM-2 Total /100
                              </th>
                            </Fragment>
                          );
                        } else {
                          return (
                            <th key={subject} className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 min-w-[150px] uppercase tracking-[0.2em]">
                              SEM-2 /100
                            </th>
                          );
                        }
                      }
                    } else {
                      const showThree = activeSemester === "average";
                      return (
                        <th
                          key={subject}
                          className="p-5 text-center font-black text-slate-700 text-[10px] border-r border-slate-200/50 last:border-0 min-w-[240px]"
                        >
                          <div className="flex flex-col mb-3 text-xs uppercase tracking-[0.15em] text-cyan-700 font-black truncate" title={subject}>
                            {subject}
                          </div>
                          <div className={`grid ${showThree ? "grid-cols-3" : "grid-cols-1"} gap-2 w-full border-t border-slate-200 pt-3`}>
                            {(activeSemester === "1" || showThree) && (
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                SEM-1
                              </span>
                            )}
                            {(activeSemester === "2" || showThree) && (
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                SEM-2
                              </span>
                            )}
                            {showThree && (
                              <span className="text-[9px] text-cyan-600 font-black uppercase tracking-widest bg-cyan-50/50 py-1 rounded-md">
                                AVG
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    }
                  })}
                  {!isSubjectPortal && (
                    <th className="p-5 text-center font-black text-slate-900 bg-slate-100/50 text-[10px] uppercase tracking-[0.2em] min-w-[110px]">
                      Aggregate {activeSemester !== "average" ? `(Sem-${activeSemester})` : "(Annual)"}
                    </th>
                  )}
                  {isSubjectPortal && (
                    <th className="p-5 text-center font-black text-cyan-900 bg-cyan-50/50 text-[10px] uppercase tracking-[0.2em] min-w-[110px]">
                      {subjectView === "annual" ? "Annual Rank" : subjectView === "sem1" ? "Sem-1 Rank" : "Sem-2 Rank"}
                    </th>
                  )}
                  {isHomeroomView && (
                    <th className="p-5 text-center font-black text-cyan-900 bg-cyan-50/50 text-[10px] uppercase tracking-[0.2em]">
                      Acc %
                    </th>
                  )}
                  {isHomeroomView && (
                    <th className="p-5 text-center font-black text-cyan-900 bg-cyan-50/50 text-[10px] uppercase tracking-[0.2em]">
                      Rank
                    </th>
                  )}
                  <th className="p-5 text-right font-black text-slate-500 min-w-[150px] text-[10px] uppercase tracking-[0.2em]">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {[...students]
                  .sort((a, b) => {
                    const nameA = (a.name || a.fullName || "").toLowerCase();
                    const nameB = (b.name || b.fullName || "").toLowerCase();
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    const rollA = parseInt(String(a.rollNumber || "0"));
                    const rollB = parseInt(String(b.rollNumber || "0"));
                    return rollA - rollB;
                  })
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((student, index) => {
                    const {
                      sid,
                      resStatus,
                      isPublished,
                      isPendingAdmin,
                      isLocked,
                      isLocalEditing,
                      allowEditSubmitted,
                    } = getRowInfo(student);
                    const { total, average } = calculateRowStats(sid);
                    const marks = tableMarks[sid] || {};
                    const isDraftHomeroom = resStatus === "draft";

                    return (
                      <tr
                        key={sid}
                        className="hover:bg-cyan-50/20 transition-all duration-300 group/row border-b border-slate-50 last:border-0"
                      >
                        <td className="p-5 font-bold text-slate-400 sticky left-0 bg-white group-hover/row:bg-cyan-50/30 z-20 text-xs tabular-nums transition-colors">
                          {student.rollNumber || index + 1}
                        </td>
                        <td className="p-5 font-bold text-slate-500 text-[11px] sticky left-[80px] bg-white group-hover/row:bg-cyan-50/30 z-20 transition-colors border-r border-slate-200/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] tabular-nums uppercase">
                          {student.studentId || student.student_id || "ID-TBD"}
                        </td>
                        <td className="p-5 font-black text-slate-800 text-sm sticky left-[200px] bg-white group-hover/row:bg-cyan-50/30 z-20 transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] truncate max-w-[200px] uppercase tracking-tight">
                          <div className="flex flex-col group/name">
                            <span className="truncate">{student.name || student.fullName}</span>
                            <button 
                              onClick={() => {
                                  const studentObj = students.find(
                                    (s) =>
                                      String(s.studentId || s.id) ===
                                      String(student.studentId),
                                  );
                                  setViewingStudent(studentObj || student);
                                }}
                              className="inline-flex items-center gap-1.5 text-[8px] font-black text-cyan-500 hover:text-white uppercase tracking-widest bg-cyan-50 hover:bg-cyan-600 px-2 py-1 rounded-lg transition-all w-max mt-1.5 border border-cyan-100/50 shadow-xs active:scale-95"
                            >
                              <Eye className="h-3 w-3" />
                              View profile
                            </button>
                            {getRowInfo(student).adminNote && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[9px] font-bold text-amber-700 animate-pulse">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                Admin Note: {getRowInfo(student).adminNote}
                              </div>
                            )}
                          </div>
                        </td>


                        <td className="p-5 text-center">
                          <span
                            className={cn(
                              "text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest",
                              normalizeGender(
                                student.gender || (student as any).sex,
                              ) === "M"
                                ? "bg-cyan-50 text-cyan-600 border-cyan-100"
                                : normalizeGender(
                                      student.gender || (student as any).sex,
                                    ) === "F"
                                  ? "bg-pink-50 text-pink-600 border-pink-100"
                                  : "bg-slate-50 text-slate-500 border-slate-100",
                            )}
                          >
                            {normalizeGender(
                              student.gender || (student as any).sex,
                            ) || "-"}
                          </span>
                        </td>

                        {subjects.map((subject) => {
                          if (isDynamic && activeSemester !== "average" && !isSubjectPortal) {
                            if (activeAssessmentTypes.length === 0) {
                              return <td key={subject} className="p-3 border-r border-slate-50 last:border-0 text-center">-</td>;
                            }
                            return activeAssessmentTypes.map(
                              (type: AssessmentType) => {
                                const val = marks[`${subject}__${type.id}`];
                                const isFail =
                                  val !== undefined &&
                                  val <
                                    (35 * (Number(type.maxMarks) || 100)) / 100;
                                return (
                                  <td
                                    key={`${subject}-${type.id}`}
                                    className="p-3 border-r border-slate-50 last:border-0 text-center"
                                  >
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      max={Number(type.maxMarks) || 100}
                                      step="any"
                                      value={val ?? ""}
                                      onChange={(e) =>
                                        handleMarkChange(
                                          sid,
                                          `${subject}__${type.id}`,
                                          e.target.value,
                                          Number(type.maxMarks) || 100,
                                        )
                                      }
                                      className={cn(
                                        "w-full text-center h-10 bg-transparent hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/10 rounded-xl font-black transition-all text-sm tabular-nums",
                                        isFail
                                          ? "text-red-600 bg-red-50 hover:bg-red-100 focus:bg-red-50"
                                          : "text-slate-800",
                                      )}
                                      placeholder="-"
                                      disabled={isLocked || isHomeroomView}
                                    />
                                  </td>
                                );
                              },
                            );
                          } else if (isSubjectPortal) {
                            const { processedSubjects: rowSubjs } = calculateRowStats(sid);
                            const subStat = rowSubjs.find(ps => ps.name === subject) || { s1: 0, s2: 0, annualMarks: 0, hasS1: false, hasS2: false };

                            const sem1Config = (settings as any)?.resultConfig?.["1"] || [];
                            const sem2Config = (settings as any)?.resultConfig?.["2"] || [];

                            if (subjectView === "annual") {
                              const annualFail = subStat.hasS1 && subStat.hasS2 && subStat.annualMarks < 35;
                              return (
                                <Fragment key={subject}>
                                  <td className="p-3 text-center align-middle font-bold text-slate-600">
                                    {subStat.hasS1 ? subStat.s1.toFixed(1) : "-"}
                                  </td>
                                  <td className="p-3 text-center align-middle font-bold text-slate-600">
                                    {subStat.hasS2 ? subStat.s2.toFixed(1) : "-"}
                                  </td>
                                  <td className={cn(
                                    "p-3 text-center align-middle font-black text-cyan-700 bg-cyan-50/20 ring-1 ring-inset ring-cyan-100/50 rounded-lg",
                                    annualFail && "text-red-700 bg-red-50 ring-red-100"
                                  )}>
                                    {subStat.hasS1 && subStat.hasS2 ? subStat.annualMarks.toFixed(1) : "-"}
                                  </td>
                                </Fragment>
                              );
                            } else if (subjectView === "sem1") {
                              if (sem1Config.length > 0) {
                                return (
                                  <Fragment key={subject}>
                                    {sem1Config.map((comp: any) => {
                                      const val = marks[`${subject}_sem1_${comp.id}`];
                                      return (
                                        <td key={`${subject}-sem1-${comp.id}`} className="p-3 text-center align-middle">
                                          <Input
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            max={comp.maxMarks}
                                            step="any"
                                            value={val ?? ""}
                                            onChange={(e) =>
                                              handleMarkChange(
                                                sid,
                                                `${subject}_sem1_${comp.id}`,
                                                e.target.value,
                                                comp.maxMarks
                                              )
                                            }
                                            className="w-full text-center h-10 bg-slate-50/50 hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/10 rounded-xl font-black transition-all text-xs tabular-nums text-slate-800"
                                            placeholder="-"
                                            disabled={isLocked}
                                          />
                                        </td>
                                      );
                                    })}
                                    <td className="p-3 text-center align-middle font-black text-slate-700 bg-slate-50">
                                      {subStat.hasS1 ? subStat.s1.toFixed(1) : "-"}
                                    </td>
                                  </Fragment>
                                );
                              } else {
                                const val = marks[`${subject}_sem1`];
                                return (
                                  <td key={subject} className="p-3 text-center align-middle">
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      max="100"
                                      step="any"
                                      value={val ?? ""}
                                      onChange={(e) =>
                                        handleMarkChange(
                                          sid,
                                          `${subject}_sem1`,
                                          e.target.value,
                                          100
                                        )
                                      }
                                      className="w-full text-center h-10 bg-slate-50/50 hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/10 rounded-xl font-black transition-all text-xs tabular-nums text-slate-800"
                                      placeholder="-"
                                      disabled={isLocked}
                                    />
                                  </td>
                                );
                              }
                            } else { // sem2
                              if (sem2Config.length > 0) {
                                return (
                                  <Fragment key={subject}>
                                    {sem2Config.map((comp: any) => {
                                      const val = marks[`${subject}_sem2_${comp.id}`];
                                      return (
                                        <td key={`${subject}-sem2-${comp.id}`} className="p-3 text-center align-middle">
                                          <Input
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            max={comp.maxMarks}
                                            step="any"
                                            value={val ?? ""}
                                            onChange={(e) =>
                                              handleMarkChange(
                                                sid,
                                                `${subject}_sem2_${comp.id}`,
                                                e.target.value,
                                                comp.maxMarks
                                              )
                                            }
                                            className="w-full text-center h-10 bg-slate-50/50 hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/10 rounded-xl font-black transition-all text-xs tabular-nums text-slate-800"
                                            placeholder="-"
                                            disabled={isLocked}
                                          />
                                        </td>
                                      );
                                    })}
                                    <td className="p-3 text-center align-middle font-black text-slate-700 bg-slate-50">
                                      {subStat.hasS2 ? subStat.s2.toFixed(1) : "-"}
                                    </td>
                                  </Fragment>
                                );
                              } else {
                                const val = marks[`${subject}_sem2`];
                                return (
                                  <td key={subject} className="p-3 text-center align-middle">
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      max="100"
                                      step="any"
                                      value={val ?? ""}
                                      onChange={(e) =>
                                        handleMarkChange(
                                          sid,
                                          `${subject}_sem2`,
                                          e.target.value,
                                          100
                                        )
                                      }
                                      className="w-full text-center h-10 bg-slate-50/50 hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/10 rounded-xl font-black transition-all text-xs tabular-nums text-slate-800"
                                      placeholder="-"
                                      disabled={isLocked}
                                    />
                                  </td>
                                );
                              }
                            }
                          } else {
                            const s1 = marks[`${subject}_sem1`];
                            const s2 = marks[`${subject}_sem2`];
                            const sAvg =
                              s1 !== undefined && s2 !== undefined
                                ? (s1 + s2) / 2
                                : (s1 !== undefined ? s1 : (s2 !== undefined ? s2 : 0));
                            const hasBoth = s1 !== undefined && s2 !== undefined;
                            const isFail = hasBoth && sAvg < 35;

                            let subTotalValue = 0;
                            if (isDynamic && activeSemester === "average" && !isSubjectPortal) {
                                // SubTotal calculation when dynamic in average view: average of semesters
                                let s1Sub = 0;
                                let s2Sub = 0;
                                gradeAssessmentTypes.forEach((type: AssessmentType) => {
                                  const val = marks[`${subject}__${type.id}`];
                                  if (val !== undefined && typeof val === "number") {
                                    const contribution = (val / (Number(type.maxMarks) || 100)) * Number(type.weight);
                                    if (type.semester === "1") s1Sub += contribution;
                                    else if (type.semester === "2") s2Sub += contribution;
                                    else {
                                      // Common assessments (all) count for both or split? Typically show in both.
                                      s1Sub += contribution;
                                      s2Sub += contribution;
                                    }
                                  }
                                });
                                subTotalValue = (s1Sub + s2Sub) / 2;
                            }

                            const showThree = activeSemester === "average" || isSubjectPortal;

                            return (
                              <td
                                key={subject}
                                className="p-3 relative border-r border-slate-50 last:border-0 text-center align-top"
                              >
                                <div className={`grid ${showThree ? "grid-cols-3" : "grid-cols-1"} gap-2`}>
                                  {(activeSemester === "1" || showThree) && (
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      max="100"
                                      step="any"
                                      value={s1 ?? ""}
                                      onChange={(e) =>
                                        handleMarkChange(
                                          sid,
                                          `${subject}_sem1`,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full text-center h-10 bg-slate-50/50 hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/10 rounded-xl font-black transition-all text-xs tabular-nums text-slate-800"
                                      placeholder="-"
                                      disabled={isLocked || isHomeroomView || (isDynamic && !isSubjectPortal)}
                                    />
                                  )}
                                  {(activeSemester === "2" || showThree) && (
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      max="100"
                                      step="any"
                                      value={s2 ?? ""}
                                      onChange={(e) =>
                                        handleMarkChange(
                                          sid,
                                          `${subject}_sem2`,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full text-center h-10 bg-slate-50/50 hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/10 rounded-xl font-black transition-all text-xs tabular-nums text-slate-800"
                                      placeholder="-"
                                      disabled={isLocked || isHomeroomView || (isDynamic && !isSubjectPortal)}
                                    />
                                  )}
                                  {showThree && (
                                    <div
                                      className={cn(
                                        "flex items-center justify-center h-10 rounded-xl font-black text-xs tabular-nums ring-1 ring-inset",
                                        (isDynamic && !isSubjectPortal) ? "bg-cyan-50 text-cyan-700 ring-cyan-100" : (isFail
                                          ? "text-red-700 bg-red-50 ring-red-100"
                                          : hasBoth
                                            ? "text-cyan-700 bg-cyan-50/50 ring-cyan-100"
                                            : "text-slate-300 ring-slate-100"),
                                      )}
                                    >
                                      {(isDynamic && !isSubjectPortal) ? subTotalValue.toFixed(1) : (hasBoth ? sAvg.toFixed(1) : "-")}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          }
                        })}
                        {!isSubjectPortal && (
                          <td className="p-5 text-center">
                            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-slate-900 font-black text-white text-[11px] shadow-lg shadow-slate-200 tabular-nums">
                              {Number.isInteger(total) ? total : total.toFixed(1)}
                            </span>
                          </td>
                        )}
                        {isSubjectPortal && (
                          <td className="p-5 text-center font-black text-cyan-700 bg-cyan-50/30 tabular-nums text-sm">
                            {(() => {
                              const myStats = getSubjectStats(sid);
                              
                              if (subjectView === "sem1") {
                                if (!myStats.hasS1) return "-";
                                const myVal = myStats.s1;
                                const allVals = students
                                  .map((s) => {
                                    const otherSid = String(s.id || s.student_id || s.studentId);
                                    const otherStats = getSubjectStats(otherSid);
                                    return otherStats.hasS1 ? otherStats.s1 : null;
                                  })
                                  .filter((val): val is number => val !== null);
                                const sorted = [...allVals].sort((a, b) => b - a);
                                return sorted.indexOf(myVal) + 1;
                              } else if (subjectView === "sem2") {
                                if (!myStats.hasS2) return "-";
                                const myVal = myStats.s2;
                                const allVals = students
                                  .map((s) => {
                                    const otherSid = String(s.id || s.student_id || s.studentId);
                                    const otherStats = getSubjectStats(otherSid);
                                    return otherStats.hasS2 ? otherStats.s2 : null;
                                  })
                                  .filter((val): val is number => val !== null);
                                const sorted = [...allVals].sort((a, b) => b - a);
                                return sorted.indexOf(myVal) + 1;
                              } else { // annual
                                if (!myStats.hasS1 || !myStats.hasS2) return "-";
                                const myVal = myStats.average;
                                const allVals = students
                                  .map((s) => {
                                    const otherSid = String(s.id || s.student_id || s.studentId);
                                    const otherStats = getSubjectStats(otherSid);
                                    return otherStats.hasS1 && otherStats.hasS2 ? otherStats.average : null;
                                  })
                                  .filter((val): val is number => val !== null);
                                const sorted = [...allVals].sort((a, b) => b - a);
                                return sorted.indexOf(myVal) + 1;
                              }
                            })()}
                          </td>
                        )}
                        {isHomeroomView && (
                          <td className="p-5 text-center font-black text-cyan-700 bg-cyan-50/30 tabular-nums text-sm">
                            {average.toFixed(1)}%
                          </td>
                        )}
                        {isHomeroomView && (
                          <td className="p-5 text-center font-black text-cyan-700 bg-cyan-50/30 tabular-nums text-sm">
                            {(() => {
                              const allAverages = students.map(
                                (s) =>
                                  calculateRowStats(
                                    String(s.id || s.student_id || s.studentId),
                                  ).average,
                              );
                              const sortedAverages = [...allAverages].sort(
                                (a, b) => b - a,
                              );
                              return sortedAverages.indexOf(average) + 1;
                            })()}
                          </td>
                        )}
                        <td className="p-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3">
                            {submitStatus[sid] === "saving" ? (
                              <div className="flex items-center gap-2 text-cyan-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Syncing
                              </div>
                            ) : submitStatus[sid] === "saved" ? (
                              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            ) : isSubjectPortal ? (
                              <div className="flex items-center gap-2">
                                {isPublished ? (
                                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg shadow-sm border border-emerald-100 tracking-[0.15em]">
                                    Live Result
                                  </span>
                                ) : isPendingAdmin ? (
                                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-amber-50 text-amber-700 rounded-lg shadow-sm border border-amber-100 tracking-[0.15em]">
                                    In Review
                                  </span>
                                ) : isLocked ? (
                                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-slate-100 text-slate-500 rounded-lg shadow-sm border border-slate-200 tracking-[0.15em]">
                                    Locked
                                  </span>
                                ) : (() => {
                                  const stats = getSubjectStats(sid);
                                  const isComplete = stats.hasS1 && stats.hasS2;
                                  return (
                                    <span className={cn(
                                      "text-[9px] font-black uppercase px-3 py-1 rounded-lg shadow-sm tracking-[0.15em] border",
                                      isComplete 
                                        ? "bg-cyan-50 text-cyan-700 border-cyan-100" 
                                        : "bg-slate-50 text-slate-400 border-slate-100"
                                    )}>
                                      {isComplete ? "Draft (Ready)" : "Draft (Incomplete)"}
                                    </span>
                                  );
                                })()}
                                {allowEditSubmitted && (isPublished || isPendingAdmin) && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl transition-all"
                                    onClick={() => toggleEditRow(sid)}
                                    title="Edit Marks"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ) : isLocalEditing ? (
                              <Button
                                size="sm"
                                variant="premium"
                                onClick={() =>
                                  handleSubmitRow(
                                    sid,
                                    isHomeroomView
                                      ? "roster"
                                      : "subject-pending",
                                  )
                                }
                                className="h-9 px-5 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 rounded-xl"
                              >
                                Commit
                              </Button>
                            ) : isPublished ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg shadow-sm border border-emerald-100 tracking-[0.15em]">
                                  Live Result
                                </span>
                                {allowEditSubmitted && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl transition-all"
                                    onClick={() => toggleEditRow(sid)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ) : isPendingAdmin ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase px-3 py-1 bg-amber-50 text-amber-700 rounded-lg shadow-sm border border-amber-100 tracking-[0.15em]">
                                  In Review
                                </span>
                                {allowEditSubmitted && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl transition-all"
                                      onClick={() => toggleEditRow(sid)}
                                      title="Edit Marks"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-cyan-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition-all"
                                      onClick={() => {
                                        const resToGen = {
                                          studentId:
                                            student?.studentId ||
                                            student?.student_id ||
                                            sid,
                                          studentName:
                                            student?.name || student?.fullName,
                                          grade: student?.grade,
                                          section: student?.section,
                                          subjects:
                                            (
                                              getRowInfo(student)
                                                .existingResult as any
                                            )?.subjects || [],
                                          total,
                                          average,
                                          promotedOrDetained:
                                            average >= 35
                                              ? "PROMOTED"
                                              : "DETAINED",
                                        };
                                        generateReportCardPDF(
                                          resToGen,
                                          student,
                                          settings || {},
                                        );
                                      }}
                                      title="Download Report Card"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSubmitRow(
                                    sid,
                                    isHomeroomView
                                      ? "roster"
                                      : "subject-pending",
                                  )
                                }
                                className="h-9 px-5 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-cyan-600 transition-colors rounded-xl border border-slate-100 hover:bg-white"
                              >
                                Submit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {students.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between p-6 bg-white border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, students.length)} of {students.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
              >
                Prev
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.ceil(students.length / ITEMS_PER_PAGE) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "h-8 w-8 rounded-xl text-[10px] font-black transition-all",
                      currentPage === i + 1 
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-100" 
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(students.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage === Math.ceil(students.length / ITEMS_PER_PAGE)}
                className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmSubmit.open}
        onClose={() => setConfirmSubmit({ ...confirmSubmit, open: false })}
        onConfirm={confirmFullSubmission}
        title="Institutional Submission"
        description={confirmSubmit.description}
        confirmText="Confirm & Submit"
      />

      <AlertModal
        open={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        title={alert.title}
        description={alert.description}
        variant={alert.variant}
      />

      <StudentProfileDialog 
        student={viewingStudent} 
        isOpen={!!viewingStudent} 
        onClose={() => setViewingStudent(null)} 
      />
    </>

  );
}

