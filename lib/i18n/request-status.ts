import type { ComponentType } from "react";
import {
  IconClipboardList,
  IconClock,
  IconCircleDot,
  IconTag,
  IconTruckDelivery,
  IconCircleCheck,
  IconCircleX,
  IconBan,
  type Icon,
} from "@tabler/icons-react";

export type RequestStatusTone =
  | "slate"
  | "blue"
  | "amber"
  | "violet"
  | "emerald"
  | "rose"
  | "orange";

export interface RequestStatusMeta {
  /** User-friendly Arabic label */
  label: string;
  /** Soft color tone for the badge */
  tone: RequestStatusTone;
  /** Compact icon (Tabler) */
  icon: Icon;
  /** Short grouping key for summary cards */
  group: "open" | "offers" | "in_progress" | "completed" | "failed" | "cancelled" | "other";
}

/**
 * Single source of truth for client-facing request statuses.
 * Maps Prisma `RequestStatus` enum → Arabic label, tone, and icon.
 * No raw enum value is ever rendered to the user.
 */
export const REQUEST_STATUSES: Record<string, RequestStatusMeta> = {
  PENDING_ADMIN_REVISION:      { label: "قيد المراجعة",  tone: "slate",   icon: IconClock,           group: "other" },
  OPEN_FOR_BIDDING:            { label: "مفتوح",         tone: "blue",    icon: IconClipboardList,  group: "open" },
  OFFERS_FORWARDED:            { label: "عروض مستلمة",   tone: "amber",   icon: IconTag,             group: "offers" },
  ORDER_PAID_PENDING_DELIVERY: { label: "قيد التنفيذ",   tone: "violet",  icon: IconTruckDelivery,   group: "in_progress" },
  CLOSED_SUCCESS:              { label: "مكتمل",          tone: "emerald", icon: IconCircleCheck,     group: "completed" },
  CLOSED_FAILED:               { label: "فشل",            tone: "rose",    icon: IconCircleX,        group: "failed" },
  CLOSED_CANCELLED:            { label: "ملغي",           tone: "rose",    icon: IconBan,            group: "cancelled" },
  REJECTED:                    { label: "مرفوض",          tone: "rose",    icon: IconCircleX,        group: "failed" },
};

export const TONE_STYLES: Record<RequestStatusTone, string> = {
  slate:   "bg-slate-50 text-slate-700 border-slate-200",
  blue:    "bg-blue-50 text-blue-700 border-blue-200",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  violet:  "bg-violet-50 text-violet-700 border-violet-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose:    "bg-rose-50 text-rose-700 border-rose-200",
  orange:  "bg-primary-subtle text-primary border-primary/30",
};

export const TONE_DOT: Record<RequestStatusTone, string> = {
  slate:   "bg-slate-400",
  blue:    "bg-blue-500",
  amber:   "bg-amber-500",
  violet:  "bg-violet-500",
  emerald: "bg-emerald-500",
  rose:    "bg-rose-500",
  orange:  "bg-primary",
};

const FALLBACK_META: RequestStatusMeta = {
  label: "غير معروف",
  tone: "slate",
  icon: IconCircleDot,
  group: "other",
};

export function getStatusMeta(status: string | null | undefined): RequestStatusMeta {
  if (!status) return FALLBACK_META;
  return REQUEST_STATUSES[status] ?? FALLBACK_META;
}

/**
 * Translate a status to its Arabic label. Safe for any caller.
 * Returns "غير معروف" for unknown / missing values.
 */
export function requestStatusLabel(status: string | null | undefined): string {
  return getStatusMeta(status).label;
}

/** Tabler Icon type widened for use in components */
export type StatusIcon = ComponentType<{ size?: number; stroke?: number; className?: string }>;
