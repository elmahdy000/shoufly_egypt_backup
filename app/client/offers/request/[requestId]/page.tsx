"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { OfferCard } from "@/components/requests/offer-card";
import { acceptClientOffer, listClientForwardedOffers } from "@/lib/api/bids";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import {
  IconTag,
  IconCircleCheck,
  IconAlertTriangle,
  IconSparkles,
  IconCurrencyDollar,
  type Icon,
} from "@tabler/icons-react";

type SortKey = "AI_SCORE" | "PRICE";

const SORT_OPTIONS: { value: SortKey; label: string; icon: Icon }[] = [
  { value: "AI_SCORE", label: "ترتيب ذكي (AI)", icon: IconSparkles },
  { value: "PRICE", label: "أقل سعر", icon: IconCurrencyDollar },
];

function OffersContent({ requestId }: { requestId: number }) {
  const router = useRouter();
  const { data, loading, error } = useAsyncData(
    () => listClientForwardedOffers(requestId),
    [requestId]
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("AI_SCORE");

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const sortedOffers = (data ?? [])
    .slice()
    .sort(
      (
        a: { clientPrice?: number | null; netPrice?: number | null; aiScore?: number | null },
        b: { clientPrice?: number | null; netPrice?: number | null; aiScore?: number | null }
      ) => {
        if (sortBy === "PRICE") {
          return (
            (a.clientPrice ?? a.netPrice ?? 0) - (b.clientPrice ?? b.netPrice ?? 0)
          );
        }
        return (b.aiScore ?? 0) - (a.aiScore ?? 0);
      }
    );

  async function accept(bidId: number) {
    try {
      setSubmittingId(bidId);
      setFeedback(null);
      await acceptClientOffer(bidId);
      setFeedback({
        type: "success",
        text: `تم اعتماد العرض رقم #${bidId} بنجاح! سيتم توجيهك لصفحة الدفع...`,
      });

      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = setTimeout(() => {
        router.push(`/client/requests/${requestId}`);
      }, 2500);
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء محاولة اعتماد العرض.",
      });
      setSubmittingId(null);
    }
  }

  const offersCount = data?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 pb-32 sm:space-y-8" dir="rtl">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between md:pb-6">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-11 sm:w-11"
              aria-hidden="true"
            >
              <IconTag size={20} stroke={1.7} />
            </span>
            <span>العروض المتاحة</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            قارن بين العروض المعتمدة لاختيار الأنسب لطلبك رقم{" "}
            <span className="font-bold text-slate-700">REQ-{requestId}</span>
          </p>
        </div>

        {offersCount > 1 && (
          <div
            role="tablist"
            aria-label="ترتيب العروض"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
          >
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = sortBy === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSortBy(opt.value)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                    isActive
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon size={14} stroke={1.8} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Feedback banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm font-bold shadow-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.type === "success" ? (
            <IconCircleCheck size={20} stroke={1.8} className="shrink-0" />
          ) : (
            <IconAlertTriangle size={20} stroke={1.8} className="shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:gap-6">
                <div className="h-28 w-full rounded-2xl bg-slate-100 md:w-56" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/3 rounded-full bg-slate-100" />
                      <div className="h-3 w-1/4 rounded-full bg-slate-100" />
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100" />
                  <div className="h-3 w-5/6 rounded-full bg-slate-100" />
                  <div className="h-3 w-2/3 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && offersCount === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center p-10 text-center sm:p-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
            <IconTag size={26} stroke={1.6} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900">
            لا توجد عروض معتمدة بعد
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            لم تقم الإدارة بتوجيه أي عروض لطلبك حتى الآن. سيتم إخطارك فور ورود
            أي عروض جديدة ومطابقتها.
          </p>
        </div>
      ) : null}

      {/* Offers list */}
      {!loading && !error && offersCount > 0 && (
        <div className="grid gap-4 sm:gap-5">
          {sortedOffers.map((offer: any) => {
            const isAccepted = offer.status === "ACCEPTED_BY_CLIENT";
            const isLoading = submittingId === offer.id;
            return (
              <OfferCard
                key={offer.id}
                offer={offer}
                isAccepted={isAccepted}
                isLoading={isLoading}
                isSubmittingAnother={submittingId !== null && !isLoading}
                onAccept={accept}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ClientOffersPage() {
  const params = useParams<{ requestId: string }>();
  const parsed = Number(params.requestId);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return <ErrorState message="معرف الطلب غير صحيح." />;
  }

  return <OffersContent requestId={parsed} />;
}
