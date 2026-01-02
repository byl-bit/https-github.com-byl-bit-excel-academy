import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, User, ShieldAlert } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface ResetApprovalsProps {
    requests: any[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export function ResetApprovals({ requests, onApprove, onReject }: ResetApprovalsProps) {
    if (requests.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 text-slate-200 mb-4" />
                    <p>No pending password reset requests.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => (
                <Card key={req.id} className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <ShieldAlert className="h-5 w-5 text-amber-600" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(req.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <CardTitle className="text-lg mt-2">{req.userName}</CardTitle>
                        <CardDescription className="flex items-center gap-1 capitalize">
                            <User className="h-3 w-3" />
                            {req.userRole} • ID: {req.userId}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="bg-slate-50 p-3 rounded-lg mb-4">
                            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">New Password Requested</p>
                            <p className="font-mono text-sm text-slate-700">********</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onApprove(req.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-xs font-bold gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                            </Button>
                            <Button
                                onClick={() => onReject(req.id)}
                                variant="outline"
                                className="flex-1 text-red-600 border-red-100 hover:bg-red-50 text-xs font-bold gap-2"
                            >
                                <XCircle className="h-4 w-4" />
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
