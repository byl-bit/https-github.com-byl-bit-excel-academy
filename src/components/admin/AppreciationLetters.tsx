'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileCheck, Trophy, Search, Printer, Filter } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { jsPDF } from 'jspdf';
import { normalizeGender } from '@/lib/utils';
import type { User, PublishedResult } from '@/lib/types';

interface AppreciationLettersProps {
    students: User[];
    results: PublishedResult[]; // Assuming this is an array of all published results
}

export function AppreciationLetters({ students, results }: AppreciationLettersProps) {
    const { success, error: notifyError } = useToast();
    const [loading, setLoading] = useState(false);
    const [minAverage, setMinAverage] = useState<number>(90);
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [selectedGender, setSelectedGender] = useState<string>('all');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [previewStudent, setPreviewStudent] = useState<PublishedResult | null>(null);

    // Get unique grades and sections
    const grades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort();
    const sections = Array.from(new Set(students.map(s => s.section).filter(Boolean))).sort();

    // Filter eligible students
    const eligibleResults = results.filter(r => {
        const avg = r.average || 0;
        const matchesGrade = selectedGrade === 'all' || r.grade === selectedGrade;
        const matchesSection = selectedSection === 'all' || r.section === selectedSection;
        const matchesGender = selectedGender === 'all' || normalizeGender(r.gender || (r as any).sex) === selectedGender;
        const matchesStudent = !selectedStudentId ||
            r.studentName?.toLowerCase().includes(selectedStudentId.toLowerCase()) ||
            String(r.studentId).includes(selectedStudentId);

        return avg >= minAverage && matchesGrade && matchesSection && matchesGender && matchesStudent;
    });

    const generatePDF = async (result: PublishedResult, isBulk: boolean = false) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // --- Border ---
        doc.setLineWidth(1);
        doc.setDrawColor(20, 30, 90); // Dark Blue border
        doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

        // Inner decorative border
        doc.setLineWidth(0.5);
        doc.setDrawColor(180, 150, 50); // Gold-ish
        doc.rect(margin + 2, margin + 2, pageWidth - (margin * 2) - 4, pageHeight - (margin * 2) - 4);

        // --- Header / Logo Placeholder ---
        // You would typically add an image here: doc.addImage(...)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(32);
        doc.setTextColor(20, 30, 90);
        doc.text("EXCEL ACADEMY", pageWidth / 2, 50, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text("Excellence in Education", pageWidth / 2, 60, { align: 'center' });

        // --- Title ---
        doc.setFontSize(28);
        doc.setTextColor(180, 150, 50); // Gold color
        doc.text("Certificate of Achievement", pageWidth / 2, 90, { align: 'center' });

        // --- Body Text ---
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");

        doc.text("This certificate is proudly presented into", pageWidth / 2, 110, { align: 'center' });

        // --- Student Name ---
        doc.setFont("times", "bolditalic");
        doc.setFontSize(36);
        doc.setTextColor(20, 30, 90);
        const name = result.studentName || "Student Name";
        doc.text(name, pageWidth / 2, 130, { align: 'center' });

        // --- Line under name ---
        doc.setDrawColor(20, 30, 90);
        doc.setLineWidth(0.5);
        const nameWidth = doc.getTextWidth(name);
        doc.line((pageWidth / 2) - (nameWidth / 2) - 10, 132, (pageWidth / 2) + (nameWidth / 2) + 10, 132);

        // --- Achievement Text ---
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);

        const gender = normalizeGender(result.gender);
        const pronoun = gender === 'F' ? 'Her' : (gender === 'M' ? 'His' : 'Their');
        const pronounObj = gender === 'F' ? 'She' : (gender === 'M' ? 'He' : 'They'); // simplified

        const text = `For outstanding academic performance in Grade ${result.grade} - Section ${result.section}.\n${name} has secured an exceptional average of ${(result.average || 0).toFixed(1)}%,\ndemonstrating dedication, hard work, and a commitment to excellence.`;

        const splitText = doc.splitTextToSize(text, pageWidth - (margin * 4));
        doc.text(splitText, pageWidth / 2, 150, { align: 'center' });

        // --- Date and Signature ---
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        doc.setFontSize(12);
        doc.text(`Date: ${today}`, margin + 20, 220);
        doc.text("Principal's Signature", pageWidth - margin - 20, 220, { align: 'right' });

        // Signature Line
        doc.line(pageWidth - margin - 70, 210, pageWidth - margin - 10, 210);

        // --- Footer Motivation ---
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('"Success is the sum of small efforts, repeated day in and day out."', pageWidth / 2, 250, { align: 'center' });

        if (!isBulk) {
            doc.save(`Appreciation_Letter_${name.replace(/\s+/g, '_')}.pdf`);
            success('Letter generated successfully!');
        }
        return doc;
    };

    const handleBulkDownload = async () => {
        if (eligibleResults.length === 0) {
            notifyError('No students match the criteria.');
            return;
        }

        setLoading(true);
        try {
            // If many certificates, it might be better to zip them or combine them. 
            // For simplicity, we'll combine them into one PDF file with multiple pages.
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Remove the default first page as we loop through results to add pages
            doc.deletePage(1);

            for (const result of eligibleResults) {
                const singleDoc = await generatePDF(result, true);
                // This is tricky with jsPDF to merge. A simpler way is to just rebuild the page logic in a loop on one doc.
                // Let's reuse the logic but apply it to a single doc instance.
                doc.addPage();

                // Re-apply the drawing logic (simplified for brevity - in real app, extract drawing to function)
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 20;

                doc.setLineWidth(1);
                doc.setDrawColor(20, 30, 90);
                doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
                doc.setLineWidth(0.5);
                doc.setDrawColor(180, 150, 50);
                doc.rect(margin + 2, margin + 2, pageWidth - (margin * 2) - 4, pageHeight - (margin * 2) - 4);

                doc.setFont("helvetica", "bold");
                doc.setFontSize(32);
                doc.setTextColor(20, 30, 90);
                doc.text("EXCEL ACADEMY", pageWidth / 2, 50, { align: 'center' });

                doc.setFontSize(14);
                doc.setTextColor(100, 100, 100);
                doc.text("Excellence in Education", pageWidth / 2, 60, { align: 'center' });

                doc.setFontSize(28);
                doc.setTextColor(180, 150, 50);
                doc.text("Certificate of Achievement", pageWidth / 2, 90, { align: 'center' });

                doc.setFontSize(12);
                doc.setTextColor(40, 40, 40);
                doc.setFont("helvetica", "normal");
                doc.text("This certificate is proudly presented into", pageWidth / 2, 110, { align: 'center' });

                doc.setFont("times", "bolditalic");
                doc.setFontSize(36);
                doc.setTextColor(20, 30, 90);
                const name = result.studentName || "Student Name";
                doc.text(name, pageWidth / 2, 130, { align: 'center' });

                doc.setDrawColor(20, 30, 90);
                doc.setLineWidth(0.5);
                const nameWidth = doc.getTextWidth(name);
                doc.line((pageWidth / 2) - (nameWidth / 2) - 10, 132, (pageWidth / 2) + (nameWidth / 2) + 10, 132);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(14);
                doc.setTextColor(40, 40, 40);

                const text = `For outstanding academic performance in Grade ${result.grade} - Section ${result.section}.\n${name} has secured an exceptional average of ${(result.average || 0).toFixed(1)}%,\ndemonstrating dedication, hard work, and a commitment to excellence.`;
                const splitText = doc.splitTextToSize(text, pageWidth - (margin * 4));
                doc.text(splitText, pageWidth / 2, 150, { align: 'center' });

                const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                doc.setFontSize(12);
                doc.text(`Date: ${today}`, margin + 20, 220);
                doc.text("Principal's Signature", pageWidth - margin - 20, 220, { align: 'right' });
                doc.line(pageWidth - margin - 70, 210, pageWidth - margin - 10, 210);

                doc.setFont("helvetica", "italic");
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('"Success is the sum of small efforts, repeated day in and day out."', pageWidth / 2, 250, { align: 'center' });
            }

            doc.save(`Appreciation_Letters_Bulk_${new Date().toISOString().split('T')[0]}.pdf`);
            success(`Successfully generated ${eligibleResults.length} certificates.`);

        } catch (e) {
            console.error(e);
            notifyError('Failed to generate PDF batch.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-none bg-blue-50/50">
            <CardHeader
                title="Appreciation Letters"
                description="Generate PDF certificates for top performing students."
                icon={Trophy}
                className="pb-2"
            />
            <div className="p-6 space-y-6">

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Min. Average (%)</Label>
                        <Input
                            type="number"
                            value={minAverage}
                            onChange={(e) => setMinAverage(Number(e.target.value))}
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Grade</Label>
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="All Grades" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grades</SelectItem>
                                {grades.map(g => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="All Sections" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {sections.map(s => <SelectItem key={s} value={String(s)}>Section {s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Gender</Label>
                        <Select value={selectedGender} onValueChange={setSelectedGender}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="All Genders" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Genders</SelectItem>
                                <SelectItem value="M">Male</SelectItem>
                                <SelectItem value="F">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Filter by Name/ID</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search..."
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="pl-8 bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Eligible List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-blue-500" />
                            <span className="font-bold text-slate-700 text-sm">{eligibleResults.length} Eligible Students</span>
                        </div>
                        <Button
                            onClick={handleBulkDownload}
                            disabled={loading || eligibleResults.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Printer className="h-3 w-3 mr-2" />}
                            Download All Selected
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {eligibleResults.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No students match the selected criteria.
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 bg-slate-50 uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">Roll No</th>
                                        <th className="px-4 py-3 font-bold">ID</th>
                                        <th className="px-4 py-3 font-bold">Name</th>
                                        <th className="px-4 py-3 font-bold text-center">Gender</th>
                                        <th className="px-4 py-3 font-bold text-center">Grade</th>
                                        <th className="px-4 py-3 font-bold text-center">Avg %</th>
                                        <th className="px-4 py-3 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {eligibleResults.map((result, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-700">{result.rollNumber || result.roll_number || '--'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{result.studentId}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800">{result.studentName}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md border uppercase bg-slate-50 text-slate-500 border-slate-100">
                                                    {normalizeGender(result.gender) || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600">{result.grade}-{result.section}</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{(result.average || 0).toFixed(1)}%</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => generatePDF(result)}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                                                    title="Download Single Certificate"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
