"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { motion } from "framer-motion";
import { IconPlus, type Icon } from "@tabler/icons-react";

export type NavIcon = React.ComponentType<any>;

export type MobileNavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

type FabConfig = {
  href: string;
  label: string;
  icon?: NavIcon;
};

export function MobileBottomNav({
  items,
  fab,
}: {
  items: MobileNavItem[];
  fab?: FabConfig;
}) {
  const pathname = usePathname();

  const isPathActive = (href: string) => {
    if (href === "/client" || href === "/vendor" || href === "/delivery" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const FabIcon = fab?.icon ?? IconPlus;

  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-4px_20px_-8px_rgba(15,23,42,0.08)] md:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-between px-2 pt-1.5">
        {items.map((item) => {
          const active = isPathActive(item.href);
          const Icon = item.icon;
          const isFabSlot = !!fab && item.href === fab.href;

          if (isFabSlot) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={fab!.label}
                className="relative flex-1 min-w-0 flex flex-col items-center justify-end group"
              >
                <div className="-mt-5 w-11 h-11 rounded-2xl bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-white flex items-center justify-center transition-transform group-active:scale-95">
                  <FabIcon size={20} stroke={2.2} />
                </div>
                <span
                  className={`text-[10px] font-semibold mt-1 leading-none transition-colors ${
                    active ? "text-primary" : "text-slate-500"
                  }`}
                >
                  {fab!.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 group"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.div
                  layoutId="bottomnav-active-dot"
                  className="absolute top-1 h-1 w-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <div
                className={`transition-all ${
                  active ? "text-primary" : "text-slate-400 group-active:text-slate-600"
                }`}
              >
                <Icon
                  size={22}
                  stroke={active ? 2.2 : 1.6}
                />
              </div>

              <span
                className={`text-[10px] font-semibold leading-none transition-colors ${
                  active ? "text-primary" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
