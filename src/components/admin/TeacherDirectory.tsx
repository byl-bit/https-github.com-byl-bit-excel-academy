'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Trash2, Edit, User, School, Shield, Save, Lock, Download, Upload } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV, parseCSV } from '@/lib/utils/export';

interface TeacherDirectoryProps {
    teachers: any[];
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: any) => void;
}

export function TeacherDirectory({ teachers, onDelete, onUpdate }: TeacherDirectoryProps) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const [editingTeacher, setEditingTeacher] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', fullName: '', password: '' });

    const filtered = teachers.filter(t =>
        (t.name || t.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.teacherId || '').toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => (a.fullName || a.name || '').localeCompare(b.fullName || b.name || ''));

    const handleEditClick = (teacher: any) => {
        setEditingTeacher(teacher);
        setEditForm({
            name: teacher.name || '',
            fullName: teacher.fullName || '',
            password: ''
        });
    };

    const handleSave = () => {
        const updates: any = { ...editForm };
        if (!updates.password) delete updates.password;
        onUpdate(editingTeacher.id, updates);
        setEditingTeacher(null);
    };

    const [roomDialog, setRoomDialog] = useState<{ id: string, name: string, grade: string, section: string } | null>(null);

    const handleRoomClick = (teacher: any) => {
        setRoomDialog({
            id: teacher.id,
            name: teacher.fullName || teacher.name,
            grade: teacher.grade || '',
            section: teacher.section || ''
        });
    };

    const handleSaveRoom = () => {
        if (!roomDialog) return;
        onUpdate(roomDialog.id, { grade: roomDialog.grade, section: roomDialog.section });
        setRoomDialog(null);
    };

    const handleExportTeacherCSV = () => {
        const headers = ["teacherId", "fullName", "email"];
        const rows = filtered.map(t => [
            t.teacherId,
            t.fullName || t.name,
            t.email
        ]);

        exportToCSV(rows, `teachers_export_${new Date().toISOString().split('T')[0]}`, headers);
    };

    const handleImportTeacherCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const rows = parseCSV(text);

            const headerIdx = rows.findIndex(r => r.some(cell => cell.toLowerCase().includes('teacherid') || cell.toLowerCase().includes('fullname')));
            if (headerIdx === -1) return alert('Invalid CSV: Missing headers');

            const headers = rows[headerIdx].map(h => h.trim());

            const teachersToImport = rows.slice(headerIdx + 1).map(values => {
                if (values.length < headers.length) return null;
                const teacher: any = { role: 'teacher', status: 'active' };
                headers.forEach((header, index) => {
                    teacher[header] = values[index];
                });
                if (!teacher.id) teacher.id = `user-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                return teacher;
            }).filter(Boolean);

            if (confirm(`Import ${teachersToImport.length} teachers?`)) {
                try {
                    const res = await fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(teachersToImport)
                    });
                    const result = await res.json();
                    if (res.ok) {
                        alert(`Successfully imported ${result.count} faculty members. ${result.skipped?.length || 0} skipped.`);
                        window.location.reload();
                    } else {
                        alert(result.error || 'Import failed');
                    }
                } catch (err) { alert('Import failed'); }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-4 md:p-6 rounded-2xl shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center shadow-inner">
                        <Shield className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Teacher Directory</h3>
                        <p className="text-xs text-slate-500 font-medium">Faculty oversight and class assignments.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Find teacher..."
                            className="pl-10 h-10 w-full md:w-64 bg-white/50 border-slate-200 focus:ring-2 focus:ring-indigo-100 rounded-xl font-medium transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2 h-10 rounded-xl border-slate-200 bg-white/50 font-bold text-slate-600 hover:bg-white" onClick={handleExportTeacherCSV}>
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </Button>
                        <div className="relative flex-1 md:flex-none">
                            <input
                                type="file"
                                id="teacher-csv-import"
                                className="hidden"
                                accept=".csv"
                                onChange={handleImportTeacherCSV}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 h-10 rounded-xl bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold"
                                onClick={() => document.getElementById('teacher-csv-import')?.click()}
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
                                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty Identity</th>
                                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">System ID</th>
                                <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Home Room</th>
                                <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Account status</th>
                                <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered
                                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                .map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-105 transition-all overflow-hidden border-2 border-white shadow-sm shrink-0">
                                                    {teacher.photo ? (
                                                        <img src={teacher.photo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <School className="h-6 w-6 text-indigo-600" />
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-black text-slate-800 group-hover:text-indigo-700 transition-colors leading-tight">{teacher.fullName || teacher.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">{teacher.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 font-black">
                                                {teacher.teacherId}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="font-black text-indigo-600 text-[11px] uppercase bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100/50">
                                                Grade {teacher.grade}-{teacher.section}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border shadow-sm ${teacher.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {teacher.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 hover:bg-indigo-100/50 rounded-xl" title="Assign Home Room" onClick={() => handleRoomClick(teacher)}>
                                                    <School className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-100/50 rounded-xl" onClick={() => handleEditClick(teacher)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-100/50 rounded-xl" onClick={() => { if (confirm('Remove this teacher?')) onDelete(teacher.id) }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Search className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-bold italic tracking-tight">No faculty members found matching your search.</p>
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
            <Dialog open={!!editingTeacher} onOpenChange={() => setEditingTeacher(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Teacher: {editingTeacher?.teacherId}</DialogTitle>
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

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Lock className="h-3 w-3" /> New Password
                            </Label>
                            <Input
                                type="password"
                                placeholder="Leave blank to keep current"
                                value={editForm.password}
                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTeacher(null)}>Cancel</Button>
                        <Button onClick={handleSave}>Update Teacher</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Home Room Assignment Dialog */}
            <Dialog open={!!roomDialog} onOpenChange={() => setRoomDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Home Room</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Assign <strong>{roomDialog?.name}</strong> as the Home Room Teacher for a specific class.
                            This grants them permission to manage this class's overall results.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Grade</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={roomDialog?.grade || ''}
                                    onChange={e => setRoomDialog(prev => prev ? ({ ...prev, grade: e.target.value }) : null)}
                                >
                                    <option value="">None / Unassigned</option>
                                    {['9', '10', '11', '12'].map(g => (
                                        <option key={g} value={g}>Grade {g}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Section</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={roomDialog?.section || ''}
                                    onChange={e => setRoomDialog(prev => prev ? ({ ...prev, section: e.target.value }) : null)}
                                >
                                    <option value="">None / Unassigned</option>
                                    {['A', 'B', 'C', 'D'].map(s => (
                                        <option key={s} value={s}>Section {s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        {roomDialog?.grade && (
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    onUpdate(roomDialog.id, { grade: '', section: '' });
                                    setRoomDialog(null);
                                }}
                            >
                                Clear Assignment
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setRoomDialog(null)}>Cancel</Button>
                        <Button onClick={handleSaveRoom}>Save Assignment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
