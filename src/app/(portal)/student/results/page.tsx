"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/glass-card";
import { StudentResult, User } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Download, AlertCircle, FileText, Award, Eye, X, BookOpen, Info, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, normalizeGender } from "@/lib/utils";
import { calculateGrade } from "@/lib/utils/gradingLogic";

export default function StudentResultsPage() {
  const { user } = useAuth() as { user: any };
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportCardEnabled, setReportCardEnabled] = useState(true);
  const [certificateEnabled, setCertificateEnabled] = useState(true);
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [viewingBreakdownSub, setViewingBreakdownSub] = useState<any>(null);

  // Track if initial fetch has been done to prevent double-fetching
  const hasFetchedRef = useRef(false);

  const fetchResult = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [rRes, sRes] = await Promise.all([
        fetch("/api/results", {
          headers: { "x-actor-role": "student", "x-actor-id": user.id || "" },
        }),
        fetch("/api/settings"),
      ]);

      const storedResults = rRes.ok ? await rRes.json() : { published: {} };
      const settingsData = sRes.ok ? await sRes.json() : {};
      
      setSettings(settingsData);

      if (settingsData.reportCardDownload !== undefined)
        setReportCardEnabled(settingsData.reportCardDownload);
      if (settingsData.certificateDownload !== undefined)
        setCertificateEnabled(settingsData.certificateDownload);
      if (settingsData.assessmentTypes)
        setAssessmentTypes(settingsData.assessmentTypes);

      const published = storedResults.published || {};
      let res = published[user.id];
      if (!res) {
        res = Object.values(published).find(
          (r: any) =>
            r.studentId === user.studentId ||
            r.studentId === user.id
        );
      }

      if (res) {
        const approvedSubjects = ((res as any).subjects || []).map(
          (s: any) => ({
            ...s,
            name: s.name || s.subject || "",
            marks: Number(s.marks || 0),
          }),
        );

        const total = approvedSubjects.reduce(
          (sum: number, s: any) => sum + (s.marks || 0),
          0,
        );
        const average =
          approvedSubjects.length > 0 ? total / approvedSubjects.length : 0;

        const normalized = {
          ...res,
          subjects: approvedSubjects,
          total: Math.round(total * 10) / 10,
          average: Math.round(average * 10) / 10,
        } as unknown as StudentResult;
        setResult(normalized);
        setError("");
      } else {
        setError("No results available yet.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load results.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchResult();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, fetchResult]);

  const downloadPDF = async () => {
    if (!result || !user) return;
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const addImage = (url: string, x: number, y: number, w: number, h: number) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            try {
              doc.addImage(img, "JPEG", x, y, w, h);
              resolve(true);
            } catch (e) {
              resolve(false);
            }
          };
          img.onerror = () => resolve(false);
          img.src = url;
        });
      };

      // Header
      if (settings?.letterheadUrl) {
         await addImage(settings.letterheadUrl, 15, 10, 180, 25);
      } else {
        doc.setFillColor(8, 145, 178);
        doc.rect(15, 10, pageWidth - 30, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("EXCEL ACADEMY", pageWidth / 2, 28, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("DETERMINED TO EXCEL!", pageWidth / 2, 35, { align: "center" });
      }

      // Student Info
      let infoY = 50;
      doc.setTextColor(0, 0, 0);
      doc.line(15, infoY, pageWidth - 15, infoY);
      infoY += 10;
      
      const photoUrl = user.photo || user.image;
      if (photoUrl) {
        await addImage(photoUrl, 160, infoY, 30, 35);
        doc.rect(160, infoY, 30, 35);
      } else {
        doc.rect(160, infoY, 30, 35);
        doc.setFontSize(8);
        doc.text("PHOTO", 175, infoY + 18, { align: "center" });
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("STUDENT REPORT CARD", 15, infoY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${result.studentName || user.name || user.fullName}`, 15, infoY + 8);
      doc.text(`Student ID: ${result.studentId || user.studentId}`, 15, infoY + 14);
      doc.text(`Grade: ${result.grade || user.grade} - ${result.section || user.section}`, 15, infoY + 20);
      doc.text(`Roll Number: ${result.rollNumber || user.rollNumber || "N/A"}`, 15, infoY + 26);
      doc.text(`Gender: ${normalizeGender(result.gender || user.gender)}`, 15, infoY + 32);

      // Table
      let y = infoY + 45;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 6, pageWidth - 30, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.text("SUBJECT", 20, y);
      doc.text("SEM 1", 90, y, { align: "center" });
      doc.text("SEM 2", 125, y, { align: "center" });
      doc.text("ANNUAL", 160, y, { align: "center" });
      doc.text("GRADE", 190, y, { align: "center" });
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      y += 10;
      doc.setFont("helvetica", "normal");
      
      let s1Sum = 0, s2Sum = 0, subCount = 0;
      result.subjects.forEach((sub: any, idx: number) => {
        if (idx % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, y - 6, pageWidth - 30, 10, "F");
        }
        const s1 = sub.sem1 ?? (sub.marks && !sub.sem2 ? sub.marks : 0);
        const s2 = sub.sem2 ?? 0;
        const annual = sub.marks ?? ((s1+s2)/2);
        s1Sum += s1; s2Sum += s2; subCount++;
        doc.text(sub.name, 20, y);
        doc.text(s1.toFixed(1), 90, y, { align: "center" });
        doc.text(s2.toFixed(1), 125, y, { align: "center" });
        doc.text(annual.toFixed(1), 160, y, { align: "center" });
        doc.text(calculateGrade(annual), 190, y, { align: "center" });
        y += 10;
      });

      // Summary
      y += 5;
      doc.setDrawColor(8, 145, 178);
      doc.line(15, y, pageWidth - 15, y);
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("ACADEMIC SUMMARY", 15, y);
      y += 10;
      doc.setFontSize(10);
      const s1Avg = subCount > 0 ? s1Sum / subCount : 0;
      const s2Avg = subCount > 0 ? s2Sum / subCount : 0;
      doc.text(`Sem 1 Avg: ${s1Avg.toFixed(2)}%`, 15, y);
      doc.text(`Sem 2 Avg: ${s2Avg.toFixed(2)}%`, 100, y);
      y += 8;
      doc.text(`Annual Avg: ${result.average.toFixed(2)}%`, 15, y);
      doc.text(`Result: ${result.promotedOrDetained || "PENDING"}`, 100, y);

      // Signatures
      const sigY = pageHeight - 40;
      doc.line(20, sigY, 80, sigY);
      doc.text("School Director", 50, sigY + 5, { align: "center" });
      if (settings?.principalName) doc.text(settings.principalName, 50, sigY + 10, { align: "center" });

      doc.line(130, sigY, 190, sigY);
      doc.text("Homeroom Teacher", 160, sigY + 5, { align: "center" });
      const tName = settings?.homeroomName || settings?.teacherName;
      if (tName) doc.text(tName, 160, sigY + 10, { align: "center" });

      doc.save(`Report_Card_${result.studentId}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center py-12">Loading results...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">STUDENT PERFORMANCE</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">ACADEMIC YEAR: 2023 - 2024</p>
        </div>
        <div className="flex gap-3">
          {reportCardEnabled && result && (
            <Button onClick={downloadPDF} className="bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs uppercase tracking-widest px-6 h-12 rounded-xl shadow-xl shadow-cyan-500/20">
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="font-bold text-slate-800">{error}</p>
        </div>
      ) : result ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Semester 1 Average</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {(() => {
                      const sum = (result.subjects || []).reduce((acc: number, s: any) => acc + (s.sem1 || (s.marks && !s.sem2 ? s.marks : 0)), 0);
                      const avg = (result.subjects || []).length > 0 ? sum / (result.subjects || []).length : 0;
                      return avg.toFixed(1);
                    })()}
                  </span>
                  <span className="text-lg font-bold text-cyan-600">%</span>
                </div>
             </div>
             <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Semester 2 Average</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black text-slate-900">
                      {(() => {
                        const sum = (result.subjects || []).reduce((acc: number, s: any) => acc + (s.sem2 || 0), 0);
                        const avg = (result.subjects || []).length > 0 ? sum / (result.subjects || []).length : 0;
                        return avg.toFixed(1);
                      })()}
                   </span>
                   <span className="text-lg font-bold text-cyan-600">%</span>
                </div>
             </div>
             <div className="p-6 rounded-3xl bg-linear-to-br from-cyan-600 to-teal-700 shadow-2xl shadow-cyan-500/20 text-white">
                <p className="text-[10px] font-black uppercase text-cyan-100 mb-2 tracking-widest opacity-80">Annual Performance</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black">{result.average.toFixed(1)}</span>
                   <span className="text-lg font-bold text-cyan-200">%</span>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subject Name</th>
                         <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sem 1</th>
                         <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sem 2</th>
                         <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Annual</th>
                         <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Grade</th>
                         <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Breakdown</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {result.subjects.map((sub, i) => (
                        <tr key={i} className="hover:bg-cyan-50/30 transition-colors group">
                           <td className="px-8 py-6 font-bold text-slate-800">{sub.name}</td>
                           <td className="px-6 py-6 text-center font-bold text-slate-600">{sub.sem1 || "-"}</td>
                           <td className="px-6 py-6 text-center font-bold text-slate-600">{sub.sem2 || "-"}</td>
                           <td className="px-6 py-6 text-right font-black text-cyan-700">{(sub.marks || 0).toFixed(1)}</td>
                           <td className="px-6 py-6 text-center">
                              <span className={cn(
                                "inline-block w-8 py-1 rounded-lg font-black text-xs",
                                calculateGrade(sub.marks) === "F" ? "bg-red-50 text-red-500" : "bg-cyan-50 text-cyan-600"
                              )}>
                                 {calculateGrade(sub.marks)}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <Button variant="ghost" size="sm" onClick={() => setViewingBreakdownSub(sub)} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:bg-white border border-transparent hover:border-cyan-100 transition-all">
                                 <Eye className="h-3 w-3 mr-2" /> Detail
                              </Button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      ) : null}

      <Dialog open={!!viewingBreakdownSub} onOpenChange={() => setViewingBreakdownSub(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white">
          <DialogHeader className="bg-linear-to-br from-slate-900 to-slate-800 p-8 text-white">
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">{viewingBreakdownSub?.name} Breakdown</DialogTitle>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Detailed assessment distribution</p>
          </DialogHeader>
          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
             {["1", "2"].map(sem => {
               const semAssessments = assessmentTypes.filter(t => t.semester === sem || t.semester === "all");
               return (
                 <div key={sem} className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-cyan-600 tracking-widest">Semester {sem}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {semAssessments.map(type => {
                         const mark = viewingBreakdownSub?.assessments?.[type.id] ?? 0;
                         return (
                           <div key={type.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                             <div className="flex justify-between items-center mb-2">
                               <p className="text-xs font-black text-slate-700 uppercase">{type.label}</p>
                               <span className="text-xs font-black text-cyan-600">{mark} / {type.maxMarks}</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-cyan-500" style={{ width: `${(mark / type.maxMarks) * 100}%` }} />
                             </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               );
             })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
