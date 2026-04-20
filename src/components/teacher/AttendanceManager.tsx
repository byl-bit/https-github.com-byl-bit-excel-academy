"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Save,
  UserCheck,
  UserX,
  Loader2,
  CalendarCheck,
  Info,
  Users,
  Eye,
} from "lucide-react";
import { StudentProfileDialog } from "@/components/StudentProfileDialog";

import { cn, normalizeGender } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";

interface AttendanceManagerProps {
  user: any;
  students: any[];
}

export function AttendanceManager({ user, students }: AttendanceManagerProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState<string[]>([]); // Array of PRESENT student IDs
  const [hasRecord, setHasRecord] = useState(false); // If record already exists for this day
  const [viewingStudent, setViewingStudent] = useState<any>(null);


  // Fetch attendance for selected date
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user.grade || !user.section) return;
      setLoading(true);
      try {
        const dateStr = date.toISOString().split("T")[0];
        const res = await fetch(
          `/api/attendance?date=${dateStr}&grade=${user.grade}&section=${user.section}`,
          {
            headers: {
              "x-actor-role": user.role || "teacher",
              "x-actor-id": user.id || "",
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAttendance(data.map((r: any) => r.student_id || r.id));
            setHasRecord(true);
          } else {
            // Default to ALL PRESENT if no record
            setAttendance(students.map((s) => s.student_id || s.id));
            setHasRecord(false);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [date, user, students]);

  const toggleStatus = (studentId: string) => {
    setAttendance((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId); // Mark Absent
      } else {
        return [...prev, studentId]; // Mark Present
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-actor-role": user.role || "teacher",
          "x-actor-id": user.id || "",
        },
        body: JSON.stringify({
          date: dateStr,
          grade: user.grade,
          section: user.section,
          presentStudentIds: attendance,
          teacherId: user.id,
        }),
      });

      if (res.ok) {
        setHasRecord(true);
        // Optional toast here
      } else {
        alert("Failed to save");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = attendance.length;
  const absentCount = students.length - attendance.length;

  if (!user.grade || !user.section) {
    return (
      <Card className="text-center py-12 flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50">
        <Info className="h-12 w-12 text-cyan-300 mb-4" />
        <h3 className="text-lg font-bold text-cyan-900">
          Attendance Unavailable
        </h3>
        <p className="text-cyan-500 max-w-sm mt-2 text-sm">
          You must be assigned a Home Room (Grade/Section) to take attendance.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="card-premium p-6 flex flex-col md:flex-row justify-between items-center gap-6 border-none ring-1 ring-slate-200/50 shadow-xl bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-cyan-50 flex items-center justify-center shadow-inner ring-4 ring-cyan-50/50 transition-transform hover:rotate-6">
            <CalendarCheck className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Presence Ledger
            </h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
              Grade {user.grade} - Section {user.section} • Digital Roster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/40 p-1.5 rounded-2xl ring-1 ring-slate-200/50 shadow-sm">
          <div className="relative">
            <input
              type="date"
              className="h-10 rounded-xl border-none bg-white px-4 py-1 text-xs text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-cyan-500/10 cursor-pointer shadow-xs uppercase tracking-wider"
              value={date ? date.toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setDate(
                  e.target.value ? new Date(e.target.value) : new Date(),
                )
              }
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            variant="premium"
            className={cn(
              "h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg transition-all rounded-xl",
              hasRecord
                ? "bg-cyan-600 shadow-cyan-500/20"
                : "bg-emerald-600 shadow-emerald-500/20",
            )}
          >
            {saving ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <Save className="mr-2 h-3 w-3" />
            )}
            {hasRecord ? "Sync Changes" : "Commit Roster"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="card-premium p-0 overflow-hidden border-none ring-1 ring-slate-200/50 bg-white/40 backdrop-blur-sm shadow-2xl shadow-slate-200/50">
            <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between backdrop-blur-md">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-500" />
                Active Enrollment
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                {date.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="p-0">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 animate-pulse">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 mb-4 animate-spin text-cyan-500" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-cyan-100/50" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600/50">
                    Hydrating Roster...
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] bg-slate-50/30">
                    <div className="col-span-1">RN</div>
                    <div className="col-span-2">Identity</div>
                    <div className="col-span-4">Full Legal Name</div>
                    <div className="col-span-2 text-center">Sex</div>
                    <div className="col-span-3 text-right pr-4">Disposition</div>
                  </div>

                  {students.length === 0 ? (
                    <div className="py-24 text-center text-slate-400">
                      <div className="h-16 w-16 mx-auto mb-4 bg-slate-50 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="font-black uppercase tracking-widest text-xs">
                        Zero Enrollment Records
                      </p>
                      <p className="text-[10px] mt-2 font-bold max-w-xs mx-auto text-slate-400">
                        Check with administration for Grade {user.grade} Sect {user.section} assignment status.
                      </p>
                    </div>
                  ) : (
                    [...students]
                      .sort((a, b) => {
                        const nameA = (
                          a.fullName ||
                          a.name ||
                          ""
                        ).toLowerCase();
                        const nameB = (
                          b.fullName ||
                          b.name ||
                          ""
                        ).toLowerCase();
                        if (nameA !== nameB) return nameA.localeCompare(nameB);
                        const rollA = parseInt(String(a.rollNumber || "0"));
                        const rollB = parseInt(String(b.rollNumber || "0"));
                        return rollA - rollB;
                      })
                      .map((student) => {
                        const sid = student.student_id || student.id;
                        const isPresent = attendance.includes(sid);
                        return (
                          <div
                            key={sid}
                            onClick={() => toggleStatus(sid)}
                            className={cn(
                              "grid grid-cols-12 gap-4 items-center px-6 py-4 cursor-pointer transition-all duration-300 group hover:z-10",
                              isPresent 
                                ? "bg-white hover:bg-cyan-50/30" 
                                : "bg-red-50/20 hover:bg-red-50/40",
                            )}
                          >
                            <div className="col-span-1 font-black text-xs text-slate-400 group-hover:text-cyan-600 transition-colors">
                              {student?.rollNumber || "--"}
                            </div>
                            <div className="col-span-2 font-black text-[10px] text-slate-500 uppercase tabular-nums">
                              {student?.studentId || student?.student_id || "PENDING"}
                            </div>
                            <div className="col-span-4 flex flex-col group-hover:translate-x-1 transition-transform">
                              <span className="font-black text-sm text-slate-800 tracking-tight truncate">
                                {student?.fullName || student?.name}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingStudent(student);
                                }}
                                className="text-[8px] font-black text-cyan-500 hover:text-cyan-700 uppercase tracking-widest bg-cyan-50 px-1 py-0.5 rounded transition-colors w-max mt-0.5"
                              >
                                View profile
                              </button>
                            </div>

                            <div className="col-span-2 text-center">
                              <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest shadow-xs",
                                normalizeGender(student.gender || student.sex) === "M"
                                  ? "bg-cyan-50 text-cyan-600 border-cyan-100"
                                  : "bg-pink-50 text-pink-600 border-pink-100"
                              )}>
                                {normalizeGender(student.gender || student.sex) || "-"}
                              </span>
                            </div>
                            <div className="col-span-3 flex justify-end">
                              <div
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all w-28 justify-center shadow-lg border",
                                  isPresent
                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-200 group-hover:scale-105"
                                    : "bg-white text-rose-600 border-rose-100 shadow-slate-100 group-hover:scale-105",
                                )}
                              >
                                {isPresent ? (
                                  <>
                                    <UserCheck className="h-4 w-4" />
                                    PRESENT
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-4 w-4" />
                                    ABSENT
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-premium p-6 space-y-8 bg-white/40 ring-1 ring-slate-200/50 backdrop-blur-sm">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Info className="h-5 w-5 text-cyan-600" />
                Ledger Summary
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time presence tracking</p>
            </div>

            <div className="space-y-4">
              <div className="group relative">
                <div className="flex justify-between items-center p-5 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-2xl shadow-xs transition-transform hover:-translate-y-1">
                  <span className="font-black flex items-center gap-3 text-xs uppercase tracking-widest">
                    <div className="bg-white h-7 w-7 rounded-lg flex items-center justify-center shadow-inner">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    Expected
                  </span>
                  <span className="text-3xl font-black tabular-nums">{presentCount}</span>
                </div>
              </div>

              <div className="group relative">
                <div className="flex justify-between items-center p-5 bg-red-50 border border-red-100 text-red-900 rounded-2xl shadow-xs transition-transform hover:-translate-y-1">
                  <span className="font-black flex items-center gap-3 text-xs uppercase tracking-widest">
                    <div className="bg-white h-7 w-7 rounded-lg flex items-center justify-center shadow-inner">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                    Exceptions
                  </span>
                  <span className="text-3xl font-black tabular-nums">{absentCount}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200/50 mt-4 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance</p>
                    <p className="text-4xl font-black text-slate-900 tabular-nums leading-none mt-1">
                      {students.length > 0
                        ? Math.round((presentCount / students.length) * 100)
                        : 0}
                      <span className="text-lg ml-0.5 text-slate-400">%</span>
                    </p>
                  </div>
                  <div className={cn(
                    "h-3 w-3 rounded-full animate-pulse",
                    (presentCount / (students.length || 1)) > 0.9 ? "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  )} />
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                      (presentCount / (students.length || 1)) > 0.9 ? "bg-emerald-500" : "bg-cyan-600"
                    )}
                    style={{
                      width: `${students.length > 0 ? (presentCount / students.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-linear-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-cyan-500/10 blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status Advisory</p>
                <p className="text-xs font-bold leading-relaxed mt-2 italic text-slate-300">
                  {absentCount === 0 
                    ? "Full institutional presence confirmed. No anomalies detected."
                    : `${absentCount} students require absence verification follow-up.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StudentProfileDialog 
        student={viewingStudent} 
        isOpen={!!viewingStudent} 
        onClose={() => setViewingStudent(null)} 
      />
    </div>

  );
}

