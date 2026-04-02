"use client";

import {
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
  GraduationCap,
  Github,
} from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 text-slate-200 pt-20 pb-10 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-cyan-600 via-teal-500 to-slate-900" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-12 w-12 relative rounded-full overflow-hidden bg-white p-0.5 shadow-lg group-hover:scale-110 transition-transform duration-300 border border-slate-700">
                <img
                  src="/excel-academy-logo.png"
                  alt="Excel Academy"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-black text-2xl tracking-tighter text-white">
                Excel Academy
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-sm max-w-xs">
              Empowering the next generation through digital innovation and
              academic excellence. Ethiopia's leading institution for future
              leaders.
            </p>
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-cyan-600 hover:border-cyan-500 hover:text-white transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-2">
              <div className="w-1 h-6 bg-cyan-600 rounded-full" />
              Quick Links
            </h3>
            <ul className="space-y-4">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Academics", href: "/academics" },
                { name: "Announcements", href: "/announcements" },
                { name: "Admissions", href: "/admissions/apply" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center group"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-2">
              <div className="w-1 h-6 bg-teal-600 rounded-full" />
              Student Portals
            </h3>
            <ul className="space-y-4">
              {[
                { name: "Student Login", href: "/auth/login" },
                { name: "Teacher Portal", href: "/auth/login" },
                { name: "Admin Dashboard", href: "/auth/login" },
                { name: "Digital Library", href: "/student/library" },
                { name: "Check Results", href: "/student/results" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-teal-400 transition-colors flex items-center group"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-600 rounded-full" />
              Contact Us
            </h3>
            <div className="space-y-6">
              <a
                href="mailto:mrictwise@gmail.com"
                className="flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-cyan-600/20 group-hover:border-cyan-500/50 transition-colors">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Email Us
                  </p>
                  <p className="text-sm text-slate-300 font-medium group-hover:text-cyan-400 transition-colors">
                    mrictwise@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="https://wa.me/251964324390"
                className="flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-green-600/20 group-hover:border-green-500/50 transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                    WhatsApp
                  </p>
                  <p className="text-sm text-slate-300 font-medium group-hover:text-green-400 transition-colors">
                    +251 964 324 390
                  </p>
                </div>
              </a>

              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Location
                  </p>
                  <p className="text-sm text-slate-300 font-medium">
                    Adama, Ethiopia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-slate-500 text-sm text-center md:text-left">
            <p>&copy; {currentYear} Excel Academy WDD. All rights reserved.</p>
          </div>


          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </Link>
            <a
              href="https://github.com/byl-bit"
              className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <Github className="w-3 h-3" /> GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
