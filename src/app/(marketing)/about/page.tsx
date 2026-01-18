'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
    CheckCircle2, Shield, Users, Trophy,
    Target, GraduationCap, Flame, Sparkles,
    ArrowRight, Globe, Zap, Heart
} from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import NextImage from "next/image";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">

            {/* --- HERO SECTION --- */}
            <section className="relative py-24 md:py-32 bg-linear-to-br from-slate-900 via-blue-900 to-indigo-950 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
                </div>

                <div className="container relative z-10 px-6 mx-auto text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold text-blue-200 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        Our Vision & Mission
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Empowering the <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-300 to-cyan-300">Next Generation</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                        The Excel Academy WDD Portal is more than just a system—it's a digital ecosystem
                        designed to cultivate excellence, integrity, and innovation in every student.
                    </p>
                </div>
            </section>

            {/* --- CORE PILLARS --- */}
            <section className="py-24 relative z-20">
                <div className="container px-6 mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 mb-6">Your Digital Campus Hub</h2>
                                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                    We bridge the gap between traditional education and the digital future.
                                    Our platform provides a seamless experience for administration, faculty, and students to collaborate
                                    and achieve academic success.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                {[
                                    { icon: Zap, title: "Real-time Access", desc: "Instant results & updates", color: "blue" },
                                    { icon: Globe, title: "Online Library", desc: "Digital resources 24/7", color: "indigo" },
                                    { icon: Shield, title: "Secure Data", desc: "Private & encrypted portal", color: "purple" },
                                    { icon: Target, title: "Goal Oriented", desc: "Track progress accurately", color: "orange" }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <item.icon className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                                            <p className="text-sm text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4">
                                <Button asChild className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white font-bold transition-all hover:scale-105">
                                    <Link href="/admissions/apply">
                                        Join Our Community <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-5xl blur-2xl opacity-10 animate-pulse" />
                            <div className="relative bg-white rounded-4xl border border-slate-200 p-8 shadow-2xl">
                                <div className="space-y-6">
                                    {[
                                        {
                                            icon: Users,
                                            title: "For Students",
                                            desc: "A personalized space to view results, manage tasks, and access study materials.",
                                            theme: "blue"
                                        },
                                        {
                                            icon: Flame,
                                            title: "For Teachers",
                                            desc: "Advanced toolset for grade management, attendance tracking, and resource sharing.",
                                            theme: "purple"
                                        },
                                        {
                                            icon: Trophy,
                                            title: "Admissions",
                                            desc: "Simplified application process for prospective students and parents.",
                                            theme: "orange"
                                        }
                                    ].map((card, i) => (
                                        <div key={i} className="flex gap-6 p-6 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                            <div className="w-14 h-14 rounded-xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0">
                                                <card.icon className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
                                                <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- STATS SECTION --- */}
            <section className="py-24 bg-slate-50">
                <div className="container px-6 mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: "Founded", value: "2010" },
                            { label: "Graduates", value: "5,000+" },
                            { label: "Awards", value: "150+" },
                            { label: "Subjects", value: "24+" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-2">
                                <h2 className="text-4xl md:text-5xl font-black text-blue-600">{stat.value}</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- MISSION STATEMENT --- */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container px-6 mx-auto text-center max-w-3xl relative z-10">
                    <Heart className="w-12 h-12 text-red-500 mx-auto mb-8 animate-bounce" />
                    <h2 className="text-4xl font-black text-slate-900 mb-8">Guided by Ethics & Excellence</h2>
                    <p className="text-2xl text-slate-600 font-light leading-relaxed italic">
                        "Our mission is to provide an environment where every student feels valued,
                        challenged, and supported in their journey toward academic and personal mastery."
                    </p>
                    <div className="mt-12 pt-12 border-t border-slate-100 flex justify-center gap-12">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 mb-4 ring-4 ring-white shadow-lg">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100" alt="Founder" />
                            </div>
                            <span className="font-bold text-slate-900">Dr. Samuel K.</span>
                            <span className="text-sm text-slate-500">Executive Director</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="py-24">
                <div className="container px-6 mx-auto">
                    <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-6xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Be Part of Our Legacy</h2>
                            <p className="text-xl text-blue-100 font-light">
                                Whether you are a prospective student, a dedicated parent, or an expert educator,
                                there is a place for you at Excel Academy.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                                <Button asChild size="lg" className="h-16 px-10 rounded-full bg-white text-blue-600 hover:bg-slate-100 font-bold text-lg shadow-xl shadow-black/10 transition-all hover:scale-105">
                                    <Link href="/admissions/apply">Apply for Admission</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-full border-2 border-white/40 text-white hover:bg-white/10 bg-transparent font-bold text-lg transition-all">
                                    <Link href="/contact">Get in Touch</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
