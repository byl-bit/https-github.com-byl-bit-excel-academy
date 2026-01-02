'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Send, School, User, Phone, MapPin, Mail, Calendar } from "lucide-react";
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
            <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-transparent">
                <Card className="max-w-md w-full bg-white/95 shadow-2xl border-0 animate-in fade-in zoom-in-95 duration-500">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-blue-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                            <Send className="w-10 h-10 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-blue-700">Application Submitted!</CardTitle>
                        <CardDescription>
                            Thank you for applying to Excel Academy. We have received your details and will contact you shortly at <strong>{formData.email}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-8">
                        <Button asChild variant="outline">
                            <Link href="/">Return to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow-sm mb-2">New Student Admission</h1>
                    <p className="text-muted-foreground">Join the Excel Academy family today. Please fill out the form below.</p>
                </div>

                <Card className="bg-white/95 shadow-2xl border-0 overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-blue-600 to-indigo-600 text-white p-6 md:p-8">
                        <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                            <School className="w-5 h-5 md:w-6 md:h-6" /> Admission Form
                        </CardTitle>
                        <CardDescription className="text-blue-200">
                            Fields marked with (*) are required.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Previous School */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="previousSchool" className="flex items-center gap-2 font-medium">
                                        <School className="w-4 h-4 text-muted-foreground" /> Previous School <span className="text-blue-500">*</span>
                                    </Label>
                                    <Input
                                        id="previousSchool"
                                        placeholder="Name of last school attended"
                                        required
                                        value={formData.previousSchool}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="grade" className="flex items-center gap-2 font-medium">
                                        <School className="w-4 h-4 text-muted-foreground" /> Admission Grade <span className="text-blue-500">*</span>
                                    </Label>
                                    <select
                                        id="grade"
                                        className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        required
                                        value={formData.grade}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Grade</option>
                                        {[9, 10, 11, 12].map(g => (
                                            <option key={g} value={g}>Grade {g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="studentName" className="flex items-center gap-2 font-medium">
                                        <User className="w-4 h-4 text-muted-foreground" /> Student Full Name <span className="text-blue-500">*</span>
                                    </Label>
                                    <Input
                                        id="studentName"
                                        placeholder="Enter student's full name"
                                        required
                                        value={formData.studentName}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="familyFullName" className="flex items-center gap-2 font-medium">
                                        <User className="w-4 h-4 text-muted-foreground" /> Family Full Name <span className="text-blue-500">*</span>
                                    </Label>
                                    <Input
                                        id="familyFullName"
                                        placeholder="Parent/Guardian Name"
                                        required
                                        value={formData.familyFullName}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age" className="flex items-center gap-2 font-medium">
                                        <Calendar className="w-4 h-4 text-muted-foreground" /> Age <span className="text-blue-500">*</span>
                                    </Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        placeholder="Student Age"
                                        required
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="flex items-center gap-2 font-medium">
                                        <User className="w-4 h-4 text-muted-foreground" /> Gender <span className="text-blue-500">*</span>
                                    </Label>
                                    <select
                                        id="gender"
                                        className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        required
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="flex items-center gap-2 font-medium">
                                        <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number <span className="text-blue-500">*</span>
                                    </Label>
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        placeholder="+1 234 567 8900"
                                        required
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2 font-medium">
                                        <Mail className="w-4 h-4 text-muted-foreground" /> Email Address <span className="text-blue-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="contact@example.com"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="flex items-center gap-2 font-medium">
                                        <MapPin className="w-4 h-4 text-muted-foreground" /> Location <span className="text-blue-500">*</span>
                                    </Label>
                                    <Input
                                        id="location"
                                        placeholder="City, Area"
                                        required
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-2 p-6 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
                                <Label htmlFor="documents" className="flex flex-col items-center gap-2 font-medium cursor-pointer">
                                    <span className="bg-primary/10 p-3 rounded-full">
                                        <Upload className="w-6 h-6 text-primary" />
                                    </span>
                                    <span className="text-lg">Attach Documents</span>
                                    <span className="text-sm text-muted-foreground font-normal">Previous Report Cards, ID Proof, etc. (MAX 5MB)</span>
                                </Label>
                                <Input
                                    id="documents"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {file && (
                                    <p className="text-center text-sm font-medium text-blue-600 bg-blue-50 py-1 px-3 rounded-full w-fit mx-auto mt-2">
                                        Attached: {file.name}
                                    </p>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 text-lg shadow-lg" disabled={loading}>
                                    {loading ? 'Submitting Application...' : 'Submit Application'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
