'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Label } from '@/components/ui/label';
import { Shield, Key, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminGateReset() {
    const [formData, setFormData] = useState({ adminId: '', email: '', fullName: '', newPassword: '' });
    const [loading, setLoading] = useState(false);
    const { success, error: notifyError } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: formData.adminId,
                    email: formData.email,
                    fullName: formData.fullName,
                    newPassword: formData.newPassword,
                    isAdminGate: true
                })
            });
            // ... (rest of the handle submit remains same)

            const data = await res.json();
            if (res.ok) {
                success('Admin password reset successfully!');
                router.push('/auth/login');
            } else {
                notifyError(data.error || 'Identity verification failed.');
            }
        } catch (err) {
            notifyError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-3 sm:p-4 md:p-6">
            <div className="max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8">
                <div className="text-center space-y-2 px-2">
                    <div className="inline-block p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-3 sm:mb-4">
                        <Shield className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-blue-500" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                        Private Master Gate
                    </h1>
                    <p className="text-blue-400 text-xs sm:text-sm px-2">Administrative Access Recovery System</p>
                </div>

                <Card className="bg-white border-blue-200 shadow-2xl">
                    <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                        <CardTitle className="text-blue-900 text-lg sm:text-xl">Verify Admin Identity</CardTitle>
                        <CardDescription className="text-blue-400 text-xs sm:text-sm">
                            Enter your credentials to override the password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-blue-300 text-sm sm:text-base">Admin ID</Label>
                                <Input
                                    value={formData.adminId}
                                    onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                                    placeholder="Enter Admin ID"
                                    className="bg-white border-blue-300 text-blue-900 placeholder:text-blue-500 h-11 sm:h-10 text-base sm:text-sm"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-blue-300 text-sm sm:text-base">System Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Administrator Email"
                                    className="bg-white border-blue-300 text-blue-900 placeholder:text-blue-500 h-11 sm:h-10 text-base sm:text-sm"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-blue-300 text-sm sm:text-base">Full Name</Label>
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Enter Full Name"
                                    className="bg-white border-blue-300 text-blue-900 placeholder:text-blue-500 h-11 sm:h-10 text-base sm:text-sm"
                                    required
                                    autoComplete="name"
                                />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2 pt-3 sm:pt-4 border-t border-slate-800">
                                <Label className="text-blue-300 text-sm sm:text-base">Set New Password</Label>
                                <PasswordInput
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    placeholder="Enter new password"
                                    className="bg-white border-blue-300 text-blue-900 placeholder:text-blue-500 h-11 sm:h-10 text-base sm:text-sm"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-12 sm:h-11 font-bold text-base sm:text-sm mt-4 sm:mt-2 touch-manipulation"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5 sm:h-4 sm:w-4" />
                                ) : (
                                    'Override Password'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                        <Link
                            href="/auth/login"
                            className="text-blue-500 hover:text-blue-300 active:text-blue-200 text-xs sm:text-sm flex items-center transition-colors touch-manipulation py-2 -ml-2 pl-2 pr-2 rounded"
                        >
                            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Back to Dashboard
                        </Link>
                    </CardFooter>
                </Card>

                <div className="text-center px-2">
                    <p className="text-[9px] sm:text-[10px] text-blue-600 uppercase tracking-widest font-black leading-relaxed">
                        Authorized Personnel Only • Secure Hyperlink
                    </p>
                </div>
            </div>
        </div>
    );
}
