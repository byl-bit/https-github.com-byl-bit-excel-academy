import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, User, ShieldAlert, Mail, GraduationCap, Hash, Fingerprint, Loader2 } from "lucide-react";

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

                return (
                    <Card key={req.id} className={`relative overflow-hidden border-none shadow-xl bg-white group hover:scale-[1.02] transition-all duration-300 ${isProcessing ? 'opacity-70' : ''}`}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />

                        <CardHeader className="pb-3 border-b border-slate-50">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-full">
                                        {isProcessing ? 'Processing...' : 'Pending Approval'}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(req.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <CardTitle className="text-xl font-black text-slate-800 tracking-tight">{req.userName}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 capitalize font-bold text-indigo-600">
                                <User className="h-3.5 w-3.5" />
                                {req.userRole}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-5 space-y-4">
                            {/* Core Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Fingerprint className="h-3 w-3" /> User ID
                                    </p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{req.userId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> Email Address
                                    </p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{req.email || 'N/A'}</p>
                                </div>
                                {req.userRole === 'student' && (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <GraduationCap className="h-3 w-3" /> Class
                                            </p>
                                            <p className="text-xs font-bold text-slate-700">{req.grade}-{req.section}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Hash className="h-3 w-3" /> Roll Number
                                            </p>
                                            <p className="text-xs font-bold text-slate-700">{req.rollNumber || 'N/A'}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Request Preview */}
                            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">New Password Requested</p>
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-lg text-slate-400 tracking-tighter">••••••••</p>
                                    <div className={`h-2 w-2 rounded-full ${isProcessing ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                                </div>
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
