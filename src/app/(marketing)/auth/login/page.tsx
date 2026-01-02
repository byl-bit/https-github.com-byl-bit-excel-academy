'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { AlertCircle, GraduationCap, Briefcase, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    // Fix hydration mismatch by delaying interactive mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loginId = role === 'teacher' ? teacherId : email;
            if (role === 'teacher' && !teacherId) {
                setError('Please enter your Teacher ID');
                setLoading(false);
                return;
            }

            const result = await login(loginId, password);
            if (result.success) {
                if (result.user?.role === 'admin') {
                    router.push('/admin');
                } else if (result.user?.role === 'student') {
                    router.push('/student');
                } else if (result.user?.role === 'teacher') {
                    router.push('/teacher');
                } else {
                    router.push('/');
                }
            } else {
                setError(result.message || 'Failed to login');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto flex items-start sm:items-center justify-center min-h-[calc(100vh-4rem)] px-3 sm:px-4 py-8 sm:py-6 md:py-8">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl w-full items-center">
                {/* Illustration Side */}
                <div className="hidden md:flex flex-col items-center justify-center p-6 lg:p-8">
                    <div className="relative w-full h-80 lg:h-96">
                        <img
                            src="/login-illustration.png"
                            alt="Login Illustration"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h2 className="text-xl lg:text-2xl font-bold mt-4 lg:mt-6 text-center">Welcome Back!</h2>
                    <p className="text-muted-foreground text-center mt-2 text-sm lg:text-base">
                        {role === 'admin'
                            ? 'Administrator Portal - Manage institutional data and users'
                            : role === 'teacher'
                                ? 'Teacher Portal - Manage class results and student performance'
                                : 'Access your student portal and track your academic progress'}
                    </p>
                </div>

                {/* Login Form Side */}
                <Card className="w-full bg-background/80 backdrop-blur-lg border-2 shadow-xl overflow-hidden glass-panel border-none">
                    <CardHeader className="space-y-1 bg-muted/30 pb-4 sm:pb-6 border-b px-4 sm:px-6 pt-4 sm:pt-6">
                        <CardTitle className="text-xl sm:text-2xl font-black text-center uppercase tracking-tighter">
                            Excel Academy Login
                        </CardTitle>
                        <CardDescription className="text-center font-medium text-xs sm:text-sm">
                            {role === 'admin' ? 'Administrative Access' : role === 'teacher' ? 'Faculty Member' : 'Student Access'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                        {!isClient ? (
                            <div className="h-[300px] flex flex-col items-center justify-center space-y-4">
                                <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waking up security core...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" suppressHydrationWarning>
                                {error && (
                                    <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="font-black uppercase text-[10px] tracking-widest">Identity Error</AlertTitle>
                                        <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2 sm:space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Portal Selector</Label>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setRole('student')}
                                            className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all gap-1 touch-manipulation min-h-[70px] sm:min-h-[80px] ${role === 'student'
                                                ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100'
                                                : 'border-slate-100 bg-white hover:bg-slate-50'
                                                }`}
                                        >
                                            <GraduationCap className={`h-5 w-5 sm:h-6 sm:w-6 ${role === 'student' ? 'text-blue-600' : 'text-slate-400'}`} />
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">Student</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('teacher')}
                                            className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all gap-1 touch-manipulation min-h-[70px] sm:min-h-[80px] ${role === 'teacher'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100'
                                                : 'border-slate-100 bg-white hover:bg-slate-50'
                                                }`}
                                        >
                                            <Briefcase className={`h-5 w-5 sm:h-6 sm:w-6 ${role === 'teacher' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">Teacher</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('admin')}
                                            className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all gap-1 touch-manipulation min-h-[70px] sm:min-h-[80px] ${role === 'admin'
                                                ? 'border-red-600 bg-red-50 text-red-600 shadow-lg shadow-red-100'
                                                : 'border-slate-100 bg-white hover:bg-slate-50'
                                                }`}
                                        >
                                            <Shield className={`h-5 w-5 sm:h-6 sm:w-6 ${role === 'admin' ? 'text-red-600' : 'text-slate-400'}`} />
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">Admin</span>
                                        </button>
                                    </div>
                                </div>

                                {role === 'teacher' ? (
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="teacherId" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Access ID</Label>
                                        <Input
                                            id="teacherId"
                                            type="text"
                                            placeholder="TE-XXXX-XXXX"
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                            value={teacherId}
                                            onChange={(e) => setTeacherId(e.target.value)}
                                            required
                                            autoComplete="username"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                            {role === 'admin' ? 'Institutional Email' : 'Student Identity (ID or Email)'}
                                        </Label>
                                        <Input
                                            id="email"
                                            type={role === 'admin' ? 'email' : 'text'}
                                            placeholder={role === 'admin' ? 'Administrator Email' : 'ST-XXXX-XXXX'}
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5 sm:space-y-2">
                                    <div className="flex justify-between items-center mr-1">
                                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Security Key</Label>
                                        {role !== 'admin' && (
                                            <Link
                                                href="/auth/forgot-password"
                                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                            >
                                                Reset Key?
                                            </Link>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-12 border-slate-200 rounded-xl font-bold"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 rounded-xl bg-blue-600 hover:bg-blue-700 transform active:scale-95 transition-all mt-4"
                                    disabled={loading}
                                >
                                    {loading ? 'Authorizing...' : `Enter ${role.toUpperCase()} Space`}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3 sm:space-y-4 pt-0 px-4 sm:px-6 pb-6 sm:pb-8">
                        <div className="text-center space-y-3 w-full">
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px bg-slate-100 flex-1" />
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Account Recovery</span>
                                <div className="h-px bg-slate-100 flex-1" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <Link href="/auth/register" className="h-10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-50">
                                    Student Signup
                                </Link>
                                <Link href="/auth/register-teacher" className="h-10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-slate-50">
                                    Teacher Signup
                                </Link>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">New Prospective Student?</p>
                                <Link href="/admissions/apply" className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                    <GraduationCap className="h-3.5 w-3.5" /> Start Admission Application
                                </Link>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
