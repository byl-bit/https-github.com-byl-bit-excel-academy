'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader } from "@/components/ui/glass-card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, Save, User as UserIcon, Mail, Briefcase, Key, Edit2, X, Check } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function TeacherProfilePage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const { success, error: notifyError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [newPhoto, setNewPhoto] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile editing state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: ''
    });

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login');
        } else if (!loading && user?.role !== 'teacher') {
            router.push('/');
        } else if (user?.photo) {
            setPhotoPreview(user.photo);
        }
        if (user) {
            setProfileData({
                name: user.name || user.fullName || '',
                email: user.email || ''
            });
        }
    }, [isAuthenticated, user, loading, router]);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Photo size must be less than 5MB' });
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select a valid image file' });
                return;
            }

            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setNewPhoto(base64String);
                setPhotoPreview(base64String);
                setMessage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePhoto = async () => {
        if (!newPhoto || !user) {
            setMessage({ type: 'error', text: 'No photo selected' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-actor-role': 'teacher', 'x-actor-id': user.id },
                body: JSON.stringify({ id: user.id, photo: newPhoto })
            });

            if (res.ok) {
                // Update local storage
                try {
                    const currentUser = JSON.parse(localStorage.getItem('excel_academy_current_user') || '{}');
                    currentUser.photo = newPhoto;
                    localStorage.setItem('excel_academy_current_user', JSON.stringify(currentUser));
                } catch (e) {
                    console.warn('Quota exceeded when saving photo to localStorage, skipping photo persistence:', e);
                }

                setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
                setNewPhoto('');

                // Reload page to refresh user context
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage({ type: 'error', text: 'Failed to update photo. Please try again.' });
            }
        } catch (error) {
            console.error('Error updating photo:', error);
            setMessage({ type: 'error', text: 'An error occurred while updating your photo.' });
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!user) return;

        if (!confirm('Are you sure you want to remove your profile photo?')) return;

        setSaving(true);
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-actor-role': 'teacher', 'x-actor-id': user.id },
                body: JSON.stringify({ id: user.id, photo: '' })
            });

            if (res.ok) {
                try {
                    const currentUser = JSON.parse(localStorage.getItem('excel_academy_current_user') || '{}');
                    currentUser.photo = '';
                    localStorage.setItem('excel_academy_current_user', JSON.stringify(currentUser));
                } catch (e) { /* Ignore */ }

                setPhotoPreview('');
                setNewPhoto('');
                setMessage({ type: 'success', text: 'Profile photo removed successfully!' });

                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage({ type: 'error', text: 'Failed to remove photo.' });
            }
        } catch (error) {
            console.error('Error removing photo:', error);
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-actor-role': 'teacher', 'x-actor-id': user.id },
                body: JSON.stringify({
                    id: user.id,
                    email: profileData.email
                })
            });

            if (res.ok) {
                try {
                    const currentUser = JSON.parse(localStorage.getItem('excel_academy_current_user') || '{}');
                    currentUser.email = profileData.email;
                    localStorage.setItem('excel_academy_current_user', JSON.stringify(currentUser));
                } catch (e) { /* Ignore */ }

                success('Profile updated successfully!');
                setIsEditingProfile(false);
                setTimeout(() => window.location.reload(), 1000);
            } else {
                notifyError('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            notifyError('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            notifyError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            notifyError('Password must be at least 6 characters');
            return;
        }

        try {
            const idCandidate = user.teacherId || user.email || '';
            const verifyRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: idCandidate, password: passwordData.currentPassword })
            });

            if (!verifyRes.ok) {
                notifyError('Current password is incorrect');
                return;
            }

            setSaving(true);
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-actor-role': 'teacher',
                    'x-actor-id': user.id
                },
                body: JSON.stringify({
                    id: user.id,
                    password: passwordData.newPassword
                })
            });

            if (res.ok) {
                success('Password changed successfully!');
                setShowPasswordChange(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                notifyError('Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            notifyError('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-4">
                <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Identity...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
            {/* Header Section */}
            <div className="glass-panel p-8 sm:p-10 relative overflow-hidden group rounded-4xl">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-600/5 via-transparent to-purple-600/5 opacity-50"></div>
                <div className="absolute -right-10 -top-10 h-40 w-40 bg-indigo-400 blur-[80px] opacity-10 group-hover:opacity-20 transition-all duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group/avatar">
                        <div className="w-32 h-32 rounded-4xl border-4 border-white shadow-xl overflow-hidden bg-slate-100 group-hover:scale-105 transition-transform duration-500">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
                                    <UserIcon className="h-16 w-16 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg cursor-pointer hover:bg-indigo-700 hover:scale-110 active:scale-90 transition-all">
                            <Camera className="h-5 w-5" />
                            <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black tracking-tight text-slate-800">
                            Faculty <span className="text-indigo-600">Identity</span>
                        </h1>
                        <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Teacher Portal • Profile & Security
                        </p>
                    </div>

                    <div className="ml-auto flex flex-col gap-2">
                        <Button variant="ghost" onClick={() => router.push('/teacher')} className="rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            Back to Overview
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-5">
                {/* Photo Actions - Side Column */}
                <div className="md:col-span-2 space-y-8">
                    {(newPhoto || photoPreview) && (
                        <div className="glass-panel p-6 space-y-4 rounded-4xl">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Upload className="h-3 w-3" /> Image Controls
                            </h3>

                            {newPhoto && (
                                <Button
                                    onClick={handleSavePhoto}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 font-black rounded-2xl transition-all hover:scale-102 active:scale-95"
                                    disabled={saving}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Processing...' : 'Deploy New Photo'}
                                </Button>
                            )}

                            {photoPreview && !newPhoto && (
                                <Button
                                    variant="ghost"
                                    onClick={handleRemovePhoto}
                                    className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-50 font-black rounded-2xl transition-all"
                                    disabled={saving}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Purge Profile Photo
                                </Button>
                            )}

                            <p className="text-[9px] text-slate-400 text-center font-bold tracking-tight px-4 leading-relaxed">
                                Professional faculty photos must be clear and under 5MB. Formats: JPG, PNG, GIF.
                            </p>
                        </div>
                    )}

                    {message && (
                        <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-bounce shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="glass-panel p-8 space-y-6 rounded-4xl">
                        <div className="text-center space-y-2">
                            <div className="h-16 w-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                <Briefcase className="h-8 w-8 text-indigo-600" />
                            </div>
                            <h4 className="text-xl font-black text-slate-800">Faculty Badge</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Teacher ID</p>
                        </div>

                        <div className="pt-4 space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Homeroom Grade</span>
                                <span className="text-xl font-black text-slate-800">{user.grade || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Homeroom Section</span>
                                <span className="text-xl font-black text-slate-800">{user.section || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Data - Content Column */}
                <div className="md:col-span-3 space-y-8">
                    <Card className="border-none shadow-sm bg-white/40 overflow-hidden">
                        <CardHeader
                            title="Faculty Records"
                            description="Core demographic data"
                            icon={UserIcon}
                        >
                            {!isEditingProfile && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingProfile(true)}
                                    className="h-10 px-5 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 rounded-2xl"
                                >
                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                    Modify Records
                                </Button>
                            )}
                        </CardHeader>

                        <div className="p-8 space-y-6 pt-2">
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                                <div className="flex items-center gap-4 p-4 bg-slate-100/50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                                    <UserIcon className="h-5 w-5 text-slate-300" />
                                    <span className="font-black text-slate-800 text-lg leading-none">{user.name || user.fullName}</span>
                                    <span className="ml-auto text-[10px] bg-white px-3 py-1.5 rounded-xl text-slate-400 font-black border border-slate-100">READ ONLY</span>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Identifier (Staff ID)</Label>
                                <div className="flex items-center gap-4 p-4 bg-slate-100/50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                                    <Briefcase className="h-5 w-5 text-slate-300" />
                                    <span className="font-black text-slate-800 text-lg font-mono tracking-tighter">{user.teacherId}</span>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</Label>
                                {isEditingProfile ? (
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                                        <Input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full h-14 pl-12 rounded-3xl border-slate-200 focus:border-indigo-500 font-bold bg-white"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 bg-slate-100/50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <Mail className="h-5 w-5 text-slate-300" />
                                        <span className="font-bold text-slate-700">{user.email || 'No email set'}</span>
                                    </div>
                                )}
                            </div>

                            {isEditingProfile && (
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Update Data
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsEditingProfile(false);
                                            setProfileData({
                                                name: user.name || user.fullName || '',
                                                email: user.email || ''
                                            });
                                        }}
                                        disabled={saving}
                                        className="flex-1 h-12 text-slate-400 font-black rounded-2xl"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Revert
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm bg-white/40 overflow-hidden">
                        <CardHeader
                            title="Security Vault"
                            description="Authentication Management"
                            icon={Key}
                        />
                        <div className="p-8 pt-2">
                            {!showPasswordChange ? (
                                <Button
                                    onClick={() => setShowPasswordChange(true)}
                                    className="w-full h-14 glass-panel bg-white/80 hover:bg-white hover:shadow-lg text-indigo-600 font-black rounded-3xl transition-all flex items-center justify-between px-8 border-transparent hover:border-indigo-100 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rotate-12 group-hover:rotate-0 transition-transform bg-indigo-50 rounded-xl flex items-center justify-center">
                                            <Key className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <span className="uppercase text-[11px] tracking-widest">Update Security Credentials</span>
                                    </div>
                                    <Check className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Secret</Label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secret</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorize Shift</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
                                            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100"
                                        >
                                            {saving ? 'Encrypting...' : 'Seal Credentials'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowPasswordChange(false)}
                                            className="flex-1 h-12 text-slate-400 font-black rounded-2xl"
                                        >
                                            Abort
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
