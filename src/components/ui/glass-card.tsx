import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function Card({
  children,
  className,
  hoverEffect = true,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-6 transition-all duration-300",
        hoverEffect && "hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 hover:bg-white/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

export function CardHeader({ title, description, icon: Icon, className, children }: CardHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shadow-inner">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <div>
          <h3 className="text-xl font-black text-slate-800 leading-tight tracking-tight">{title}</h3>
          {description && <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wide">{description}</p>}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}