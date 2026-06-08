"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import { requestStatusLabel } from "@/lib/i18n/request-status";

const STATUS_VALUES = [
  "ALL",
  "PENDING_ADMIN_REVISION",
  "OPEN_FOR_BIDDING",
  "OFFERS_FORWARDED",
  "ORDER_PAID_PENDING_DELIVERY",
  "CLOSED_SUCCESS",
  "CLOSED_CANCELLED",
] as const;

const STATUS_FILTERS = STATUS_VALUES.map((value) => ({
  value,
  label: value === "ALL" ? "الكل" : requestStatusLabel(value),
}));

export function FiltersBar({
  initialSearch,
  initialStatus,
}: {
  initialSearch: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (search) params.set("search", search);
      else params.delete("search");

      if (status && status !== "ALL") params.set("status", status);
      else params.delete("status");

      params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, pathname, router]);

  return (
    <div className="surface-card-soft flex flex-col items-stretch gap-3 p-4 md:flex-row md:items-center">
      <div className="relative w-full flex-1">
        <IconSearch
          className="pointer-events-none absolute top-1/2 end-4 -translate-y-1/2 text-slate-400 transition-colors"
          size={18}
          stroke={1.7}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الطلب أو العنوان..."
          className="sf-input h-12 pe-12"
          aria-label="بحث"
        />
      </div>
      <div className="no-scrollbar -mx-4 flex w-full items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-auto md:px-0 md:pb-0">
        {STATUS_FILTERS.map((s) => {
          const isActive = status === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              aria-pressed={isActive}
              className={`shrink-0 h-10 rounded-full border px-4 text-[12px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                isActive
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
