"use client";

import { IconArrowRight, IconArrowLeft, IconLoader2 } from "@tabler/icons-react";

export interface NavigationButtonsProps {
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

export function NavigationButtons({
  onPrev,
  onNext,
  nextLabel = "التالي",
  prevLabel = "السابق",
  nextDisabled,
  prevDisabled,
  nextLoading,
  isLastStep,
  lastStepLabel = "تأكيد ونشر الطلب",
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center gap-3 w-full" dir="rtl">
      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          disabled={prevDisabled}
          className="sf-btn-secondary h-13 px-5 shrink-0"
        >
          <IconArrowRight size={18} stroke={1.8} />
          <span>{prevLabel}</span>
        </button>
      )}

      {(onNext || isLastStep) && (
        <button
          type={isLastStep ? "submit" : "button"}
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className={`sf-btn-primary flex-1 ${onPrev ? "" : "w-full"}`}
        >
          {nextLoading ? (
            <IconLoader2 size={18} stroke={1.8} className="animate-spin" />
          ) : isLastStep ? null : (
            <IconArrowLeft size={18} stroke={1.8} />
          )}
          <span>{isLastStep ? lastStepLabel : nextLabel}</span>
        </button>
      )}
    </div>
  );
}
