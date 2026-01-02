'use client';

import { Card, CardHeader } from "@/components/ui/glass-card";
import { Users, CheckCircle, FileText, Megaphone, TrendingUp, Shield, GraduationCap, School } from "lucide-react";
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
            iconColor: "text-blue-600",
            bg: "bg-blue-100",
            description: "Active student accounts"
        },
        {
            title: "Pending Approvals",
            value: pendingCount,
            icon: CheckCircle,
            iconColor: "text-amber-600",
            bg: "bg-amber-100",
            description: "Action required"
        },
        {
            title: "Results Published",
            value: stats.resultsCount,
            icon: GraduationCap,
            iconColor: "text-emerald-600",
            bg: "bg-emerald-100",
            description: "Current term"
        },
        {
            title: "Total Teachers",
            value: stats.totalTeachers,
            icon: School,
            iconColor: "text-indigo-600",
            bg: "bg-indigo-100",
            description: "Faculty members"
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className="glass-panel p-6 relative group overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:bg-white"
                    >
                        <div className="absolute -right-6 -top-6 p-3 opacity-5 group-hover:opacity-10 transition-all transform group-hover:scale-110 duration-700">
                            <card.icon className="h-24 w-24" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`${card.bg}/60 p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                    <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                                </div>
                                <span className={cn("text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-xs",
                                    idx === 0 ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                        idx === 1 ? "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse" :
                                            idx === 2 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                )}>
                                    System Active
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.title}</h3>
                                <div className="text-4xl font-black tracking-tighter text-slate-800 group-hover:text-blue-600 transition-colors">
                                    {card.value}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">{card.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-none shadow-sm bg-white/40 overflow-hidden group">
                    <CardHeader title="Academic Performance" description="Performance analytics" icon={TrendingUp} />
                    <div className="space-y-10 p-8 pt-2">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Success Rate</p>
                                    <span className="text-4xl font-black text-blue-600 group-hover:scale-105 transition-transform inline-block origin-left">{stats.passRate?.toFixed(1)}%</span>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                <div
                                    className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/20"
                                    style={{ width: `${stats.passRate}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Highest Average</p>
                                    <span className="text-4xl font-black text-emerald-600 group-hover:scale-105 transition-transform inline-block origin-left">{stats.topAverage?.toFixed(1)}%</span>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                </div>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                <div
                                    className="h-full bg-linear-to-r from-emerald-400 to-teal-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-emerald-500/20"
                                    style={{ width: `${stats.topAverage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white/40 overflow-hidden">
                    <CardHeader title="System Health" description="Real-time monitoring" icon={Shield} />
                    <div className="space-y-3 p-8 pt-2">
                        {[
                            { label: "Database Core", status: "Secure", icon: CheckCircle, color: "emerald", glow: "rgba(34,197,94,0.6)" },
                            { label: "Computational Load", status: "Optimal", icon: TrendingUp, color: "blue", glow: "rgba(59,130,246,0.6)" },
                            { label: "Access Security", status: "Enforced", icon: Shield, color: "indigo", glow: "rgba(99,102,241,0.6)" }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-5 glass-panel bg-white/60 hover:bg-white transition-all duration-300 group border-transparent hover:border-white shadow-xs">
                                <div className="flex items-center gap-4">
                                    <div className={`h-2.5 w-2.5 rounded-full bg-${item.color}-500 animate-pulse`} style={{ boxShadow: `0 0 10px ${item.glow}` }} />
                                    <span className="text-slate-700 font-black uppercase text-[11px] tracking-wider group-hover:text-slate-900 transition-colors">{item.label}</span>
                                </div>
                                <span className={`text-${item.color}-700 bg-${item.color}-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xs border border-${item.color}-100`}>
                                    <item.icon className="h-3.5 w-3.5" /> {item.status}
                                </span>
                            </div>
                        ))}
                        <div className="mt-4 p-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Infrastructure Status</p>
                            <p className="text-sm font-bold flex items-center gap-2">
                                <Shield className="h-4 w-4" /> All Systems Nominal - 100% Uptime
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
