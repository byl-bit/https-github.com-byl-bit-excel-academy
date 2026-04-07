"use client";

import { Card, CardHeader } from "@/components/ui/glass-card";
import {
  Users,
  CheckCircle,
  FileText,
  Megaphone,
  TrendingUp,
  Shield,
  GraduationCap,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStats } from "@/lib/utils/stats";

interface AdminOverviewProps {
  stats: SystemStats | null;
  pendingCount: number;
}

export function AdminOverview({ stats, pendingCount }: AdminOverviewProps) {
  if (!stats) return null;

  const cards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      iconColor: "text-cyan-600",
      bg: "bg-cyan-100",
      description: "Active student accounts",
    },
    {
      title: "Pending Approvals",
      value: pendingCount,
      icon: CheckCircle,
      iconColor: "text-amber-600",
      bg: "bg-amber-100",
      description: "Action required",
    },
    {
      title: "Results Published",
      value: stats.resultsCount,
      icon: GraduationCap,
      iconColor: "text-emerald-600",
      bg: "bg-emerald-100",
      description: "Current term",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      icon: School,
      iconColor: "text-teal-600",
      bg: "bg-teal-100",
      description: "Faculty members",
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in-up">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="card-premium p-6 relative group overflow-hidden border-none ring-1 ring-slate-200/50 hover:ring-cyan-500/30 shadow-xs hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 hover:-translate-y-1.5"
          >
            {/* Background blob */}
            <div className={cn(
              "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700",
              idx === 0 ? "bg-cyan-500" : idx === 1 ? "bg-amber-500" : idx === 2 ? "bg-emerald-500" : "bg-teal-500"
            )} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div
                  className={cn(
                    "p-4 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                    card.bg
                  )}
                >
                  <card.icon className={cn("h-7 w-7", card.iconColor)} />
                </div>
                {idx === 1 && pendingCount > 0 && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-slate-900 group-hover:to-cyan-600 transition-all duration-300">
                    {card.value}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="h-1 w-8 bg-cyan-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-2/3" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="card-premium border-none p-8 space-y-8 bg-white/40 ring-1 ring-slate-200/50 group">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Academic Performance</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Institutional Analytics</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <TrendingUp className="h-6 w-6 text-cyan-600 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div className="grid gap-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Success Rate</p>
                  <p className="text-3xl font-extrabold tracking-tight text-cyan-600 tabular-nums">
                    {stats.passRate?.toFixed(1)}<span className="text-lg ml-0.5">%</span>
                  </p>
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100/50 rounded-full overflow-hidden shadow-inner flex p-0.5">
                <div
                  className="h-full bg-linear-to-r from-cyan-500 to-teal-600 rounded-full animate-grow-x shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  style={{ width: `${stats.passRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distinction Average</p>
                  <p className="text-3xl font-extrabold tracking-tight text-emerald-600 tabular-nums">
                    {stats.topAverage?.toFixed(1)}<span className="text-lg ml-0.5">%</span>
                  </p>
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100/50 rounded-full overflow-hidden shadow-inner flex p-0.5">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 to-teal-500 rounded-full animate-grow-x delay-200 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  style={{ width: `${stats.topAverage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium border-none p-8 space-y-8 bg-white/40 ring-1 ring-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Reliability</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Real-time Core Monitoring</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center shadow-inner">
              <Shield className="h-6 w-6 text-teal-600" />
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: "Data Integrity", status: "Verified", icon: CheckCircle, color: "emerald", glow: "rgba(34,197,94,0.4)" },
              { label: "Neural Compute", status: "Optimal", icon: TrendingUp, color: "cyan", glow: "rgba(6,182,212,0.4)" },
              { label: "Network Security", status: "Enforced", icon: Shield, color: "teal", glow: "rgba(13,148,136,0.4)" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-white/60 border border-white rounded-2xl shadow-xs group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse", `bg-${item.color}-500`)} style={{ boxShadow: `0 0 12px ${item.glow}` }} />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-tight">{item.label}</span>
                </div>
                <div className={cn("text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border", `bg-${item.color}-50 text-${item.color}-700 border-${item.color}-100`)}>
                  <item.icon className="h-3 w-3" /> {item.status}
                </div>
              </div>
            ))}

            <div className="mt-6 p-6 rounded-3xl bg-linear-to-br from-teal-600 to-cyan-700 text-white shadow-2xl shadow-cyan-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Infrastructure</p>
                  <p className="text-base font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 fill-white/20" /> 100% System Uptime
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Latency</span>
                  <span className="text-lg font-bold tabular-nums">14ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
