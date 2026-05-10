"use client";

import { useState, Fragment } from "react";
import {
  Award,
  Clock,
  Printer,
  CheckCircle,
  XCircle,
  Trash2,
  Lock,
  FileText,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/PaginationControls";
import { cn, normalizeGender } from "@/lib/utils";
import type { PublishedResult, PendingResult, Subject } from "@/lib/types";

interface ResultDirectoryTableProps {
  data: Array<PublishedResult | PendingResult>;
  isPendingView?: boolean;
  onApproveMany?: (keys: string[], teacherName: string) => void;
  onApprovePending?: (key: string, name: string, note?: string) => void;
  onApproveSubject?: (studentKey: string, subjectName: string) => void;
  onRejectPending?: (key: string, name: string, note?: string) => void;
  onDeletePublished?: (id: string) => void;
  onUnlock?: (id: string) => void;
  onPrintSingle: (result: PublishedResult) => void;
  onGenerateLetter?: (result: PublishedResult) => void;
  onBatchPrint: () => void;
}

const ITEMS_PER_PAGE = 10;

export function ResultDirectoryTable({
  data,
  isPendingView = false,
  onApproveMany,
  onApprovePending,
  onApproveSubject,
  onRejectPending,
  onDeletePublished,
  onUnlock,
  onPrintSingle,
  onGenerateLetter,
  onBatchPrint,
}: ResultDirectoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const paginatedData = data.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shadow-inner",
              isPendingView
                ? "bg-amber-100 text-amber-600"
                : "bg-blue-100 text-blue-600",
            )}
          >
            {isPendingView ? (
              <Clock className="h-5 w-5" />
            ) : (
              <Award className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              {isPendingView ? "Pending Approvals" : "Published Results"}
              <span className="ml-2 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                {data.length} Total
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {isPendingView
                ? "Submission queue from teachers"
                : "Verified and publicly accessible records"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "table"
                  ? "bg-white shadow-xs text-cyan-600"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "cards"
                  ? "bg-white shadow-xs text-cyan-600"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {!isPendingView && (
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-black h-10 px-6 rounded-xl shadow-lg shadow-cyan-100 transition-all hover:scale-105 active:scale-95 text-[11px] uppercase tracking-widest"
              onClick={onBatchPrint}
            >
              <Printer className="h-4 w-4 mr-2" /> Export All (PDF)
            </Button>
          )}
          {isPendingView && data.length > 0 && onApproveMany && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-10 px-6 rounded-xl shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95 text-[11px] uppercase tracking-widest"
              onClick={() => {
                if (confirm(`Approve all ${data.length} pending results?`)) {
                  onApproveMany(
                    data.map(
                      (r) => r.key || r.studentId || (r as any).student_id,
                    ),
                    "Bulk Action",
                  );
                }
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Approve All
            </Button>
          )}
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {!isPendingView && (
                    <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">
                      Rank
                    </th>
                  )}
                  <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">
                    ID / Roll
                  </th>
                  <th className="py-5 px-6 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">
                    Student Information
                  </th>
                  <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">
                    Grade & Sec
                  </th>
                  <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">
                    Performance
                  </th>
                  <th className="py-5 px-6 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">
                    Status
                  </th>
                  <th className="py-5 px-6 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest pr-10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30 grayscale">
                        <FileText className="h-16 w-16 mb-4" />
                        <p className="font-black text-xs uppercase tracking-[0.2em]">
                          No Records Found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((r, idx) => {
                    const resultsRow = r as PublishedResult;
                    return (
                      <Fragment key={r.studentId || (r as any).student_id || idx}>
                        <tr className="group hover:bg-slate-50/80 transition-all duration-300 border-b border-slate-50">
                          {!isPendingView && (
                            <td className="py-5 px-6 text-center">
                              <span className="text-xl font-black text-slate-300 group-hover:text-cyan-600 transition-colors">
                                #{r.rank || "-"}
                              </span>
                            </td>
                          )}
                          <td className="py-5 px-6 text-center">
                            <div className="font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl text-[11px] inline-block shadow-xs border border-slate-200/50">
                              {r.rollNumber || (r as any).roll_number || "-"}
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="font-black text-slate-900 text-[15px] group-hover:text-cyan-600 transition-colors leading-tight">
                              {r.studentName || (r as any).student_name}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              ID: {r.studentId || r.student_id}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <span className="font-black text-slate-600 text-[11px] uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                              {r.grade} - {r.section}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-center bg-slate-50/30 group-hover:bg-blue-50/50 transition-colors">
                            <div className="flex flex-col items-center gap-1">
                              <div className="font-black text-[18px] leading-none text-slate-800">
                                {r.average?.toFixed(1) || "0.0"}
                                <span className="text-[10px] text-slate-400 ml-0.5">
                                  %
                                </span>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  S1: {((r.subjects || []).reduce((acc, s) => acc + (s.sem1 || 0), 0) / (r.subjects?.length || 1)).toFixed(1)}%
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  S2: {((r.subjects || []).reduce((acc, s) => acc + (s.sem2 || 0), 0) / (r.subjects?.length || 1)).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xs border",
                                (r.promotedOrDetained ||
                                  r.promoted_or_detained) === "PROMOTED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-100",
                                isPendingView && "hover:bg-amber-50 hover:border-amber-200 transition-all"
                              )}
                              onClick={() => {
                                if (isPendingView) {
                                  setReviewingId(reviewingId === (r.studentId || (r as any).student_id) ? null : (r.studentId || (r as any).student_id));
                                }
                              }}
                            >
                              {isPendingView
                                ? reviewingId === (r.studentId || (r as any).student_id) ? "Reviewing..." : "Verify Details"
                                : r.promotedOrDetained ||
                                  r.promoted_or_detained ||
                                  "Pending"}
                            </Button>
                          </td>
                          <td className="py-5 px-6 text-right pr-10">
                            <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                              {isPendingView ? (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                                    onClick={() =>
                                      onApprovePending?.(
                                        r.key ||
                                          r.studentId ||
                                          (r as any).student_id ||
                                          "",
                                        r.studentName || "",
                                        adminNotes[r.studentId || (r as any).student_id || ""]
                                      )
                                    }
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                                    onClick={() =>
                                      onRejectPending?.(
                                        r.key ||
                                          r.studentId ||
                                          (r as any).student_id ||
                                          "",
                                        r.studentName || "",
                                        adminNotes[r.studentId || (r as any).student_id || ""]
                                      )
                                    }
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 text-cyan-600 hover:bg-cyan-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                                    onClick={() => onPrintSingle(resultsRow)}
                                  >
                                    <Printer className="h-5 w-5" />
                                  </Button>
                                  {r.average && r.average >= 90 && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-10 w-10 text-amber-500 hover:bg-amber-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                                      onClick={() =>
                                        onGenerateLetter?.(resultsRow)
                                      }
                                    >
                                      <Award className="h-5 w-5" />
                                    </Button>
                                  )}
                                  {onUnlock && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-10 w-10 text-cyan-500 hover:bg-cyan-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                                      onClick={() =>
                                        onUnlock(
                                          r.key ||
                                            r.studentId ||
                                            (r as any).student_id ||
                                            "",
                                        )
                                      }
                                    >
                                      <Lock className="h-5 w-5" />
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                                    onClick={() =>
                                      onDeletePublished?.(
                                        r.key ||
                                          r.studentId ||
                                          (r as any).student_id ||
                                          "",
                                      )
                                    }
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isPendingView && reviewingId === (r.studentId || (r as any).student_id) && (
                          <tr className="bg-slate-50/50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-300">
                            <td colSpan={7} className="p-8">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <LayoutGrid className="h-4 w-4" /> Subject Breakdown (S1 / S2)
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(r.subjects || []).map((s: any, si: number) => (
                                      <div key={si} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                                        <div>
                                          <p className="font-black text-slate-800 text-sm">{s.name}</p>
                                          <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">S1: {s.sem1 ?? "-"}</span>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">S2: {s.sem2 ?? "-"}</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-black text-lg text-cyan-600">{s.marks ?? "-"}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ANNUAL AVG</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Final Assessment & Feedback
                                  </h4>
                                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Admin Review Note</label>
                                      <textarea
                                        className="w-full h-24 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-100 transition-all resize-none"
                                        placeholder="Add an internal note or feedback for the teacher/student..."
                                        value={adminNotes[r.studentId || (r as any).student_id || ""] || ""}
                                        onChange={(e) => setAdminNotes(prev => ({...prev, [r.studentId || (r as any).student_id || ""]: e.target.value}))}
                                      />
                                    </div>
                                    <div className="flex gap-3">
                                      <Button
                                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl gap-2 shadow-lg shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95"
                                        onClick={() => {
                                          onApprovePending?.(
                                            r.key || r.studentId || (r as any).student_id || "",
                                            r.studentName || "",
                                            adminNotes[r.studentId || (r as any).student_id || ""]
                                          );
                                          setReviewingId(null);
                                        }}
                                      >
                                        <CheckCircle className="h-5 w-5" /> APPROVE & PUBLISH
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="flex-1 h-12 border-rose-200 text-rose-600 hover:bg-rose-50 font-black rounded-2xl gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                        onClick={() => {
                                          onRejectPending?.(
                                            r.key || r.studentId || (r as any).student_id || "",
                                            r.studentName || "",
                                            adminNotes[r.studentId || (r as any).student_id || ""]
                                          );
                                          setReviewingId(null);
                                        }}
                                      >
                                        <XCircle className="h-5 w-5" /> REJECT AS DRAFT
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedData.map((r, i) => (
            <div
              key={i}
              className="glass-panel p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-slate-50/80 backdrop-blur-sm rounded-bl-2xl border-b border-l border-slate-100">
                {/* Actions same as table but in mini menu */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-blue-600 rounded-lg"
                  onClick={() =>
                    (r as any).status === "published"
                      ? onPrintSingle(r as any)
                      : onApprovePending?.(r.key || "", r.studentName || "")
                  }
                >
                  {(r as any).status === "published" ? (
                    <Printer className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border",
                    (r.promotedOrDetained || r.promoted_or_detained) ===
                      "PROMOTED"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-red-50 text-red-600 border-red-100",
                  )}
                >
                  <span className="text-xl leading-none">
                    {r.average?.toFixed(0)}
                  </span>
                  <span className="text-[10px] uppercase opacity-60">Avg</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 truncate text-lg leading-tight group-hover:text-cyan-600 transition-colors">
                    {r.studentName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {r.studentId}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                      Grade {r.grade}-{r.section}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                    Total Score
                  </p>
                  <p className="font-black text-xl text-slate-700">
                    {r.total || 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                    Class Rank
                  </p>
                  <p className="font-black text-xl text-cyan-600">
                    #{r.rank || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, data.length)} of{" "}
            {data.length} entries
          </p>
          <PaginationControls
            currentPage={currentPage}
            totalItems={data.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
