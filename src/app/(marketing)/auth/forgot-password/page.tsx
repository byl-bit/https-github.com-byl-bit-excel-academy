'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ArrowLeft, Loader2, Info } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
    const [formData, setFormData] = useState({ userId: '', email: '', fullName: '', newPassword: '', grade: '', section: '', rollNumber: '' });
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { success, error: notifyError, info } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // If Student ID format is used require class details
            if (String(formData.userId || '').toUpperCase().startsWith('ST-')) {
                if (!formData.grade || !formData.section || !formData.rollNumber) {
                    notifyError('Students must provide grade, section and roll number for account recovery');
                    setLoading(false);
                    return;
                }
            }

            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: formData.userId,
                    email: formData.email,
                    fullName: formData.fullName,
                    newPassword: formData.newPassword,
                    grade: formData.grade,
                    section: formData.section,
                    rollNumber: formData.rollNumber,
                    isAdminGate: false
                })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.pending) {
                    success(data.message);
                    info('Request Pending: Reach out to your school admin for approval.');
                    router.push('/auth/login');
                } else {
                    success('Password reset successful!');
                    router.push('/auth/login');
                }
            } else {
                notifyError(data.error || 'Verification failed.');
            }
        } catch (err) {
            notifyError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
            <Card className="w-full max-w-md shadow-2xl border-2">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center">
                        <div className="p-3 bg-blue-50 rounded-full">
                            <KeyRound className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black">Account Recovery</CardTitle>
                    <CardDescription>
                        Reset your student or teacher portal password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex gap-3 text-amber-800">
                        <Info className="h-5 w-5 shrink-0" />
                        <p className="text-xs font-medium">
                            Enter your <strong>System Email</strong>, <strong>ID</strong>, and <strong>Full Name</strong> to verify your identity.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="userId">Student or Teacher ID</Label>
                            <Input
                                id="userId"
                                value={formData.userId}
                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                placeholder="ST-2025-XXXX or TE-2025-XXXX"
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">System Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="e.g. john@excel.edu"
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Registered Full Name</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Enter your full name"
                                required
                                className="h-11"
                            />
                        </div>

                        {/* Student-specific verification fields */}
                        <div className="text-xs text-muted-foreground">If you are a student, provide your class details below (required for students)</div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="grade">Grade</Label>
                                <Input
                                    id="grade"
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                    placeholder="e.g. 10"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="section">Section</Label>
                                <Input
                                    id="section"
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                    placeholder="e.g. A"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rollNumber">Roll Number</Label>
                                <Input
                                    id="rollNumber"
                                    value={formData.rollNumber}
                                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                    placeholder="e.g. 23"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                placeholder="Enter a secure password"
                                required
                                className="h-11"
                            />
                        </div>
                        <Button type="submit" className="w-full h-11 font-bold text-lg" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset My Password'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t py-4">
                    <Link href="/auth/login" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
