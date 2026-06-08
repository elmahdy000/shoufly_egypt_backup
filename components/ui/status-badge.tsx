import React from "react";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  PENDING_ADMIN_REVISION: "bg-amber-50 text-amber-700 border-amber-200",
  OPEN_FOR_BIDDING: "bg-blue-50 text-blue-700 border-blue-200",
  BIDS_RECEIVED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OFFERS_FORWARDED: "bg-violet-50 text-violet-700 border-violet-200",
  ORDER_PAID_PENDING_DELIVERY: "bg-sky-50 text-sky-700 border-sky-200",
  CLOSED_SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED_CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SELECTED: "bg-green-50 text-green-700 border-green-200",
  ACCEPTED_BY_CLIENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WITHDRAWN: "bg-stone-50 text-stone-700 border-stone-200",
  OUT_FOR_DELIVERY: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  READY_FOR_PICKUP: "bg-indigo-50 text-indigo-700 border-indigo-200"
};

const dotMap: Record<string, string> = {
  PENDING_ADMIN_REVISION: "bg-amber-500",
  OPEN_FOR_BIDDING: "bg-blue-500",
  BIDS_RECEIVED: "bg-indigo-500",
  OFFERS_FORWARDED: "bg-violet-500",
  ORDER_PAID_PENDING_DELIVERY: "bg-sky-500",
  CLOSED_SUCCESS: "bg-emerald-500",
  CLOSED_CANCELLED: "bg-rose-500",
  REJECTED: "bg-rose-500",
  PENDING: "bg-amber-500",
  SELECTED: "bg-green-500",
  ACCEPTED_BY_CLIENT: "bg-emerald-500",
  APPROVED: "bg-emerald-500",
  WITHDRAWN: "bg-stone-500",
  OUT_FOR_DELIVERY: "bg-blue-500",
  DELIVERED: "bg-emerald-500",
  FAILED: "bg-rose-500",
  READY_FOR_PICKUP: "bg-indigo-500"
};

const labelMap: Record<string, string> = {
  PENDING_ADMIN_REVISION: "قيد المراجعة",
  OPEN_FOR_BIDDING: "مفتوح للعروض",
  BIDS_RECEIVED: "عروض واردة",
  OFFERS_FORWARDED: "عروض مُرسلة",
  ORDER_PAID_PENDING_DELIVERY: "مدفوع - بانتظار التوصيل",
  CLOSED_SUCCESS: "مكتمل",
  CLOSED_CANCELLED: "ملغى",
  REJECTED: "مرفوض",
  PENDING: "قيد الانتظار",
  SELECTED: "مختار",
  ACCEPTED_BY_CLIENT: "مقبول من العميل",
  APPROVED: "موافق عليه",
  WITHDRAWN: "مسحوب",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التوصيل",
  FAILED: "فشل الاستلام",
  READY_FOR_PICKUP: "جاهز للاستلام"
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const key = status ?? "UNKNOWN";
  const arabicLabel = labelMap[key] ?? key;
  const tone = toneMap[key] ?? "bg-stone-50 text-stone-700 border-stone-200";
  const dotColor = dotMap[key] ?? "bg-stone-400";

  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        tone,
        "cursor-default",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full ml-1.5 shrink-0", dotColor)} />
      {arabicLabel}
    </div>
  );
}
