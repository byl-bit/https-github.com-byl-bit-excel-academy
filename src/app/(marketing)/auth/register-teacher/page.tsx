"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function RegisterTeacherPage() {
    const { registerTeacher } = useAuth() as any;
    interface FormState { fullName: string; sex: string; grade: string; section: string; password: string; photo?: string; email?: string }
    const [form, setForm] = useState<FormState>({ fullName: '', sex: '', grade: '', section: '', password: '', photo: '', email: '' });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<{ teacherId: string } | null>(null);
    const [error, setError] = useState('');
    const [isClient, setIsClient] = useState(false);

    // Safety check for hydration
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setForm(prev => ({ ...prev, photo: String(reader.result) }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (!form.fullName || !form.sex || !form.password) {
                setError('Please fill all required fields');
                setLoading(false);
                return;
            }
            if (form.password.length < 6) {
                setError('Password must be at least 6 characters long');
                setLoading(false);
                return;
            }

            // Try AuthContext helper if present
            if (typeof registerTeacher === 'function') {
                const res = await registerTeacher(form.fullName, form.sex, '', '', form.password, form.photo || '');
                if (res && res.success && res.teacherId) {
                    setSuccess({ teacherId: res.teacherId });
                    setForm({ fullName: '', sex: '', grade: '', section: '', password: '', photo: '', email: '' });
                    setLoading(false);
                    return;
                } else {
                    setError(res?.message || 'Registration failed. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            // Local fallback: persist pending teacher to API or localStorage
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const teacherId = `TE-${new Date().getFullYear()}-${randomPart}`;
            const newTeacher = {
                id: `teacher-${Date.now()}`,
                name: form.fullName,
                fullName: form.fullName,
                email: form.email || `${teacherId.toLowerCase()}@excel.edu`,
                password: form.password,
                role: 'teacher',
                status: 'pending',
                teacherId,
                grade: '', // No fixed grade
                section: '', // No fixed section
                gender: form.sex, // Store sex as gender field
                sex: form.sex, // Also keep sex for compatibility
                photo: form.photo || '',
                createdAt: new Date().toISOString()
            };

            // Try to POST to /api/users and fall back to localStorage
            try {
                const resp = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTeacher) });
                if (!resp.ok) throw new Error('API rejected');
            } catch (err) {
                // fallback: save to localStorage so admin can see pending users
                try {
                    const users = JSON.parse(localStorage.getItem('excel_academy_users') || '[]');
                    users.push(newTeacher);
                    localStorage.setItem('excel_academy_users', JSON.stringify(users));
                } catch (storeErr) {
                    console.warn('Quota exceeded in registration fallback, stripping photo.', storeErr);
                    try {
                        const users = JSON.parse(localStorage.getItem('excel_academy_users') || '[]');
                        const { photo, ...strippedTeacher } = newTeacher;
                        users.push(strippedTeacher);
                        localStorage.setItem('excel_academy_users', JSON.stringify(users));
                    } catch (finalErr) {
                        console.error('Total storage failure:', finalErr);
                    }
                }
            }

            setSuccess({ teacherId });
            setForm({ fullName: '', sex: '', grade: '', section: '', password: '', photo: '', email: '' });
        } catch (err) {
            console.error(err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <Card className="max-w-lg w-full shadow-2xl border-none glass-panel">
                    <CardHeader className="text-center">
                        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Identity Request Sent</CardTitle>
                        <CardDescription className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mt-2">Your Credentials</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-100 rounded-2xl p-6 text-center mb-6 border border-slate-200 shadow-inner">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Teacher Staff ID</p>
                            <p className="text-3xl font-black text-blue-600 tracking-tighter">{success.teacherId}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-500 text-center mb-8 leading-relaxed">
                            Your application has been received. Our administration team will review and authorize your account shortly. You will be able to log in once your status is set to <span className="text-emerald-600 font-black">ACTIVE</span>.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button asChild className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200">
                                <Link href="/auth/login">Continue to Login</Link>
                            </Button>
                            <Button variant="outline" asChild className="h-12 rounded-xl border-slate-200 font-black uppercase text-xs tracking-widest hover:bg-slate-50">
                                <Link href="/">Return Home</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
            <Card className="max-w-3xl w-full border-none shadow-2xl glass-panel overflow-hidden">
                <div className="h-2 bg-linear-to-r from-blue-600 to-indigo-600" />
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Teacher Enrollment</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Request secure access to the faculty portal</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    {!isClient ? (
                        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
                            <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Secure Form...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid gap-6" suppressHydrationWarning>
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-shake">
                                    <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Full Name</Label>
                                    <Input id="fullName" value={form.fullName} onChange={handleChange} required placeholder="e.g. John Doe" className="h-12 rounded-xl border-slate-200 focus:ring-blue-600/20 focus:border-blue-600 font-bold" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Institutional Email (Optional)</Label>
                                    <Input id="email" type="email" value={form.email} onChange={handleChange} placeholder="teacher@excel.edu" className="h-12 rounded-xl border-slate-200 focus:ring-blue-600/20 focus:border-blue-600 font-bold" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="sex" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender Identity</Label>
                                    <select
                                        id="sex"
                                        className="w-full h-12 rounded-xl border border-slate-200 p-2 px-4 font-bold focus:ring-blue-600/20 focus:border-blue-600 bg-white transition-all appearance-none outline-none"
                                        value={form.sex}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Security Password</Label>
                                    <Input id="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min 6 characters" className="h-12 rounded-xl border-slate-200 focus:ring-blue-600/20 focus:border-blue-600 font-bold" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <Label htmlFor="photo" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Faculty Identification Photo</Label>
                                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 group hover:border-blue-400 transition-colors cursor-pointer" onClick={() => document.getElementById('photo')?.click()}>
                                    <input id="photo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    {form.photo ? (
                                        <div className="relative">
                                            <img src={form.photo} alt="Preview" className="h-28 w-28 object-cover rounded-2xl border-4 border-white shadow-xl" />
                                            <div className="absolute -right-2 -bottom-2 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-28 w-28 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors shadow-sm">
                                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex-1 text-center md:text-left">
                                        <p className="font-black text-slate-700 uppercase text-xs tracking-tight mb-1">Upload Profile Image</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG or GIF. Maximum 5MB.</p>
                                    </div>
                                    <Button type="button" variant="outline" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200">Choose File</Button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <Button type="submit" className="h-14 flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 transform active:scale-95 transition-all" disabled={loading}>
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing Request...</span>
                                        </div>
                                    ) : 'Submit Identity Request'}
                                </Button>
                                <Button variant="ghost" asChild className="h-14 px-8 rounded-xl font-bold text-slate-500 hover:bg-slate-100">
                                    <Link href="/auth/login">I have an account</Link>
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
