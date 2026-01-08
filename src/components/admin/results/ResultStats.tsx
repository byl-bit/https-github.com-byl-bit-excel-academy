'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Award, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";
import type { PublishedResult, PendingResult } from '@/lib/types';

interface ResultStatsProps {
    published: PublishedResult[];
    pending: PendingResult[];
}

export function ResultStats({ published, pending }: ResultStatsProps) {
    const totalPublished = published.length;
    const totalPending = pending.length;

    // Calculate pass rate
    const passed = published.filter(r => (r.promotedOrDetained || r.promoted_or_detained) === 'PROMOTED').length;
    const passRate = totalPublished > 0 ? (passed / totalPublished) * 100 : 0;

    // Average score across all published
    const avgScore = totalPublished > 0
        ? published.reduce((acc, r) => acc + (r.average || 0), 0) / totalPublished
        : 0;

    const stats = [
        {
            label: "Published Results",
            value: totalPublished,
            icon: Award,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            label: "Pending Approval",
            value: totalPending,
            icon: Clock,
            color: "text-amber-600",
            bgColor: "bg-amber-50"
        },
        {
            label: "Pass Rate",
            value: `${passRate.toFixed(1)}%`,
            icon: CheckCircle,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50"
        },
        {
            label: "Avg. Performance",
            value: `${avgScore.toFixed(1)}%`,
            icon: TrendingUp,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-sm glass-panel overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl ${stat.bgColor} flex items-center justify-center shadow-inner`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
