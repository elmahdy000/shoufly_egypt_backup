"use client";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import {
  IconHome,
  IconClipboardList,
  IconWallet,
  IconBell,
  IconUser,
} from "@tabler/icons-react";

const items = [
  { href: "/client",               label: "الرئيسية",  icon: IconHome },
  { href: "/client/requests",      label: "الطلبات",   icon: IconClipboardList },
  { href: "/client/requests/new",  label: "طلب جديد",  icon: IconHome },
  { href: "/client/wallet",        label: "المحفظة",   icon: IconWallet },
  { href: "/client/notifications", label: "الإشعارات", icon: IconBell },
  { href: "/client/profile",       label: "الملف",     icon: IconUser },
];

export function ClientNav() {
  return (
    <MobileBottomNav
      items={items}
      fab={{ href: "/client/requests/new", label: "طلب جديد" }}
    />
  );
}
