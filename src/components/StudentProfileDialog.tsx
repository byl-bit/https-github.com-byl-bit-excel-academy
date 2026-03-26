"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, GraduationCap, MapPin, Calendar, BookOpen, Fingerprint, Phone, AtSign, CreditCard, Hash, Users as UsersIcon } from "lucide-react";

import { normalizeGender, cn } from "@/lib/utils";

interface StudentProfileDialogProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentProfileDialog({ student, isOpen, onClose }: StudentProfileDialogProps) {
  if (!student) return null;

  const gender = normalizeGender(student.gender || student.sex || "");
  const fullName = student.fullName || student.name || `${student.firstName} ${student.middleName} ${student.lastName}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/80 backdrop-blur-xl border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden p-0 rounded-3xl ring-1 ring-slate-200/50">
        {/* Animated Accent Bar */}
        <div className="h-2 w-full bg-linear-to-r from-blue-500 via-indigo-600 to-violet-600" />
        
        <DialogHeader className="p-8 pb-6 bg-slate-50/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
            <GraduationCap className="h-32 w-32" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-28 h-28 rounded-2xl border-4 border-white shadow-2xl bg-white flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                {student.photo ? (
                  <img
                    src={student.photo}
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Institutional Profile</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                  <Fingerprint className="h-3.5 w-3.5" /> ID: {student.studentId || "PENDING"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset",
                  student.status === "active" 
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100" 
                    : "bg-amber-50 text-amber-700 ring-amber-100"
                )}>
                  {student.status || "PENDING"} ACCOUNT
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-10 bg-white/50">
          {/* Identity Grid */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">
                Personal Credentials
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem label="First Name" value={student.firstName || "-"} icon={User} />
              <InfoItem label="Middle Name" value={student.middleName || "-"} icon={User} />
              <InfoItem label="Last Name" value={student.lastName || "-"} icon={User} />
              <InfoItem 
                label="Gender" 
                value={gender === "M" ? "Male" : gender === "F" ? "Female" : "-"} 
                icon={UsersIcon}
              />

              <InfoItem label="Email" value={student.email || "N/A"} icon={AtSign} />
              <InfoItem label="Member Since" value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "-"} icon={Calendar} />
            </div>
          </section>

          {/* Academic Grid */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <GraduationCap className="h-4 w-4" />
              </div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">
                Educational Enrollment
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoItem label="Level / Grade" value={`Grade ${student.grade || "UNASSIGNED"}`} icon={BookOpen} color="indigo" />
              <InfoItem label="Class Section" value={student.section || "NOT SET"} icon={MapPin} color="indigo" />
              <InfoItem label="Class Roll No" value={student.rollNumber || "PENDING"} icon={Hash} color="indigo" />
            </div>
          </section>
        </div>

        <div className="bg-slate-50/80 p-6 flex justify-end gap-3 backdrop-blur-sm border-t border-slate-100">
          <button 
            onClick={onClose}
            className="group px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95"
          >
            Close Profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value, icon: Icon, color = "blue" }: { label: string; value: string; icon?: any; color?: "blue" | "indigo" }) {
  return (
    <div className="group space-y-2">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-hover:text-slate-600">
        {label}
      </p>
      <div className={cn(
        "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300",
        "bg-white/80 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-slate-100 group-hover:-translate-y-0.5",
        color === "blue" ? "border-slate-100/80 group-hover:border-blue-100" : "border-slate-100/80 group-hover:border-indigo-100"
      )}>
        <div className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          color === "blue" ? "bg-blue-50 text-blue-500" : "bg-indigo-50 text-indigo-500"
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
