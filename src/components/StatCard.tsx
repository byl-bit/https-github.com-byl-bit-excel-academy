import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  variant?: "default" | "vibrant" | "outline";
  className?: string;
  description?: string;
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  variant = "default",
  className,
  description,
}: StatCardProps) {
  const variants = {
    default: "bg-white border-slate-100 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 text-slate-900",
    vibrant: "bg-linear-to-br from-cyan-600 to-teal-700 shadow-2xl shadow-cyan-500/20 text-white",
    outline: "bg-transparent border-slate-200 border-dashed text-slate-600",
  };

  const labelColors = {
    default: "text-slate-400",
    vibrant: "text-cyan-100 opacity-80",
    outline: "text-slate-400",
  };

  const unitColors = {
    default: "text-cyan-600",
    vibrant: "text-cyan-200",
    outline: "text-slate-400",
  };

  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all duration-300 group",
      variants[variant],
      className
    )}>
      <div className="flex justify-between items-start mb-2">
        <p className={cn("text-[10px] font-black uppercase tracking-widest", labelColors[variant])}>
          {label}
        </p>
        {Icon && (
          <Icon className={cn("h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity")} />
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black tracking-tight">{value}</span>
        {unit && (
          <span className={cn("text-lg font-bold", unitColors[variant])}>{unit}</span>
        )}
      </div>

      {description && (
        <p className={cn("mt-2 text-[10px] font-bold uppercase tracking-wide opacity-60")}>
          {description}
        </p>
      )}
    </div>
  );
}
