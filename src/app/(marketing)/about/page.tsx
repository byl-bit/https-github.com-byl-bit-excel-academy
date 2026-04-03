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
  BookOpen,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-cyan-100 selection:text-cyan-900">
      {/* --- HERO SECTION --- */}
      <section className="relative py-28 md:py-40 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 text-center">
          <img 
            src="/images/au-1024x683.jpg" 
            alt="Excel Academy Community" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-linear-to-b from-slate-900/95 via-slate-900/60 to-slate-950" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(6,182,212,0.15),transparent_70%)]" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/20 text-sm font-black text-cyan-300 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <Sparkles className="w-4 h-4" />
            20 Years of Excellence
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-[0.95]">
            Determined <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-teal-300 to-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] uppercase">
              To Excel!
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 max-w-3xl mx-auto drop-shadow-lg italic">
            "Excel Academy - Where Knowledge Meets Character and Every Student is Empowered to Lead."
          </p>
        </div>
      </section>

      {/* --- FOUNDERS GROUP PHOTO --- */}
      <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/founders.jpg" 
            alt="Excel Academy Founders" 
            className="w-full h-full object-cover transition-transform duration-5000 hover:scale-110 ease-out"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.4)_100%)]" />
        </div>
        <div className="container relative z-10 h-full flex flex-col justify-end pb-20 px-6 mx-auto">
           <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
              <div className="inline-block px-4 py-1.5 rounded-lg bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 text-cyan-300 text-xs font-black uppercase tracking-[0.4em] mb-6 shadow-xl">
                 Founding Committee
              </div>
              <h2 className="text-5xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter mb-8 drop-shadow-2xl">
                 United by <br/>
                 <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-teal-200">One Vision.</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-200 font-light max-w-xl leading-relaxed italic drop-shadow-lg">
                 "Our founders represent more than two decades of dedication to shaping the future of Ethiopia through quality education."
              </p>
           </div>
        </div>
      </section>

      {/* --- VISION & MISSION CARDS --- */}
      <section className="py-24 -mt-20 relative z-20">
        <div className="container px-6 mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Our Vision",
                content: "To see Excel Academy become a preferred institution within the community by ensuring students at all levels are well-rounded in their academic excellence and moral character. We aim to produce democratic citizens who leverage science and technology to lead their country out of challenges.",
                icon: Globe,
                color: "from-cyan-500 to-blue-600",
                delay: "delay-100"
              },
              {
                title: "Our Mission",
                content: "The mission of Excel Academy is to provide quality education to all citizens in accordance with the national education policy and to produce students who possess high levels of competence and capability.",
                icon: Target,
                color: "from-teal-400 to-emerald-600",
                delay: "delay-200"
              }
            ].map((pillar, i) => (
              <Card key={i} className={`border-none shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 group animate-in fade-in slide-in-from-bottom-12 ${pillar.delay}`}>
                <CardContent className="p-10 md:p-14 space-y-6">
                  <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${pillar.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                    <pillar.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{pillar.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium text-lg opacity-90">
                    {pillar.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- VALUES SECTION --- */}
      <section className="py-32 relative overflow-hidden bg-white">
        <div className="container px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
             <h2 className="text-sm font-black text-cyan-600 uppercase tracking-[0.3em]">Our Foundation</h2>
             <h3 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tighter">
               Rooted in Core Values
             </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {[
              {
                title: "Holistic Citizenship",
                desc: "To produce citizens who are grounded in good ethics, possess a deep love for their country, and are highly capable.",
                icon: Heart,
                color: "bg-red-50 text-red-600"
              },
              {
                title: "Passion for Learning",
                desc: "Since education is the cornerstone of national development, we strive to instill a genuine love and desire for learning in every student at Excel Academy.",
                icon: BookOpen,
                color: "bg-cyan-50 text-cyan-600"
              },
              {
                title: "Competitiveness",
                desc: "To produce well-prepared and competitive students who are fully equipped for the next level of their education.",
                icon: Trophy,
                color: "bg-amber-50 text-amber-600"
              },
              {
                title: "Language Proficiency",
                desc: "Addressing the practical challenges seen in our country's schools regarding the English language, the Academy focuses on ensuring students can speak, read, and write English fluently and accurately.",
                icon: Sparkles,
                color: "bg-purple-50 text-purple-600"
              }
            ].map((value, i) => (
              <div key={i} className="flex gap-8 p-8 rounded-[2.5rem] border border-slate-100 hover:border-cyan-200 hover:bg-slate-50/50 transition-all duration-500 group">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${value.color} shadow-sm font-bold`}>
                  <value.icon className="w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value.title}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {value.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- LEADERSHIP MESSAGES --- */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="container px-6 mx-auto text-center max-w-3xl mb-20 space-y-4">
             <h2 className="text-sm font-black text-cyan-600 uppercase tracking-[0.3em]">Leadership Voice</h2>
             <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Messages from Our Founders</h3>
        </div>

        <div className="container px-6 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {[
              {
                name: "Dr. Tewodros Yirgashewa",
                role: "Board Member",
                title: "Message from the Board",
                message: "Completing high school is just the beginning of many great things to come. Despite global challenges, our students test their perseverance and ingenuity. You are stronger persons finding the resolution you did not know you had. Never stop learning, exploring, and growing.",
                image: "/images/tewodros_yirgashewa.png"
              },
              {
                name: "Workineh Shewangizaw",
                role: "Academic Head",
                title: "Academic Excellence",
                message: "Our commitment to academic excellence remains unshakable. We provide a rigorous educational path that prepares students not just for university entrance, but for life. The success of our graduates at national levels is a testament to our dedicated faculty.",
                image: "/images/workineh_shewangizaw.jpg"
              }
            ].map((leader, i) => (
              <div key={i} className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-10 hover:shadow-2xl transition-shadow duration-500 group">
                <div className="flex-none">
                   <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden ring-4 ring-cyan-50 shadow-xl group-hover:rotate-3 transition-transform duration-500">
                      <img src={leader.image} alt={leader.name} className="w-full h-full object-cover" />
                   </div>
                </div>
                <div className="space-y-6">
                   <Quote className="w-10 h-10 text-cyan-200" />
                   <h4 className="text-sm font-black text-cyan-600 uppercase tracking-widest">{leader.title}</h4>
                   <p className="text-slate-600 leading-relaxed italic text-lg line-clamp-6 font-medium">"{leader.message}"</p>
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
               <h2 className="text-sm font-black text-cyan-600 uppercase tracking-[0.3em]">Our Team</h2>
               <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">The Visionary Core</h3>
            </div>
            <p className="max-w-md text-slate-500 font-medium">Dedicated professionals ensuring every student reaches their peak potential.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Desalegn", role: "School Director", image: "/images/director_desalegn.jpg" },
              { name: "Umer Ebrahim", role: "Academic Vice President", icon: GraduationCap },
              { name: "Milkesa Admanu", role: "Unit Leader", image: "/images/milkesa_admanu.jpg" },
              { name: "Tewodros Y.", role: "Board Representative", icon: Star }
            ].map((member, i) => (
              <Card key={i} className="border-none bg-slate-50 p-8 rounded-4xl hover:bg-cyan-600 group transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-0 space-y-6 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden flex items-center justify-center text-cyan-600 group-hover:bg-white shadow-xl group-hover:scale-110 transition-all duration-500">
                    {'image' in member ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <member.icon className="w-10 h-10" />
                    )}
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
      <section className="py-24">
        <div className="container px-6 mx-auto">
          <div className="bg-linear-to-br from-slate-900 to-navy-950 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(6,182,212,0.3)] ring-1 ring-white/10 group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
            
            <div className="relative z-10 space-y-10 max-w-3xl mx-auto">
              <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
                Ready to Join <br /> Our Community?
              </h2>
              <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed italic">
                "Excel Academy aims to produce democratic citizens who leverage science and technology to lead their country out of challenges."
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Button asChild size="lg" className="h-18 px-12 rounded-full bg-cyan-500 text-white hover:bg-cyan-400 font-black text-lg transition-all hover:scale-110 shadow-2xl shadow-cyan-600/20 active:scale-95">
                  <Link href="/admissions/apply">Apply Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-18 px-12 rounded-full border-2 border-white/20 text-white hover:bg-white/10 bg-transparent font-black text-lg transition-all active:scale-95">
                  <Link href="/contact">Get Information</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
