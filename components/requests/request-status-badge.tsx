import {
  getStatusMeta,
  TONE_STYLES,
  TONE_DOT,
  type RequestStatusTone,
} from "@/lib/i18n/request-status";

interface RequestStatusBadgeProps {
  status: string;
  /** Optional override for the label; defaults to the mapped Arabic label */
  label?: string;
  /** Tone override; defaults to the mapped tone */
  tone?: RequestStatusTone;
  /** Render as a compact dot-only chip (no label) */
  compact?: boolean;
  className?: string;
}

export function RequestStatusBadge({
  status,
  label,
  tone,
  compact = false,
  className = "",
}: RequestStatusBadgeProps) {
  const meta = getStatusMeta(status);
  const resolvedTone = tone ?? meta.tone;
  const resolvedLabel = label ?? meta.label;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${TONE_STYLES[resolvedTone]} ${className}`}
      aria-label={`حالة الطلب: ${resolvedLabel}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[resolvedTone]}`} aria-hidden="true" />
      {compact ? null : <Icon size={12} stroke={2} className="opacity-80" aria-hidden="true" />}
      {compact ? null : <span>{resolvedLabel}</span>}
    </span>
  );
}
