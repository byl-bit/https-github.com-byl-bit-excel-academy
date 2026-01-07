'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/label";
import { Search, Trash2, Edit, User, Mail, ShieldAlert, X, Save, Lock, Download, Upload, Users } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { normalizeGender } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { printResults, exportToCSV, parseCSV, parseExcel } from '@/lib/utils/export';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { AlertModal } from '@/components/ui/alert-modal';

interface StudentDirectoryProps {
    students: any[];
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: any) => void;
}

export function StudentDirectory({ students, onDelete, onUpdate }: StudentDirectoryProps) {
    const [search, setSearch] = useState('');
    const [filterGrade, setFilterGrade] = useState('ALL');
    const [filterSection, setFilterSection] = useState('ALL');
    const [filterGender, setFilterGender] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', fullName: '', password: '', grade: '', section: '', rollNumber: '', gender: 'M' });

    // Dialog States
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
    const [confirmReset, setConfirmReset] = useState<{ open: boolean; student: any }>({ open: false, student: null });
    const [promptPass, setPromptPass] = useState<{ open: boolean; student: any }>({ open: false, student: null });
    const [alert, setAlert] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', description: '', variant: 'info' });
    const [isResetting, setIsResetting] = useState(false);

    // Map canonical 'M'/'F' to display-friendly labels
    const displayGender = (g: any) => {
        const n = normalizeGender(g ?? null);
        if (n === 'M') return 'Male';
        if (n === 'F') return 'Female';
        return 'N/A';
    };

    const { user } = useAuth() as any;

    const handleForceReset = async (newPass: string) => {
        const student = promptPass.student;
        if (!student) return;
        if (newPass.length < 6) {
            setAlert({ open: true, title: 'Invalid Password', description: 'Password must be at least 6 characters.', variant: 'error' });
            return;
        }

        setIsResetting(true);
        try {
            const identifier = student.studentId || student.id;
            const res = await fetch('/api/admin/force-reset', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-actor-role': 'admin', 'x-actor-id': user?.id || '' }, body: JSON.stringify({ studentId: identifier, newPassword: newPass }) });
            const json = await res.json();
            if (res.ok && json.success) {
                setAlert({ open: true, title: 'Success', description: 'Password reset successfully. Temporary password: ' + newPass, variant: 'success' });
            } else {
                setAlert({ open: true, title: 'Reset Failed', description: json.error || json.message || 'Server error', variant: 'error' });
            }
        } catch (err) {
            setAlert({ open: true, title: 'Reset Error', description: 'An unexpected error occurred during password reset.', variant: 'error' });
        } finally {
            setIsResetting(false);
        }
    };

    const handleExportStudentResults = async (student: any) => {
        try {
            const res = await fetch('/api/results', { headers: { 'x-actor-role': 'admin', 'x-actor-id': user?.id || '' } });
            const data = await res.json();
            const published = data?.published || {};
            const found = Object.values(published).find((r: any) => r.student_id === student.studentId || r.studentId === student.studentId || r.student_id === student.id || r.studentId === student.id);
            if (!found) {
                setAlert({ open: true, title: 'No Results', description: 'No published results found for this student', variant: 'info' });
                return;
            }
            printResults(found as any, student.fullName || student.name || `${student.studentId}`);
        } catch (err) {
            setAlert({ open: true, title: 'Export Failed', description: 'Failed to export student results', variant: 'error' });
        }
    };

    // Extract unique grades and sections for filters
    const grades = Array.from(new Set(students.map(s => s.grade))).filter(Boolean).sort();
    const sections = Array.from(new Set(students.map(s => s.section))).filter(Boolean).sort();

    const filtered = students.filter(s => {
        const q = search.toLowerCase();
        const matchesSearch = (s.name || s.fullName || '').toLowerCase().includes(q) ||
            (s.firstName || '').toLowerCase().includes(q) ||
            (s.middleName || '').toLowerCase().includes(q) ||
            (s.lastName || '').toLowerCase().includes(q) ||
            (s.studentId || '').toLowerCase().includes(q) ||
            (s.rollNumber || '').toLowerCase().includes(q);
        const matchesGrade = filterGrade === 'ALL' || s.grade === filterGrade;
        const matchesSection = filterSection === 'ALL' || s.section === filterSection;
        const matchesGender = filterGender === 'ALL' || normalizeGender(s.gender || s.sex) === filterGender;
        return matchesSearch && matchesGrade && matchesSection && matchesGender;
    }).sort((a, b) => {
        const nameA = (a.fullName || a.name || '').toLowerCase();
        const nameB = (b.fullName || b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;

        // If names are same, sort by roll number
        const rollA = parseInt(a.rollNumber) || 0;
        const rollB = parseInt(b.rollNumber) || 0;
        return rollA - rollB;
    });

    const handleEditClick = (student: any) => {
        setEditingStudent(student);
        setEditForm({
            name: student.name || '',
            fullName: student.fullName || '',
            password: '', // Keep empty unless changing
            grade: student.grade || '',
            section: student.section || '',
            rollNumber: student.rollNumber || '',
            gender: normalizeGender(student.gender ?? student.sex ?? null) || 'M'
        });
    };

    const handleSave = () => {
        if (editForm.rollNumber) {
            const rollNum = parseInt(editForm.rollNumber);
            if (isNaN(rollNum) || rollNum < 1 || rollNum > 100) {
                setAlert({ open: true, title: 'Invalid Roll Number', description: 'Roll number must be between 1 and 100.', variant: 'error' });
                return;
            }
        }
        const updates: any = { ...editForm };
        if (!updates.password) delete updates.password; // Don't overwrite if empty
        const identifier = editingStudent.studentId || editingStudent.id;
        onUpdate(identifier, updates);
        setEditingStudent(null);
    };

    const handleExportStudentCSV = () => {
        const headers = ["Student ID", "Roll Number", "First Name", "Middle Name", "Last Name", "Gender", "Grade", "Section", "Email"];
        const rows = filtered.map(s => [
            s.studentId || '',
            s.rollNumber || '',
            s.firstName || '',
            s.middleName || '',
            s.lastName || '',
            (normalizeGender(s.gender ?? s.sex ?? null) === 'M' ? 'Male' : normalizeGender(s.gender ?? s.sex ?? null) === 'F' ? 'Female' : ''),
            s.grade || '',
            s.section || '',
            s.email || ''
        ]);

        exportToCSV(rows, `students_export_${new Date().toISOString().split('T')[0]}`, headers);
    };

    const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            let rows: string[][] = [];
            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

            if (isExcel) {
                rows = await parseExcel(file);
            } else {
                const text = await file.text();
                rows = parseCSV(text);
            }

            const headerRowIndex = rows.findIndex(r =>
                r.some(cell => cell.toLowerCase().includes('student id') || cell.toLowerCase().includes('roll number') || cell.toLowerCase().includes('firstname'))
            );

            if (headerRowIndex === -1) {
                setAlert({ open: true, title: 'Import Failed', description: "Invalid format: Missing header row (Student ID, First Name, etc.)", variant: 'error' });
                return;
            }

            const headers = rows[headerRowIndex].map(h => h.trim());

            const credentialsList: Array<{ fullName: string; studentId: string; tempPassword: string }> = [];
            const genStudentId = () => {
                const year = new Date().getFullYear();
                const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                return `ST-${year}-${rand}`;
            };
            const genTempPass = () => 'Temp' + Math.random().toString(36).slice(2, 10);

            const studentsToImport = rows.slice(headerRowIndex + 1).map((values, i) => {
                if (values.length < headers.length) return null;

                const row: any = {};
                headers.forEach((header, index) => {
                    const cleanHeader = header.toLowerCase().replace(/\s+/g, '');
                    const val = values[index];
                    if (cleanHeader === 'firstname') row.firstName = val;
                    else if (cleanHeader === 'middlename') row.middleName = val;
                    else if (cleanHeader === 'lastname') row.lastName = val;
                    else if (cleanHeader === 'gender' || cleanHeader === 'sex') {
                        const v = val.toLowerCase();
                        if (v.startsWith('m')) row.gender = 'M';
                        else if (v.startsWith('f')) row.gender = 'F';
                        else row.gender = val;
                    }
                    else if (cleanHeader === 'grade' || cleanHeader === 'class') row.grade = val;
                    else if (cleanHeader === 'section') row.section = val;
                    else if (cleanHeader === 'rollnumber' || cleanHeader === 'roll' || cleanHeader === 'rollno') row.rollNumber = val;
                    else if (cleanHeader === 'email') row.email = val;
                    else if (cleanHeader === 'studentid' || cleanHeader === 'id') row.studentId = val;
                });

                // Skip completely empty rows
                if (!row.firstName && !row.lastName && !row.studentId) return null;

                const fullName = [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ');

                // 1. DEDUPLICATION: Check if this student already exists in the system
                const isExisting = students.some(s =>
                    ((s.name || s.fullName || '').toLowerCase() === fullName.toLowerCase() &&
                        String(s.grade || '') === String(row.grade || '')) ||
                    s.studentId === row.studentId
                );

                if (isExisting) return null;

                const tempPass = genTempPass();
                const sid = row.studentId || genStudentId();
                credentialsList.push({ fullName, studentId: sid, tempPassword: tempPass });

                return {
                    id: `import-${Date.now()}-${i}`,
                    firstName: row.firstName || '',
                    middleName: row.middleName || '',
                    lastName: row.lastName || '',
                    fullName: fullName,
                    name: fullName,
                    email: row.email || `pending-${i}@excel.edu`,
                    studentId: sid,
                    password: tempPass,
                    rollNumber: row.rollNumber || '',
                    grade: row.grade || '',
                    section: row.section || '',
                    gender: row.gender || 'M',
                    role: 'student',
                    status: 'active',
                    createdAt: new Date().toISOString()
                };
            }).filter(Boolean);

            if (studentsToImport.length === 0) {
                setAlert({ open: true, title: 'Import Status', description: 'No new students found to import. All records already exist or file is empty.', variant: 'info' });
                return;
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentsToImport)
            });
            const result = await res.json();
            if (res.ok) {
                const credCsv = ['Student ID,Full Name,Temporary Password', ...credentialsList.map(c => `${c.studentId},"${c.fullName}",${c.tempPassword}`)].join('\n');
                try {
                    await navigator.clipboard.writeText(credCsv);
                    setAlert({ open: true, title: 'Import Successful', description: `Successfully imported ${result.count} students. Credentials copied to clipboard.`, variant: 'success' });
                } catch (copyErr) {
                    setAlert({ open: true, title: 'Import Successful', description: `Successfully imported ${result.count} students. Note: Could not copy to clipboard.`, variant: 'success' });
                }
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setAlert({ open: true, title: 'Import Failed', description: result.error || 'Import failed', variant: 'error' });
            }
        } catch (err) {
            console.error(err);
            setAlert({ open: true, title: 'Error', description: 'Failed to parse file. Ensure it is a valid CSV or Excel file.', variant: 'error' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-4 md:p-6 rounded-2xl shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-inner">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Student Directory</h3>
                        <p className="text-xs text-slate-500 font-medium">Manage and monitor student records.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Find student..."
                            className="pl-10 h-10 w-full md:w-64 bg-white/50 border-slate-200 focus:ring-2 focus:ring-blue-100 rounded-xl font-medium transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="flex-1 md:flex-none h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                        >
                            <option value="ALL">All Grades</option>
                            {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select
                            className="flex-1 md:flex-none h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={filterSection}
                            onChange={(e) => setFilterSection(e.target.value)}
                        >
                            <option value="ALL">All Sections</option>
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            className="flex-1 md:flex-none h-10 rounded-xl border border-slate-200 bg-white/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={filterGender}
                            onChange={(e) => setFilterGender(e.target.value)}
                        >
                            <option value="ALL">All Genders</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2 h-10 rounded-xl border-slate-200 bg-white/50 font-bold text-slate-600 hover:bg-white" onClick={handleExportStudentCSV}>
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </Button>
                        <div className="relative flex-1 md:flex-none">
                            <input
                                type="file"
                                id="student-csv-import"
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleImportData}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 h-10 rounded-xl bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 font-bold"
                                onClick={() => document.getElementById('student-csv-import')?.click()}
                            >
                                <Upload className="h-4 w-4" />
                                <span>Import</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">System ID</th>
                                <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Roll Number</th>
                                <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</th>
                                <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Status</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered
                                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                .map((student) => (
                                    <tr key={student.studentId || student.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                    {student.photo ? (
                                                        <img src={student.photo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                            <User className="h-6 w-6 text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-black text-slate-800 group-hover:text-blue-700 transition-colors leading-tight">
                                                        {student.firstName} {student.middleName} {student.lastName}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 font-black">
                                                {student.studentId || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="font-black text-xs text-slate-700">
                                                {student.rollNumber || '--'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {(() => {
                                                const genderNorm = normalizeGender(student.gender || (student as any).sex || '');
                                                const label = genderNorm === 'M' ? 'Male' : genderNorm === 'F' ? 'Female' : 'N/A';
                                                return (
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm ${genderNorm === 'M'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : genderNorm === 'F'
                                                            ? 'bg-pink-50 text-pink-600 border-pink-100'
                                                            : 'bg-slate-50 text-slate-600 border-slate-100'
                                                        }`}>
                                                        {label.toUpperCase()}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="font-black text-blue-600 text-[11px] uppercase">Grade {student.grade}</span>
                                                <span className="font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] uppercase tracking-tighter">Section {student.section}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-100/50 rounded-xl" onClick={() => handleEditClick(student)} title="Edit Record">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 hover:bg-indigo-100/50 rounded-xl" onClick={() => handleExportStudentResults(student)} title="Export Performance">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-600 hover:bg-amber-100/50 rounded-xl" onClick={() => setConfirmReset({ open: true, student })} title="Security Reset">
                                                    <Lock className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-100/50 rounded-xl" onClick={() => setConfirmDelete({ open: true, id: student.studentId || student.id, name: student.fullName || student.name })} title="Delete Student">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Search className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-bold italic tracking-tight">No students found matching your search criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filtered.length > ITEMS_PER_PAGE && (
                    <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                        <PaginationControls
                            currentPage={currentPage}
                            totalItems={filtered.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
            {/* Edit Modal */}
            <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Student: {editingStudent?.studentId}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Grade</Label>
                                <Input value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Section</Label>
                                <Input value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Roll Number</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={editForm.rollNumber}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val !== '' && (parseInt(val) < 1 || parseInt(val) > 100)) return;
                                        setEditForm({ ...editForm, rollNumber: val })
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={editForm.gender}
                                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                >
                                    <option value="" disabled>Select your gender</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Lock className="h-3 w-3" /> New Password
                            </Label>
                            <PasswordInput
                                placeholder="Leave blank to keep current"
                                value={editForm.password}
                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Deletion */}
            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ ...confirmDelete, open: false })}
                onConfirm={() => {
                    onDelete(confirmDelete.id);
                    setConfirmDelete({ ...confirmDelete, open: false });
                }}
                title="Confirm Selection"
                description={`Are you sure you want to delete ${confirmDelete.name}? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />

            {/* Confirmation Dialog for Reset */}
            <ConfirmDialog
                open={confirmReset.open}
                onClose={() => setConfirmReset({ ...confirmReset, open: false })}
                onConfirm={() => {
                    const student = confirmReset.student;
                    setConfirmReset({ ...confirmReset, open: false });
                    setPromptPass({ open: true, student });
                }}
                title="Reset Password"
                description={`Reset password for ${confirmReset.student?.fullName || confirmReset.student?.name}?`}
                confirmText="Initiate Reset"
            />

            {/* Prompt Dialog for New Password */}
            <PromptDialog
                open={promptPass.open}
                onClose={() => setPromptPass({ ...promptPass, open: false })}
                onConfirm={handleForceReset}
                title="New Student Password"
                description="Enter a temporary password for this student (minimum 6 characters)."
                label="Temporary Password"
                defaultValue={`temp${Math.floor(Math.random() * 9000) + 1000}`}
                placeholder="Enter password..."
                confirmText="Reset Password"
            />

            {/* Alert Modal for Messages */}
            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                description={alert.description}
                variant={alert.variant}
            />
        </div>
    );
}
