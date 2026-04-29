"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { StudentResult } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Download, AlertCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { calculateGrade } from "@/lib/utils/gradingLogic";
import { generateReportCardPDF } from "@/lib/utils/export";
import { normalizeGrade, calculateAnnualAverage, calculateSemesterAverage } from "@/lib/data-utils";
import { useSettings } from "@/hooks/useSettings";
import { StatCard } from "@/components/StatCard";

export default function StudentResultsPage() {
  const { user } = useAuth() as { user: any };
  const { settings, loading: settingsLoading } = useSettings();
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingBreakdownSub, setViewingBreakdownSub] = useState<any>(null);

  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false);

  const fetchResult = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rRes = await fetch("/api/results", {
        headers: { "x-actor-role": "student", "x-actor-id": user.id || "" },
      });

      const storedResults = rRes.ok ? await rRes.json() : {};
      
      const studentDisplayId = user.studentId || user.student_id || '';
      let res = storedResults[user.id] || storedResults[studentDisplayId];
      
      if (!res && storedResults.published) {
        res = storedResults.published[user.id] || storedResults.published[studentDisplayId];
      }
      
      if (!res) {
        const allResults = storedResults.published 
          ? Object.values(storedResults.published) 
          : Object.values(storedResults);
          
        res = allResults.find(
          (r: any) =>
            r.studentId === studentDisplayId ||
            r.student_id === studentDisplayId ||
            r.studentId === user.id ||
            r.student_id === user.id
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

        const annualAvg = calculateAnnualAverage(approvedSubjects);

        const normalized = {
          ...res,
          subjects: approvedSubjects,
          average: annualAvg,
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
    await generateReportCardPDF(result, user, settings);
  };

  const reportCardEnabled = settings?.reportCardDownload !== false;
  const assessmentTypes = settings?.assessmentTypes || [];

  if (loading || settingsLoading) return <div className="text-center py-12">Loading results...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">STUDENT PERFORMANCE</h1>
          <p className="text-slate-500 font-bold text-xs sm:text-sm tracking-wide mt-1">ACADEMIC YEAR: 2023 - 2024</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {reportCardEnabled && result && (
            <Button onClick={downloadPDF} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs uppercase tracking-widest px-6 h-11 rounded-xl shadow-xl shadow-cyan-500/20">
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
             <StatCard 
               label="Semester 1 Average" 
               value={calculateSemesterAverage(result.subjects, 1).toFixed(1)} 
               unit="%" 
             />
             <StatCard 
               label="Semester 2 Average" 
               value={calculateSemesterAverage(result.subjects, 2).toFixed(1)} 
               unit="%" 
             />
             <StatCard 
               label="Annual Performance" 
               value={result.average.toFixed(1)} 
               unit="%" 
               variant="vibrant"
               description="Weighted Academic Year Total"
             />
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
                      {result.subjects.map((sub, i) => {
                        const s1 = Number(sub.sem1 || 0);
                        const s2 = Number(sub.sem2 || 0);
                        // Annual = average of s1+s2 if both exist, otherwise the one that exists
                        const annual = (s1 > 0 && s2 > 0)
                          ? Math.round(((s1 + s2) / 2) * 10) / 10
                          : Number(sub.marks || s1 || s2 || 0);
                        const gradeLetterInput = (s1 > 0 || s2 > 0) ? annual : Number(sub.marks || 0);
                        return (
                          <tr key={i} className="hover:bg-cyan-50/30 transition-colors group">
                             <td className="px-8 py-6 font-bold text-slate-800">{sub.name}</td>
                             <td className="px-6 py-6 text-center font-bold text-slate-600">{s1 > 0 ? s1.toFixed(1) : "-"}</td>
                             <td className="px-6 py-6 text-center font-bold text-slate-600">{s2 > 0 ? s2.toFixed(1) : "-"}</td>
                             <td className="px-6 py-6 text-right font-black text-cyan-700">{annual > 0 ? annual.toFixed(1) : "-"}</td>
                             <td className="px-6 py-6 text-center">
                                <span className={cn(
                                  "inline-block w-8 py-1 rounded-lg font-black text-xs",
                                  calculateGrade(gradeLetterInput) === "F" ? "bg-red-50 text-red-500" : "bg-cyan-50 text-cyan-600"
                                )}>
                                   {calculateGrade(gradeLetterInput)}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <Button variant="ghost" size="sm" onClick={() => setViewingBreakdownSub(sub)} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:bg-white border border-transparent hover:border-cyan-100 transition-all">
                                   <Eye className="h-3 w-3 mr-2" /> Detail
                                </Button>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {result.subjects.map((sub, i) => {
              const s1 = Number(sub.sem1 || 0);
              const s2 = Number(sub.sem2 || 0);
              const annual = (s1 > 0 && s2 > 0)
                ? Math.round(((s1 + s2) / 2) * 10) / 10
                : Number(sub.marks || s1 || s2 || 0);
              const gradeLetterInput = (s1 > 0 || s2 > 0) ? annual : Number(sub.marks || 0);
              const grade = calculateGrade(gradeLetterInput);
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-slate-800 text-sm">{sub.name}</h3>
                    <span className={cn(
                      "inline-block px-2.5 py-1 rounded-lg font-black text-xs",
                      grade === "F" ? "bg-red-50 text-red-500" : "bg-cyan-50 text-cyan-600"
                    )}>{grade}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Sem 1</p>
                      <p className="text-sm font-bold text-slate-700">{s1 > 0 ? s1.toFixed(1) : "-"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Sem 2</p>
                      <p className="text-sm font-bold text-slate-700">{s2 > 0 ? s2.toFixed(1) : "-"}</p>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-2">
                      <p className="text-[9px] font-black text-cyan-500 uppercase tracking-wider mb-1">Annual</p>
                      <p className="text-sm font-black text-cyan-700">{annual > 0 ? annual.toFixed(1) : "-"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setViewingBreakdownSub(sub)} className="w-full mt-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:bg-cyan-50 border border-cyan-100">
                    <Eye className="h-3 w-3 mr-1.5" /> View Breakdown
                  </Button>
                </div>
              );
            })}
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
               const semAssessments = assessmentTypes.filter((t: any) => 
                 (t.semester === sem || t.semester === "all" || !t.semester) && 
                 (normalizeGrade(t.grade) === "all" || normalizeGrade(t.grade) === normalizeGrade(user.grade))
               );
               return (
                 <div key={sem} className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-cyan-600 tracking-widest">Semester {sem}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {semAssessments.map((type: any) => {
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

