"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiHome, 
  FiPlusSquare, 
  FiBriefcase, 
  FiUser, 
  FiBell,
  FiLayout
} from "react-icons/fi";

interface BottomNavProps {
  userRole?: "CLIENT" | "VENDOR" | "ADMIN" | "DELIVERY" | null;
}

export function MobileBottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();

  // Don't show on login/register pages, or backend role dashboards (admin, vendor, delivery)
  if (
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/delivery')
  ) return null;

  const getDashboardLink = () => {
    if (!userRole) return "/login";
    switch(userRole.toUpperCase()) {
      case "ADMIN": return "/admin";
      case "VENDOR": return "/vendor";
      case "DELIVERY": return "/delivery";
      default: return "/client";
    }
  };

  const navItems = [
    { name: "الرئيسية", icon: FiHome, href: "/" },
    { name: "أقسامنا", icon: FiLayout, href: "/categories" },
    { name: "اطلب", icon: FiPlusSquare, href: "/client/requests/new", primary: true },
    { name: "إشعارات", icon: FiBell, href: "/client/notifications" },
    { name: "حسابي", icon: FiUser, href: getDashboardLink() },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] lg:hidden">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]" />
      
      <div className="relative flex items-end justify-around px-2 pb-6 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          if (item.primary) {
            return (
              <Link key={item.name} href={item.href} className="relative -top-8 flex flex-col items-center">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 border-4 border-white transition-transform active:scale-90">
                  <item.icon size={24} />
                </div>
                <span className="text-[10px] font-black text-primary mt-1 uppercase tracking-tighter">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex flex-col items-center gap-1 py-1 transition-all active:scale-95 ${isActive ? "text-primary" : "text-slate-400"}`}
            >
              <item.icon size={20} className={isActive ? "stroke-[2.5px]" : ""} />
              <span className={`text-[9px] font-black tracking-tighter ${isActive ? "text-primary" : "text-slate-400"}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-primary rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Safe Area Padding for Modern Phones */}
      <div className="h-safe-bottom bg-white/80 backdrop-blur-xl" />
    </div>
  );
}
