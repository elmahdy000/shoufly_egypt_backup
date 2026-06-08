"use client";

import { Button } from "@/components/shoofly/button";
import { IconCheck, IconShield, IconStarFilled, IconSparkles } from "@tabler/icons-react";
import { splitCurrency } from "@/lib/formatters";

interface OfferCardProps {
  offer: {
    id: number;
    status: string;
    clientPrice?: number | null;
    netPrice?: number | null;
    description?: string | null;
    aiScore?: number | null;
    aiRecommendation?: string | null;
    vendor?: { fullName?: string | null; id?: number | string } | null;
    vendorId?: number | string;
  };
  isAccepted: boolean;
  isLoading: boolean;
  isSubmittingAnother: boolean;
  onAccept: (id: number) => void;
}

export function OfferCard({
  offer,
  isAccepted,
  isLoading,
  isSubmittingAnother,
  onAccept,
}: OfferCardProps) {
  const priceValue = offer.clientPrice ?? offer.netPrice ?? 0;
  const { amount, unit } = splitCurrency(priceValue);
  const isTopPick = offer.aiRecommendation === "TOP_PICK";
  const hasAiScore =
    typeof offer.aiScore === "number" && Number.isFinite(offer.aiScore) && offer.aiScore > 0;

  return (
    <article
      className={`group relative flex flex-col gap-5 rounded-2xl border bg-white p-4 transition-all sm:p-6 ${
        isAccepted
          ? "border-emerald-300 shadow-emerald-100/60 shadow-md"
          : isTopPick
            ? "border-primary/40 shadow-primary/5 shadow-md"
            : "border-slate-200 hover:border-primary/30 hover:shadow-md"
      }`}
      aria-label={`عرض رقم ${offer.id}`}
    >
      {isTopPick && !isAccepted && (
        <div className="absolute -top-3 start-4 flex items-center gap-1 rounded-full border border-primary/20 bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-sm">
          <IconSparkles size={12} stroke={2} />
          <span>أفضل اختيار</span>
        </div>
      )}

      {isAccepted && (
        <div className="absolute -top-3 start-4 flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
          <IconCheck size={12} stroke={2.5} />
          <span>تم الاعتماد</span>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
        {/* Price block — light, prominent, not dark */}
        <div className="flex w-full shrink-0 flex-col justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-subtle p-5 md:w-56">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            التكلفة الإجمالية
          </p>
          <p className="flex items-baseline gap-1.5 text-slate-900">
            <span className="text-3xl font-black tracking-tight sm:text-4xl">
              {amount}
            </span>
            <span className="text-sm font-bold text-slate-500">{unit}</span>
          </p>
          <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full border border-primary/20 bg-white px-2.5 py-0.5 text-[10px] font-bold text-primary">
            <IconShield size={10} stroke={2} />
            شامل الدعم والنقل
          </span>
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Supplier row */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary"
                aria-hidden="true"
              >
                {offer.vendor?.fullName?.charAt(0) || "V"}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900">
                  <span className="truncate">
                    {offer.vendor?.fullName || `مورّد رقم ${offer.vendorId ?? "—"}`}
                  </span>
                  <IconCheck
                    size={14}
                    stroke={2.5}
                    className="shrink-0 text-emerald-500"
                    aria-label="مورد معتمد"
                  />
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-amber-500">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <IconStarFilled key={i} size={11} className="opacity-80" />
                  ))}
                  {hasAiScore && (
                    <span className="ms-2 text-[11px] font-medium text-slate-500">
                      تقييم AI: {offer.aiScore}/100
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              #{offer.id}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              تقديم المورّد
            </h3>
            <p className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700 sm:p-4">
              {offer.description || "لم يتم إدراج تفاصيل إضافية لهذا العرض."}
            </p>
          </div>

          {/* CTA */}
          {!isAccepted && (
            <div className="flex justify-end pt-1">
              <Button
                onClick={() => onAccept(offer.id)}
                isLoading={isLoading}
                disabled={isSubmittingAnother}
                className="min-w-[160px] px-6 shadow-sm"
              >
                اعتماد هذا العرض
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
