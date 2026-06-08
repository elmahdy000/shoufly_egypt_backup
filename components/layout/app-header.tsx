"use client";

import React from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Home,
  LogOut,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { NotificationDropdown } from "@/components/shoofly/notification-dropdown";
import { logoutUser } from "@/lib/api/auth";

type HeaderNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type RoleKey = "client" | "vendor" | "delivery" | "unknown";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

const ROLE_NAV: Record<RoleKey, { items: HeaderNavItem[]; profileHref: string }> = {
  client: {
    profileHref: "/client/profile",
    items: [
      { href: "/client", label: "الرئيسية", icon: Home },
      { href: "/client/requests", label: "الطلبات", icon: Package },
      { href: "/client/wallet", label: "المحفظة", icon: Wallet },
    ],
  },
  vendor: {
    profileHref: "/vendor/profile",
    items: [
      { href: "/vendor", label: "الرئيسية", icon: Home },
      { href: "/vendor/requests", label: "الطلبات", icon: Package },
      { href: "/vendor/bids", label: "العروض", icon: ShoppingBag },
      { href: "/vendor/earnings", label: "الأرباح", icon: TrendingUp },
    ],
  },
  delivery: {
    profileHref: "/delivery/profile",
    items: [
      { href: "/delivery", label: "الرئيسية", icon: Home },
      { href: "/delivery/tasks", label: "المهام", icon: ClipboardList },
    ],
  },
  unknown: {
    profileHref: "/",
    items: [{ href: "/", label: "الرئيسية", icon: Home }],
  },
};

function detectRole(pathname: string): RoleKey {
  if (pathname.startsWith("/client")) return "client";
  if (pathname.startsWith("/vendor")) return "vendor";
  if (pathname.startsWith("/delivery")) return "delivery";
  return "unknown";
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/client" || href === "/vendor" || href === "/delivery") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = detectRole(pathname);
  const navConfig = ROLE_NAV[role];

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex h-14 sm:h-16 max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 dir-rtl">
        {/* Brand */}
        <Link
          href={navConfig.profileHref.replace(/\/profile$/, "") || "/"}
          className="flex min-w-0 items-center gap-2.5 group"
          aria-label="شوفلي"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/20 transition-transform group-active:scale-95">
            <Zap size={18} strokeWidth={2.4} />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-[15px] sm:text-base font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="hidden sm:block truncate text-[11px] font-medium text-slate-500">{subtitle}</p>
            )}
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden xl:flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-1"
        >
          {navConfig.items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {Icon && React.createElement(Icon, { size: 15, strokeWidth: active ? 2.2 : 1.8 })}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <NotificationDropdown />
            <button
              onClick={handleLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-95"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* On mobile we only show the notification bell. Profile is reached from the bottom nav. */}
          <div className="sm:hidden">
            <NotificationDropdown />
          </div>

          <Link
            href={navConfig.profileHref}
            className={`hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors active:scale-95 ${
              isActivePath(pathname, navConfig.profileHref)
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-primary"
            }`}
            title="الملف الشخصي"
            aria-label="الملف الشخصي"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {actions}
        </div>
      </div>
    </header>
  );
}
