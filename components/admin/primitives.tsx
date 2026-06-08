/**
 * Admin panel shared primitives.
 *
 * Single source of truth for page headers, status badges, tables, empty/loading
 * states, mobile cards, stat cards, and confirm dialogs. All admin pages
 * should compose from these instead of redefining styles.
 *
 * Design tokens live in components/admin/ui.tsx (AdminButton etc).
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Inbox,
  Loader2,
  Search,
  X,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminButton } from "./ui";

/* ─── 1. PageHeader ──────────────────────────────────────────────────────
 * Title + breadcrumb + optional subtitle + optional right-side action buttons.
 * Use on every admin page instead of bespoke headers.
 * ─────────────────────────────────────────────────────────────────────── */

export interface CrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  crumbs?: CrumbItem[];
  /** Tiny pill above the title (e.g. "لوحة التحكم التشغيلية"). */
  eyebrow?: string;
  /** Status dot in the eyebrow (e.g. "online"). */
  eyebrowTone?: "neutral" | "emerald" | "amber" | "rose" | "blue";
  /** Right-side action area. */
  actions?: React.ReactNode;
  /** Optional metadata strip below title (e.g. date + online count). */
  meta?: React.ReactNode;
  sticky?: boolean;
}

const dotClasses: Record<NonNullable<PageHeaderProps["eyebrowTone"]>, string> = {
  neutral: "bg-slate-300",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  blue: "bg-blue-500",
};

export function PageHeader({
  title,
  subtitle,
  crumbs,
  eyebrow,
  eyebrowTone = "neutral",
  actions,
  meta,
  sticky = false,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "bg-white border-b border-slate-200",
        sticky && "sticky top-0 z-30",
      )}
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-6">
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label="مسار التنقل"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-3 flex-wrap"
          >
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <React.Fragment key={i}>
                  {c.href && !isLast ? (
                    <Link
                      href={c.href}
                      className="hover:text-slate-900 transition-colors"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        isLast
                          ? "text-slate-700 font-bold"
                          : "text-slate-500",
                      )}
                    >
                      {c.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronRight
                      size={12}
                      className="text-slate-300 shrink-0 rotate-180 rtl:rotate-0"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    dotClasses[eyebrowTone],
                  )}
                />
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  {eyebrow}
                </span>
              </div>
            )}
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
            {meta && <div className="mt-3">{meta}</div>}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─── 2. StatusBadge — single source of truth ─────────────────────────── */

export type StatusTone =
  | "slate"
  | "blue"
  | "indigo"
  | "sky"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "orange";

const toneStyles: Record<StatusTone, string> = {
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
};

const dotStyles: Record<StatusTone, string> = {
  slate: "bg-slate-400",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  orange: "bg-orange-500",
};

export interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  /** Render a small leading dot. */
  dot?: boolean;
  size?: "xs" | "sm";
  className?: string;
  ariaLabel?: string;
}

export function StatusBadge({
  tone,
  label,
  dot = false,
  size = "sm",
  className,
  ariaLabel,
}: StatusBadgeProps) {
  const sizeCls =
    size === "xs"
      ? "px-2 py-0.5 text-[9px] rounded-md"
      : "px-2.5 py-1 text-[10px] rounded-lg";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-bold whitespace-nowrap",
        toneStyles[tone],
        sizeCls,
        className,
      )}
      aria-label={ariaLabel ?? `الحالة: ${label}`}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotStyles[tone])} />}
      {label}
    </span>
  );
}

/* Request status → tone + label mapping. Used everywhere request status
   is displayed. Keep in sync with Prisma's `RequestStatus` enum. */
export const REQUEST_STATUS_META: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  PENDING_ADMIN_REVISION: { label: "قيد المراجعة", tone: "amber" },
  OPEN_FOR_BIDDING: { label: "مفتوح للعروض", tone: "blue" },
  BIDS_RECEIVED: { label: "عروض مستلمة", tone: "indigo" },
  OFFERS_FORWARDED: { label: "تم التوجيه", tone: "sky" },
  ORDER_PAID_PENDING_DELIVERY: { label: "قيد التنفيذ", tone: "violet" },
  CLOSED_SUCCESS: { label: "مكتمل", tone: "emerald" },
  CLOSED_CANCELLED: { label: "ملغي", tone: "rose" },
  REJECTED: { label: "مرفوض", tone: "rose" },
};

