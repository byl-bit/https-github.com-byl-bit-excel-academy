"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, Shield, MapPin, Calendar, School, Fingerprint } from "lucide-react";
import { normalizeGender } from "@/lib/utils";

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
      <DialogContent className="max-w-2xl bg-white border-none shadow-2xl overflow-hidden glass-panel p-0">
        <div className="h-2 bg-linear-to-r from-indigo-600 to-blue-600" />
        
        <DialogHeader className="p-8 pb-4 bg-slate-50/30">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                {teacher.photo ? (
                  <img
                    src={teacher.photo}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-slate-300" />
                )}
              </div>
            </div>
            
            <div className="text-center md:text-left space-y-1">
              <DialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {fullName}
              </DialogTitle>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                  <Fingerprint className="h-3 w-3" /> {teacher.teacherId || "PENDING ID"}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  teacher.status === "active" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-amber-50 text-amber-600 border-amber-100"
                }`}>
                  {teacher.status || "PENDING"} ACCOUNT
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Identity Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <User className="h-4 w-4 text-indigo-600" />
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                Faculty Information
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Full Name" value={fullName || "-"} />
              <InfoItem 
                label="Gender Identity" 
                value={gender === "M" || gender === "Male" ? "Male" : gender === "F" || gender === "Female" ? "Female" : teacher.gender || teacher.sex || "-"} 
              />
              <InfoItem label="Email Address" value={teacher.email || "No email linked"} icon={Mail} />
              <InfoItem label="Account Created" value={teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "-"} icon={Calendar} />
            </div>
          </section>section

          {/* Institutional Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <School className="h-4 w-4 text-secondary-600" />
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                Institutional Assignment
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Home Room" value={teacher.grade && teacher.section ? `Grade ${teacher.grade} - ${teacher.section}` : "No Homeroom Assigned"} />
              <InfoItem label="Institutional Role" value={teacher.role || "Teacher"} />
            </div>
          </section>section
        </div>

        <div className="bg-slate-50 p-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Close Profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
        {label}
      </p>
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        <span className="text-sm font-bold text-slate-700 tracking-tight">{value}</span>
      </div>
    </div>
  );
}
