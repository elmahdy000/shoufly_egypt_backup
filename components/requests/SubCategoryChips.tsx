"use client";

import { useRef } from "react";
import { IconChevronLeft, IconChevronRight, IconCheck } from "@tabler/icons-react";

export interface SubCategoryChipsProps {
  items: Array<{ id: number; name: string }>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  label?: string;
  required?: boolean;
  emptyMessage?: string;
}

export function SubCategoryChips({
  items,
  selectedId,
  onSelect,
  label = "التخصص الفرعي",
  required,
  emptyMessage = "لا توجد تخصصات فرعية في هذا القسم.",
}: SubCategoryChipsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (items.length === 0) {
    return (
      <section aria-label={label} className="surface-card-soft p-4 text-center text-helper">
        {emptyMessage}
      </section>
    );
  }

  return (
    <section aria-label={label} className="surface-card-soft p-3.5 sm:p-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy("left")}
            aria-label="تمرير يمين"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center"
          >
            <IconChevronRight size={14} stroke={1.8} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy("right")}
            aria-label="تمرير يسار"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center"
          >
            <IconChevronLeft size={14} stroke={1.8} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="chip-scroll flex gap-2 overflow-x-auto no-scrollbar flex-wrap sm:flex-nowrap"
        role="radiogroup"
        aria-label={label}
      >
        {items.map((item) => {
          const isSel = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSel}
              onClick={() => onSelect(item.id)}
              className={`shrink-0 inline-flex items-center gap-1 h-9 px-3.5 sm:px-4 rounded-full text-[13px] sm:text-sm font-semibold transition-colors duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSel
                  ? "bg-primary-subtle border-primary text-primary"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {isSel && <IconCheck size={12} stroke={2.4} />}
              <span className="whitespace-nowrap">{item.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