export function RequestStatusBadge({
  status,
  ...rest
}: { status: string } & Omit<StatusBadgeProps, "tone" | "label">) {
  const meta = REQUEST_STATUS_META[status] ?? { label: status, tone: "slate" as StatusTone };
  return <StatusBadge tone={meta.tone} label={meta.label} {...rest} />;
}

/* Bid status */
export const BID_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  PENDING: { label: "بانتظار", tone: "amber" },
  SELECTED: { label: "مختار", tone: "blue" },
  ACCEPTED_BY_CLIENT: { label: "مقبول من العميل", tone: "emerald" },
  REJECTED_BY_CLIENT: { label: "مرفوض من العميل", tone: "rose" },
  WITHDRAWN: { label: "تم السحب", tone: "slate" },
  EXPIRED: { label: "منتهي", tone: "slate" },
};

/* Complaint status */
export const COMPLAINT_STATUS_META: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  OPEN: { label: "مفتوحة", tone: "amber" },
  IN_PROGRESS: { label: "قيد المعالجة", tone: "blue" },
  RESOLVED: { label: "محلولة", tone: "emerald" },
  REJECTED: { label: "مرفوضة", tone: "rose" },
};

/* Verification status */
export const VERIFICATION_STATUS_META: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  NOT_SUBMITTED: { label: "لم يُقدّم", tone: "slate" },
  PENDING: { label: "بانتظار المراجعة", tone: "amber" },
  APPROVED: { label: "مُوثّق", tone: "emerald" },
  REJECTED: { label: "مرفوض", tone: "rose" },
};

/* Withdrawal status */
export const WITHDRAWAL_STATUS_META: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "بانتظار", tone: "amber" },
  APPROVED: { label: "موافق عليه", tone: "emerald" },
  REJECTED: { label: "مرفوض", tone: "rose" },
  COMPLETED: { label: "منجز", tone: "emerald" },
  FAILED: { label: "فشل", tone: "rose" },
};

/* Transaction type → tone + label */
export const TX_TYPE_META: Record<string, { label: string; tone: StatusTone }> = {
  ESCROW_DEPOSIT: { label: "إيداع ضامن", tone: "blue" },
  VENDOR_PAYOUT: { label: "صرف تاجر", tone: "emerald" },
  DELIVERY_PAYOUT: { label: "صرف مندوب", tone: "emerald" },
  ADMIN_COMMISSION: { label: "عمولة", tone: "violet" },
  REFUND: { label: "استرداد", tone: "amber" },
  WITHDRAWAL: { label: "سحب", tone: "slate" },
  WALLET_TOPUP: { label: "شحن محفظة", tone: "blue" },
};

/* Delivery tracking status */
export const DELIVERY_STATUS_META: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "بانتظار", tone: "slate" },
  PREPARING: { label: "بيتجهز", tone: "amber" },
  READY_FOR_PICKUP: { label: "جاهز للاستلام", tone: "blue" },
  OUT_FOR_DELIVERY: { label: "في الطريق", tone: "violet" },
  DELIVERED: { label: "تم التسليم", tone: "emerald" },
  FAILED: { label: "فشل", tone: "rose" },
  RETURNED: { label: "مرتجع", tone: "slate" },
};

/* Flagged content severity */
export const FLAGGED_SEVERITY_META: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  LOW: { label: "منخفضة", tone: "slate" },
  MEDIUM: { label: "متوسطة", tone: "amber" },
  HIGH: { label: "مرتفعة", tone: "orange" },
  CRITICAL: { label: "حرجة", tone: "rose" },
};

/* ─── 3. TableCard — uniform table wrapper ───────────────────────────── */

export interface TableCardProps {
  /** Header label, e.g. "أحدث العمليات". */
  title?: React.ReactNode;
  /** Right-side of the title row (e.g. count, link). */
  titleAction?: React.ReactNode;
  /** Subtle line below the title. */
  description?: React.ReactNode;
  /** Optional toolbar area (search, filters). */
  toolbar?: React.ReactNode;
  /** Body. */
  children: React.ReactNode;
  className?: string;
  /** Removes the inner padding, e.g. for full-bleed tables. */
  flush?: boolean;
}

export function TableCard({
  title,
  titleAction,
  description,
  toolbar,
  children,
  className,
  flush = false,
}: TableCardProps) {
  const hasHeader = !!(title || titleAction || description || toolbar);
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden",
        className,
      )}
    >
      {hasHeader && (
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 space-y-3">
          {(title || titleAction) && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                {title && (
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                )}
              </div>
              {titleAction && (
                <div className="shrink-0">{titleAction}</div>
              )}
            </div>
          )}
          {toolbar && <div>{toolbar}</div>}
        </div>
      )}
      <div className={cn(!flush && "p-4 sm:p-6")}>{children}</div>
    </div>
  );
}

