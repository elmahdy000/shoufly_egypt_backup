"use client";

import { type ComponentType, type SVGProps } from "react";
import { IconCheck } from "@tabler/icons-react";

export interface CategoryCardProps {
  id: number;
  name: string;
  icon?: ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;
  image?: string;
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({ name, icon: Icon, image, isSelected, onClick }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={name}
      className={`group relative w-full text-right rounded-xl border-[1.5px] transition-colors duration-150 p-3 sm:p-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        isSelected
          ? "bg-primary/[0.06] border-primary"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? "bg-primary text-white"
              : "bg-slate-50 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary"
          }`}
        >
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : Icon ? (
            <Icon size={18} strokeWidth={1.6} />
          ) : null}
        </div>

        <p
          className={`flex-1 min-w-0 text-[13px] sm:text-sm font-semibold leading-snug truncate ${
            isSelected ? "text-slate-900" : "text-slate-800"
          }`}
        >
          {name}
        </p>

        {isSelected && (
          <IconCheck
            size={14}
            stroke={2.4}
            className="text-primary shrink-0"
            aria-hidden
          />
        )}
      </div>
    </button>
  );
}
