'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2, AlertCircle, Download, Upload, FileSpreadsheet, Loader2, Shield, Clock, Users, Edit } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { excelSum, excelAverage } from '@/lib/utils/excelCalculations';
import type { User, PendingResult, PublishedResult, Subject, AssessmentType } from '@/lib/types';
import { cn, normalizeGender } from "@/lib/utils";
import { exportToCSV, parseCSV } from '@/lib/utils/export';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';
import { Card } from '@/components/ui/card';
import { calculatePassStatus, calculatePromotionStatus, calculateConduct } from '@/lib/utils/gradingLogic';

interface ResultTableProps {
    students: User[];
    subjects: string[];
    classResults: Array<PublishedResult | PendingResult>;
    user: User;
    onRefresh: () => void;
    settings?: { assessmentTypes?: AssessmentType[], allowTeacherEditAfterSubmission?: boolean };
    isHomeroomView?: boolean;
}

export function ResultTable({ students, subjects, classResults, user, onRefresh, settings, isHomeroomView }: ResultTableProps) {
    const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

    const toggleEditRow = (studentId: string) => {
        setEditingRows(prev => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    };

    const assessmentTypes = (settings?.assessmentTypes && settings.assessmentTypes.length > 0) ? settings.assessmentTypes : [] as AssessmentType[];
    const isDynamic = assessmentTypes.length > 0;

    const [tableMarks, setTableMarks] = useState<{ [studentId: string]: { [key: string]: number } }>({});
    const { success, error: notifyError } = useToast();
    const [submitStatus, setSubmitStatus] = useState<{ [studentId: string]: 'saving' | 'saved' | 'error' | '' }>({});
    const [loadingFull, setLoadingFull] = useState(false);

    // Dialog States
    const [confirmSubmit, setConfirmSubmit] = useState<{ open: boolean; level: 'subject-draft' | 'subject-pending' | 'roster'; description: string }>({ open: false, level: 'subject-pending', description: '' });
    const [alert, setAlert] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', description: '', variant: 'info' });

    // Load existing results into table format
    useEffect(() => {
        if (classResults.length >= 0 && students.length >= 0 && subjects.length > 0) {
            const marksMap: { [studentId: string]: { [key: string]: number } } = {};
            classResults.forEach(result => {
                const r = result as unknown as Record<string, unknown>;
                const rid = String(r['student_id'] ?? r['studentId'] ?? r['id'] ?? r['studentName'] ?? '');
                const student = students.find(s => String(s.student_id) === rid || String(s.id) === rid || String(s.studentId) === rid || String(s.name) === rid);
                if (student) {
                    const studentId = String(student.id || student.student_id || student.studentId || '');
                    if (!marksMap[studentId]) {
                        marksMap[studentId] = {};
                        const rSubjects = r['subjects'] as Subject[] | undefined;
                        (rSubjects || []).forEach((sub: Subject) => {
                            if (isDynamic && sub.assessments) {
                                Object.keys(sub.assessments).forEach(typeId => {
                                    marksMap[studentId][`${sub.name}__${typeId}`] = sub.assessments?.[typeId] as number;
                                });
                            } else {
                                marksMap[studentId][sub.name] = sub.marks || 0;
                            }
                        });
                    }
                }
            });
            setTableMarks(prev => ({ ...prev, ...marksMap }));
        }
    }, [classResults, students, subjects, isDynamic]);

    const calculateRowStats = (studentId: string) => {
        const marks = tableMarks[studentId] || {};
        let total = 0;

        const subjectMarks = subjects.map(sub => {
            if (isDynamic) {
                let subTotal = 0;
                assessmentTypes.forEach((type: AssessmentType) => {
                    const val = marks[`${sub}__${type.id}`];
                    if (val !== undefined && typeof val === 'number') {
                        subTotal += (val / (Number(type.maxMarks) || 100)) * Number(type.weight);
                    }
                });
                return Math.round(subTotal * 10) / 10;
            } else {
                return marks[sub] || 0;
            }
        });

        total = excelSum(subjectMarks);
        const average = excelAverage(subjectMarks);
        return { total, average, subjectMarks };
    };

    const isHomeRoom = String(user.grade) === String(students[0]?.grade) && String(user.section) === String(students[0]?.section);

    const handleSubmitRow = async (studentId: string, level: 'subject' | 'roster' | 'subject-draft' | 'subject-pending' = 'subject') => {
        try {
            const student = students.find(s => s.id === studentId);
            if (!student) return;

            const marks = tableMarks[studentId] || {};
            setSubmitStatus(prev => ({ ...prev, [studentId]: 'saving' }));

            const { total, average } = calculateRowStats(studentId);
            // Professional precision handling: round to 1 decimal to match UI display
            const totalRounded = Math.round(total * 10) / 10;
            const avgRounded = Math.round(average * 10) / 10;
            const isPass = avgRounded >= 35;

            const subjectsArr = subjects.map(s => {
                if (isDynamic) {
                    const assessments: Record<string, number> = {};
                    let subTotal = 0;
                    assessmentTypes.forEach((type: AssessmentType) => {
                        const val = marks[`${s}__${type.id}`];
                        if (val !== undefined && typeof val === 'number') {
                            assessments[type.id] = val;
                            subTotal += (val / (Number(type.maxMarks) || 100)) * Number(type.weight);
                        }
                    });
                    // Individual subject marks also preserved at 1 decimal
                    return { name: s, assessments, marks: Math.round(subTotal * 10) / 10 };
                } else {
                    return { name: s, marks: marks[s] || 0 };
                }
            });

            const resultObj = {
                studentId: student.studentId || student.student_id || studentId,
                studentName: student.name || student.fullName,
                grade: student.grade,
                section: student.section,
                gender: normalizeGender(student.gender ?? student.sex ?? null) || null,
                rollNumber: student.rollNumber,
                subjects: subjectsArr,
                total: totalRounded,
                average: avgRounded,
                rank: 0,
                conduct: 'Satisfactory',
                result: isPass ? 'PASS' : 'FAIL',
                promotedOrDetained: isPass ? 'PROMOTED' : 'DETAINED',
                submissionLevel: level,
                actorId: user?.id || user?.teacherId
            };

            const response = await fetch('/api/results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-actor-role': String(user?.role || 'teacher'),
                    'x-actor-id': String(user?.id || user?.teacherId || '')
                },
                body: JSON.stringify({ [studentId]: resultObj })
            });

            if (response.ok) {
                setSubmitStatus(prev => ({ ...prev, [studentId]: 'saved' }));
                success(level === 'subject-draft' ? 'Draft saved locally' : 'Marks submitted to Admin');
                onRefresh();
                setEditingRows(prev => {
                    const next = new Set(prev);
                    next.delete(studentId);
                    return next;
                });
                setTimeout(() => {
                    setSubmitStatus(prev => ({ ...prev, [studentId]: '' }));
                }, 3000);
            } else {
                setSubmitStatus(prev => ({ ...prev, [studentId]: 'error' }));
            }
        } catch (e) {
            console.error('Submit error:', e);
            setSubmitStatus(prev => ({ ...prev, [studentId]: 'error' }));
        }
    };

    const handleSubmitRoster = async (level: 'subject-draft' | 'subject-pending' | 'roster' = 'subject-pending') => {
        const msg = level === 'subject-draft' ? 'save these marks as a draft'
            : level === 'subject-pending' ? 'submit these marks to the Admin for approval'
                : 'submit the final class roster to the Admin (this will calculate ranks and publish results)';

        setConfirmSubmit({
            open: true,
            level,
            description: `Are you sure you want to ${msg}?`
        });
    };

    const confirmFullSubmission = async () => {
        const level = confirmSubmit.level;
        setConfirmSubmit({ ...confirmSubmit, open: false });

        setLoadingFull(true);
        try {
            const batch: Record<string, unknown> = {};
            const subjectStatus = level === 'subject-draft' ? 'draft' : 'pending';

            // Mark all relevant rows as saving for UI feedback
            const affectedIds: string[] = [];

            students.forEach(student => {
                const sid = String(student.id || student.student_id || student.studentId);
                const marks = tableMarks[sid] || {};

                // Only include students who have some marks entered (professional skip empty)
                if (Object.keys(marks).length === 0) return;

                affectedIds.push(sid);
                const { total, average } = calculateRowStats(sid);

                // Preservation of decimal precision (1 decimal place)
                const totalRounded = Math.round(total * 10) / 10;
                const avgRounded = Math.round(average * 10) / 10;
                const isPass = avgRounded >= 35;

                const subjectsArr = subjects.map(s => {
                    if (isDynamic) {
                        const assessments: Record<string, number> = {};
                        let subTotal = 0;
                        assessmentTypes.forEach((type: AssessmentType) => {
                            const val = marks[`${s}__${type.id}`];
                            if (val !== undefined && typeof val === 'number') {
                                assessments[type.id] = val;
                                subTotal += (val / (Number(type.maxMarks) || 100)) * Number(type.weight);
                            }
                        });
                        return { name: s, assessments, marks: Math.round(subTotal * 10) / 10 };
                    } else {
                        return { name: s, marks: marks[s] || 0 };
                    }
                });

                batch[sid] = {
                    studentId: student.studentId || student.student_id || sid,
                    studentName: student.name || student.fullName || '',
                    grade: student.grade,
                    section: student.section,
                    gender: normalizeGender(student.gender ?? student.sex ?? null) || null,
                    rollNumber: student.rollNumber || null,
                    subjects: subjectsArr,
                    total: totalRounded,
                    average: avgRounded,
                    rank: 0,
                    conduct: calculateConduct(avgRounded),
                    result: calculatePassStatus(avgRounded),
                    promotedOrDetained: calculatePromotionStatus(calculatePassStatus(avgRounded) === 'PASS'),
                    submissionLevel: level,
                    actorId: user?.id || user?.teacherId
                };
            });

            if (Object.keys(batch).length === 0) {
                setLoadingFull(false);
                notifyError('No marks found to submit.');
                return;
            }

            // Set UI to saving state
            setSubmitStatus(prev => {
                const next = { ...prev };
                affectedIds.forEach(id => { next[id] = 'saving'; });
                return next;
            });

            const response = await fetch('/api/results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-actor-role': String(user?.role || 'teacher'),
                    'x-actor-id': String(user?.id || user?.teacherId || '')
                },
                body: JSON.stringify(batch)
            });

            if (response.ok) {
                // Set UI to saved state
                setSubmitStatus(prev => {
                    const next = { ...prev };
                    affectedIds.forEach(id => { next[id] = 'saved'; });
                    return next;
                });

                success(level === 'subject-draft' ? 'Drafts saved successfully' : 'Final roster submitted successfully!');

                setTimeout(() => {
                    onRefresh();
                    setEditingRows(new Set());
                    setSubmitStatus({});
                }, 1500);
            } else {
                setSubmitStatus(prev => {
                    const next = { ...prev };
                    affectedIds.forEach(id => { next[id] = 'error'; });
                    return next;
                });
                notifyError('Failed to process batch submission');
            }
        } catch (e) {
            console.error(e);
            notifyError('Critical error during batch processing');
        } finally {
            setLoadingFull(false);
        }
    };

    // Autosave logic
    useEffect(() => {
        const dirtyIds = Object.keys(tableMarks).filter(id => {
            // Check if current marks differ from what we last saved or loaded from classResults
            // But a simpler way is to just save if it's currently being edited or just changed
            return true;
        });

        if (dirtyIds.length === 0) return;

        const timer = setTimeout(() => {
            // Only autosave rows that are not locked
            const toSave = dirtyIds.filter(id => {
                const student = students.find(s => String(s.id || s.student_id || s.studentId) === id);
                if (!student) return false;
                const { isLocked } = getRowInfo(student);
                return !isLocked;
            });

            if (toSave.length > 0) {
                // Batch autosave as draft
                const batch: Record<string, any> = {};
                toSave.forEach(sid => {
                    const student = students.find(s => String(s.id || s.student_id || s.studentId) === sid);
                    if (!student) return;

                    const { total, average } = calculateRowStats(sid);
                    const marks = tableMarks[sid] || {};
                    const isPass = average >= 35;

                    const subjectsArr = subjects.map(s => {
                        if (isDynamic) {
                            const assessments: Record<string, number> = {};
                            let subTotal = 0;
                            assessmentTypes.forEach((type: AssessmentType) => {
                                const val = marks[`${s}__${type.id}`];
                                if (val !== undefined && typeof val === 'number') {
                                    assessments[type.id] = val;
                                    subTotal += (val / (Number(type.maxMarks) || 100)) * Number(type.weight);
                                }
                            });
                            return { name: s, assessments, marks: Math.round(subTotal * 10) / 10 };
                        } else {
                            return { name: s, marks: marks[s] || 0 };
                        }
                    });

                    batch[sid] = {
                        studentId: student.studentId || student.student_id || sid,
                        studentName: student.name || student.fullName || '',
                        grade: student.grade,
                        section: student.section,
                        gender: normalizeGender(student.gender ?? student.sex ?? null) || null,
                        rollNumber: student.rollNumber || null,
                        subjects: subjectsArr,
                        total: total,
                        average: average,
                        rank: 0,
                        conduct: 'Satisfactory',
                        result: isPass ? 'PASS' : 'FAIL',
                        promotedOrDetained: isPass ? 'PROMOTED' : 'DETAINED',
                        submissionLevel: 'subject-draft'
                    };
                });

                fetch('/api/results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-actor-role': String(user?.role || 'teacher'),
                        'x-actor-id': String(user?.id || user?.teacherId || '')
                    },
                    body: JSON.stringify(batch)
                }).catch(console.error);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [tableMarks]);

    const handleMarkChange = (studentId: string, key: string, value: string, max: number = 100) => {
        // Allow empty string for clearing
        if (value === '') {
            setTableMarks(prev => {
                const updated = { ...(prev[studentId] || {}) };
                delete (updated as any)[key];
                return { ...prev, [studentId]: updated as any };
            });
            return;
        }

        let num = parseFloat(value);
        if (isNaN(num)) return;
        num = Math.min(max, Math.max(0, num));

        setTableMarks(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [key]: num
            }
        }));

        if (submitStatus[studentId] === 'saved') {
            setSubmitStatus(prev => ({ ...prev, [studentId]: '' }));
        }
    };

    const exportDataCSV = () => {
        const headers = ['StudentID', 'RollNumber', 'FullName'];
        subjects.forEach(sub => {
            if (isDynamic) {
                assessmentTypes.forEach((type: AssessmentType) => {
                    headers.push(`${sub}__${type.id}`);
                });
            } else {
                headers.push(sub);
            }
        });
        headers.push('Total', 'Average');

        const rows = students.map(student => {
            const sid = String(student.id || student.student_id || student.studentId || '');
            const marks = tableMarks[sid] || {};
            const { total, average } = calculateRowStats(sid);
            const row = [String(student.studentId || ''), String(student.rollNumber || ''), String(student.name || student.fullName || '')];
            subjects.forEach(sub => {
                if (isDynamic) {
                    assessmentTypes.forEach((type: AssessmentType) => {
                        const val = marks[`${sub}__${type.id}`];
                        row.push(val !== undefined ? String(val) : '');
                    });
                } else {
                    const val = marks[sub];
                    row.push(val !== undefined ? String(val) : '');
                }
            });
            row.push(String(total), String(average.toFixed(2)));
            return row;
        });

        const grade = students[0]?.grade || user.grade;
        const section = students[0]?.section || user.section;
        const filename = `Marks_Grade_${grade}_${section}_${new Date().toISOString().split('T')[0]}`;
        exportToCSV(rows, filename, headers);
    };

    const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = parseCSV(text);
            if (rows.length < 1) {
                setAlert({ open: true, title: 'Import Failed', description: 'The CSV file appears to be empty or in an invalid format.', variant: 'error' });
                return;
            }

            const headers = rows[0].map(h => h.trim());
            const newMarksMap = { ...tableMarks };

            for (let i = 1; i < rows.length; i++) {
                const values = rows[i];
                if (values.length < headers.length) continue;

                const studentId = values[0];
                const student = students.find(s => (s.studentId || s.student_id || s.id) === studentId);
                if (student) {
                    const sid = String(student.id || student.student_id || student.studentId || '');
                    const studentMarks: Record<string, number> = { ...(newMarksMap[sid] || {}) } as Record<string, number>;
                    headers.forEach((header, index) => {
                        if (header !== 'StudentID' && header !== 'FullName' && header !== 'RollNumber' && header !== 'Total' && header !== 'Average') {
                            const val = parseFloat(values[index]);
                            if (!isNaN(val)) {
                                studentMarks[header] = val;
                            }
                        }
                    });
                    newMarksMap[sid] = studentMarks;
                }
            }

            setTableMarks(newMarksMap);
            success('Marks imported and autosaving as draft...');
        };
        reader.readAsText(file);
    };

    if (students.length === 0) {
        return (
            <div className="text-center py-12 text-blue-400 bg-blue-50/50 rounded-lg border border-dashed border-blue-200">
                <p className="font-semibold mb-2">No students found in your class</p>
                <p className="text-sm">Grade {user.grade} - Section {user.section} has no active students yet.</p>
            </div>
        );
    }

    const getRowInfo = (student: User) => {
        const sid = String(student.id || student.student_id || student.studentId || '');
        const existingResult = classResults.find(r => {
            const rr = r as unknown as Record<string, unknown>;
            const rid = String(rr['studentId'] ?? rr['student_id'] ?? '');
            return rid === String(student.studentId || student.student_id);
        });

        const resStatus = (existingResult?.status || '') as any;
        const isPublished = resStatus === 'published';
        const isPendingAdmin = resStatus === 'pending' || resStatus === 'pending_admin' || resStatus === 'subject-pending';
        const allowEditSubmitted = settings?.allowTeacherEditAfterSubmission === true;

        // Subject-aware locking
        let isSubjectLocked = false;
        if (!isHomeroomView && subjects.length === 1) {
            const mySubject = subjects[0];
            const subData = (existingResult?.subjects || []).find((s: any) => s.name === mySubject);
            if (subData) {
                const subStatus = subData.status || '';
                isSubjectLocked = (subStatus === 'published' || subStatus === 'approved' || (subStatus === 'pending_admin' && !allowEditSubmitted));
            }
        }

        const isLocalEditing = editingRows.has(sid);

        const isLocked = (((isPublished && !allowEditSubmitted) || (isPendingAdmin && !allowEditSubmitted))) &&
            !isLocalEditing &&
            (resStatus !== 'draft' && resStatus !== '') &&
            (isHomeroomView || isSubjectLocked);

        return { sid, existingResult, resStatus, isPublished, isPendingAdmin, isLocked, isLocalEditing, allowEditSubmitted };
    };

    return (
        <>
            <Card className="border-none shadow-none bg-transparent animate-fade-in space-y-4">
                <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shadow-inner">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Result Entry</h3>
                            <p className="text-xs text-slate-500 font-medium">Drafts autosave every 2 seconds. Total calculates automatically.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {(settings?.allowTeacherEditAfterSubmission || classResults.some(r => r.status === 'draft')) && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (editingRows.size > 0) {
                                        setEditingRows(new Set());
                                    } else {
                                        const allEditableIds = students
                                            .filter(s => {
                                                const { resStatus, allowEditSubmitted } = getRowInfo(s);
                                                return resStatus === 'draft' || (resStatus === 'pending' && allowEditSubmitted);
                                            })
                                            .map(s => String(s.id || s.student_id || s.studentId || ''));

                                        if (allEditableIds.length === 0) {
                                            setAlert({
                                                open: true,
                                                title: 'Permission Denied',
                                                description: 'Admin has not granted permission to edit these results.',
                                                variant: 'error'
                                            });
                                        } else {
                                            setEditingRows(new Set(allEditableIds));
                                        }
                                    }
                                }}
                                className={cn(
                                    "h-9 px-4 text-xs font-bold transition-all flex items-center gap-2 shadow-sm rounded-lg border",
                                    editingRows.size > 0 ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                                )}
                            >
                                <Edit className="h-4 w-4" />
                                {editingRows.size > 0 ? 'Finish Editing' : 'Edit Marks'}
                            </Button>
                        )}
                        <Button
                            onClick={() => handleSubmitRoster(isHomeroomView ? 'roster' : 'subject-pending')}
                            disabled={loadingFull}
                            className={cn(
                                "h-9 px-6 text-xs font-black shadow-lg shadow-blue-100 border-none transition-all flex items-center gap-2 rounded-lg hover:scale-105 active:scale-95",
                                isHomeroomView ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                        >
                            {loadingFull ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                            {isHomeroomView ? 'Submit Roster' : 'Submit All'}
                        </Button>
                        <div className="h-6 w-px bg-slate-200 mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={exportDataCSV}
                            className="h-9 w-9 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                                className="h-9 w-9 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Import CSV"
                            >
                                <Upload className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <table className="w-full text-sm border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="p-4 text-left font-black text-slate-700 sticky left-0 bg-slate-50 z-20 min-w-[100px] text-xs uppercase tracking-wider">Roll Number</th>
                                    <th className="p-4 text-left font-black text-slate-700 sticky left-[100px] bg-slate-50 z-20 min-w-[120px] text-xs uppercase tracking-wider shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">Student ID</th>
                                    <th className="p-4 text-left font-black text-slate-700 sticky left-[220px] bg-slate-50 z-20 min-w-[180px] text-xs uppercase tracking-wider shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">Full Name</th>
                                    <th className="p-4 text-center font-black text-slate-700 text-xs uppercase tracking-wider min-w-[80px]">Gender</th>
                                    {subjects.map(subject => (
                                        isDynamic ? (
                                            assessmentTypes.map((type: AssessmentType) => (
                                                <th key={`${subject}-${type.id}`} className="p-4 text-center font-black text-slate-700 text-xs border-r border-slate-100 last:border-0 min-w-[100px]">
                                                    <div className="flex flex-col">
                                                        <span className="uppercase tracking-tight text-slate-800">{type.label}</span>
                                                        <span className="text-[10px] font-medium text-slate-400">({type.weight}%)</span>
                                                    </div>
                                                </th>
                                            ))
                                        ) : (
                                            <th key={subject} className="p-4 text-center font-black text-slate-700 text-xs border-r border-slate-100 last:border-0 uppercase tracking-tight">
                                                {subject}
                                            </th>
                                        )
                                    ))}
                                    <th className="p-4 text-center font-black text-slate-800 bg-slate-100/50 text-xs uppercase tracking-wider min-w-[100px]">Total</th>
                                    {isHomeroomView && <th className="p-4 text-center font-black text-indigo-900 bg-indigo-50/50 text-xs uppercase tracking-wider">Avg</th>}
                                    {isHomeroomView && <th className="p-4 text-center font-black text-indigo-900 bg-indigo-50/50 text-xs uppercase tracking-wider">Rank</th>}
                                    <th className="p-4 text-right font-black text-slate-700 min-w-[140px] text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[...students].sort((a, b) => {
                                    const nameA = (a.name || a.fullName || '').toLowerCase();
                                    const nameB = (b.name || b.fullName || '').toLowerCase();
                                    if (nameA < nameB) return -1;
                                    if (nameA > nameB) return 1;
                                    const rollA = parseInt(String(a.rollNumber || '0'));
                                    const rollB = parseInt(String(b.rollNumber || '0'));
                                    return rollA - rollB;
                                }).map((student, index) => {
                                    const { sid, resStatus, isPublished, isPendingAdmin, isLocked, isLocalEditing, allowEditSubmitted } = getRowInfo(student);
                                    const { total, average } = calculateRowStats(sid);
                                    const marks = tableMarks[sid] || {};
                                    const isDraftHomeroom = resStatus === 'draft';

                                    return (
                                        <tr key={sid} className="bg-white hover:bg-blue-50/30 transition-colors group">
                                            <td className="p-4 font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10">{student.rollNumber || index + 1}</td>
                                            <td className="p-4 font-bold text-slate-600 text-xs sticky left-[100px] bg-white group-hover:bg-blue-50/30 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">{student.studentId || student.student_id || 'PENDING'}</td>
                                            <td className="p-4 font-bold text-slate-800 text-sm sticky left-[220px] bg-white group-hover:bg-blue-50/30 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] truncate max-w-[180px]">{student.name || student.fullName}</td>
                                            <td className="p-4 text-center">
                                                <span className={cn(
                                                    "text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                                    normalizeGender(student.gender || (student as any).sex) === 'M' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                        normalizeGender(student.gender || (student as any).sex) === 'F' ? "bg-pink-50 text-pink-600 border-pink-100" :
                                                            "bg-slate-50 text-slate-500 border-slate-100"
                                                )}>
                                                    {normalizeGender(student.gender || (student as any).sex) || '-'}
                                                </span>
                                            </td>

                                            {subjects.map(subject => {
                                                if (isDynamic) {
                                                    return assessmentTypes.map((type: AssessmentType) => {
                                                        const val = marks[`${subject}__${type.id}`];
                                                        const isFail = val !== undefined && val < (35 * (Number(type.maxMarks) || 100) / 100);
                                                        return (
                                                            <td key={`${subject}-${type.id}`} className="p-2 border-r border-slate-50 last:border-0 text-center">
                                                                <Input
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    min="0"
                                                                    max={Number(type.maxMarks) || 100}
                                                                    step="any"
                                                                    value={val ?? ''}
                                                                    onChange={(e) => handleMarkChange(sid, `${subject}__${type.id}`, e.target.value, Number(type.maxMarks) || 100)}
                                                                    className={cn(
                                                                        "w-full text-center h-9 bg-transparent hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-lg font-bold transition-all text-sm",
                                                                        isFail ? 'text-red-500 bg-red-50 hover:bg-red-50 focus:bg-red-50' : 'text-slate-700'
                                                                    )}
                                                                    placeholder="-"
                                                                    disabled={isLocked || isHomeroomView}
                                                                />
                                                            </td>
                                                        );
                                                    });
                                                } else {
                                                    const val = marks[subject];
                                                    const isFail = val !== undefined && val < 35;
                                                    return (
                                                        <td key={subject} className="p-2 relative min-w-[100px] border-r border-slate-50 last:border-0 text-center">
                                                            <Input
                                                                type="number"
                                                                inputMode="decimal"
                                                                min="0"
                                                                max="100"
                                                                step="any"
                                                                value={val ?? ''}
                                                                onChange={(e) => handleMarkChange(sid, subject, e.target.value)}
                                                                className={cn(
                                                                    "w-20 mx-auto text-center h-9 bg-transparent hover:bg-white focus:bg-white border-transparent hover:border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-lg font-bold transition-all text-sm",
                                                                    isFail ? 'text-red-500 bg-red-50 hover:bg-red-50 focus:bg-red-50' : 'text-slate-700'
                                                                )}
                                                                placeholder="-"
                                                                disabled={isLocked || isHomeroomView}
                                                            />
                                                        </td>
                                                    );
                                                }
                                            })}
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-100/80 font-black text-slate-700 text-sm border border-slate-200">
                                                    {Number.isInteger(total) ? total : total.toFixed(1)}
                                                </span>
                                            </td>
                                            {isHomeroomView && (
                                                <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/30">
                                                    {average.toFixed(1)}%
                                                </td>
                                            )}
                                            {isHomeroomView && (
                                                <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/30">
                                                    {(() => {
                                                        const allAverages = students.map(s => calculateRowStats(String(s.id || s.student_id || s.studentId)).average);
                                                        const sortedAverages = [...allAverages].sort((a, b) => b - a);
                                                        return sortedAverages.indexOf(average) + 1;
                                                    })()}
                                                </td>
                                            )}
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {submitStatus[sid] === 'saving' ? (
                                                        <span className="text-slate-400 text-xs font-bold animate-pulse">Saving...</span>
                                                    ) : submitStatus[sid] === 'saved' ? (
                                                        <span className="text-blue-600 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /></span>
                                                    ) : isLocalEditing ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSubmitRow(sid, isHomeroomView ? 'roster' : 'subject-pending')}
                                                            className={cn(
                                                                "h-8 px-3 font-bold shadow-sm rounded-lg text-xs",
                                                                "bg-blue-600 hover:bg-blue-700 text-white"
                                                            )}
                                                        >
                                                            Save
                                                        </Button>
                                                    ) : isPublished ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase px-2 py-1 bg-green-100 text-green-700 rounded-lg shadow-sm border border-green-200">
                                                                Published
                                                            </span>
                                                            {allowEditSubmitted && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                    onClick={() => toggleEditRow(sid)}
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : isPendingAdmin ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase px-2 py-1 bg-amber-100 text-amber-700 rounded-lg shadow-sm border border-amber-200">
                                                                Pending
                                                            </span>
                                                            {allowEditSubmitted && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                    onClick={() => toggleEditRow(sid)}
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : isDraftHomeroom ? (
                                                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                                                            Draft
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSubmitRow(sid, isHomeroomView ? 'roster' : 'subject-pending')}
                                                            className={cn(
                                                                "h-8 px-3 font-bold shadow-sm rounded-lg text-xs",
                                                                "bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                                            )}
                                                        >
                                                            Send
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
            </Card >

            <ConfirmDialog
                open={confirmSubmit.open}
                onClose={() => setConfirmSubmit({ ...confirmSubmit, open: false })}
                onConfirm={confirmFullSubmission}
                title="Confirm Submission"
                description={confirmSubmit.description}
                confirmText="Submit"
            />

            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                description={alert.description}
                variant={alert.variant}
            />
        </>
    );
}
