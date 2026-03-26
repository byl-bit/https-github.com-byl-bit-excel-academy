"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, Shield, MapPin, Calendar, School, Fingerprint, AtSign, Briefcase, Award } from "lucide-react";
import { normalizeGender, cn } from "@/lib/utils";

interface TeacherProfileDialogProps {
  teacher: any;
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherProfileDialog({ teacher, isOpen, onClose }: TeacherProfileDialogProps) {
  if (!teacher) return null;

  const gender = normalizeGender(teacher.gender || teacher.sex || "");
  const fullName = teacher.fullName || teacher.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/80 backdrop-blur-xl border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden p-0 rounded-3xl ring-1 ring-slate-200/50">
        {/* Animated Accent Bar */}
        <div className="h-2 w-full bg-linear-to-r from-indigo-500 via-blue-600 to-cyan-600" />
        
        <DialogHeader className="p-8 pb-6 bg-slate-50/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
            <School className="h-32 w-32" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-28 h-28 rounded-2xl border-4 border-white shadow-2xl bg-white flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                {teacher.photo ? (
                  <img
                    src={teacher.photo}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <User className="h-12 w-12 text-slate-200" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center md:text-left space-y-3">
              <div>
                <DialogTitle className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {fullName}
                </DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Faculty Member Profile</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                  <Fingerprint className="h-3.5 w-3.5" /> STAFF ID: {teacher.teacherId || "PENDING"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset",
                  teacher.status === "active" 
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100" 
                    : "bg-amber-50 text-amber-700 ring-amber-100"
                )}>
                  {teacher.status || "PENDING"} ACCOUNT
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-10 bg-white/50">
          {/* Identity Grid */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">
                Faculty Credentials
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <InfoItem label="Full Legal Name" value={fullName || "-"} icon={User} />
              <InfoItem 
                label="Gender" 
                value={gender === "M" || gender === "Male" ? "Male" : gender === "F" || gender === "Female" ? "Female" : "-"} 
                icon={User}
              />
              <InfoItem label="Official Email" value={teacher.email || "N/A"} icon={AtSign} />
              <InfoItem label="Date Joined" value={teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "-"} icon={Calendar} />
            </div>
          </section>

          {/* Institutional Grid */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <School className="h-4 w-4" />
              </div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">
                Institutional Assignment
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Home Room" value={teacher.grade && teacher.section ? `Grade ${teacher.grade} - ${teacher.section}` : "NO HOMEROOM"} icon={Award} color="blue" />
              <InfoItem label="Professional Role" value={teacher.role || "TEACHER"} icon={Briefcase} color="blue" />
            </div>
          </section>
        </div>

        <div className="bg-slate-50/80 p-6 flex justify-end gap-3 backdrop-blur-sm border-t border-slate-100">
          <button 
            onClick={onClose}
            className="group px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95"
          >
            Close Faculty Profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value, icon: Icon, color = "indigo" }: { label: string; value: string; icon?: any; color?: "blue" | "indigo" }) {
  return (
    <div className="group space-y-2">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-hover:text-slate-600">
        {label}
      </p>
      <div className={cn(
        "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300",
        "bg-white/80 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-slate-100 group-hover:-translate-y-0.5",
        color === "indigo" ? "border-slate-100/80 group-hover:border-indigo-100" : "border-slate-100/80 group-hover:border-blue-100"
      )}>
        <div className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          color === "indigo" ? "bg-indigo-50 text-indigo-500" : "bg-blue-50 text-blue-500"
        )}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        <span className="text-sm font-extrabold text-slate-700 tracking-tight truncate uppercase">
          {value}
        </span>
      </div>
    </div>
  );
}
