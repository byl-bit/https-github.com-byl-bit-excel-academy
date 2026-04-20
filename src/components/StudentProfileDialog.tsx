"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, GraduationCap, MapPin, Calendar, BookOpen, Fingerprint, Phone, AtSign, CreditCard, Hash, Users as UsersIcon, X, Loader2 } from "lucide-react";
import { normalizeGender, cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface StudentProfileDialogProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentProfileDialog({ student: initialStudent, isOpen, onClose }: StudentProfileDialogProps) {
  const [student, setStudent] = useState(initialStudent);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialStudent?.id) {
      setStudent(initialStudent); // Set initial data immediately
      
      const fetchFullData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/users?id=${initialStudent.id}`);
          if (res.ok) {
            const data = await res.json();
            // API returns array for queries, single object for ID fetch (usually)
            const fullStudent = Array.isArray(data) ? data[0] : data;
            if (fullStudent) setStudent(fullStudent);
          }
        } catch (err) {
          console.error("Failed to fetch full student data:", err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchFullData();
    }
  }, [isOpen, initialStudent]);

  if (!initialStudent) return null;

  const gender = normalizeGender(student?.gender || student?.sex || initialStudent.gender || initialStudent.sex || "");
  const fullName = student?.fullName || student?.name || initialStudent.fullName || initialStudent.name || `${initialStudent.firstName} ${initialStudent.middleName} ${initialStudent.lastName}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl bg-white/90 backdrop-blur-2xl border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden p-0 rounded-4xl ring-1 ring-slate-200/50 flex flex-col max-h-[90vh]">

        {/* Animated Accent Bar */}
        <div className="h-2 w-full bg-linear-to-r from-teal-500 via-cyan-600 to-teal-600 shrink-0" />
        
        {/* Header Section - Sticky */}
        <DialogHeader className="p-6 sm:p-8 pb-4 sm:pb-6 bg-slate-50/50 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
            <GraduationCap className="h-32 w-32" />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="shrink-0 relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-teal-500 to-cyan-600 rounded-3xl blur opacity-25" />
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-2xl bg-white flex items-center justify-center overflow-hidden">
                {student?.photo ? (
                  <img
                    src={student.photo}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 sm:h-12 sm:w-12 text-slate-200" />
                )}
                {loading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                    <Loader2 className="h-6 w-6 text-cyan-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center sm:text-left space-y-2 sm:space-y-3 flex-1 min-w-0">
              <div className="space-y-1">
                <DialogTitle className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight truncate px-2 sm:px-0">
                  {fullName}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Electronic academic record for student {fullName}
                </DialogDescription>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Profile</p>
              </div>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-teal-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">
                  <Fingerprint className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> {student?.studentId || initialStudent?.studentId || "PENDING"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm ring-1 ring-inset",
                  (student?.status || initialStudent?.status) === "active" 
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100" 
                    : "bg-amber-50 text-amber-700 ring-amber-100"
                )}>
                  {student?.status || initialStudent?.status || "PENDING"} ACCOUNT
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 sm:space-y-10 custom-scrollbar">
          {/* Personal Information */}
          <section className="space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3 ml-1">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-xs border border-cyan-100">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-[0.25em]">
                Personal Credentials
              </h3>
            </div>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <InfoItem label="First Name" value={student?.firstName || initialStudent?.firstName || "-"} icon={User} />
              <InfoItem label="Middle Name" value={student?.middleName || initialStudent?.middleName || "-"} icon={User} />
              <InfoItem label="Last Name" value={student?.lastName || initialStudent?.lastName || "-"} icon={User} />
              <InfoItem 
                label="Gender" 
                value={gender === "M" ? "Male" : gender === "F" ? "Female" : "-"} 
                icon={UsersIcon}
              />
              <InfoItem label="Email" value={student?.email || initialStudent?.email || "N/A"} icon={AtSign} isCompact />
              <InfoItem label="Member Since" value={student?.createdAt ? new Date(student.createdAt).toLocaleDateString() : "-"} icon={Calendar} />
            </div>
          </section>

          {/* Academic Information */}
          <section className="space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3 ml-1">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shadow-xs border border-teal-100">
                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <h3 className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-[0.25em]">
                Educational Enrollment
              </h3>
            </div>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <InfoItem label="Level / Grade" value={`Grade ${student?.grade || initialStudent?.grade || "UNSET"}`} icon={BookOpen} color="teal" />
              <InfoItem label="Class Section" value={student?.section || initialStudent?.section || "NOT SET"} icon={MapPin} color="teal" />
              <InfoItem label="Class Roll No" value={student?.rollNumber || (student as any)?.roll_number || initialStudent?.rollNumber || (initialStudent as any)?.roll_number || "PENDING"} icon={Hash} color="teal" />
            </div>
          </section>
        </div>

        {/* Footer Actions - Sticky */}
        <div className="bg-slate-50/80 p-4 sm:p-6 flex justify-end gap-3 backdrop-blur-sm border-t border-slate-100 shrink-0">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Close Profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value, icon: Icon, color = "cyan", isCompact = false }: { label: string; value: string; icon?: any; color?: "cyan" | "teal"; isCompact?: boolean }) {
  return (
    <div className="group space-y-1.5 sm:space-y-2">
      <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </p>
      <div className={cn(
        "flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all duration-300",
        "bg-white/80 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-slate-100",
        color === "cyan" ? "border-slate-100/80 group-hover:border-cyan-100" : "border-slate-100/80 group-hover:border-teal-100"
      )}>
        <div className={cn(
          "shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          color === "cyan" ? "bg-cyan-50 text-cyan-500" : "bg-teal-50 text-teal-500"
        )}>
          {Icon && <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </div>
        <span className={cn(
          "text-xs sm:text-sm font-extrabold text-slate-700 tracking-tight truncate uppercase",
          isCompact && "text-[10px] sm:text-xs font-bold lowercase tracking-normal"
        )}>
          {value}
        </span>
      </div>
    </div>
  );
}