/* ─── 4. EmptyState / ErrorState / LoadingState ──────────────────────── */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-14 px-6",
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mb-4 shadow-sm">
        <Icon size={26} />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-14 px-6",
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
        <AlertTriangle size={26} />
      </div>
      <h3 className="text-sm font-bold text-slate-900">حصل مشكلة</h3>
      <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <AdminButton
          variant="soft"
          size="sm"
          onClick={onRetry}
          className="mt-4"
        >
          إعادة المحاولة
        </AdminButton>
      )}
    </div>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}

export function PageLoading({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 size={28} className="animate-spin text-primary" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

/* ─── 5. DataTable — uniform responsive table ────────────────────────── */

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  /** Tailwind class for the TH and TD (e.g. "text-center", "w-32"). */
  className?: string;
  /** Optional header class. */
  thClassName?: string;
  /** Cell renderer. */
  render: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  empty?: React.ReactNode;
  loading?: boolean;
  /** Render an alternate card list for mobile (passed through TableCard). */
  mobileCard?: (row: T, index: number) => React.ReactNode;
  /** Min width of the inner table (forces horizontal scroll on narrow). */
  minWidth?: number;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  loading,
  mobileCard,
  minWidth = 720,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingState rows={4} />;
  }
  if (!rows || rows.length === 0) {
    return (
      <div className="px-2 py-6">
        {empty ?? <EmptyState title="مفيش بيانات" />}
      </div>
    );
  }
  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table
          className={cn("w-full text-right border-collapse", className)}
          style={{ minWidth }}
        >
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest",
                    c.thClassName ?? c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                className={cn(
                  "group transition-colors",
                  onRowClick && "cursor-pointer hover:bg-slate-50",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-4 py-3 text-sm text-slate-700", c.className)}
                  >
                    {c.render(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards (optional) */}
      {mobileCard && (
        <div className="sm:hidden space-y-3">
          {rows.map((row, i) => (
            <div key={rowKey(row, i)}>{mobileCard(row, i)}</div>
          ))}
        </div>
      )}
    </>
  );
}

/* ─── 6. StatCard — KPI tile ─────────────────────────────────────────── */

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; up?: boolean };
  badge?: { label: string; tone?: "neutral" | "amber" | "emerald" | "rose" | "blue" };
  href?: string;
  className?: string;
  /** Accent color for the icon background. */
  tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "primary";
}

const iconTone: Record<NonNullable<StatCardProps["tone"]>, string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  primary: "bg-orange-50 text-orange-600 border-orange-100",
};

const badgeTone: Record<NonNullable<NonNullable<StatCardProps["badge"]>["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-500",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  blue: "bg-blue-100 text-blue-700",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  badge,
  href,
  className,
  tone = "primary",
}: StatCardProps) {
  const inner = (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3",
        href && "hover:border-slate-300 hover:shadow-md transition-all",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0",
            iconTone[tone],
          )}
        >
          <Icon size={20} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
            {label}
          </p>
          {badge && (
            <span
              className={cn(
                "shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                badgeTone[badge.tone ?? "neutral"],
              )}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-tight">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "text-[10px] font-bold",
                trend.up ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {trend.up ? "▲" : "▼"} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ─── 7. SearchInput — uniform search bar ─────────────────────────────── */

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Debounce delay in ms (default 250). */
  debounceMs?: number;
  ariaLabel?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "ابحث...",
  className,
  debounceMs = 250,
  ariaLabel = "بحث",
}: SearchInputProps) {
  const [local, setLocal] = React.useState(value);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value
  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = React.useCallback(
    (v: string) => {
      setLocal(v);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onChange(v), debounceMs);
    },
    [onChange, debounceMs],
  );

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <Search
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "w-full h-10 pr-9 pl-9 bg-white border border-slate-200 rounded-xl text-sm font-medium",
          "text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:border-slate-400 focus:bg-white transition-colors",
        )}
      />
      {local && (
        <button
          type="button"
          onClick={() => handleChange("")}
          aria-label="مسح"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ─── 8. Pagination — uniform pagination row ─────────────────────────── */

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 pt-4 flex-wrap",
        className,
      )}
    >
      <div className="text-[11px] text-slate-500 font-semibold">
        صفحة {page} من {totalPages}
        {typeof totalItems === "number" && ` • ${totalItems} عنصر`}
      </div>
      <div className="flex items-center gap-1.5">
        <AdminButton
          variant="soft"
          size="xs"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          leadingIcon={ArrowRight}
        >
          السابق
        </AdminButton>
        <AdminButton
          variant="soft"
          size="xs"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          trailingIcon={ArrowRight}
        >
          التالي
        </AdminButton>
      </div>
    </div>
  );
}

