import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, User, ShieldAlert, Mail, GraduationCap, Hash, Fingerprint, Loader2, Contact } from "lucide-react";

interface ResetApprovalsProps {
    requests: any[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    processingId?: string | null;
}

export function ResetApprovals({ requests, onApprove, onReject, processingId }: ResetApprovalsProps) {
    if (requests.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 text-slate-200 mb-4" />
                    <p className="font-bold text-slate-400">No pending password reset requests.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => {
                const isProcessing = processingId === req.id;
                const specificId = req.userRole === 'student' ? req.studentId : (req.userRole === 'teacher' ? req.teacherId : null);

                return (
                    <Card key={req.id} className={`relative overflow-hidden border-none shadow-xl bg-white group hover:scale-[1.02] transition-all duration-300 ${isProcessing ? 'opacity-70' : ''}`}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />

                        <CardHeader className="pb-3 border-b border-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md overflow-hidden bg-slate-100">
                                            {req.photo ? (
                                                <img src={req.photo} alt={req.userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-amber-50">
                                                    <User className="h-6 w-6 text-amber-300" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-lg font-black text-slate-800 tracking-tight leading-none">{req.userName}</CardTitle>
                                        <CardDescription className="flex items-center gap-1.5 capitalize font-bold text-indigo-600 text-xs">
                                            <User className="h-3 w-3" />
                                            {req.userRole}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        {isProcessing ? 'Processing' : 'Pending'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {new Date(req.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-5 space-y-4">
                            {/* Detailed Information Grid */}
                            <div className="grid grid-cols-2 gap-y-4 gap-x-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Mail className="h-2.5 w-2.5" /> Email
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-700 truncate">{req.email || 'N/A'}</p>
                                </div>

                                <div className="space-y-0.5 text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                                        <Contact className="h-2.5 w-2.5" /> Gender
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-700 capitalize">{req.gender || 'N/A'}</p>
                                </div>

                                {specificId && (
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Fingerprint className="h-2.5 w-2.5" /> {req.userRole === 'student' ? 'Student ID' : 'Teacher ID'}
                                        </p>
                                        <p className="text-[11px] font-bold text-indigo-600 font-mono tracking-tighter">{specificId}</p>
                                    </div>
                                )}

                                <div className="space-y-0.5 text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                                        <Fingerprint className="h-2.5 w-2.5" /> DB ID
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-400 font-mono truncate max-w-[80px] ml-auto" title={req.userId}>
                                        {req.userId.split('-')[0]}...
                                    </p>
                                </div>

                                {req.userRole === 'student' && (
                                    <>
                                        <div className="space-y-0.5 pt-1 border-t border-slate-200/50">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <GraduationCap className="h-2.5 w-2.5" /> Class
                                            </p>
                                            <p className="text-[11px] font-bold text-slate-700">{req.grade}-{req.section}</p>
                                        </div>
                                        <div className="space-y-0.5 pt-1 border-t border-slate-200/50 text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                                                <Hash className="h-2.5 w-2.5" /> Roll
                                            </p>
                                            <p className="text-[11px] font-bold text-slate-700">#{req.rollNumber || 'N/A'}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    disabled={isProcessing}
                                    onClick={() => {
                                        console.log('Approve clicked for request:', req.id);
                                        onApprove(req.id);
                                    }}
                                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-xs font-black gap-2 shadow-lg shadow-emerald-200 rounded-xl"
                                >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    APPROVE
                                </Button>
                                <Button
                                    disabled={isProcessing}
                                    onClick={() => {
                                        console.log('Reject clicked for request:', req.id);
                                        onReject(req.id);
                                    }}
                                    variant="outline"
                                    className="flex-1 h-11 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-black gap-2 rounded-xl"
                                >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    REJECT
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
