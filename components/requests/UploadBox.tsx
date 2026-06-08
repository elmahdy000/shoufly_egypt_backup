"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { IconPhotoPlus, IconX, IconAlertCircle, IconPhoto, IconLoader2 } from "@tabler/icons-react";

export interface UploadBoxProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxBytes?: number;
  acceptedTypes?: string[];
  uploading?: boolean;
  errorMessage?: string | null;
  helperText?: string;
}

const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function UploadBox({
  files,
  onChange,
  maxFiles = 4,
  maxBytes = 5 * 1024 * 1024,
  acceptedTypes = DEFAULT_TYPES,
  uploading = false,
  errorMessage = null,
  helperText = "ارفع صورة توضّح المشكلة علشان الموردين يقدروا يقدّموا عروض دقيقة.",
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayedError = errorMessage || localError;

  useEffect(() => {
    if (localError) setLocalError(null);
     
  }, [files]);

  const handleFiles = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;

    const rejected: string[] = [];
    const accepted: File[] = [];

    Array.from(picked).forEach((file) => {
      if (!acceptedTypes.includes(file.type)) {
        rejected.push(`${file.name} (نوع غير مدعوم)`);
        return;
      }
      if (file.size > maxBytes) {
        rejected.push(`${file.name} (أكبر من ${Math.round(maxBytes / 1024 / 1024)} ميجابايت)`);
        return;
      }
      accepted.push(file);
    });

    const remaining = Math.max(0, maxFiles - files.length);
    const toAdd = accepted.slice(0, remaining);
    const dropped = accepted.length - toAdd.length;

    if (toAdd.length > 0) onChange([...files, ...toAdd]);

    const messages: string[] = [];
    if (rejected.length > 0) messages.push(`تم رفض ${rejected.length} ملف`);
    if (dropped > 0) messages.push(`تم اختيار أول ${toAdd.length} صور فقط (الحد ${maxFiles})`);
    if (messages.length > 0) setLocalError(messages.join(" — "));
  };

  const removeAt = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const isAtMax = files.length >= maxFiles;

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  return (
    <div className="surface-card-soft p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <IconPhoto size={18} stroke={1.6} className="text-primary" />
        <h3 className="text-section-title">صور توضيحية</h3>
        <span className="text-helper">اختياري</span>
      </div>
      <p className="text-body-soft mb-5">{helperText}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {files.map((file, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm"
          >
            <img
              src={previews[i]}
              alt={`صورة ${i + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center" aria-hidden>
                <IconLoader2 size={24} stroke={1.8} className="animate-spin text-white" />
              </div>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`حذف الصورة ${i + 1}`}
              className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-danger active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <IconX size={14} stroke={1.8} />
            </button>
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/55 text-white text-[10px] font-semibold leading-none">
              {i + 1}/{files.length}
            </span>
          </div>
        ))}

        {!isAtMax && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <IconLoader2 size={22} stroke={1.6} className="animate-spin" />
            ) : (
              <IconPhotoPlus size={22} stroke={1.6} />
            )}
            <span className="text-[11px] sm:text-xs font-semibold">
              {files.length === 0 ? "رفع صور" : "إضافة صورة"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex items-center justify-between mt-4 text-helper">
        <span>
          {files.length} / {maxFiles} صور
        </span>
        {displayedError && (
          <span className="text-danger flex items-center gap-1.5">
            <IconAlertCircle size={13} stroke={1.6} />
            {displayedError}
          </span>
        )}
      </div>
    </div>
  );
}
