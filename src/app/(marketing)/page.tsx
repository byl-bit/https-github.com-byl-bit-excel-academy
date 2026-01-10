'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import NextImage from "next/image";
import {
  ArrowRight, Calendar, GraduationCap, Users, Award,
  ThumbsUp, ChevronRight, Star, TrendingUp, ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FormattedText } from "@/components/FormattedText";
import { SlideshowMedia } from "@/components/SlideshowMedia";

export default function Home() {
  const { user, isAuthenticated } = useAuth() as any;
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    const y = new Date().getFullYear();
    setAcademicYear(`${y}-${y + 1}`);
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans">

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900 text-white">
        {/* Abstract Dynamic Background */}
        <div className="absolute inset-0 z-0 select-none">
          <NextImage
            src="/hero-banner.png"
            alt="Campus Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/80 to-slate-900/60" />
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/30 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-destructive/20 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }} />
        </div>

        <div className="container relative z-10 px-6 py-20 text-center">
          {/* Admissions Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-blue-100 mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            Admissions Open for {academicYear || '2026-2027'}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-fade-in-up delay-100">
            Welcome to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-300 via-white to-blue-200">
              Excel Academy
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed animate-fade-in-up delay-200">
            Empowering the next generation of leaders through world-class education,
            character development, and verified academic excellence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            {!isAuthenticated ? (
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
                <Link href="/auth/login">
                  Student Login <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
                <Link href={user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student'}>
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button variant="outline" size="lg" asChild className="h-14 px-8 rounded-full text-base font-semibold bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all">
              <Link href="/admissions/apply">
                Apply Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 hidden sm:block">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="bg-white border-b border-slate-100 relative z-20 -mt-8 sm:-mt-16 mx-4 sm:mx-8 md:container md:mx-auto rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          {[
            { label: "Pass Rate", value: "100%", icon: TrendingUp, color: "text-green-600" },
            { label: "Expert Faculty", value: "50+", icon: Users, color: "text-blue-600" },
            { label: "Students", value: "1200+", icon: GraduationCap, color: "text-indigo-600" },
            { label: "Years of Excellence", value: "25", icon: ShieldCheck, color: "text-purple-600" }
          ].map((stat, i) => (
            <div key={i} className="p-6 md:p-8 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-colors">
              <div className={`mb-3 p-3 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</span>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-slate-50">
        <div className="container px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Why Excel Academy</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Excellence in Every Aspect</h3>
            <p className="text-slate-600 text-lg">We provide a holistic educational environment designed to foster growth, creativity, and leadership.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={GraduationCap}
              title="Academic Excellence"
              desc="Our rigorous curriculum tailored to international standards ensures students excel in global assessments."
              image="/academic-icon.png"
              accent="border-blue-500"
            />
            <FeatureCard
              icon={Users}
              title="Vibrant Community"
              desc="A diverse, inclusive environment where every student finds their voice through clubs, sports, and arts."
              image="/student-life-icon.png"
              accent="border-purple-500"
            />
            <FeatureCard
              icon={Award}
              title="Proven Results"
              desc="Consistently ranked as the top performing institution with alumni in prestigious universities worldwide."
              image="/results-icon.png"
              accent="border-green-500"
            />
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
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-900/20 to-purple-900/20 opacity-50"></div>
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[128px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-destructive/20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>

        <div className="container relative z-10 px-6 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-8 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-2" />
            <span className="text-sm font-medium">Join a community of achievers</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to start your journey?</h2>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Applications are now open for the upcoming academic year. Secure your future with Excel Academy today.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold transition-transform hover:scale-105">
              <Link href="/admissions/apply">Start Application</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
              <Link href="/contact">Schedule a Visit</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, image, accent }: any) {
  return (
    <Card className="group relative overflow-hidden border-none shadow-lg bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${accent.replace('border-', 'text-')}`}></div>

      <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/0 transition-colors z-10"></div>
        <Icon className="absolute z-0 w-32 h-32 text-slate-200/50 -rotate-12 -bottom-4 -right-4 group-hover:scale-110 transition-transform duration-500" />
        <NextImage
          src={image}
          alt={title}
          width={120}
          height={120}
          className="relative z-20 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <CardContent className="p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{desc}</p>

        <div className="mt-6 flex items-center text-primary font-semibold text-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          Learn more <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// Announcements Component (Preserved Logic, Updated UI)
function HomeAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, { likes: number, dislikes: number, myVote?: 'like' | 'dislike' }>>({});

  useEffect(() => {
    const saved = localStorage.getItem('announcement_votes');
    if (saved) {
      try { setVotes(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  const handleVote = (id: string | number, vote: 'like' | 'dislike', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const key = String(id);
    const current = votes[key] || { likes: Math.floor(Math.random() * 15) + 3, dislikes: Math.floor(Math.random() * 4) };

    let newVote: 'like' | 'dislike' | undefined = vote;
    let newLikes = current.likes;
    let newDislikes = current.dislikes;

    if (current.myVote === vote) {
      newVote = undefined;
      if (vote === 'like') newLikes--;
      else newDislikes--;
    } else {
      current.myVote === 'like' && newLikes--;
      current.myVote === 'dislike' && newDislikes--;
      vote === 'like' && newLikes++;
      vote === 'dislike' && newDislikes++;
    }

    const updated = { ...votes, [key]: { likes: newLikes, dislikes: newDislikes, myVote: newVote } };
    setVotes(updated);
    localStorage.setItem('announcement_votes', JSON.stringify(updated));
  };

  useEffect(() => {
    fetch('/api/announcements?limit=3')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setAnnouncements(data);
        else import("@/lib/mockData").then(m => setAnnouncements(m.MOCK_ANNOUNCEMENTS.slice(0, 3)));
      })
      .catch(() => import("@/lib/mockData").then(m => setAnnouncements(m.MOCK_ANNOUNCEMENTS.slice(0, 3))))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map(i => <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-2xl"></div>)}
      </div>
    );
  }

  if (announcements.length === 0) return null;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Latest Updates</h2>
          <p className="text-lg text-slate-600">Keep up with the latest news, events, and academic highlights from around the campus.</p>
        </div>
        <Button variant="outline" className="rounded-full border-slate-300 hover:border-primary hover:text-primary transition-colors px-6" asChild>
          <Link href="/announcements">
            View All Updates <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="group flex flex-col h-full bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-1">
            <div className="relative h-56 bg-slate-100 overflow-hidden">
              {(announcement.media && announcement.media.length > 0) ? (
                <SlideshowMedia media={announcement.media} title={announcement.title} />
              ) : (
                <NextImage
                  src={announcement.imageUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1'}
                  alt={announcement.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                {announcement.type}
              </div>
            </div>

            <CardContent className="flex-1 p-6 flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-3">
                <Calendar className="w-3.5 h-3.5" />
                {announcement.date}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {announcement.title}
              </h3>

              <div className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                <FormattedText text={announcement.body} />
              </div>

              {announcement.type === 'event' && (
                <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => handleVote(announcement.id, 'like', e)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${votes[String(announcement.id)]?.myVote === 'like'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${votes[String(announcement.id)]?.myVote === 'like' ? 'fill-current' : ''}`} />
                    <span>{votes[String(announcement.id)]?.likes ?? 0} Likes</span>
                  </button>
                  <span className="text-xs text-slate-400 font-medium">Event</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
