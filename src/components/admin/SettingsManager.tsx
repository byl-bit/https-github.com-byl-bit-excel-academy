'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, RefreshCw, Plus, Trash2, Lock, Download, Award, Users } from "lucide-react";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';

interface SettingsManagerProps {
    maintenanceMode: boolean;
    onToggleMaintenance: () => void;
    subjects: string[];
    onAddSubject: (s: string) => void;
    onDeleteSubject: (s: string) => void;
    onResetSystem: () => void;
    onChangeAdminPassword: (pass: string) => void;
    settings: any;
    onUpdateSettings: (key: string, value: any) => void;
}

export function SettingsManager({
    maintenanceMode,
    onToggleMaintenance,
    subjects,
    onAddSubject,
    onDeleteSubject,
    onResetSystem,
    onChangeAdminPassword,
    settings,
    onUpdateSettings
}: SettingsManagerProps) {
    const [newSubject, setNewSubject] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mediaList, setMediaList] = useState<Array<{ name: string; url: string }>>([]);

    // Dialog States
    const [confirmAction, setConfirmAction] = useState<{ open: boolean; onConfirm: () => void; title: string; description: string; variant: 'default' | 'destructive' }>({ open: false, onConfirm: () => { }, title: '', description: '', variant: 'default' });
    const [alert, setAlert] = useState<{ open: boolean; title: string; description: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', description: '', variant: 'info' });

    useEffect(() => {
        // Fetch media list on mount
        (async () => {
            try {
                const res = await fetch('/api/media/list');
                if (res.ok) {
                    const json = await res.json();
                    setMediaList(json || []);
                    // Populate select
                    const sel = document.getElementById('media-select') as HTMLSelectElement | null;
                    if (sel) {
                        sel.innerHTML = '<option value="">-- Select uploaded letterhead --</option>';
                        (json || []).forEach((it: any) => {
                            const opt = document.createElement('option');
                            opt.value = it.url;
                            opt.text = it.name;
                            sel.appendChild(opt);
                        });
                        if (settings?.letterheadUrl) sel.value = String(settings.letterheadUrl);
                    }
                }
            } catch (err) {
                // ignore
            }
        })();
    }, []);

    const handlePasswordChange = async () => {
        if (adminPassword !== confirmPassword) {
            setAlert({ open: true, title: 'Validation Error', description: 'Passwords do not match.', variant: 'error' });
            return;
        }
        if (adminPassword.length < 6) {
            setAlert({ open: true, title: 'Security Requirement', description: 'Password must be at least 6 characters long.', variant: 'error' });
            return;
        }
        try {
            await Promise.resolve(onChangeAdminPassword(adminPassword));
            setAdminPassword('');
            setConfirmPassword('');
            setAlert({ open: true, title: 'Success', description: 'Admin password updated successfully.', variant: 'success' });
        } catch (err) {
            setAlert({ open: true, title: 'Operation Failed', description: 'Failed to change admin password. Please try again.', variant: 'error' });
        }
    };

    const [assessmentForm, setAssessmentForm] = useState({ label: '', weight: 30, maxMarks: 100 });

    const handleAddAssessment = () => {
        const currentTypes = settings?.assessmentTypes || [];
        const newType = {
            id: assessmentForm.label.toLowerCase().replace(/\s+/g, '-'),
            label: assessmentForm.label,
            weight: assessmentForm.weight,
            maxMarks: assessmentForm.maxMarks
        };
        onUpdateSettings('assessmentTypes', [...currentTypes, newType]);
        setAssessmentForm({ label: '', weight: 30, maxMarks: 100 });
    };

    const handleDeleteAssessment = (index: number) => {
        const types = settings?.assessmentTypes || [];
        const typeToDelete = types[index];
        if (!typeToDelete) return;

        setConfirmAction({
            open: true,
            title: 'Delete Assessment Type',
            description: `Are you sure you want to delete "${typeToDelete.label || 'this assessment'}"? This will affect how results are calculated for all students.`,
            variant: 'destructive',
            onConfirm: () => {
                const updatedTypes = types.filter((_: any, i: number) => i !== index);
                onUpdateSettings('assessmentTypes', updatedTypes);
                setConfirmAction(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleDeleteAllAssessments = () => {
        setConfirmAction({
            open: true,
            title: 'Delete All Assessments',
            description: 'CRITICAL: Are you sure you want to delete ALL assessment types? This will clear all grading structures for all students.',
            variant: 'destructive',
            onConfirm: () => {
                onUpdateSettings('assessmentTypes', []);
                setConfirmAction(prev => ({ ...prev, open: false }));
            }
        });
    };

    return (
        <div className="grid gap-8 md:grid-cols-2">
            {/* Subject Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-600" />
                        Curriculum Subjects
                    </CardTitle>
                    <CardDescription>Manage subjects used across the system.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            id="curriculum-subject-input"
                            name="curriculum-subject-input"
                            autoComplete="off"
                            placeholder="New subject name..."
                            value={newSubject}
                            onChange={e => setNewSubject(e.target.value)}
                        />
                        <Button onClick={() => { if (newSubject) onAddSubject(newSubject); setNewSubject(''); }}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {subjects.map(s => (
                            <div key={s} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-sm group">
                                {s}
                                <button className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDeleteSubject(s)}>
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Assessment Configuration */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-purple-600" />
                            Assessment Types
                        </CardTitle>
                        {(settings?.assessmentTypes || []).length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 h-8"
                                onClick={handleDeleteAllAssessments}
                            >
                                <Trash2 className="h-3 w-3" />
                                Clear All
                            </Button>
                        )}
                    </div>
                    <CardDescription>Define assessments and their weights (Total should be 100%).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input
                                placeholder="e.g. Midterm"
                                value={assessmentForm.label}
                                onChange={e => setAssessmentForm({ ...assessmentForm, label: e.target.value })}
                            />
                        </div>
                        <div className="w-20 space-y-1">
                            <Label className="text-xs">Weight %</Label>
                            <Input
                                type="number"
                                value={assessmentForm.weight}
                                onChange={e => setAssessmentForm({ ...assessmentForm, weight: Number(e.target.value) })}
                            />
                        </div>
                        <div className="w-20 space-y-1">
                            <Label className="text-xs">Max Marks</Label>
                            <Input
                                type="number"
                                value={assessmentForm.maxMarks}
                                onChange={e => setAssessmentForm({ ...assessmentForm, maxMarks: Number(e.target.value) })}
                            />
                        </div>
                        <Button onClick={handleAddAssessment} disabled={!assessmentForm.label}>Add</Button>
                    </div>

                    <div className="space-y-2 pt-2">
                        {(settings?.assessmentTypes || []).map((type: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border text-sm">
                                <div className="flex-1 flex items-center gap-2">
                                    <Input
                                        className="h-8 flex-1 font-semibold"
                                        value={type.label}
                                        onChange={(e) => {
                                            const updated = [...(settings?.assessmentTypes || [])];
                                            updated[idx] = { ...updated[idx], label: e.target.value };
                                            onUpdateSettings('assessmentTypes', updated);
                                        }}
                                        placeholder="Label"
                                    />
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            className="h-8 w-16 text-center"
                                            value={type.weight}
                                            onChange={(e) => {
                                                const updated = [...(settings?.assessmentTypes || [])];
                                                updated[idx] = { ...updated[idx], weight: Number(e.target.value) };
                                                onUpdateSettings('assessmentTypes', updated);
                                            }}
                                            placeholder="%"
                                        />
                                        <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            className="h-8 w-16 text-center"
                                            value={type.maxMarks}
                                            onChange={(e) => {
                                                const updated = [...(settings?.assessmentTypes || [])];
                                                updated[idx] = { ...updated[idx], maxMarks: Number(e.target.value) };
                                                onUpdateSettings('assessmentTypes', updated);
                                            }}
                                            placeholder="Max"
                                        />
                                        <span className="text-xs text-muted-foreground">max</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    onClick={() => handleDeleteAssessment(idx)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {(settings?.assessmentTypes || []).length > 0 && (
                            <div className="text-xs text-right font-medium text-slate-500">
                                Total Weight: {(settings?.assessmentTypes || []).reduce((acc: number, curr: any) => acc + (curr.weight || 0), 0)}%
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Student Feature Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-indigo-600" />
                        Student Features
                    </CardTitle>
                    <CardDescription>Control what features students can access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Report Card Download</Label>
                            <p className="text-xs text-muted-foreground">Allow students to download PDFs</p>
                        </div>
                        <Switch
                            checked={settings?.reportCardDownload !== false}
                            onCheckedChange={(checked: boolean) => onUpdateSettings('reportCardDownload', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Certificate Download</Label>
                            <p className="text-xs text-muted-foreground">For students with 90%+ average</p>
                        </div>
                        <Switch
                            checked={settings?.certificateDownload !== false}
                            onCheckedChange={(checked: boolean) => onUpdateSettings('certificateDownload', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Report Card Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-slate-600" />
                        Report Card Settings
                    </CardTitle>
                    <CardDescription>Configure letterhead and signature names shown on generated report cards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Letterhead URL</Label>
                        <Input
                            placeholder="https://.../letterhead.png"
                            value={settings?.letterheadUrl || ''}
                            onChange={(e) => onUpdateSettings('letterheadUrl', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <input type="file" accept="image/*" id="letterhead-file-input" className="hidden" onChange={async (e) => {
                                const f = (e.target as HTMLInputElement).files?.[0];
                                if (!f) return;
                                try {
                                    const formData = new FormData();
                                    formData.append('file', f);
                                    formData.append('fileName', f.name);
                                    formData.append('bucket', 'letterheads');

                                    const res = await fetch('/api/media/upload', {
                                        method: 'POST',
                                        body: formData
                                    });

                                    const json = await res.json();
                                    if (res.ok && json.url) {
                                        onUpdateSettings('letterheadUrl', json.url);
                                    } else {
                                        setAlert({ open: true, title: 'Upload Failed', description: json.error || 'The letterhead image could not be uploaded.', variant: 'error' });
                                    }
                                } catch (err: any) {
                                    setAlert({ open: true, title: 'Upload Error', description: err.message || 'An unexpected error occurred during letterhead upload.', variant: 'error' });
                                }
                            }} />
                            <Button variant="outline" onClick={() => document.getElementById('letterhead-file-input')?.click()}>Upload File</Button>
                            {settings?.letterheadUrl && (
                                <img src={String(settings.letterheadUrl)} alt="letterhead" className="h-12 w-auto rounded-md border" />
                            )}
                        </div>

                        <div className="mt-2">
                            <Label>Media Library</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <select id="media-select" className="rounded-xl border-slate-200 h-10 px-3" defaultValue="" onChange={(e) => onUpdateSettings('letterheadUrl', e.target.value)}>
                                    <option value="">-- Select uploaded letterhead --</option>
                                    {/* Rendered options populated by effect */}
                                </select>
                                <Button variant="outline" size="sm" onClick={async () => {
                                    try {
                                        const res = await fetch('/api/media/list');
                                        const json = await res.json();
                                        const sel = document.getElementById('media-select') as HTMLSelectElement | null;
                                        if (sel) {
                                            // Clear existing
                                            sel.innerHTML = '<option value="">-- Select uploaded letterhead --</option>';
                                            (json || []).forEach((it: any) => {
                                                const opt = document.createElement('option');
                                                opt.value = it.url;
                                                opt.text = it.name;
                                                sel.appendChild(opt);
                                            });
                                        }
                                    } catch (err) {
                                        setAlert({ open: true, title: 'Library Error', description: 'Failed to fetch the list of uploaded media.', variant: 'error' });
                                    }
                                }}>Refresh</Button>
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Principal Name</Label>
                            <Input value={settings?.principalName || ''} onChange={(e) => onUpdateSettings('principalName', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Homeroom Signatory</Label>
                            <Input value={settings?.homeroomName || ''} onChange={(e) => onUpdateSettings('homeroomName', e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Teacher Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-600" />
                        Teacher Controls
                    </CardTitle>
                    <CardDescription>Configure editing permissions for teachers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Allow Editing After Submission</Label>
                            <p className="text-xs text-muted-foreground">Subject teachers can edit 'Pending Admin' marks</p>
                        </div>
                        <Switch
                            checked={settings?.allowTeacherEditAfterSubmission === true}
                            onCheckedChange={(checked: boolean) => onUpdateSettings('allowTeacherEditAfterSubmission', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Admin Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-amber-600" />
                        Admin Security
                    </CardTitle>
                    <CardDescription>Update your administrative password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <Label>New Password</Label>
                        <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Confirm Password</Label>
                        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                    <Button className="w-full mt-2" onClick={handlePasswordChange}>Change Password</Button>
                    <div className="pt-2">
                        <Link href="/auth/admin-gate-reset" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full">Use Admin Gate Reset</Button>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">Opens the private master gate for emergency administrative override.</p>
                    </div>
                </CardContent>
            </Card>

            {/* System Controls */}
            <Card className="border-red-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                        <ShieldAlert className="h-5 w-5" />
                        System Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-sm">Maintenance Mode</p>
                                <p className="text-xs text-muted-foreground">Students see "Under Construction" page</p>
                            </div>
                            <Button
                                variant={maintenanceMode ? "destructive" : "outline"}
                                size="sm"
                                onClick={onToggleMaintenance}
                            >
                                {maintenanceMode ? 'Disable' : 'Enable'}
                            </Button>
                        </div>
                        <div className={`text-center py-1 px-4 rounded-full text-[10px] font-black uppercase tracking-widest ${maintenanceMode ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                            {maintenanceMode ? 'Maintenance Mode Active' : 'System Status: Online'}
                        </div>
                    </div>

                    <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
                        <h4 className="flex items-center gap-2 text-red-800 font-bold text-sm mb-2">
                            <AlertTriangle className="h-4 w-4" /> Danger Zone
                        </h4>
                        <p className="text-xs text-red-600 mb-4">
                            Resetting the system will permanently delete all students, teachers, results, applications, and announcements.
                        </p>
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => {
                            setConfirmAction({
                                open: true,
                                title: 'System Reset',
                                description: 'CRITICAL: This will permanently delete all students, teachers, results, and other data. This action cannot be undone.',
                                variant: 'destructive',
                                onConfirm: () => {
                                    onResetSystem();
                                    setConfirmAction(prev => ({ ...prev, open: false }));
                                }
                            });
                        }}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Reset Entire System
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={confirmAction.open}
                onClose={() => setConfirmAction({ ...confirmAction, open: false })}
                onConfirm={confirmAction.onConfirm}
                title={confirmAction.title}
                description={confirmAction.description}
                variant={confirmAction.variant}
            />

            <AlertModal
                open={alert.open}
                onClose={() => setAlert({ ...alert, open: false })}
                title={alert.title}
                description={alert.description}
                variant={alert.variant}
            />
        </div>
    );
}
