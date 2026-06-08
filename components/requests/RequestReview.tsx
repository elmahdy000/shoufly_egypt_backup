"use client";

import { IconCheck, type Icon } from "@tabler/icons-react";

export interface ReviewItem {
  label: string;
  value: string;
  icon?: Icon;
  action?: React.ReactNode;
}

export interface RequestReviewProps {
  title: string;
  items: ReviewItem[];
  notes?: { label: string; value: string } | null;
  budgetSlot?: React.ReactNode;
  budgetHelperText?: string;
  tipText?: string;
  loading?: boolean;
}

export function RequestReview({
  title,
  items,
  notes,
  budgetSlot,
  budgetHelperText = "نشر ميزانية تقديرية يساعد الموردين على تقديم عروض تنافسية بسرعة.",
  tipText = "بمجرد النشر، هيوصل طلبك لمئات الموردين المعتمدين في منطقتك.",
  loading = false,
}: RequestReviewProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="surface-card p-4 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IconCheck size={18} stroke={1.8} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">مراجعة الطلب</h2>
            <p className="text-helper mt-0.5 leading-snug">{tipText}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 mb-1">عنوان الطلب</p>
            <p className="text-[15px] sm:text-base font-bold text-slate-900 leading-snug">{title || "—"}</p>
          </div>

          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100"
              >
                {Icon && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <Icon size={14} stroke={1.6} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500">{item.label}</p>
                  <p className="text-[13px] sm:text-sm font-medium text-slate-800 mt-0.5 break-words leading-relaxed">
                    {item.value || "—"}
                  </p>
                </div>
                {item.action && <div className="shrink-0">{item.action}</div>}
              </div>
            );
          })}

          {notes && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 mb-1">{notes.label}</p>
              <p className="text-[13px] sm:text-sm font-medium text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                {notes.value || "—"}
              </p>
            </div>
          )}

          {budgetSlot && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-primary/[0.04] border border-primary/15">
              {budgetSlot}
              <p className="text-helper mt-2">{budgetHelperText}</p>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-helper py-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          جاري نشر الطلب...
        </div>
      )}
    </div>
  );
}
