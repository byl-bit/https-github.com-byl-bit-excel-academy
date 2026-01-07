'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, GraduationCap, User, Lock, BookOpen, Camera, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        password: '',
        confirmPassword: '',
        grade: '',
        section: '',
        rollNumber: '',
        photo: ''
    });
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<{ studentId: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [isClient, setIsClient] = useState(false);
    const { register } = useAuth();

    // Fix hydration mismatch
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Photo size must be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData({ ...formData, photo: base64String });
                setPhotoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate all mandatory fields
        if (!formData.firstName.trim()) {
            setError('First Name is required');
            setLoading(false);
            return;
        }
        if (!formData.middleName.trim()) {
            setError('Middle Name is required');
            setLoading(false);
            return;
        }
        if (!formData.lastName.trim()) {
            setError('Last Name is required');
            setLoading(false);
            return;
        }
        if (!formData.gender) {
            setError('Gender is required');
            setLoading(false);
            return;
        }
        if (!formData.grade) {
            setError('Grade is required');
            setLoading(false);
            return;
        }
        if (!formData.section) {
            setError('Section is required');
            setLoading(false);
            return;
        }
        if (!formData.rollNumber.trim()) {
            setError('Class Roll Number is required');
            setLoading(false);
            return;
        }

        const rollNum = parseInt(formData.rollNumber);
        if (isNaN(rollNum) || rollNum < 1 || rollNum > 100) {
            setError('Roll Number must be between 1 and 100');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const result = await register(
                formData.firstName,
                formData.middleName,
                formData.lastName,
                formData.password,
                formData.grade,
                formData.section,
                formData.photo,
                formData.gender,
                formData.rollNumber
            );

            if (result.success && result.studentId) {
                setSuccessData({ studentId: result.studentId });
                setFormData({ firstName: '', middleName: '', lastName: '', gender: '', password: '', confirmPassword: '', grade: '', section: '', rollNumber: '', photo: '' });
                setPhotoPreview('');
            } else {
                setError(result.message || 'Application failed');
            }
        } catch (err) {
            setError('An error occurred during application submission');
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 relative z-10">
                <Card className="w-full max-w-2xl bg-white/98 shadow-2xl border-none glass-panel animate-slide-in-up">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <div className="rounded-full bg-emerald-100 p-5 shadow-lg text-emerald-600">
                                <CheckCircle className="h-16 w-16" />
                            </div>
                        </div>
                        <CardTitle className="text-center text-3xl font-black text-slate-800 uppercase tracking-tighter">
                            Identity Authorized
                        </CardTitle>
                        <CardDescription className="text-center text-sm text-slate-500 mt-2 font-bold uppercase tracking-widest">
                            Welcome to the student body of Excel Academy
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-inner">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 text-center">Your Unique Student ID</p>
                            <p className="text-4xl font-black text-center text-blue-600 tracking-tighter">
                                {successData.studentId}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase tracking-widest leading-relaxed">Please record this ID securely. It is your primary <br /> identity for all institutional services.</p>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-black text-slate-700 mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
                                Deployment Protocol:
                            </h3>
                            <ul className="text-xs text-slate-500 space-y-2 list-none font-bold uppercase tracking-wider">
                                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Account is currently pending authorization</li>
                                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Admin will review your credentials</li>
                                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Access will be granted within 24 hours</li>
                            </ul>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 pt-4">
                            <Button asChild className="flex-1 h-14 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100">
                                <Link href="/auth/login">Proceed to Login →</Link>
                            </Button>
                            <Button asChild variant="outline" className="flex-1 h-14 rounded-xl border-slate-200 font-black uppercase text-xs tracking-widest hover:bg-slate-50">
                                <Link href="/">Back to Home</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto flex items-start sm:items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 relative z-10">
            <Card className="w-full max-w-3xl bg-white border-none shadow-2xl overflow-hidden glass-panel">
                <div className="h-2 bg-linear-to-r from-blue-600 to-indigo-600" />
                <CardHeader className="text-center pb-8 p-10 bg-slate-50/30">
                    <div className="flex justify-center mb-6">
                        <div className="rounded-2xl bg-white p-5 shadow-xl border border-slate-50 transform hover:scale-105 transition-transform">
                            <GraduationCap className="h-12 w-12 text-blue-600" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
                        Student Onboarding
                    </CardTitle>
                    <CardDescription className="text-xs mt-3 text-slate-500 font-black uppercase tracking-[0.2em]">
                        Establish your secure academic identity
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-8">
                    {!isClient ? (
                        <div className="h-[500px] flex flex-col items-center justify-center space-y-4">
                            <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing secure modules...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning>
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-shake">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            {/* Personal Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Biometric Information</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="John"
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="middleName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Middle Name</Label>
                                        <Input
                                            id="middleName"
                                            value={formData.middleName}
                                            onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                            placeholder="Quincy"
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="Doe"
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender Identification</Label>
                                        <select
                                            id="gender"
                                            className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select Gender</option>
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Profile Visualization</h3>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-center p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed hover:border-blue-300 transition-colors">
                                    <div className="shrink-0">
                                        <div className="w-32 h-32 rounded-2xl border-2 border-white shadow-xl bg-white flex items-center justify-center overflow-hidden">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="h-10 w-10 text-slate-200" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 text-center md:text-left w-full">
                                        <div>
                                            <h4 className="font-black text-slate-700 uppercase text-xs tracking-tight mb-1">Standard Passport Photo</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended for identity verification</p>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <Input
                                                id="photo"
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('photo')?.click()}
                                                className="h-10 rounded-xl px-6 border-slate-200 font-black text-[10px] uppercase tracking-widest"
                                            >
                                                <Upload className="mr-2 h-3.5 w-3.5" />
                                                {photoPreview ? 'Modify Photo' : 'Upload Image'}
                                            </Button>
                                            {photoPreview && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setFormData({ ...formData, photo: '' });
                                                        setPhotoPreview('');
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Institutional Designation</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="grade" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Grade</Label>
                                        <select
                                            id="grade"
                                            className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select Grade</option>
                                            {[9, 10, 11, 12].map((g) => (
                                                <option key={g} value={g.toString()}>Grade {g}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="section" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Class Section</Label>
                                        <select
                                            id="section"
                                            className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                                            value={formData.section}
                                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select Section</option>
                                            {['A', 'B', 'C', 'D'].map((s) => (
                                                <option key={s} value={s}>Section {s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rollNumber" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Class Roll Number</Label>
                                    <Input
                                        id="rollNumber"
                                        type="number"
                                        value={formData.rollNumber}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val !== '' && (parseInt(val) > 100)) return;
                                            setFormData({ ...formData, rollNumber: val });
                                        }}
                                        placeholder="Assigned roll number (1-100)"
                                        className="h-12 border-slate-200 rounded-xl font-bold"
                                        required
                                        min="1"
                                        max="100"
                                    />
                                    <div className="flex items-center gap-2 mt-2 ml-1">
                                        <AlertCircle className="h-3 w-3 text-slate-400" />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Must correspond with official school registry records</p>
                                    </div>
                                </div>
                            </div>

                            {/* Account Security Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <Lock className="h-4 w-4 text-blue-600" />
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Security Protocol</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key</Label>
                                        <PasswordInput
                                            id="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Min 6 characters"
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                            required
                                        />
                                        {/* Password Strength Meter */}
                                        {formData.password && (
                                            <div className="space-y-1.5 pt-1">
                                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${formData.password.length < 6 ? 'bg-red-500 w-1/3' :
                                                            formData.password.length < 8 ? 'bg-amber-500 w-2/3' :
                                                                'bg-emerald-500 w-full'
                                                            }`}
                                                    />
                                                </div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">
                                                    Security: {formData.password.length < 6 ? 'Poor' : formData.password.length < 8 ? 'Moderate' : 'Optimal'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Validate Security Key</Label>
                                        <PasswordInput
                                            id="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            placeholder="Re-enter security key"
                                            className="h-12 border-slate-200 rounded-xl font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Terms and Submit */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed text-center">
                                        I hereby certify that the information provided is accurate and corresponds to my official academic status at Excel Academy.
                                    </p>
                                </div>

                                <Button type="submit" className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 transform active:scale-95 transition-all" disabled={loading}>
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Authorizing...</span>
                                        </div>
                                    ) : (
                                        'Initialize Secure Account'
                                    )}
                                </Button>

                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Legacy Member?</p>
                                    <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm">
                                        Proceed to Authentication →
                                    </Link>
                                </div>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
