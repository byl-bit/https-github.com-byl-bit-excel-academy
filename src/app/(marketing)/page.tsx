"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import NextImage from "next/image";
import {
  ArrowRight,
  Calendar,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Target,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Globe,
  Lightbulb,
  Heart,
  Star,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FormattedText } from "@/components/FormattedText";
import { SlideshowMedia } from "@/components/SlideshowMedia";

const defaultBackgrounds = [
  "/images/school/photo_2026-03-14_10-54-52.jpg",
  "/images/school/photo_2026-03-14_10-54-56.jpg",
  "/images/school/photo_2026-03-14_10-55-00.jpg",
  "/images/school/photo_2026-02-24_17-23-49.jpg",
];

export default function Home() {
  const { user, isAuthenticated } = useAuth() as any;
  const [academicYear, setAcademicYear] = useState("");
  const [currentBg, setCurrentBg] = useState(0);
  const [backgroundImages, setBackgroundImages] = useState<string[]>(defaultBackgrounds);

  useEffect(() => {
    // Determine current year
    const y = new Date().getFullYear();
    setAcademicYear(`${y}-${y + 1}`);

    // Fetch dynamic background images from the gallery
    fetch("/api/media/list?type=image&prefix=gallery/")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const galleryUrls = data.map(item => item.url);
          // Combine gallery images with default ones to ensure we always have content
          setBackgroundImages([...galleryUrls, ...defaultBackgrounds]);
        }
      })
      .catch(err => console.error("Failed to fetch dynamic backgrounds", err));

    // Slideshow interval
    const interval = setInterval(() => {
      setCurrentBg((prev) => {
        // Safe check for backgroundImages length
        if (backgroundImages.length === 0) return 0;
        return (prev + 1) % backgroundImages.length;
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, [backgroundImages.length]); // Added dependency on length for safety

  // Fallback for empty backgroundImages (though defaultBackgrounds prevents this)
  const currentImage = backgroundImages[currentBg] || defaultBackgrounds[0];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          {backgroundImages.map((img, idx) => (
            <div
              key={img}
              className={`absolute inset-0 transition-all duration-2000 ease-in-out ${
                idx === currentBg ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
              }`}
            >
              <NextImage
                src={img}
                alt={`Campus Background ${idx + 1}`}
                fill
                className="object-cover blur-[2px]"
                priority={idx === 0}
              />
            </div>
          ))}
          <div className="absolute inset-0 z-20 bg-linear-to-b from-slate-950/40 via-cyan-950/5 to-slate-950/50" />

          {/* Animated Orbs */}
          <div
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "6s" }}
          />
        </div>

        <div className="container relative z-10 px-6 py-12 flex flex-col items-center justify-center text-center">
          {/* Content Wrapper (Glass Effect Removed) */}
          <div className="relative p-6 md:p-10 rounded-3xl animate-fade-in-up w-full max-w-5xl group">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Welcome Message */}
            <div className="mb-6 space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight drop-shadow-lg">
                Welcome to <span className="text-cyan-400">Excel Academy</span>
              </h2>
              <p className="text-base md:text-lg text-cyan-100/80 font-medium tracking-wide">
                Excellence at Every Stage of Education
              </p>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-cyan-900/40 border border-cyan-400/30 text-xs font-semibold text-cyan-50 mb-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] animate-fade-in-up">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-200 to-teal-200 uppercase tracking-tighter">
                Admissions for {academicYear || "2026-2027"}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6 animate-fade-in-up delay-100 drop-shadow-2xl">
              <span className="block text-white mb-1 uppercase">Determined</span>
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-cyan-300 via-teal-200 to-cyan-500 animate-pulse uppercase" style={{animationDuration: '3s'}}>
                To Excel!
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl mx-auto text-lg sm:text-xl text-cyan-50 mb-8 leading-relaxed font-light animate-fade-in-up delay-200 drop-shadow-xl">
              Join Ethiopia's leading educational institution where excellence meets innovation.
              <span className="block mt-1 font-semibold text-cyan-200 text-base italic opacity-90">
                20 years of academic excellence. 100% pass rate.
              </span>
            </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
            {!isAuthenticated ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="h-16 px-10 rounded-full text-lg font-bold bg-cyan-500 text-white hover:bg-cyan-400 glow-cyan-strong hover-lift relative overflow-hidden group/btn border border-cyan-400"
                >
                  <Link href="/admissions/apply">
                    <span className="absolute inset-0 bg-linear-to-r from-teal-400/0 via-teal-400/30 to-teal-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    <Award className="mr-3 h-6 w-6 relative z-10" />
                    <span className="relative z-10">Apply Now</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-16 px-10 rounded-full text-lg font-bold bg-white/5 border-2 border-cyan-400/50 text-white hover:bg-white/20 hover:border-cyan-300 backdrop-blur-md transition-all hover:scale-105"
                >
                  <Link href="/auth/login">
                    Student Portal
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                asChild
                size="lg"
                className="h-16 px-10 rounded-full text-lg font-bold bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105 relative overflow-hidden group/btn border border-cyan-400"
              >
                <Link
                  href={
                    user?.role === "admin"
                      ? "/admin"
                      : user?.role === "teacher"
                        ? "/teacher"
                        : "/student"
                  }
                >
                  <span className="absolute inset-0 bg-linear-to-r from-teal-400/0 via-teal-400/30 to-teal-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                  <GraduationCap className="mr-3 h-6 w-6 relative z-10" />
                  <span className="relative z-10">Go to Dashboard</span>
                </Link>
              </Button>
            )}
          </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-cyan-100 animate-fade-in-up delay-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">
                Accredited Institution
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium">Top Rated School</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium">1200+ Students</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-7 h-11 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="relative -mt-24 z-20 px-4 sm:px-8">
        <div className="container mx-auto">
          <Card className="card-premium overflow-hidden bg-white/95 backdrop-blur-xl border border-white/40 ring-1 ring-cyan-900/5">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100/50">
              {[
                {
                  label: "Pass Rate",
                  value: "100%",
                  icon: TrendingUp,
                  color: "text-green-600",
                  bgColor: "bg-green-50",
                },
                {
                  label: "Expert Faculty",
                  value: "50+",
                  icon: Users,
                  color: "text-cyan-600",
                  bgColor: "bg-cyan-50",
                },
                {
                  label: "Active Students",
                  value: "1,200+",
                  icon: GraduationCap,
                  color: "text-teal-600",
                  bgColor: "bg-teal-50",
                },
                {
                  label: "Years of Excellence",
                  value: "20",
                  icon: Award,
                  color: "text-teal-600",
                  bgColor: "bg-teal-50",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-8 text-center group hover:bg-slate-50 transition-all cursor-default"
                >
                  <div
                    className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* --- WHY CHOOSE US --- */}
      <section className="py-24 bg-slate-50">
        <div className="container px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-800 text-sm font-bold mb-4">
              <Target className="w-4 h-4" />
              Why Excel Academy
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Where Excellence Meets Innovation
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We provide a transformative educational experience that prepares
              students for success in an ever-changing world.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: "Academic Excellence",
                desc: "Rigorous curriculum aligned with international standards, ensuring students excel in global assessments and university admissions.",
                color: "cyan",
                gradient: "from-cyan-500 to-teal-500",
              },
              {
                icon: Globe,
                title: "Global Perspective",
                desc: "Preparing students to thrive in an interconnected world with multicultural awareness and international collaboration.",
                color: "cyan",
                gradient: "from-cyan-600 to-teal-600",
              },
              {
                icon: Lightbulb,
                title: "Innovation & Creativity",
                desc: "Fostering critical thinking, problem-solving, and creative expression through hands-on learning experiences.",
                color: "orange",
                gradient: "from-orange-500 to-red-500",
              },
              {
                icon: Users,
                title: "Expert Faculty",
                desc: "Dedicated teachers with advanced qualifications and a passion for nurturing each student's unique potential.",
                color: "green",
                gradient: "from-green-500 to-emerald-500",
              },
              {
                icon: Heart,
                title: "Holistic Development",
                desc: "Comprehensive programs in sports, arts, and character education that develop well-rounded individuals.",
                color: "pink",
                gradient: "from-pink-500 to-rose-500",
              },
              {
                icon: BookOpen,
                title: "Modern Facilities",
                desc: "State-of-the-art classrooms, science labs, computer labs, library, and sports facilities for optimal learning.",
                color: "teal",
                gradient: "from-teal-600 to-cyan-700",
              },
            ].map((feature: any, idx) => (
              <Card
                key={idx}
                className="card-premium group relative overflow-hidden hover:-translate-y-2 bg-linear-to-b from-white to-slate-50 border border-white/50"
              >
                <div
                  className={`absolute top-0 left-0 w-full h-1 bg-linear-to-r ${feature.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                />
                <CardContent className="p-8">
                  <div
                    className={`w-14 h-14 bg-linear-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-${feature.color}-500/30`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {feature.desc}
                  </p>
                  <div className="flex items-center text-cyan-600 font-semibold text-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- ANNOUNCEMENTS --- */}
      <section className="py-24 bg-white">
        <div className="container px-6">
          <HomeAnnouncements />
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="relative py-32 bg-slate-950 text-white overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 blur-3xl rounded-full" />
        </div>

        <div className="container relative z-10 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm mb-8">
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl md:text-2xl text-cyan-50 max-w-3xl mx-auto mb-12 leading-relaxed">
            Join thousands of successful students who chose Excel Academy.
            Applications are now open for the {academicYear || "2026-2027"}{" "}
            academic year.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Button
              size="lg"
              asChild
              className="h-16 px-10 rounded-full bg-cyan-500 text-white hover:bg-cyan-400 font-bold text-lg shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105"
            >
              <Link href="/admissions/apply">
                <Award className="mr-2 h-6 w-6" />
                Start Application
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-16 px-10 rounded-full border-2 border-white/30 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm font-bold text-lg transition-all"
            >
              <Link href="/contact">
                Schedule Campus Visit
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-cyan-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Open Mon-Sat, 8AM-5PM</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">+251 964 324 390</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Announcements Component
function HomeAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/announcements?limit=3")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-800 text-sm font-bold mb-4">
            <Calendar className="w-4 h-4" />
            Latest Updates
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900">
            Stay Informed
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 bg-slate-100 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
          <Calendar className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">
          No Announcements Yet
        </h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Check back soon for the latest news, events, and updates from Excel
          Academy.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-800 text-sm font-bold mb-4">
          <Calendar className="w-4 h-4" />
          Latest Updates
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
          Stay Informed
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Keep up with the latest news, events, and academic highlights from
          around the campus.
        </p>
        <Button
          variant="outline"
          className="rounded-full border-2 border-slate-300 hover:border-cyan-600 hover:text-cyan-600 transition-colors px-6 font-semibold"
          asChild
        >
          <Link href="/announcements">
            View All Updates <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {announcements.map((announcement) => (
          <Card
            key={announcement.id}
            className="group flex flex-col h-full bg-white border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-2"
          >
            <div className="relative h-56 bg-slate-100 overflow-hidden">
              {announcement.media && announcement.media.length > 0 ? (
                <SlideshowMedia
                  media={announcement.media}
                  title={announcement.title}
                />
              ) : (
                <NextImage
                  src={
                    announcement.imageUrl ||
                    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1"
                  }
                  alt={announcement.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
              )}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-slate-800 shadow-lg">
                {announcement.type}
              </div>
            </div>

            <CardContent className="flex-1 p-6 flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-3">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(announcement.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                {announcement.title}
              </h3>

              <div className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                <FormattedText text={announcement.body} />
              </div>

              <div className="flex items-center text-cyan-600 font-semibold text-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Read more <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