/* ─── 9. ConfirmDialog — typed confirm for destructive actions ───────── */

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Word the user must type to enable the confirm button. */
  requiredText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  requiredText,
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState("");
  const router = useRouter();
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  if (!open) return null;

  const canConfirm = requiredText ? typed === requiredText : true;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="px-6 py-5 flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              variant === "danger"
                ? "bg-rose-50 text-rose-600"
                : "bg-orange-50 text-orange-600",
            )}
          >
            <Info size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="font-black text-slate-900 text-base"
            >
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {requiredText && (
          <div className="px-6 pb-4">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              اكتب <span className="font-mono text-rose-600">{requiredText}</span> للتأكيد
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
            />
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <AdminButton variant="soft" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </AdminButton>
          <AdminButton
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={!canConfirm}
            isLoading={loading}
          >
            {confirmText}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

/* ─── 10. Toast (simple inline) ──────────────────────────────────────── */

export interface InlineToastProps {
  type: "ok" | "err";
  message: string;
  onClose?: () => void;
  className?: string;
}

export function InlineToast({ type, message, onClose, className }: InlineToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border",
        type === "ok"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200",
        className,
      )}
    >
      {type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="w-6 h-6 rounded-md hover:bg-white/40 flex items-center justify-center"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/* ─── 11. DataCard — for displaying a list of key/value pairs in detail pages */

export interface DataField {
  label: string;
  value: React.ReactNode;
  /** Render a small badge instead of plain value (uses StatusBadge). */
  badge?: StatusBadgeProps;
  icon?: LucideIcon;
}

export function DataCard({
  title,
  fields,
  action,
  className,
}: {
  title?: React.ReactNode;
  fields: DataField[];
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden",
        className,
      )}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          {title && (
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          )}
          {action}
        </div>
      )}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {fields.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="flex items-start gap-2.5 min-w-0">
              {Icon && (
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {f.label}
                </p>
                <div className="text-sm font-semibold text-slate-900 break-words">
                  {f.badge ? (
                    <StatusBadge
                      tone={f.badge.tone}
                      label={f.badge.label}
                      size={f.badge.size}
                    />
                  ) : (
                    f.value
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 12. Section title ──────────────────────────────────────────────── */

export function SectionTitle({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 flex-wrap", className)}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Icon size={15} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 truncate">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── 13. DetailPanel — consistent side panel for selected items ───── */
export interface DetailPanelField {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  highlight?: boolean;
  fullWidth?: boolean;
}

export interface DetailPanelProps {
  title: string;
  subtitle?: React.ReactNode;
  fields: DetailPanelField[];
  /** Grid at the top of the panel body. */
  summaryGrid?: { label: string; value: React.ReactNode }[];
  /** Action buttons at the bottom. */
  actions?: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export function DetailPanel({
  title,
  subtitle,
  fields,
  summaryGrid,
  actions,
  onClose,
  className,
}: DetailPanelProps) {
  return (
    <aside
      className={cn(
        "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 truncate">{title}</h2>
          {subtitle && (
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          aria-label="إغلاق"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {summaryGrid && summaryGrid.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {summaryGrid.map((item, i) => (
              <div
                key={i}
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-center"
              >
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {fields.map((f, i) => (
            <DetailRow key={i} {...f} />
          ))}
        </div>

        {actions && (
          <div className="pt-3 border-t border-slate-100 space-y-2">{actions}</div>
        )}
      </div>
    </aside>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
  highlight,
  fullWidth,
}: DetailPanelField) {
  return (
    <div className="flex items-start justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-slate-200 transition-all">
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shrink-0 mt-0.5">
            <Icon size={13} />
          </div>
        )}
        <div className={cn("min-w-0 flex-1", !fullWidth && "max-w-[200px]")}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p
            className={cn(
              "text-sm font-bold leading-tight mt-0.5 break-words",
              highlight ? "text-primary" : "text-slate-900",
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 14. TableSkeleton — for consistent loading states ────────────── */

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("space-y-3 p-4", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}

/* Re-export FileText so consumers don't have to import it for placeholders */
export { FileText };
