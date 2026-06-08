"use client";

import { IconAlertCircle } from "@tabler/icons-react";

export interface ProblemDescriptionFieldProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  maxLength?: number;
  placeholder?: string;
}

export function ProblemDescriptionField({
  value,
  onChange,
  error,
  maxLength = 1000,
  placeholder = "اشرح المشكلة باختصار، مثال: الشاشة مكسورة أو الجهاز لا يعمل",
}: ProblemDescriptionFieldProps) {
  return (
    <div className="surface-card-soft p-3.5 sm:p-4" data-has-error={!!error}>
      <label htmlFor="description" className="sf-label flex items-center gap-1.5">
        <IconAlertCircle size={14} className="text-primary" stroke={1.6} />
        وصف المشكلة <span className="text-danger">*</span>
      </label>
      <textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        aria-invalid={!!error}
        placeholder={placeholder}
        className="sf-input resize-none"
        maxLength={maxLength}
      />
      {error ? (
        <p className="sf-error">{error}</p>
      ) : (
        <div className="flex items-center justify-between mt-1.5">
          <p className="sf-helper !mt-0">كل ما التفاصيل أكتر، العروض أحسن.</p>
          <span className="text-helper">
            {value.length} / {maxLength}
          </span>
        </div>
      )}
    </div>
  );
}
