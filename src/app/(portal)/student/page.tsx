"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  User,
  Calendar,
  BookOpen,
  Bell,
  TrendingUp,
  Award,
  Clock,
  GraduationCap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { AnnouncementList } from "@/components/AnnouncementList";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { cn } from "@/lib/utils";


export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [academicSummary, setAcademicSummary] = useState<any>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem("excel_academy_maintenance") === "true";
    return false;
  });

  if (!user) return null;

  const fetchData = async () => {
    if (!user) return;
    try {
      // Parallelize requests and use specific student filters
      const [resRes, attRes] = await Promise.all([
        fetch(`/api/results?studentId=${user.id}`, {
          headers: { "x-actor-role": "student", "x-actor-id": user.id },
        }),
        fetch(`/api/attendance?studentId=${user.id}`),
      ]);

      if (resRes.ok) {
        const data = await resRes.json();
        // API now returns specific result for studentId if provided
        let summary = data[user.id];
        if (!summary) {
          summary = Object.values(data).find(
            (r: any) =>
              r.studentId === user.studentId || r.studentId === user.id,
          );
        }
        if (summary) setAcademicSummary(summary);
      }

      if (attRes.ok) {
        const data = await attRes.json();
        setAttendanceCount(data.length);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data");
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for global sync from Navbar
    const syncHandler = () => fetchData();
    window.addEventListener("systemSync", syncHandler);
    return () => window.removeEventListener("systemSync", syncHandler);
  }, [user]);

  useAutoRefresh(fetchData, {
    enabled: !!user,
    interval: 30000,
    refreshOnFocus: true,
    refreshOnMount: false,
  });

  return (
    <div className="space-y-10 pb-10 animate-fade-in-up">
      {/* Hero Section */}
      <div className="card-premium overflow-hidden border-none ring-1 ring-slate-200/50 shadow-2xl shadow-cyan-500/5 relative group p-0">
        <div className="absolute inset-0 bg-linear-to-br from-cyan-600/5 via-transparent to-teal-600/5"></div>
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-500 blur-[120px] opacity-10 group-hover:opacity-25 transition-opacity duration-1000"></div>
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-teal-500 blur-[120px] opacity-10 group-hover:opacity-25 transition-opacity duration-1000"></div>

        <div className="relative z-10 p-10 sm:p-14 flex flex-col md:flex-row items-center gap-10 md:gap-14">
          <div className="relative shrink-0 group/photo">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-slate-100 group-hover/photo:scale-105 transition-transform duration-500 ring-8 ring-cyan-50/50">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
                  <User className="h-14 w-14 text-slate-300" />
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 bg-emerald-500 w-8 h-8 rounded-2xl border-4 border-white shadow-lg animate-pulse flex items-center justify-center"
              title="Identity Verified"
            >
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="text-center md:text-left flex-1 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100/50 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-2 shadow-xs">
                Active Session
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
                Welcome,{" "}
                <span className="text-gradient">
                  {user.name?.split(" ")[0]}
                </span>
              </h1>
              <p className="text-slate-500 text-lg font-semibold flex items-center justify-center md:justify-start gap-2.5 opacity-80 mt-4">
                <div className="h-10 w-10 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-cyan-500" />
                </div>
                <span className="text-slate-700">{user.fullName} • <span className="text-cyan-600 font-bold text-sm uppercase">Grade {user.grade}-{user.section}</span></span>
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white shadow-xs flex items-center gap-3">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">ID: {user.studentId}</span>
              </div>
              <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white shadow-xs flex items-center gap-3">
                <Clock className="h-4 w-4 text-cyan-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Term 2024-25</span>
              </div>
            </div>
          </div>
        </div>
      </div>      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Academic Performance Card */}
        <div className="lg:col-span-2 card-premium relative overflow-hidden group border-none shadow-sm h-full bg-white/40 ring-1 ring-slate-200/50">
          <div className="p-8 pb-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center shadow-inner">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Academic Journey</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Official Evaluation Record</p>
              </div>
            </div>
            <Button
              variant="premium"
              size="sm"
              asChild
              className="rounded-xl font-bold text-xs h-9 px-5 uppercase tracking-wider"
            >
              <Link href="/student/results">
                View Transcript <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="p-1">
            <Link
              href="/student/results"
              className="block cursor-pointer group/card"
            >
              {academicSummary ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center p-8 pt-4">
                  <div className="sm:col-span-1 flex flex-col items-center justify-center p-10 bg-linear-to-br from-cyan-600 to-teal-700 rounded-[2.5rem] shadow-2xl shadow-cyan-500/20 group-hover/card:scale-105 transition-transform duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 blur-2xl -mr-10 -mt-10" />
                    <div className="text-5xl font-bold text-white mb-1 leading-none drop-shadow-md">
                      {academicSummary.average.toFixed(0)}
                      <span className="text-2xl opacity-60 ml-0.5">%</span>
                    </div>
                    <p className="text-xs font-bold text-cyan-100 uppercase tracking-wider mt-2">
                      Aggregate
                    </p>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/60 border border-white rounded-3xl shadow-xs group-hover/card:bg-white transition-all duration-300">
                      <div className="text-3xl font-bold text-slate-900 mb-1 tabular-nums">
                        #{academicSummary.rank}
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Class Rank
                      </p>
                    </div>
                    <div className="p-6 bg-white/60 border border-white rounded-3xl shadow-xs group-hover/card:bg-white transition-all duration-300">
                      <div className="text-3xl font-bold text-slate-900 mb-1 tabular-nums">
                        {academicSummary.total}
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Score Points
                      </p>
                    </div>
                    <div className="col-span-2 p-5 bg-emerald-50/50 border border-emerald-100 rounded-3xl flex items-center justify-between group-hover/card:bg-emerald-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center shadow-inner">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          Outcome
                        </span>
                      </div>
                      <span className="px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-50/50">
                        {academicSummary.promotedOrDetained}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center group-hover/card:bg-white/50 transition-all rounded-3xl m-4 border-2 border-dashed border-slate-100">
                  <div className="h-20 w-20 bg-slate-50 rounded-4xl flex items-center justify-center mb-6 group-hover/card:bg-white shadow-sm transition-colors ring-8 ring-slate-50/50">
                    <FileText className="h-10 w-10 text-slate-300" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">
                    Processing Data
                  </h4>
                  <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
                    Administration is currently verifying your latest assessments.
                  </p>
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Engagement Card */}
        <div className="card-premium p-8 h-full bg-white/40 ring-1 ring-slate-200/50 flex flex-col space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center shadow-inner">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Engagement</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Calendar Presence</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all duration-700"></div>
              <svg className="w-48 h-48 transform -rotate-90 relative z-10 transition-transform duration-1000 group-hover:rotate-0">
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-100/50"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={527}
                  strokeDashoffset={527 - 527 * 0.92}
                  className="text-cyan-600 transition-all duration-1000 ease-out drop-shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
                <span className="text-6xl font-bold text-slate-900 leading-none tabular-nums">
                  {attendanceCount}
                </span>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
                  Sessions
                </span>
              </div>
            </div>
            <div className="mt-10 px-6 py-3 rounded-2xl bg-white shadow-xs border border-slate-100 group hover:shadow-lg transition-all">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Consistent Attendance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "My Profile", icon: User, href: "/student/profile", color: "text-cyan-600", bg: "bg-cyan-100" },
          { label: "Evaluations", icon: FileText, href: "/student/results", color: "text-teal-600", bg: "bg-teal-100" },
          { label: "Library", icon: BookOpen, href: "/student/library", color: "text-sky-600", bg: "bg-sky-100" },
          { label: "Newsroom", icon: Bell, href: "/student/announcements", color: "text-amber-600", bg: "bg-amber-100" },
        ].map((item, i) => (
          <Link key={i} href={item.href} className="group">
            <div className="card-premium h-full flex flex-col items-center justify-center p-8 transition-all duration-500 cursor-pointer border-none ring-1 ring-slate-200/50 hover:bg-white hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-2 relative overflow-hidden">
              <div
                className={cn("p-6 rounded-3xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner", item.bg)}
              >
                <item.icon className={cn("h-8 w-8", item.color)} />
              </div>
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Announcements */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shadow-inner">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Institutional Feed</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Official News & Updates</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-cyan-600 font-bold text-xs uppercase tracking-wider hover:bg-cyan-50 rounded-xl px-6 group"
            asChild
          >
            <Link href="/student/announcements">
              News Archive <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="card-premium p-6 border-none ring-1 ring-slate-200/50 bg-white/60">
          <AnnouncementList limit={3} />
        </div>
      </div>
    </div>
  );
}


