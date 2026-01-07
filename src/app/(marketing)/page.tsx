'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import NextImage from "next/image";
import { ArrowRight, Calendar, FileText, CheckCircle, GraduationCap, Users, BookOpen, Award, Info, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, isAuthenticated } = useAuth() as any;

  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    const y = new Date().getFullYear();
    setAcademicYear(`${y}-${y + 1}`);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden border-b border-blue-100">
        <div className="absolute inset-0 bg-[url('/hero-banner.png')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-linear-to-b from-background/70 via-background/50 to-background"></div>

        <div className="container relative z-10 text-center space-y-4 sm:space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-medium backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            Admissions Open for {academicYear || '2026-2027'}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-[1.1]">
            Welcome to <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-700 via-indigo-600 to-sky-500 hover:from-blue-600 hover:via-purple-600 hover:to-sky-400 transition-all duration-500 drop-shadow-sm filter">Excel Academy WDD PORTAL</span>
            <br className="hidden sm:inline" />
            <span className="text-muted-foreground block mt-4 text-xl sm:text-2xl font-medium tracking-normal">
              Empowering Excellence
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-base sm:text-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 px-4">
            Excel Academy WDD provides a world-class education fostering academic success,
            character development, and future leaders.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 px-6">
            {!isAuthenticated ? (
              <Button asChild className="rounded-full text-sm font-semibold h-10 px-6 w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
                <Link href="/auth/login">
                  Student Login <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-full text-sm font-semibold h-10 px-6 w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
                <Link href={user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student'}>
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild className="rounded-full text-sm font-semibold h-10 px-6 w-full sm:w-auto bg-white/50 backdrop-blur-sm hover:bg-white/80 border-blue-100">
              <Link href="/announcements">
                Latest News
              </Link>
            </Button>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute -bottom-32 -left-32 w-64 h-64 sm:w-96 sm:h-96 bg-blue-50/30 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -right-20 w-48 h-48 sm:w-72 sm:h-72 bg-blue-50/30 rounded-full blur-3xl"></div>
      </section>

      {/* Features Grid */}
      <section className="container py-8 sm:py-16 md:py-24 -mt-12 sm:-mt-20 relative z-20">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="bg-white shadow-xl border-t-4 border-t-blue-500 hover:-translate-y-1 transition-transform duration-300 border-blue-100">
            <CardHeader className="p-5 sm:p-6">
              <div className="relative w-full h-24 sm:h-32 mb-4 rounded-lg overflow-hidden flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-blue-500/20 absolute" />
                <NextImage
                  src="/academic-icon.png"
                  alt="Academic Excellence"
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Academic Excellence</CardTitle>
              <CardDescription className="text-sm">Top-tier curriculum designed for success.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base leading-relaxed">
              We consistently achieve 100% pass rates with our rigorous academic programs and dedicated faculty.
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-t-4 border-t-sky-400 hover:-translate-y-1 transition-transform duration-300 border-blue-100">
            <CardHeader className="p-5 sm:p-6">
              <div className="relative w-full h-24 sm:h-32 mb-4 rounded-lg overflow-hidden flex items-center justify-center">
                <Users className="h-16 w-16 text-sky-400/20 absolute" />
                <NextImage
                  src="/student-life-icon.png"
                  alt="Student Life"
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Student Life</CardTitle>
              <CardDescription className="text-sm">Vibrant community and extracurriculars.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base leading-relaxed">
              From sports to coding clubs, we nurture talent beyond the classroom ensuring holistic development.
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-t-4 border-t-indigo-400 hover:-translate-y-1 transition-transform duration-300 border-blue-100">
            <CardHeader className="p-5 sm:p-6">
              <div className="relative w-full h-24 sm:h-32 mb-4 rounded-lg overflow-hidden flex items-center justify-center">
                <Award className="h-16 w-16 text-indigo-400/20 absolute" />
                <NextImage
                  src="/results-icon.png"
                  alt="Proven Results"
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Proven Results</CardTitle>
              <CardDescription className="text-sm">Consistently ranked top in the region.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base leading-relaxed">
              Our students gain admission to top universities worldwide, backed by our strong alumni network.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="container py-8 sm:py-16">
        <HomeAnnouncements />
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-b from-white to-blue-50 py-16 sm:py-24 border-t border-blue-100">
        <div className="container text-center px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Ready to Join Excel Academy?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-base sm:text-lg">
            Secure your spot for the upcoming academic year. Applications are now open for Grades 9-12.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto h-12">
              <Link href="/admissions/apply">Apply Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12">
              <Link href="/about">Contact Admissions</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function HomeAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/announcements?limit=3')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-blue-50 animate-pulse rounded"></div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-blue-50 animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) return null;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Latest Updates</h2>
          <p className="text-muted-foreground">Stay informed with the latest announcements from Excel Academy.</p>
        </div>
        <Button variant="ghost" className="text-primary group" asChild>
          <Link href="/announcements">
            View All <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary flex flex-col h-full">
            {(announcement.media && announcement.media.length > 0) ? (
              <div className="relative h-48 overflow-hidden rounded-t-lg bg-blue-50/50">
                {announcement.media[0].type === 'video' ? (
                  <video
                    src={announcement.media[0].url}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <NextImage
                    src={announcement.media[0].url}
                    alt={announcement.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {announcement.media.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md z-10">
                    +{announcement.media.length - 1} more
                  </div>
                )}
              </div>
            ) : announcement.imageUrl ? (
              <div className="relative h-48 overflow-hidden rounded-t-lg bg-blue-50/50">
                <NextImage
                  src={announcement.imageUrl || ''}
                  alt={announcement.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : null}
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide
                   ${announcement.type === 'academic' ? 'bg-blue-100/50 text-blue-700' :
                    announcement.type === 'event' ? 'bg-sky-100/50 text-sky-700' :
                      'bg-indigo-50 text-indigo-700'}`}>
                  {announcement.type}
                </span>
                <div className="flex items-center text-muted-foreground text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  {announcement.date}
                </div>
              </div>
              <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{announcement.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="line-clamp-3 text-foreground/80">
                {announcement.body}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
