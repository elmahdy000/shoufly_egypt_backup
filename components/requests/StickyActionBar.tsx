"use client";

import { IconArrowRight, IconArrowLeft, IconLoader2 } from "@tabler/icons-react";

export interface StickyActionBarProps {
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
  nextLoading?: boolean;
  isLastStep?: boolean;
  lastStepLabel?: string;
}

export function StickyActionBar({
  onPrev,
  onNext,
  nextLabel = "التالي",
  prevLabel = "السابق",
  nextDisabled,
  prevDisabled,
  nextLoading,
  isLastStep,
  lastStepLabel = "نشر الطلب",
}: StickyActionBarProps) {
  const hasSecondary = !!onPrev;
  const primaryLabel = isLastStep ? lastStepLabel : nextLabel;
  const primaryType = isLastStep ? "submit" : "button";
  const PrimaryIcon = isLastStep ? null : IconArrowLeft;
  const SecondaryIcon = IconArrowRight;

  return (
    <div
      className="fixed inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bottom-16 md:bottom-0"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto flex items-center gap-2.5">
        {hasSecondary && (
          <button
            type="button"
            onClick={onPrev}
            disabled={prevDisabled}
            aria-label={prevLabel}
            className="h-12 w-12 sm:w-auto sm:px-4 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SecondaryIcon size={16} stroke={1.8} />
            <span className="hidden sm:inline">{prevLabel}</span>
          </button>
        )}

        <button
          type={primaryType}
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          aria-label={primaryLabel}
          className={`h-12 inline-flex items-center justify-center gap-2 rounded-xl font-bold text-[15px] text-white transition active:scale-[0.98] disabled:cursor-not-allowed ${
            hasSecondary ? "flex-1" : "w-full"
          } ${
            nextDisabled || nextLoading
              ? "bg-slate-300"
              : "bg-primary hover:bg-primary-hover"
          }`}
        >
          {nextLoading ? (
            <IconLoader2 size={18} stroke={1.8} className="animate-spin" />
          ) : PrimaryIcon ? (
            <PrimaryIcon size={18} stroke={1.8} />
          ) : null}
          <span>{primaryLabel}</span>
        </button>
      </div>
    </div>
  );
}
