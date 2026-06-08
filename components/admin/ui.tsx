"use client";

import * as React from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accepts both lucide-react icons and react-icons icon components. */
export type AdminIcon = LucideIcon | React.ComponentType<{ size?: number; className?: string }>;

/* ───────────────────────────────────────────────────────────────────────────
 * Admin UI Kit
 *
 * Centralized, RTL-aware button and control primitives for the admin panel.
 *
 * Design tokens (use these — do not hardcode raw colors in pages):
 *   - Primary   → orange   (one main action per section only)
 *   - Secondary → navy     (strong secondary action)
 *   - Soft      → white/light navy tint (chat, contact, neutral)
 *   - Ghost     → transparent with hover
 *   - Outline   → bordered neutral
 *   - Danger    → rose (destructive)
 *   - Success   → emerald (confirmed states)
 *   - Disabled  → muted slate, no misleading contrast
 *
 * Size scale (consistent across the admin):
 *   - xs → h-8  px-3 text-xs    (chips, table actions)
 *   - sm → h-9  px-3.5 text-xs (toolbar buttons)
 *   - md → h-10 px-4 text-sm    (default)
 *   - lg → h-11 px-5 text-sm    (page header buttons)
 * ─────────────────────────────────────────────────────────────────────────── */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "ghost"
  | "outline"
  | "danger"
  | "success";

type ButtonSize = "xs" | "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-500/30 shadow-sm",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-slate-900/30 shadow-sm",
  soft:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-slate-200",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-200",
  outline:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:ring-slate-200",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500/30 shadow-sm",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500/30 shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  sm: "h-9 px-3.5 text-xs gap-2 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
};

const baseClasses =
  "inline-flex items-center justify-center font-bold whitespace-nowrap select-none transition-all duration-150 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "active:scale-[0.97]";

export interface AdminButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leadingIcon?: AdminIcon;
  trailingIcon?: AdminIcon;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}

/**
 * AdminButton — the canonical button for the admin panel.
 * Use this instead of inline `<button>` or ad-hoc `<Button>` variants.
 */
export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  function AdminButton(
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 size={size === "xs" || size === "sm" ? 14 : 16} className="animate-spin shrink-0" />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {LeadingIcon && <LeadingIcon size={size === "xs" || size === "sm" ? 14 : 16} className="shrink-0" />}
            {children}
            {TrailingIcon && <TrailingIcon size={size === "xs" || size === "sm" ? 14 : 16} className="shrink-0" />}
          </>
        )}
      </button>
    );
  }
);

/* ─── IconButton — square button with only an icon ──────────────────────── */

const iconSizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 w-8",
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

export interface AdminIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  icon: AdminIcon;
  variant?: Exclude<ButtonVariant, "soft"> | "soft";
  size?: ButtonSize;
  label: string;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
}

export const AdminIconButton = React.forwardRef<HTMLButtonElement, AdminIconButtonProps>(
  function AdminIconButton(
    { icon: Icon, variant = "soft", size = "md", label, isLoading, className, disabled, type = "button", ...props },
    ref
  ) {
    const iconPx = size === "xs" ? 14 : size === "sm" ? 16 : size === "md" ? 18 : 20;
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-label={label}
        title={label}
        className={cn(
          baseClasses,
          variantClasses[variant],
          iconSizeClasses[size],
          "p-0 rounded-lg",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={iconPx} className="animate-spin" />
        ) : (
          <Icon size={iconPx} />
        )}
      </button>
    );
  }
);

/* ─── BackButton — small, neutral, never dominant ──────────────────────── */

export interface AdminBackButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  label?: string;
  type?: "button" | "submit" | "reset";
}

export const AdminBackButton = React.forwardRef<HTMLButtonElement, AdminBackButtonProps>(
  function AdminBackButton({ label = "رجوع", className, children, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg",
          "bg-white border border-slate-200 text-slate-600 text-xs font-bold",
          "hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200",
          "transition-colors",
          className
        )}
        {...props}
      >
        {children ?? <span>{label}</span>}
      </button>
    );
  }
);

/* ─── FilterChip — soft pill for filters and tabs ───────────────────────── */

type ChipTone = "neutral" | "primary" | "emerald" | "rose" | "amber" | "blue";

const chipToneClasses: Record<ChipTone, { idle: string; active: string }> = {
  neutral: {
    idle: "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700",
    active: "bg-slate-900 text-white border-slate-900 shadow-sm",
  },
  primary: {
    idle: "bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-600",
    active: "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20",
  },
  emerald: {
    idle: "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700",
    active: "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20",
  },
  rose: {
    idle: "bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-700",
    active: "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20",
  },
  amber: {
    idle: "bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-700",
    active: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20",
  },
  blue: {
    idle: "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-700",
    active: "bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20",
  },
};

export interface AdminFilterChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  label: string;
  count?: number;
  icon?: AdminIcon;
  active?: boolean;
  tone?: ChipTone;
  size?: "xs" | "sm";
  type?: "button" | "submit" | "reset";
}

export const AdminFilterChip = React.forwardRef<HTMLButtonElement, AdminFilterChipProps>(
  function AdminFilterChip(
    {
      label,
      count,
      icon: Icon,
      active = false,
      tone = "neutral",
      size = "sm",
      className,
      type = "button",
      ...props
    },
    ref
  ) {
    const tones = chipToneClasses[tone];
    const sizeCls =
      size === "xs"
        ? "h-7 px-2.5 text-[10px] gap-1 rounded-md"
        : "h-9 px-3 text-xs gap-1.5 rounded-lg";
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center font-bold whitespace-nowrap border transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-200",
          sizeCls,
          active ? tones.active : tones.idle,
          className
        )}
        {...props}
      >
        {Icon && <Icon size={12} className="shrink-0" />}
        <span>{label}</span>
        {typeof count === "number" && count > 0 && (
          <span
            className={cn(
              "inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[9px] font-black",
              active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  }
);

/* ─── ActionChip — small inline link/button (e.g. "فتح الطلب") ─────────── */

type ActionTone = "primary" | "neutral" | "danger";

const actionToneClasses: Record<ActionTone, string> = {
  primary:
    "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500",
  neutral:
    "bg-white text-slate-600 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900",
  danger:
    "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500",
};

export interface AdminActionChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  label: string;
  icon?: AdminIcon;
  tone?: ActionTone;
  type?: "button" | "submit" | "reset";
}

export const AdminActionChip = React.forwardRef<HTMLButtonElement, AdminActionChipProps>(
  function AdminActionChip(
    { label, icon: Icon, tone = "neutral", className, type = "button", ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 h-7 rounded-md border text-[10px] font-bold",
          "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-200",
          actionToneClasses[tone],
          className
        )}
        {...props}
      >
        {Icon && <Icon size={11} className="shrink-0" />}
        <span>{label}</span>
      </button>
    );
  }
);

/* ─── Re-export common admin button patterns for quick use ──────────────── */

export const adminButtonStyles = {
  base: baseClasses,
  variant: variantClasses,
  size: sizeClasses,
};
