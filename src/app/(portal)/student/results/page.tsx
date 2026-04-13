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
import { generateReportCardPDF } from "@/lib/utils/export";

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

      const storedResults = rRes.ok ? await rRes.json() : {};
      const settingsData = sRes.ok ? await sRes.json() : {};
      
      setSettings(settingsData);

      if (settingsData.reportCardDownload !== undefined)
        setReportCardEnabled(settingsData.reportCardDownload);
      if (settingsData.certificateDownload !== undefined)
        setCertificateEnabled(settingsData.certificateDownload);
      if (settingsData.assessmentTypes)
        setAssessmentTypes(settingsData.assessmentTypes);

      // The API returns { published: {}, pending: {} } for admin/teachers
      // but returns { [studentId]: result } directly for students
      const studentDisplayId = user.studentId || user.student_id || '';
      let res = storedResults[user.id] || storedResults[studentDisplayId];
      
      if (!res && storedResults.published) {
        res = storedResults.published[user.id] || storedResults.published[studentDisplayId];
      }
      
      if (!res) {
        // Search through all values if direct lookup fails
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
    await generateReportCardPDF(result, user, settings);
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
