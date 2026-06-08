"use client";

import { type Icon } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { IconCheck } from "@tabler/icons-react";

export interface StepperStep {
  key: string;
  label: string;
  shortLabel?: string;
  icon: Icon;
}

export interface RequestStepperProps {
  steps: StepperStep[];
  current: number;
  className?: string;
}

export function RequestStepper({ steps, current, className = "" }: RequestStepperProps) {
  const total = steps.length;

  return (
    <div className={`w-full ${className}`} aria-label="خطوات إنشاء الطلب">
      <ol className="relative flex items-start justify-between gap-0.5 sm:gap-1" role="list">
        {steps.map((step, idx) => {
          const num = idx + 1;
          const IconCmp = step.icon;
          const isCompleted = current > num;
          const isCurrent = current === num;
          const isLast = idx === total - 1;

          return (
            <li
              key={step.key}
              className="relative flex-1 flex flex-col items-center text-center min-w-0"
              aria-current={isCurrent ? "step" : undefined}
            >
              {!isLast && (
                <div className="absolute top-[14px] sm:top-[18px] right-[calc(50%+16px)] sm:right-[calc(50%+20px)] left-[calc(-50%+16px)] sm:left-[calc(-50%+20px)] h-[2px] -z-0 pointer-events-none">
                  <div className="relative w-full h-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 right-0 h-full bg-primary rounded-full"
                      initial={false}
                      animate={{ width: current > num ? "100%" : "0%" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              <div
                className={`relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : isCurrent
                    ? "bg-white border-primary text-primary"
                    : "bg-white border-slate-200 text-slate-300"
                }`}
              >
                {isCompleted ? (
                  <IconCheck size={isCurrent ? 14 : 12} stroke={2.4} />
                ) : (
                  <IconCmp size={isCurrent ? 14 : 12} stroke={isCurrent ? 1.8 : 1.6} />
                )}
              </div>

              <span
                className={`mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold leading-tight transition-colors ${
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                    ? "text-slate-700"
                    : "text-slate-400"
                }`}
              >
                <span className="sm:hidden">{step.shortLabel ?? step.label}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="sr-only" aria-live="polite">
        الخطوة {current} من {total}
      </div>
    </div>
  );
}
