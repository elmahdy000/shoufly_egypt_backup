"use client";

import { IconSparkles } from "@tabler/icons-react";

export interface CreateRequestHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
}

export function CreateRequestHeader({
  badge = "طلب جديد",
  title,
  subtitle,
}: CreateRequestHeaderProps) {
  return (
    <header className="text-center sm:text-right">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
        <IconSparkles size={12} stroke={1.6} />
        <span>{badge}</span>
      </div>
      <h1 className="text-[22px] sm:text-heading-1 leading-tight font-bold text-slate-900 mt-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[13px] sm:text-body-soft text-slate-500 mt-1">
          {subtitle}
        </p>
      )}
    </header>
  );
}
