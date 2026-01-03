'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Shield, Users, Trophy } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Header Section */}
            <div className="text-center space-y-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="inline-flex items-center rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold transition-colors text-blue-600 bg-blue-50">Our Mission</span>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                    About <span className="text-blue-600">Excel Academy WDD</span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
                    Empowering the next generation through digital innovation. The Excel Academy WDD Portal is a state-of-the-art educational management system designed to streamline the academic experience.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                <div className="space-y-8 animate-in slide-in-from-left-8 duration-700 delay-100">
                    <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
                        <h2 className="text-2xl font-bold mb-4 text-slate-800">Your Digital Campus</h2>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            This portal serves as the central hub for our academic community, bridging the gap between administration, faculty, and students. We leverage technology to ensure transparency, efficiency, and academic excellence.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Real-time Academic Results Publishing',
                                'Digital Library & Resource Management',
                                'Secure Student & Faculty Profiles',
                                'Automated Attendance Tracking'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="grid gap-6 animate-in slide-in-from-right-8 duration-700 delay-200">
                    <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg">For Students</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-500">
                            Access your results, track attendance, download learning materials, and view important announcements instantly.
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-purple-600" />
                            </div>
                            <CardTitle className="text-lg">For Faculty</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-500">
                            Manage class rosters, submit grades seamlessly, generate report cards, and upload educational resources.
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-amber-600" />
                            </div>
                            <CardTitle className="text-lg">Legacy of Excellence</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-500">
                            Built on the principles of integrity and innovation, Excel Academy continues to set the standard for modern education.
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-3xl font-bold">Join Our Community</h2>
                    <p className="text-slate-300 max-w-xl mx-auto">
                        Experience the future of education management. Whether you are prospective student or a parent, we welcome you to Excel Academy.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/50">
                            <Link href="/admissions/apply">Apply for Admission</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-slate-700 hover:bg-slate-800 text-white hover:text-white bg-transparent">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
