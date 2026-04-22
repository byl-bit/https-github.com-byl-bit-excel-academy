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
                      {result.subjects.map((sub, i) => {
                        const s1 = sub.sem1 || (sub.marks && !sub.sem2 ? sub.marks : 0);
                        const s2 = sub.sem2 || 0;
                        return (
                          <tr key={i} className="hover:bg-cyan-50/30 transition-colors group">
                             <td className="px-8 py-6 font-bold text-slate-800">{sub.name}</td>
                             <td className="px-6 py-6 text-center font-bold text-slate-600">{s1 > 0 ? Number(s1).toFixed(1) : "-"}</td>
                             <td className="px-6 py-6 text-center font-bold text-slate-600">{s2 > 0 ? Number(s2).toFixed(1) : "-"}</td>
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
                        );
                      })}
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

