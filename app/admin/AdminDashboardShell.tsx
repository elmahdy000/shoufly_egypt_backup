"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, Briefcase, CreditCard, LayoutGrid,
  LoaderCircle, LogOut, Menu, Package,
  Shield, Truck, Users,
  BarChart3, Settings, Eye,
  Layers, ShieldCheck, CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { listAllNotifications } from "@/lib/api/notifications";
import { NotificationsDrawer } from "@/components/admin/notifications-drawer";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: keyof AdminStats;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "العمليات المركزية",
    items: [
      { label: "لوحة التحكم", icon: LayoutGrid, href: "/admin" },
      { label: "إدارة الطلبات", icon: Package, href: "/admin/requests", badge: "openRequests" },
      { label: "تتبع الأسطول", icon: Truck, href: "/admin/tracking" },
      { label: "التحليلات والأداء", icon: BarChart3, href: "/admin/analytics" },
    ],
  },
  {
    label: "إدارة الهوية",
    items: [
      { label: "سجل المستخدمين", icon: Users, href: "/admin/users" },
      { label: "إدارة الموردين", icon: Briefcase, href: "/admin/vendors", badge: "totalVendors" },
      { label: "توثيق الحسابات (KYC)", icon: ShieldCheck, href: "/admin/kyc", badge: "pendingAiReview" },
      { label: "مركز الرؤية الذكي", icon: Eye, href: "/admin/vision" },
    ],
  },
  {
    label: "القطاع المالي",
    items: [
      { label: "الخزينة والمالية", icon: CircleDollarSign, href: "/admin/finance" },
      { label: "طلبات السحب", icon: CreditCard, href: "/admin/withdrawals", badge: "pendingWithdrawals" },
      { label: "إدارة النزاعات", icon: Shield, href: "/admin/complaints", badge: "pendingComplaints" },
    ],
  },
  {
    label: "ضبط النظام",
    items: [
      { label: "سجل الأحداث (Audit)", icon: Layers, href: "/admin/audit-logs" },
      { label: "إعدادات المنصة", icon: Settings, href: "/admin/settings" },
    ],
  },
];

// Flat list of all hrefs for proactive prefetch
const ALL_HREFS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));

interface AdminStats {
  totalUsers: number;
  openRequests: number;
  pendingWithdrawals: number;
  totalVendors: number;
  pendingAiReview: number;
  onlineAdmins: number;
  pendingComplaints: number;
}

// ─── Slim progress bar shown during navigation ────────────────────────────────

function NavProgressBar({ active }: { active: boolean }) {
  const [pct, setPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    if (active) {
      setVisible(true);
      setPct(0);
      t1 = setTimeout(() => setPct(55), 30);
      t2 = setTimeout(() => setPct(80), 800);
    } else {
      setPct(100);
      t3 = setTimeout(() => { setVisible(false); setPct(0); }, 400);
    }
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="absolute bottom-0 left-0 h-[2px] bg-primary transition-all ease-out"
      style={{
        width: `${pct}%`,
        transitionDuration: active ? (pct === 0 ? "0ms" : "700ms") : "250ms",
      }}
    />
  );
}

// ─── Sidebar inner component ──────────────────────────────────────────────────
// Extracted outside the shell so React never recreates it on every render.

interface SidebarContentProps {
  pathname: string;
  adminName: string;
  stats: AdminStats | null;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate: (href: string) => void;
}

