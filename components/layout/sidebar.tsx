"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  FiHome,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import { useTheme } from "@/components/providers/theme-provider";

export type SidebarItem = { href: string; label: string; icon: ComponentType<{ size?: number; className?: string }> };

export function Sidebar({ title, items }: { title: string; items: SidebarItem[] }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden h-screen w-72 shrink-0 overflow-hidden border-l border-white/70 bg-white/90 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:flex flex-col">
      <div className="border-b border-slate-100/80 px-5 py-5">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary/10 via-white to-slate-50 p-3 ring-1 ring-primary/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <FiHome size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Shoofly</p>
            <h2 className="truncate text-lg font-bold text-slate-900">{title}</h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {items.map((item) => {
          const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                isActive
                  ? "border-primary/20 bg-primary/10 text-slate-900 shadow-sm"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {isActive && <span className="absolute inset-y-2 right-2 w-1 rounded-full bg-primary" />}
              <Icon size={18} className={isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100/80 p-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-sm">
                AD
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">المدير العام</p>
                <p className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  متصل
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-primary/30 hover:text-primary"
                title="ØªØ¨Ø¯ÙŠÙ„ Ø§Ù„ÙˆØ¶Ø¹"
              >
                {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
              <button
                onClick={() => {
                  document.cookie = "session_token=; Max-Age=0; path=/";
                  window.location.href = "/login";
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 transition-colors hover:border-rose-200 hover:bg-rose-500 hover:text-white"
                title="ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
