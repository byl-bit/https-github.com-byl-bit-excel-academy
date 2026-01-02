import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, User as UserIcon, Trash2, Plus, Search, Filter, Hash, GraduationCap, LayoutGrid } from "lucide-react";
import type { SubjectAllocation } from "@/lib/mockData";
import type { User } from "@/hooks/useAdminData";

interface SubjectAllocationsProps {
    allocations: SubjectAllocation[];
    teachers: User[];
    subjects: string[];
    onAllocate: (allocation: Omit<SubjectAllocation, 'id'>) => Promise<void>;
    onDeallocate: (id: string) => Promise<void>;
}

export function SubjectAllocations({ allocations, teachers, subjects, onAllocate, onDeallocate }: SubjectAllocationsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');

    const handleAllocate = async () => {
        if (!selectedTeacher || !selectedGrade || !selectedSection || !selectedSubject) return;

        setLoading(true);
        try {
            const teacher = teachers.find(t => t.id === selectedTeacher);
            if (!teacher) return;

            // Prefer human-readable ID for business logic, fallback to UUID
            const storedTeacherId = teacher.teacherId || teacher.id;

            await onAllocate({
                teacherId: storedTeacherId,
                teacherName: teacher.name,
                grade: selectedGrade,
                section: selectedSection,
                subject: selectedSubject
            });
            setIsOpen(false);
            // Reset form (keep teacher selected for rapid entry?) - No, better reset
            setSelectedSubject('');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name));

    const filteredAllocations = allocations.filter(alloc => {
        const q = searchQuery.toLowerCase();
        const tName = (alloc.teacherName || alloc.teacher_name || '').toLowerCase();
        const subj = alloc.subject.toLowerCase();
        const grade = alloc.grade.toLowerCase();
        return tName.includes(q) || subj.includes(q) || grade.includes(q);
    });

    const grades = ['9', '10', '11', '12'];
    const sections = ['A', 'B', 'C', 'D'];

    // Subject color mapping (simple hashing)
    const getSubjectColor = (subject: string) => {
        const colors = [
            'bg-rose-50 text-rose-700 border-rose-200',
            'bg-blue-50 text-blue-700 border-blue-200',
            'bg-emerald-50 text-emerald-700 border-emerald-200',
            'bg-violet-50 text-violet-700 border-violet-200',
            'bg-amber-50 text-amber-700 border-amber-200',
            'bg-cyan-50 text-cyan-700 border-cyan-200',
        ];
        let hash = 0;
        for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="h-6 w-6 text-indigo-600" />
                        Subject Matrix
                    </h3>
                    <p className="text-slate-500 font-medium">Manage teacher assignments and class coverage.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by teacher, subject..."
                            className="pl-9 bg-white border-slate-200 focus:border-indigo-500 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 rounded-xl transition-all hover:scale-105">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Assign Subject</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <div className="bg-indigo-100 p-2 rounded-lg"><BookOpen className="h-5 w-5 text-indigo-600" /></div>
                                    New Assignment
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    Link a teacher to a class section and subject.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-5 py-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</Label>
                                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                            <SelectValue placeholder="Select Teacher" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {sortedTeachers.map(t => (
                                                <SelectItem key={t.id} value={t.id} className="font-medium cursor-pointer">
                                                    {t.name} <span className="text-slate-400 ml-1 text-xs">({t.teacherId || 'No ID'})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</Label>
                                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {grades.map(g => (
                                                    <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section</Label>
                                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sections.map(s => (
                                                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</Label>
                                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                            <SelectValue placeholder="Select Subject" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {subjects.sort().map(s => (
                                                <SelectItem key={s} value={s} className="font-medium cursor-pointer">{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsOpen(false)} className="font-bold text-slate-500 hover:text-slate-700">Cancel</Button>
                                <Button onClick={handleAllocate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">
                                    {loading ? "Assigning..." : "Confirm Assignment"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-100">
                            <TableRow>
                                <TableHead className="font-bold text-slate-500 pl-6">Teacher Details</TableHead>
                                <TableHead className="font-bold text-slate-500">Target Class</TableHead>
                                <TableHead className="font-bold text-slate-500">Subject</TableHead>
                                <TableHead className="text-right font-bold text-slate-500 pr-6">Management</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAllocations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                                <BookOpen className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="font-bold text-lg text-slate-600">No Assignments Found</p>
                                            <p className="max-w-xs text-sm mt-1">
                                                {searchQuery ? "Try adjusting your search terms." : "Get started by assigning a subject to a teacher."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAllocations.map((alloc) => {
                                    const allocTeacherId = alloc.teacherId || alloc.teacher_id;
                                    const allocTeacherName = alloc.teacherName || alloc.teacher_name;
                                    const teacher = teachers.find(t => t.id === allocTeacherId || t.teacherId === allocTeacherId);
                                    const subjectColorClass = getSubjectColor(alloc.subject);

                                    return (
                                        <TableRow key={alloc.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-100">
                                                        {(teacher?.name?.[0] || allocTeacherName?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{teacher?.name || allocTeacherName || 'Unknown'}</p>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                                            <Hash className="h-3 w-3" />
                                                            {teacher?.teacherId || teacher?.id || allocTeacherId || 'No ID'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-black border border-slate-200">
                                                        {alloc.grade}-{alloc.section}
                                                    </span>
                                                    <span className="text-slate-400 text-xs">
                                                        <GraduationCap className="h-4 w-4" />
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${subjectColorClass}`}>
                                                    {alloc.subject}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all rounded-full h-8 w-8 p-0"
                                                    onClick={() => onDeallocate(alloc.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
