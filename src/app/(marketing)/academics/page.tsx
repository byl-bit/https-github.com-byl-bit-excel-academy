'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    BookOpen, GraduationCap, Award, Users, TrendingUp,
    CheckCircle, Globe, Microscope, Calculator, Languages,
    Palette, Music, Trophy, Brain, Target
} from "lucide-react";

export default function AcademicsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
                <div className="absolute inset-0 bg-[url('/hero-banner.png')] opacity-10 bg-cover bg-center"></div>
                <div className="container relative z-10 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-6">
                        <GraduationCap className="w-4 h-4" />
                        Academic Excellence
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Our Academic Programs</h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
                        A rigorous, internationally-aligned curriculum designed to develop critical thinking,
                        creativity, and leadership skills in every student.
                    </p>
                </div>
            </section>

            {/* Academic Philosophy */}
            <section className="py-16 bg-white">
                <div className="container px-6">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Our Academic Philosophy</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            At Excel Academy, we believe in nurturing well-rounded individuals who excel not only
                            academically but also in character, creativity, and community engagement. Our curriculum
                            is designed to challenge students while providing the support they need to succeed.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Brain className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Critical Thinking</h3>
                                <p className="text-slate-600">
                                    Developing analytical skills and problem-solving abilities through inquiry-based learning
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Target className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Personalized Learning</h3>
                                <p className="text-slate-600">
                                    Tailored instruction that meets each student at their level and helps them reach their potential
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Globe className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Global Perspective</h3>
                                <p className="text-slate-600">
                                    Preparing students to thrive in an interconnected world with international standards
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Grade Levels */}
            <section className="py-16 bg-slate-50">
                <div className="container px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Grade Levels</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Comprehensive education from early childhood through secondary school
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                level: "Kindergarten",
                                grades: "KG 1-3",
                                description: "Building foundational skills through play-based learning and early literacy",
                                icon: Users,
                                color: "bg-pink-100 text-pink-600"
                            },
                            {
                                level: "Primary School",
                                grades: "Grades 1-4",
                                description: "Developing core competencies in reading, writing, mathematics, and science",
                                icon: BookOpen,
                                color: "bg-blue-100 text-blue-600"
                            },
                            {
                                level: "Upper Primary",
                                grades: "Grades 5-8",
                                description: "Expanding knowledge with specialized subjects and critical thinking skills",
                                icon: TrendingUp,
                                color: "bg-green-100 text-green-600"
                            },
                            {
                                level: "Secondary School",
                                grades: "Grades 9-10",
                                description: "Preparing for national examinations with rigorous academic preparation",
                                icon: GraduationCap,
                                color: "bg-purple-100 text-purple-600"
                            },
                            {
                                level: "Preparatory",
                                grades: "Grades 11-12",
                                description: "Advanced studies in Natural Science, Social Science, or other streams",
                                icon: Award,
                                color: "bg-orange-100 text-orange-600"
                            },
                            {
                                level: "Exam Preparation",
                                grades: "All Levels",
                                description: "Comprehensive support for national and international examinations",
                                icon: Trophy,
                                color: "bg-yellow-100 text-yellow-600"
                            }
                        ].map((level, index) => (
                            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className={`w-14 h-14 ${level.color} rounded-full flex items-center justify-center mb-4`}>
                                        <level.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{level.level}</h3>
                                    <p className="text-sm font-semibold text-primary mb-3">{level.grades}</p>
                                    <p className="text-slate-600 text-sm">{level.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Subjects */}
            <section className="py-16 bg-white">
                <div className="container px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Core Subjects</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            A comprehensive curriculum covering all essential areas of learning
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Mathematics", icon: Calculator, color: "text-blue-600" },
                            { name: "Sciences", icon: Microscope, color: "text-green-600" },
                            { name: "Languages", icon: Languages, color: "text-purple-600" },
                            { name: "Social Studies", icon: Globe, color: "text-orange-600" },
                            { name: "Arts & Music", icon: Palette, color: "text-pink-600" },
                            { name: "Physical Education", icon: Trophy, color: "text-red-600" },
                            { name: "Technology", icon: Brain, color: "text-indigo-600" },
                            { name: "Life Skills", icon: CheckCircle, color: "text-teal-600" }
                        ].map((subject, index) => (
                            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-all text-center group">
                                <CardContent className="p-6">
                                    <subject.icon className={`w-12 h-12 ${subject.color} mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                                    <h3 className="font-bold text-slate-900">{subject.name}</h3>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Academic Excellence Features */}
            <section className="py-16 bg-slate-50">
                <div className="container px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">What Sets Us Apart</h2>

                        <div className="space-y-4">
                            {[
                                "100% pass rate in national examinations for the past 5 years",
                                "Internationally aligned curriculum with local context",
                                "Experienced and qualified teaching staff with ongoing professional development",
                                "Small class sizes ensuring personalized attention (max 30 students per class)",
                                "Modern facilities including science labs, computer labs, and library",
                                "Regular assessments and detailed progress reports for parents",
                                "Extra-curricular activities including sports, arts, and academic clubs",
                                "University and career counseling for senior students"
                            ].map((feature, index) => (
                                <div key={index} className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                                    <p className="text-slate-700">{feature}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-linear-to-br from-blue-600 to-blue-700 text-white">
                <div className="container px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join Excel Academy?</h2>
                    <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                        Give your child the gift of quality education. Applications are now open for the upcoming academic year.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-slate-100 font-bold rounded-full px-8">
                            <Link href="/admissions/apply">Apply Now</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold rounded-full px-8">
                            <Link href="/contact">Schedule a Visit</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
