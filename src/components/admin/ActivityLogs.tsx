'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Search, Filter } from "lucide-react";

interface ActivityLogsProps {
    logs: any[];
}

export function ActivityLogs({ logs }: ActivityLogsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-600" />
                    System Activity Log
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No recorded activity.
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                            {logs.map((log, idx) => (
                                <div key={log.id || idx} className="relative pl-8">
                                    <div className="absolute left-[-9px] top-1 h-4 w-4 rounded-full bg-slate-200 border-4 border-white" />
                                    <div className="flex flex-col">
                                        <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                                            <span>{log.action}</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">
                                                {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                                        <p className="text-[10px] text-blue-600 mt-1 font-semibold uppercase tracking-widest">{log.userName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
