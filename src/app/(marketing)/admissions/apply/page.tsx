'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Upload, Send, School, User, Phone, MapPin,
    Mail, Calendar, Sparkles, CheckCircle2,
    ChevronRight, ArrowLeft, Info, FileText
} from "lucide-react";
import Link from 'next/link';

export default function AdmissionPage() {
    const [formData, setFormData] = useState({
        studentName: '',
        previousSchool: '',
        age: '',
        gender: '',
        grade: '',
        familyFullName: '',
        phoneNumber: '',
        location: '',
        email: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    fileName: file?.name
                }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert('Failed to submit application. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen py-24 px-4 flex items-center justify-center bg-slate-50">
                <Card className="max-w-xl w-full bg-white shadow-2xl border-none rounded-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-2 bg-linear-to-r from-blue-600 to-indigo-600" />
                    <CardHeader className="text-center pt-12">
                        <div className="mx-auto bg-green-100 p-6 rounded-3xl w-24 h-24 flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-black text-slate-900">Application Received!</CardTitle>
                        <CardDescription className="text-lg text-slate-500 max-w-sm mx-auto mt-4 px-4">
                            Your journey with Excel Academy starts here. We've sent a confirmation email to
                            <span className="font-bold text-blue-600 ml-1">{formData.email}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 pb-12 pt-6">
                        <div className="w-full h-px bg-slate-100 max-w-xs" />
                        <div className="text-center space-y-2">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Next Steps</p>
                            <p className="text-slate-600 px-4">Our admission team will review your data and call you within 24-48 business hours.</p>
                        </div>
                        <Button asChild size="lg" className="rounded-full bg-slate-900 px-10 h-14 font-bold transition-all hover:scale-105 shadow-xl shadow-slate-900/10">
                            <Link href="/">Back to Homepage</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container relative z-10 px-6 py-16 mx-auto max-w-6xl">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-blue-600 font-bold text-sm mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Website
                </Link>

                <div className="grid lg:grid-cols-[1fr_450px] gap-12 items-start">
                    {/* Left Column: Form */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest mb-4">
                                <Sparkles className="w-3 h-3" /> Admissions 2026/27
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                Apply for <span className="text-blue-600">Admission</span>
                            </h1>
                            <p className="text-lg text-slate-500 mt-4 font-light">
                                Start your application today and join a community of achievers.
                                It takes less than 5 minutes.
                            </p>
                        </div>

                        <Card className="border-none shadow-2xl shadow-slate-900/5 rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="bg-slate-950 text-white p-8">
                                <CardTitle className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-blue-400" /> Application Details
                                </CardTitle>
                                <CardDescription className="text-slate-400">Please provide accurate information for processing.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">

                                    {/* Section 1: Academic Background */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 text-blue-600">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-black text-sm">1</div>
                                            <h3 className="font-black uppercase tracking-wider text-xs">Academic Background</h3>
                                            <div className="h-px bg-slate-100 flex-1" />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="previousSchool" className="font-bold text-slate-700">Previous School Name *</Label>
                                                <div className="relative">
                                                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <Input id="previousSchool" placeholder="Last institution attended" required value={formData.previousSchool} onChange={handleChange} className="h-12 pl-11 rounded-xl border-slate-200 focus:ring-blue-500" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="grade" className="font-bold text-slate-700">Admission Grade *</Label>
                                                <select id="grade" className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer" required value={formData.grade} onChange={handleChange}>
                                                    <option value="">Select Grade Level</option>
                                                    {[...Array(12)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Student Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 text-indigo-600">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center font-black text-sm">2</div>
                                            <h3 className="font-black uppercase tracking-wider text-xs">Student Information</h3>
                                            <div className="h-px bg-slate-100 flex-1" />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="studentName" className="font-bold text-slate-700">Student Full Name *</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <Input id="studentName" placeholder="Legal full name" required value={formData.studentName} onChange={handleChange} className="h-12 pl-11 rounded-xl border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="age" className="font-bold text-slate-700">Current Age *</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <Input id="age" type="number" placeholder="Enter age" required value={formData.age} onChange={handleChange} className="h-12 pl-11 rounded-xl border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender" className="font-bold text-slate-700">Gender *</Label>
                                                <select id="gender" className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer" required value={formData.gender} onChange={handleChange}>
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="familyFullName" className="font-bold text-slate-700">Parent/Guardian Name *</Label>
                                                <Input id="familyFullName" placeholder="Full guardian name" required value={formData.familyFullName} onChange={handleChange} className="h-12 rounded-xl border-slate-200" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Contact Details */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 text-purple-600">
                                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center font-black text-sm">3</div>
                                            <h3 className="font-black uppercase tracking-wider text-xs">Contact Details</h3>
                                            <div className="h-px bg-slate-100 flex-1" />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="phoneNumber" className="font-bold text-slate-700">Phone Number *</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <Input id="phoneNumber" type="tel" placeholder="+251 ..." required value={formData.phoneNumber} onChange={handleChange} className="h-12 pl-11 rounded-xl border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="font-bold text-slate-700">Email Address *</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <Input id="email" type="email" placeholder="email@example.com" required value={formData.email} onChange={handleChange} className="h-12 pl-11 rounded-xl border-slate-200" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="location" className="font-bold text-slate-700">Living Address *</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <Input id="location" placeholder="City, Sub-city, House No." required value={formData.location} onChange={handleChange} className="h-12 pl-11 rounded-xl border-slate-200" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents Upload */}
                                    <div className="space-y-4">
                                        <Label className="font-bold text-slate-700">Support Documents (Optional)</Label>
                                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer relative group">
                                            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto group-hover:bg-blue-600 transition-colors">
                                                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-white" />
                                                </div>
                                                <p className="font-bold text-slate-700">Drag & Drop or Click to Upload</p>
                                                <p className="text-sm text-slate-500 italic">Please attach previous report cards or ID proof (Max 10MB)</p>
                                            </div>
                                            {file && (
                                                <div className="mt-4 p-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg inline-flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" /> {file.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95">
                                            {loading ? 'Processing Application...' : 'Submit Final Application'}
                                            {!loading && <Send className="ml-2 w-5 h-5" />}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Info Cards */}
                    <aside className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
                        <div className="bg-white p-8 rounded-4xl shadow-xl shadow-slate-950/5 space-y-6">
                            <h3 className="font-black text-slate-900 border-b border-slate-100 pb-4">Admission Guidelines</h3>
                            <ul className="space-y-4">
                                {[
                                    { title: "Review Period", text: "Most applications are reviewed within 48 hours." },
                                    { title: "Interview", text: "Selected students will be invited for an entrance interview." },
                                    { title: "Documentation", text: "Original documents must be presented during registration." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{item.title}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-linear-to-br from-indigo-900 to-slate-950 p-8 rounded-4xl shadow-2xl text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Info className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold">Need Assistance?</h3>
                                <p className="text-sm text-indigo-100/80 leading-relaxed">
                                    Our support team is available Mon-Fri, 8AM to 5PM to help you with the registration process.
                                </p>
                                <div className="pt-2">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Direct Line</p>
                                    <p className="text-lg font-black">+251 964 324 390</p>
                                </div>
                            </div>
                        </div>

                        <Card className="border-none bg-blue-600 text-white rounded-4xl p-6 text-center">
                            <p className="text-sm font-bold opacity-80 mb-2">Academic Consistency</p>
                            <h4 className="text-2xl font-black">100% Pass Rate</h4>
                            <p className="text-xs opacity-60 mt-2">Verified results for 2024/25</p>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
