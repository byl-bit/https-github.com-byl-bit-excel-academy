"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Shield,
  Users,
  Trophy,
  Target,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Globe,
  Heart,
  Quote,
  Star,
  Award,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-cyan-100 selection:text-cyan-900">
      {/* --- HERO SECTION --- */}
      <section className="relative py-28 md:py-40 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050335192-ce11558cd97d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-30 blur-[1px]" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-900/90 via-slate-900/60 to-slate-950" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(6,182,212,0.15),transparent_70%)]" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/20 text-sm font-black text-cyan-300 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <Sparkles className="w-4 h-4" />
            Excellence Since 1999
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-[0.95]">
            Where Knowledge <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-teal-300 to-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              Meets Character
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 max-w-3xl mx-auto drop-shadow-lg">
            Excel Academy is Ethiopia's premier educational institution, dedicated to nurturing brilliant minds and upright citizens for over two decades.
          </p>
        </div>
      </section>

      {/* --- VISION & MISSION CARDS --- */}
      <section className="py-24 -mt-20 relative z-20">
        <div className="container px-6 mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Our Vision",
                content: "To be a leading educational institution producing citizens who are academically excellent, ethically grounded, and technically capable of solving global challenges through science and innovation.",
                icon: Globe,
                color: "from-cyan-500 to-blue-600",
                delay: "delay-100"
              },
              {
                title: "Our Mission",
                content: "To provide world-class quality education that empowers students with modern knowledge and industry-relevant skills, enabling them to become competent leaders in their communities.",
                icon: Target,
                color: "from-teal-400 to-emerald-600",
                delay: "delay-200"
              },
              {
                title: "Our Values",
                content: "Integrity, Academic Rigor, Character Building, and Patriotism form the bedrock of our educational philosophy, guiding every student toward their maximum potential.",
                icon: Shield,
                color: "from-indigo-500 to-purple-600",
                delay: "delay-300"
              }
            ].map((pillar, i) => (
              <Card key={i} className={`border-none shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 group animate-in fade-in slide-in-from-bottom-12 ${pillar.delay}`}>
                <CardContent className="p-10 space-y-6">
                  <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${pillar.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                    <pillar.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pillar.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium opacity-80">
                    {pillar.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- CORE PHILOSOPHY --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="container px-6 mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-sm font-black text-cyan-600 uppercase tracking-[0.3em]">Core Philosophy</h2>
                <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter">
                  Higher Standards <br /> For Every Student
                </h3>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">
                Since our inception in 1999, we have remained steadfast in our commitment to academic rigor. Our curriculum is designed to exceed national standards, incorporating international best practices in STEM and the humanities.
              </p>
              
              <ul className="space-y-6">
                {[
                  "Fostering Patriotism & Global Citizenship",
                  "Ensuring Equitable Access to Quality Education",
                  "100% University Entrance Success Rate",
                  "Advanced English Proficiency Programs"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 group">
                    <div className="flex-none w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-6">
                <Button asChild className="h-16 px-10 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-black transition-all hover:scale-105 shadow-2xl hover:shadow-slate-400/20">
                  <Link href="/admissions/apply">Join The Legacy <ArrowRight className="ml-3 w-5 h-5" /></Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-tr from-cyan-600/10 to-teal-600/10 rounded-3xl blur-3xl" />
              <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-373b1eef2a68?auto=format&fit=crop&q=80&w=1000" 
                  alt="Student Excellence" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-8 left-8 right-8 p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="h-1 w-12 bg-cyan-600 rounded-full" />
                      <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Success Metric</span>
                   </div>
                   <p className="text-2xl font-black text-slate-900 mb-1">98.5% Passing Grade</p>
                   <p className="text-sm font-bold text-slate-500">Across all graduating Grade 12 students since 2015.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LEADERSHIP MESSAGES --- */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="container px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
             <h2 className="text-sm font-black text-cyan-600 uppercase tracking-[0.3em]">Leadership Voice</h2>
             <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic">"A Legacy of Brilliance"</h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {[
              {
                name: "Dr. Tewodros Yirgashewa",
                role: "Board Member",
                title: "A Message from the Board",
                message: "Completing high school is just the beginning of many great things to come. Despite global challenges, our students test their perseverance and ingenuity. You are stronger persons finding the resolution you did not know you had. Never stop learning, exploring, and growing.",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400"
              },
              {
                name: "Workineh Shewangizaw",
                role: "Academic Head",
                title: "Academic Excellence",
                message: "Our commitment to academic excellence remains unshakable. We provide a rigorous educational path that prepares students not just for university entrance, but for life. The success of our graduates at national levels is a testament to our dedicated faculty.",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=400"
              }
            ].map((leader, i) => (
              <div key={i} className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-10 hover:shadow-2xl transition-shadow duration-500 group">
                <div className="flex-none">
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden ring-4 ring-cyan-50 shadow-xl group-hover:rotate-3 transition-transform duration-500">
                      <img src={leader.image} alt={leader.name} className="w-full h-full object-cover" />
                   </div>
                </div>
                <div className="space-y-6">
                   <Quote className="w-10 h-10 text-cyan-200" />
                   <h4 className="text-sm font-black text-cyan-600 uppercase tracking-widest">{leader.title}</h4>
                   <p className="text-slate-600 leading-relaxed italic text-lg line-clamp-6">"{leader.message}"</p>
                   <div className="pt-4">
                      <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{leader.name}</p>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{leader.role}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ADMINISTRATIVE TEAM --- */}
      <section className="py-32 bg-white">
        <div className="container px-6 mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <h2 className="text-sm font-black text-cyan-600 uppercase tracking-[0.3em]">Our Faculty</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">The Visionary Team</h3>
            </div>
            <p className="max-w-md text-slate-500 font-medium">Meet the dedicated leaders ensuring every operational and academic department runs at the highest peak of efficiency.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Desalegn", role: "School Director", icon: Shield },
              { name: "Urteer Ibrahim", role: "Academic Vice President", icon: GraduationCap },
              { name: "Milkesa Admasu", role: "Unit Coordinator", icon: Users },
              { name: "Tewodros Y.", role: "Board Representative", icon: Star }
            ].map((member, i) => (
              <Card key={i} className="border-none bg-slate-50 p-8 rounded-[2rem] hover:bg-cyan-600 group transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-0 space-y-6 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-cyan-600 group-hover:bg-white shadow-xl group-hover:scale-110 transition-all duration-500">
                    <member.icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-white uppercase tracking-tighter transition-colors">{member.name}</h4>
                    <p className="text-sm font-bold text-slate-400 group-hover:text-white/80 uppercase tracking-widest mt-1 transition-colors">{member.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 bg-white">
        <div className="container px-6 mx-auto">
          <div className="bg-linear-to-br from-slate-900 via-slate-950 to-navy-950 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(6,182,212,0.3)] ring-1 ring-white/10 group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 space-y-12 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                 <Award className="w-4 h-4" />
                 Ready to Excel?
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
                Start Your Student <br /> Journey Today
              </h2>
              <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                Admissions for the current academic year are closing soon. Secure your place in Ethiopia's leading academy and reshape your future.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                <Button asChild size="lg" className="h-18 px-12 rounded-full bg-cyan-500 text-white hover:bg-cyan-400 font-black text-lg transition-all hover:scale-110 shadow-2xl shadow-cyan-600/20 active:scale-95">
                  <Link href="/admissions/apply">Apply for Admission</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-18 px-12 rounded-full border-2 border-white/20 text-white hover:bg-white/10 bg-transparent font-black text-lg transition-all active:scale-95">
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
