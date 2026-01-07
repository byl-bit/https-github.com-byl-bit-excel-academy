'use client';

import { useState } from 'react';
import { Card, CardHeader } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, XCircle, Users, FileText, UserCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";

interface UserApprovalsProps {
    pendingUsers: any[];
    admissionApplications: any[];
    pendingResults: any[];
    onApprove: (userId: string) => void;
    onReject: (userId: string) => void;
    onRejectAll?: (role: string) => void;
    onAcceptAdmission: (app: any) => void;
    onRejectAdmission: (appId: string) => void;
    onApproveResult: (key: string, name: string) => void;
    onApproveSubject?: (studentKey: string, subjectName: string) => void;
    onRejectResult: (key: string, name: string) => void;
    onTabChange?: (tab: string) => void;
    refresh: () => void;
}

export function UserApprovals({
    pendingUsers,
    admissionApplications,
    pendingResults,
    onApprove,
    onReject,
    onRejectAll,
    onAcceptAdmission,
    onRejectAdmission,
    onApproveResult,
    onApproveSubject,
    onRejectResult,
    onTabChange,
    refresh
}: UserApprovalsProps) {
    // ... existing code ...
    // Note: I will only replace the top part and then fix the JSX in a separate chunk to avoid huge context but wait, I can do multi-replace.

    const ITEMS_PER_PAGE = 5;
    const [pageAdmissions, setPageAdmissions] = useState(1);
    const [pageStudents, setPageStudents] = useState(1);
    const [pageTeachers, setPageTeachers] = useState(1);
    const [pageResults, setPageResults] = useState(1);

    const pendingStudents = pendingUsers
        .filter(u => u.role === 'student')
        .sort((a, b) => {
            const nameA = (a.fullName || a.name || '').toLowerCase();
            const nameB = (b.fullName || b.name || '').toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0);
        });

    const pendingTeachers = pendingUsers
        .filter(u => u.role === 'teacher')
        .sort((a, b) => (a.fullName || a.name || '').localeCompare(b.fullName || b.name || ''));

    const sortedResults = [...pendingResults].sort((a, b) => {
        const nameA = (a.studentName || '').toLowerCase();
        const nameB = (b.studentName || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0);
    });

    const renderEmptyState = (message: string) => (
        <div className="text-center py-12 text-blue-400 bg-white rounded-xl border border-dashed border-blue-100 flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-blue-200" />
            <span className="font-medium">{message}</span>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* 1. Admission Applications Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shadow-inner">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">New Admission Applications</h3>
                        <p className="text-xs text-slate-500 font-medium">Direct applications from the 'Apply Now' form.</p>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-1">
                        {admissionApplications.length === 0 ? renderEmptyState("No new applications.") : (
                            <div className="space-y-1">
                                {admissionApplications
                                    .slice((pageAdmissions - 1) * ITEMS_PER_PAGE, pageAdmissions * ITEMS_PER_PAGE)
                                    .map((app, idx) => (
                                        <div key={app.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 hover:bg-white group">
                                            <div className="flex items-center gap-4 self-start md:self-center">
                                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    {(app.studentName || app.familyFullName)?.[0] || 'A'}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{app.studentName || app.familyFullName}</h4>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-wider">
                                                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Grade {app.grade}</span>
                                                        <span className="text-slate-400 py-0.5 flex items-center gap-1"><Users className="h-3 w-3" /> {app.familyFullName}</span>
                                                        <span className="text-slate-400 py-0.5">{app.phoneNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => onAcceptAdmission(app)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 font-bold rounded-xl h-9 px-4 transition-transform hover:scale-105 active:scale-95"
                                                >
                                                    Approve & Enroll
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 px-4 font-bold"
                                                    onClick={() => onRejectAdmission(app.id)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                    {admissionApplications.length > ITEMS_PER_PAGE && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <PaginationControls
                                currentPage={pageAdmissions}
                                totalItems={admissionApplications.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPageAdmissions}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 2. & 3. Account Requests Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Students */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shadow-inner">
                            <UserCheck className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black text-slate-800">Student Accounts</h3>
                                <button
                                    onClick={() => onRejectAll && onRejectAll('student')}
                                    className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                >
                                    Reject All
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Pending registrations.</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-1">
                        {pendingStudents.length === 0 ? renderEmptyState("No pending students.") : (
                            <div className="space-y-1">
                                {pendingStudents
                                    .slice((pageStudents - 1) * ITEMS_PER_PAGE, pageStudents * ITEMS_PER_PAGE)
                                    .map((user, idx) => (
                                        <div key={user.id} className="p-4 flex items-center justify-between transition-all duration-300 hover:bg-white group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                                    {(user.fullName || user.name)?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-amber-700 transition-colors uppercase tracking-tight">{user.fullName || user.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{user.studentId}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">G{user.grade}-{user.section}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg" onClick={() => onApprove(user.id)} title="Approve">
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-50 rounded-lg" onClick={() => onReject(user.id)} title="Reject">
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                    {pendingStudents.length > ITEMS_PER_PAGE && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                            <PaginationControls
                                currentPage={pageStudents}
                                totalItems={pendingStudents.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPageStudents}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Teachers */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shadow-inner">
                        <ShieldAlert className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">Teacher Accounts</h3>
                        <p className="text-xs text-slate-500 font-medium">Faculty verifications.</p>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-1">
                        {pendingTeachers.length === 0 ? renderEmptyState("No pending teachers.") : (
                            <div className="space-y-1">
                                {pendingTeachers
                                    .slice((pageTeachers - 1) * ITEMS_PER_PAGE, pageTeachers * ITEMS_PER_PAGE)
                                    .map((user, idx) => (
                                        <div key={user.id} className="p-4 flex items-center justify-between transition-all duration-300 hover:bg-white group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {(user.fullName || user.name)?.[0] || 'T'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{user.fullName || user.name}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{user.teacherId}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">H: {user.grade}-{user.section}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={() => onApprove(user.id)} title="Verify">
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-50 rounded-lg" onClick={() => onReject(user.id)} title="Delete">
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                    {pendingTeachers.length > ITEMS_PER_PAGE && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                            <PaginationControls
                                currentPage={pageTeachers}
                                totalItems={pendingTeachers.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPageTeachers}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Result Approvals Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-inner">
                            <Award className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Pending Result Approvals</h3>
                            <p className="text-xs text-slate-500 font-medium">Awaiting publication verification.</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                        onClick={() => onTabChange?.('results')}
                    >
                        Detailed Manager <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                    {/* Reject All Results */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors ml-2"
                        onClick={() => onRejectAll?.('result')}
                    >
                        Reject All Results
                    </Button>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-1">
                        {pendingResults.length === 0 ? renderEmptyState("No pending results.") : (
                            <div className="space-y-1">
                                {sortedResults
                                    .slice((pageResults - 1) * ITEMS_PER_PAGE, pageResults * ITEMS_PER_PAGE)
                                    .map((res, idx) => (
                                        <div key={res.key} className="p-4 flex items-center justify-between transition-all duration-300 hover:bg-white group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                    {res.studentName?.[0] || 'R'}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{res.studentName}</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-blue-500 font-mono font-bold bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50">{res.studentId}</span>
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Average: {res.average.toFixed(1)}%</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Grade {res.grade}</span>
                                                    </div>
                                                    {/* Subject specific approvals */}
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {(res.subjects || []).filter((s: any) => s.status === 'pending_admin').map((s: any) => (
                                                            <Button
                                                                key={s.name}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-[9px] font-black uppercase px-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                                onClick={() => onApproveSubject?.(res.key, s.name)}
                                                            >
                                                                Approve {s.name}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 font-bold rounded-xl h-9 px-4 transition-transform hover:scale-105 active:scale-95" onClick={() => onApproveResult(res.key, res.studentName)}>Approve</Button>
                                                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl h-9 px-4 font-bold" onClick={() => onRejectResult(res.key, res.studentName)}>Reject</Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                    {sortedResults.length > ITEMS_PER_PAGE && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <PaginationControls
                                currentPage={pageResults}
                                totalItems={sortedResults.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPageResults}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