const SidebarContent = memo(function SidebarContent({
  pathname,
  adminName,
  stats,
  isLoggingOut,
  onLogout,
  onNavigate,
}: SidebarContentProps) {
  const getBadge = (key?: keyof AdminStats) => (key && stats ? stats[key] ?? 0 : 0);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white border-l border-slate-200 shadow-sm relative">

      {/* Brand */}
      <div className="px-8 py-8 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter leading-none mb-1">
              {"شوفلي "}
              <span className="text-primary">{"مصر"}</span>
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {"لوحة التحكم الإدارية"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-5 py-6 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                const badge = getBadge(item.badge);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => { if (!isActive) onNavigate(item.href); }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors group relative ${
                      isActive
                        ? "bg-orange-50 text-primary font-bold border border-orange-100"
                        : "text-slate-500 font-medium border border-transparent hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? "text-primary"
                          : "text-slate-400 group-hover:text-slate-600 transition-colors"
                      }
                    />
                    <span className="flex-1 text-[13px] tracking-tight">{item.label}</span>
                    {badge > 0 && (
                      <span
                        className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-lg text-[9px] font-bold ${
                          isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute right-0 w-1 h-5 bg-primary rounded-l-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-3 mb-4 p-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 text-xs font-bold">
            {adminName.charAt(0) || "م"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">{adminName}</p>
            <p className="truncate text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
              {"متصل الآن"}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-transparent hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 disabled:opacity-60"
        >
          {isLoggingOut ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <LogOut size={14} />
          )}
          {isLoggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
        </button>
      </div>
    </div>
  );
});

// ─── Simple in-memory cache so shell data survives client-side navigation ─────
const shellCache: { stats: AdminStats | null; adminName: string; notifCount: number } = {
  stats: null,
  adminName: "مدير النظام",
  notifCount: 0,
};

// ─── Main Shell ───────────────────────────────────────────────────────────────

export default function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarMounted, setMobileSidebarMounted] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminName, setAdminName] = useState(shellCache.adminName);
  const [stats, setStats] = useState<AdminStats | null>(shellCache.stats);
  const [notifCount, setNotifCount] = useState(shellCache.notifCount);
  const [navigating, setNavigating] = useState(false);
  const bootstrapped = useRef(false);
  const prevPathname = useRef(pathname);

  // Hide progress bar and close mobile sidebar when route finishes loading
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setNavigating(false);
      setSidebarOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Heartbeat — keep admin marked as online
  useEffect(() => {
    const sendHeartbeat = () => {
      apiFetch("/api/admin/heartbeat", "ADMIN", { method: "POST" }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Bootstrap shell data once per session mount.
  // Also proactively prefetch all admin routes so navigation is instant.
  // GET deduplication in apiFetch means the /stats call is shared with the
  // dashboard page if they fire at the same time.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    apiFetch<AdminStats>("/api/admin/stats", "ADMIN")
      .then((s) => { shellCache.stats = s; setStats(s); })
      .catch(() => {});

    apiFetch<{ fullName?: string }>("/api/auth/me", "ADMIN")
      .then((u) => {
        if (u?.fullName) { shellCache.adminName = u.fullName; setAdminName(u.fullName); }
      })
      .catch(() => {});

    listAllNotifications("ADMIN")
      .then((list) => {
        const count = list.filter((n) => !n.isRead).length;
        shellCache.notifCount = count;
        setNotifCount(count);
      })
      .catch(() => {});

    // Proactively prefetch every sidebar route so first click is instant.
    // Stagger slightly to avoid a burst on load.
    ALL_HREFS.forEach((href, i) => {
      setTimeout(() => router.prefetch(href), i * 50);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", "ADMIN", { method: "POST" });
      router.push("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  const handleNavigate = useCallback((href: string) => {
    if (href !== pathname) setNavigating(true);
  }, [pathname]);

  const openSidebar = useCallback(() => {
    setMobileSidebarMounted(true);
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-cairo text-foreground" dir="rtl">

      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 lg:sticky lg:top-0 lg:flex">
        <SidebarContent
          pathname={pathname}
          adminName={adminName}
          stats={stats}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      </aside>

      {/* Mobile Sidebar — CSS transitions, no framer-motion dependency */}
      {mobileSidebarMounted && (
        <div
          className={`fixed inset-0 z-50 lg:hidden ${
            sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeSidebar}
          />
          {/* Drawer */}
          <aside
            className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out ${
              sidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <SidebarContent
              pathname={pathname}
              adminName={adminName}
              stats={stats}
              isLoggingOut={isLoggingOut}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md relative overflow-hidden">
          {/* Navigation progress bar */}
          <NavProgressBar active={navigating} />

          <div className="flex h-full items-center justify-between gap-4 px-6 lg:px-10">

            <div className="flex items-center gap-4">
              <button
                onClick={openSidebar}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {"نظام التشغيل المركزي"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                onClick={() => setNotifDrawerOpen(true)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primary transition-all shadow-sm"
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white px-1">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-3">
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{adminName}</p>
                  <p className="text-[10px] font-medium text-slate-400">Admin Account</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-slate-50">
                  {adminName.charAt(0) || "م"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <NotificationsDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        onUnreadCountChange={setNotifCount}
      />
    </div>
  );
}
