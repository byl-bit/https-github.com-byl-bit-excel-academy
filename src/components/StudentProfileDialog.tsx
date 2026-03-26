"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, GraduationCap, MapPin, Calendar, BookOpen, Fingerprint } from "lucide-react";
import { normalizeGender } from "@/lib/utils";

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
      <DialogContent className="max-w-2xl bg-white border-none shadow-2xl overflow-hidden glass-panel p-0">
        <div className="h-2 bg-linear-to-r from-blue-600 to-indigo-600" />
        
        <DialogHeader className="p-8 pb-4 bg-slate-50/30">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                {student.photo ? (
                  <img
                    src={student.photo}
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                  <Fingerprint className="h-3 w-3" /> {student.studentId || "PENDING ID"}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  student.status === "active" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-amber-50 text-amber-600 border-amber-100"
                }`}>
                  {student.status || "PENDING"} ACCOUNT
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Identity Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <User className="h-4 w-4 text-blue-600" />
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                Account Credentials
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="First Name" value={student.firstName || "-"} />
              <InfoItem label="Middle Name" value={student.middleName || "-"} />
              <InfoItem label="Last Name" value={student.lastName || "-"} />
              <InfoItem 
                label="Gender Identity" 
                value={gender === "M" ? "Male" : gender === "F" ? "Female" : student.gender || student.sex || "-"} 
              />
              <InfoItem label="Email Address" value={student.email || "No email linked"} icon={Mail} />
              <InfoItem label="Account Created" value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "-"} icon={Calendar} />
            </div>
          </section>section

          {/* Institutional Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                Academic Designation
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoItem label="Assigned Grade" value={`Grade ${student.grade || "-"}`} />
              <InfoItem label="Class Section" value={`Section ${student.section || "-"}`} />
              <InfoItem label="Roll Number" value={student.rollNumber || "-"} />
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
