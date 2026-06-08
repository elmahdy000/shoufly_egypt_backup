"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { SuccessConfetti } from "@/components/shoofly/success-confetti";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { payClientRequest } from "@/lib/api/transactions";
import { getRequestDetails, cancelClientRequest } from "@/lib/api/requests";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import {
  IconArrowRight,
  IconCalendar,
  IconCircleCheck,
  IconCircleX,
  IconMessage,
  IconStar,
  IconActivity,
  IconAlertCircle,
  IconTruck,
  IconPhone,
  IconCreditCard,
  IconMap,
  IconPackage,
  IconCheck,
  IconMapPin,
  IconX,
  IconInfoCircle,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
  IconTag,
  IconBan,
  IconLoader2,
  IconCash,
  IconRefresh,
  IconEye,
  IconNote,
} from "@tabler/icons-react";

const JOURNEY = [
  { label: "إنشاء الطلب", statuses: ["PENDING_ADMIN_REVISION", "OPEN_FOR_BIDDING", "OFFERS_FORWARDED", "ORDER_PAID_PENDING_DELIVERY", "CLOSED_SUCCESS"] },
  { label: "البحث عن عروض", statuses: ["OPEN_FOR_BIDDING", "OFFERS_FORWARDED", "ORDER_PAID_PENDING_DELIVERY", "CLOSED_SUCCESS"] },
  { label: "الدفع والتأكيد", statuses: ["ORDER_PAID_PENDING_DELIVERY", "CLOSED_SUCCESS"] },
  { label: "التسليم والإغلاق", statuses: ["CLOSED_SUCCESS"] },
];

function RequestDetailsContent({ requestId }: { requestId: number }) {
  const { data, loading, error, refresh } = useAsyncData(
    () => getRequestDetails(requestId),
    [requestId],
  );
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [commissionRate, setCommissionRate] = useState(0.15);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    apiFetch("/api/settings/public", "CLIENT")
      .then((data: any) => {
        if (data?.commission) setCommissionRate(data.commission / 100);
      })
      .catch(() => {});
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!actionMsg) return;
    const t = setTimeout(() => setActionMsg(null), actionMsg.type === "ok" ? 4000 : 8000);
    return () => clearTimeout(t);
  }, [actionMsg]);

  // Confetti once per request per session
  const confettiFlagKey = `shoofly_confetti_seen_${requestId}`;
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(confettiFlagKey)) {
      setShowConfetti(false);
      return;
    }
    setShowConfetti(true);
    sessionStorage.setItem(confettiFlagKey, "1");
  }, [confettiFlagKey]);

  // SSE listener — only refresh for events related to this request
  // The stream wraps events as { type: 'notification'|'chat', data: {...} }
  // so the inner type is payload.data?.type, not payload.type.
  useEffect(() => {
    const RELEVANT = new Set([
      "NEW_BID",
      "ORDER_STATUS_CHANGED",
      "BID_ACCEPTED",
      "DELIVERY_ASSIGNED",
      "DELIVERY_PICKED_UP",
      "DELIVERY_DELIVERED",
    ]);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type !== "notification") return;
      const inner = payload.data as { type?: string; requestId?: number } | null;
      if (!inner) return;
      if (!RELEVANT.has(inner.type ?? "")) return;
      if (inner.requestId === requestId) {
        void refresh();
      }
    });
    return unsubscribe;
  }, [requestId, refresh]);

  const executePayment = useCallback(async () => {
    try {
      setIsPaying(true);
      setActionMsg(null);
      const result = await payClientRequest(requestId);
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      setShowPayConfirm(false);
      setActionMsg({ type: "ok", text: `تمت عملية السداد بنجاح! الرصيد المتبقي: ${result.wallet?.balance} ج.م` });
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(refresh, 1500);
    } catch (err) {
      setActionMsg({ type: "err", text: err instanceof Error ? err.message : "حصل مشكلة أثناء الدفع" });
    } finally {
      setIsPaying(false);
    }
  }, [requestId, refresh]);

  const requestCancel = useCallback(() => {
    setActionMsg(null);
    setCancelConfirmText("");
    setShowCancelConfirm(true);
  }, []);

  const executeCancel = useCallback(async () => {
    // Guard: require the user to have explicitly typed "إلغاء" to confirm.
    // Prevents accidental single-tap cancellations.
    if (cancelConfirmText.trim() !== "إلغاء") return;
    try {
      setIsCancelling(true);
      await cancelClientRequest(requestId);
      setShowCancelConfirm(false);
      setCancelConfirmText("");
      setActionMsg({ type: "ok", text: "تم إلغاء الطلب بنجاح." });
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(refresh, 1500);
    } catch (err) {
      setActionMsg({ type: "err", text: err instanceof Error ? err.message : "حصل مشكلة" });
    } finally {
      setIsCancelling(false);
    }
  }, [requestId, refresh, cancelConfirmText]);

  const closeCancelConfirm = useCallback(() => {
    if (isCancelling) return;
    setShowCancelConfirm(false);
    setCancelConfirmText("");
  }, [isCancelling]);

  const handleReview = useCallback(async () => {
    if (rating === 0) return;
    setSubmittingReview(true);
    setActionMsg(null);
    try {
      const getCsrfToken = () => {
        const m = document.cookie.match(/(^| )csrf_token=([^;]+)/);
        return m ? m[2] : null;
      };
      const res = await fetch("/api/client/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() || "",
        },
        body: JSON.stringify({ requestId, rating, comment: reviewComment }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data && (data.error || data.message)) || "فشل إرسال التقييم. حاول مرة أخرى.";
        throw new Error(msg);
      }
      setShowReview(false);
      setActionMsg({ type: "ok", text: "شكراً لتقييمك! تم تسجيل رأيك بنجاح." });
      refresh();
    } catch (err) {
      setActionMsg({ type: "err", text: err instanceof Error ? err.message : "فشل إرسال التقييم." });
    } finally {
      setSubmittingReview(false);
    }
  }, [rating, reviewComment, requestId, refresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <IconLoader2 size={28} className="animate-spin text-primary" />
        <p className="text-helper">جاري تحميل بيانات الطلب...</p>
      </div>
    );
  }
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="الطلب غير موجود." />;

  const isCompleted = data.status === "CLOSED_SUCCESS";
  const isCancelled = data.status === "CLOSED_CANCELLED";
  const hasOffers = data.status === "OFFERS_FORWARDED" && data.selectedBidId === null;
  const awaitPayment = data.status === "OFFERS_FORWARDED" && data.selectedBidId !== null;
  const isPaid = data.status === "ORDER_PAID_PENDING_DELIVERY";
  const canCancel = !isPaid && !isCompleted && !isCancelled && !awaitPayment;

  const images = (data.images as Array<{ filePath: string; fileName: string }>) ?? [];

  return (
    <div className="min-h-screen pb-28" dir="rtl">
      {isCompleted && showConfetti && <SuccessConfetti />}

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/client/requests"
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              aria-label="رجوع لطلباتي"
            >
              <IconArrowRight size={18} stroke={1.6} />
            </Link>
            <span className="text-helper">طلب #{data.id}</span>
          </div>
          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={requestCancel}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                {isCancelling ? <IconLoader2 size={13} className="animate-spin" /> : <IconBan size={13} stroke={1.6} />}
                إلغاء الطلب
              </button>
            )}
            <Link
              href="/client/chat"
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <IconMessage size={13} stroke={1.6} />
              الدعم
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-4 scroll-mt-20">
        {/* Toast */}
        {actionMsg && (
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-medium scroll-mt-20 ${
              actionMsg.type === "ok"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}
            role="status"
          >
            {actionMsg.type === "ok" ? (
              <IconCircleCheck size={18} stroke={1.6} className="shrink-0" />
            ) : (
              <IconAlertCircle size={18} stroke={1.6} className="shrink-0" />
            )}
            <span className="flex-1">{actionMsg.text}</span>
            <button
              type="button"
              onClick={() => setActionMsg(null)}
              aria-label="إغلاق"
              className="opacity-60 hover:opacity-100"
            >
              <IconX size={16} />
            </button>
          </div>
        )}

        {/* Title card */}
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              <IconPackage size={11} stroke={1.6} />
              REQ-{data.id}
            </span>
            <RequestStatusBadge status={data.status} />
          </div>
          <h1 className="text-heading-2 mb-2 leading-snug">{data.title || "طلب خدمة"}</h1>
          <p className="text-helper flex items-center gap-1.5">
            <IconCalendar size={12} stroke={1.6} />
            {data.createdAt
              ? new Date(data.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </p>
        </div>

        {/* Action zone */}
        {(hasOffers || awaitPayment) && (
          <div
            className={`rounded-2xl border p-5 space-y-3 ${
              awaitPayment ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
            }`}
          >
            <div
              className={`flex items-center gap-2 text-sm font-bold ${
                awaitPayment ? "text-emerald-800" : "text-amber-800"
              }`}
            >
              <IconAlertCircle size={16} stroke={1.6} />
              {hasOffers ? "عندك عروض جديدة من الموردين!" : "الطلب جاهز للدفع"}
            </div>
            <p className={`text-xs leading-relaxed ${awaitPayment ? "text-emerald-700" : "text-amber-700"}`}>
              {hasOffers
                ? "راجع العروض المتاحة واختر الأنسب ليك."
                : "اضغط تأكيد الدفع لإتمام الحجز وبدء التنفيذ."}
            </p>
            <div className="pt-1">
              {hasOffers && (
                <Link
                  href={`/client/offers/request/${requestId}`}
                  className="inline-flex items-center gap-2 h-11 px-5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
                >
                  <IconEye size={16} stroke={1.6} />
                  عرض العروض
                </Link>
              )}
              {awaitPayment && (
                <button
                  type="button"
                  onClick={() => setShowPayConfirm(true)}
                  disabled={isPaying}
                  className="inline-flex items-center gap-2 h-11 px-5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isPaying ? <IconLoader2 size={15} className="animate-spin" /> : <IconCreditCard size={15} stroke={1.6} />}
                  تأكيد الدفع
                </button>
              )}
            </div>
          </div>
        )}

        {/* AI Audit Feedback */}
        {(data.status === "REJECTED" || data.status === "PENDING_ADMIN_REVISION") && data.notes && (
          <div
            className={`rounded-2xl border p-5 flex items-start gap-4 ${
              data.status === "REJECTED" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="shrink-0 mt-1">
              {data.status === "REJECTED" ? <IconCircleX size={22} stroke={1.6} className="text-rose-600" /> : <IconInfoCircle size={22} stroke={1.6} className="text-blue-600" />}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold">نتائج التدقيق الآلي</h3>
              <p className="text-xs leading-relaxed opacity-90">
                {data.notes.replace("رفض آلي (AI): ", "").replace("مراجعة مطلوبة (AI): ", "")}
              </p>
              {data.status === "REJECTED" && (
                <div className="pt-2 flex gap-2">
                  <Link href="/client/requests/new" className="sf-btn-primary !h-9 !text-xs !rounded-xl !px-4">
                    إعادة صياغة الطلب
                  </Link>
                  <Link
                    href="/client/chat"
                    className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100"
                  >
                    تواصل مع الدعم
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {isPaid && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-violet-800 text-sm font-bold">
              <IconTruck size={16} stroke={1.6} />
              الطلب قيد التنفيذ
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[11px] text-violet-700 mb-0.5">كود الاستلام</p>
                <p className="text-lg font-bold text-violet-900 tracking-wider">SHF-{String(data.id).padStart(4, "0")}</p>
              </div>
              <Link
                href={`/client/delivery/${requestId}`}
                className="inline-flex items-center gap-2 h-11 px-5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
              >
                <IconMap size={15} stroke={1.6} />
                تتبع المندوب
              </Link>
            </div>
          </div>
        )}

        {/* Journey */}
        <div className="surface-card p-5 sm:p-6">
          <h3 className="text-section-title mb-4 flex items-center gap-2">
            <IconActivity size={16} stroke={1.6} className="text-primary" />
            مسار الطلب
          </h3>
          <ol className="flex items-start gap-1" role="list">
            {JOURNEY.map((s, idx) => {
              const done = s.statuses.includes(data.status);
              const isFinal = idx === JOURNEY.length - 1;
              const next = JOURNEY[idx + 1];
              const current = isFinal
                ? isCompleted
                : next
                ? done && !next.statuses.includes(data.status)
                : false;
              return (
                <li key={idx} className="flex-1 flex flex-col items-center text-center min-w-0" aria-current={current ? "step" : undefined}>
                  <div className="flex items-center w-full">
                    {idx > 0 && (
                      <div className={`flex-1 h-[2px] rounded-full ${done ? "bg-primary" : "bg-slate-200"}`} />
                    )}
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        current
                          ? "bg-white border-primary text-primary"
                          : done
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-slate-200 text-slate-300"
                      }`}
                    >
                      {done ? <IconCheck size={14} stroke={1.6} strokeWidth={3} /> : idx + 1}
                    </div>
                    {idx < JOURNEY.length - 1 && (
                      <div className={`flex-1 h-[2px] rounded-full ${next?.statuses.includes(data.status) ? "bg-primary" : "bg-slate-200"}`} />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-semibold leading-tight ${
                      current ? "text-primary" : done ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Delivery tracking */}
        {isPaid && (data as any).deliveryTracking?.length > 0 && (
          <div className="surface-card p-5 sm:p-6 space-y-4">
            <h3 className="text-section-title flex items-center gap-2">
              <IconActivity size={16} stroke={1.6} className="text-amber-500" />
              تحديثات المندوب
            </h3>
            <div className="relative space-y-5 before:absolute before:end-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {(data as { deliveryTracking?: Array<{ status: string; createdAt: string }> }).deliveryTracking?.map(
                (step: { status: string; createdAt: string }, idx: number) => (
                  <div key={idx} className="relative ps-12">
                    <div
                      className={`absolute end-0 top-0 w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center z-10 shadow-sm ${
                        idx === 0 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {idx === 0 ? <IconActivity size={14} stroke={1.6} /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${idx === 0 ? "text-slate-900" : "text-slate-500"}`}>
                        {step.status === "VENDOR_PREPARING"
                          ? "المورد يجهّز طلبك"
                          : step.status === "READY_FOR_PICKUP"
                          ? "الطلب جاهز وينتظر المندوب"
                          : step.status === "OUT_FOR_DELIVERY"
                          ? "المندوب في الطريق إليك"
                          : step.status === "DELIVERED"
                          ? "تم التوصيل — في انتظار تأكيدك"
                          : step.status}
                      </p>
                      <p className="text-helper flex items-center gap-1 mt-0.5">
                        {new Date(step.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            {(data as any).deliveryAgent && (
              <div className="mt-4 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {(data as any).deliveryAgent.fullName?.[0] ?? "؟"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{(data as any).deliveryAgent.fullName}</p>
                  <p className="text-helper flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    مندوب معتمد
                  </p>
                </div>
                <a
                  href={`tel:${(data as any).deliveryAgent.phone}`}
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors"
                >
                  <IconPhone size={13} stroke={1.6} />
                  اتصال
                </a>
              </div>
            )}
          </div>
        )}

        {/* Completion */}
        {isCompleted && (
          <div className="surface-card p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <IconCircleCheck size={24} stroke={1.6} />
              </div>
              <div>
                <h2 className="text-section-title">اكتمل الطلب بنجاح</h2>
                <p className="text-helper">تم الانتهاء من كل مراحل الطلب</p>
              </div>
            </div>

            {data.selectedBid?.netPrice && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm text-slate-700">
                  <span>سعر الخدمة</span>
                  <span className="font-semibold">{Number(data.selectedBid.netPrice).toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700">
                  <span>رسوم المنصة ({(commissionRate * 100).toFixed(0)}%)</span>
                  <span className="font-semibold text-rose-600">
                    +{(Number(data.selectedBid.netPrice) * commissionRate).toFixed(2)} ج.م
                  </span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between text-sm font-bold text-slate-900">
                  <span>الإجمالي</span>
                  <span className="text-primary">{(Number(data.selectedBid.netPrice) * (1 + commissionRate)).toFixed(2)} ج.م</span>
                </div>
              </div>
            )}

            {data.review ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IconStar
                      key={i}
                      size={16}
                      className="text-amber-500"
                      fill={i <= (data as any).review.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span className="text-xs text-amber-700 font-medium">تم تقييم الخدمة</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowReview(true)}
                className="w-full h-12 border-2 border-amber-200 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
              >
                <IconStar size={16} stroke={1.6} />
                قيّم تجربتك الآن
              </button>
            )}
          </div>
        )}

        {/* Request details */}
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <h3 className="text-section-title flex items-center gap-2 pb-3 border-b border-slate-100">
            <IconTag size={16} stroke={1.6} className="text-slate-500" />
            تفاصيل الطلب
          </h3>

          <p className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-xl p-4">
            {data.description || "لا يوجد وصف"}
          </p>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {images.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setLightboxIdx(idx)}
                  aria-label={`عرض الصورة ${idx + 1} بالحجم الكامل`}
                  className="aspect-square rounded-2xl overflow-hidden border border-slate-200 cursor-zoom-in hover:border-primary transition-colors p-0 bg-slate-50"
                >
                  <img src={img.filePath} alt={img.fileName} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-helper flex items-center gap-1 mb-1">
                <IconCash size={12} stroke={1.6} />
                الميزانية المتوقعة
              </p>
              <p className="text-lg font-bold text-slate-900">{data.budget ? `${data.budget} ج.م` : "—"}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 group relative">
              <p className="text-helper flex items-center gap-1 mb-1">
                <IconMapPin size={12} stroke={1.6} />
                عنوان التوصيل
              </p>
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                {data.address || "لم يتم تحديد عنوان"}
              </p>
              {data.latitude && data.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <IconMap size={11} stroke={1.6} />
                  عرض على الخريطة
                </a>
              )}
            </div>
          </div>

          {data.notes && data.status !== "REJECTED" && data.status !== "PENDING_ADMIN_REVISION" && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-helper flex items-center gap-1 mb-1">
                <IconNote size={12} stroke={1.6} />
                ملاحظات
              </p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{data.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-section-title">قيّم تجربتك</h3>
              <button
                type="button"
                onClick={() => setShowReview(false)}
                aria-label="إغلاق"
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex justify-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} نجوم`}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-4xl transition-transform active:scale-90 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                    rating >= star ? "text-amber-400" : "text-slate-200"
                  }`}
                >
                  <IconStar fill={rating >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>

            <textarea
              dir="rtl"
              placeholder="اكتب ملاحظتك أو شكر للمورد..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 h-28 outline-none focus:border-primary text-sm resize-none"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="sf-btn-secondary flex-1 !h-12"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={rating === 0 || submittingReview}
                className="sf-btn-primary flex-1 !h-12 !bg-amber-500 !border-amber-500 hover:!bg-amber-600"
              >
                {submittingReview ? <IconLoader2 size={14} className="animate-spin" /> : <IconStar size={14} stroke={1.6} />}
                إرسال التقييم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment confirm */}
      {showPayConfirm && data?.selectedBid?.netPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-section-title flex items-center gap-2">
                <IconInfoCircle className="text-primary" size={20} />
                تأكيد الدفع
              </h3>
              <button
                type="button"
                onClick={() => setShowPayConfirm(false)}
                aria-label="إغلاق"
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">سعر الخدمة</span>
                <span className="font-semibold text-slate-900">
                  {Number(data.selectedBid.netPrice).toFixed(2)} ج.م
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">رسوم المنصة ({(commissionRate * 100).toFixed(0)}%)</span>
                <span className="font-semibold text-rose-600">
                  +{(Number(data.selectedBid.netPrice) * commissionRate).toFixed(2)} ج.م
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-slate-900">الإجمالي</span>
                <span className="text-primary text-xl">
                  {(Number(data.selectedBid.netPrice) * (1 + commissionRate)).toFixed(2)} ج.م
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <IconAlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-amber-800">
                بالضغط على تأكيد الدفع، هيتخصم المبلغ من محفظتك أو هينقلك لبوابة الدفع الإلكتروني.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPayConfirm(false)}
                className="sf-btn-secondary flex-1"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executePayment}
                disabled={isPaying}
                className="sf-btn-primary flex-1"
              >
                {isPaying ? <IconLoader2 size={18} className="animate-spin" /> : <IconCircleCheck size={18} stroke={1.6} />}
                تأكيد الدفع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm — requires typing "إلغاء" to enable the confirm button */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-confirm-title"
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 id="cancel-confirm-title" className="text-section-title flex items-center gap-2">
                <IconAlertCircle className="text-rose-600" size={20} />
                تأكيد الإلغاء
              </h3>
              <button
                type="button"
                onClick={closeCancelConfirm}
                disabled={isCancelling}
                aria-label="إغلاق"
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center disabled:opacity-50"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <IconAlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1.5 text-sm text-rose-800 leading-relaxed">
                <p className="font-bold">هل أنت متأكد من إلغاء الطلب؟</p>
                <p>ده إجراء نهائي مش هينفع تتداركه، وهيتم إبلاغ أي موردين قدّموا عروض.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="cancel-confirm-input" className="text-helper block">
                للتأكيد، اكتب كلمة <span className="font-bold text-rose-700">إلغاء</span> في المربع أدناه
              </label>
              <input
                id="cancel-confirm-input"
                type="text"
                dir="rtl"
                value={cancelConfirmText}
                onChange={(e) => setCancelConfirmText(e.target.value)}
                placeholder="إلغاء"
                autoComplete="off"
                disabled={isCancelling}
                className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-base text-center font-bold tracking-widest text-slate-900 outline-none transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:opacity-50"
                aria-describedby="cancel-confirm-hint"
              />
              <p id="cancel-confirm-hint" className="text-[11px] text-slate-500 text-center">
                زرار التأكيد هيشتغل بس لما الكلمة تكون مطابقة بالظبط
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeCancelConfirm}
                disabled={isCancelling}
                className="sf-btn-secondary flex-1"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={executeCancel}
                disabled={isCancelling || cancelConfirmText.trim() !== "إلغاء"}
                className="flex-1 h-[52px] inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-rose-600 text-white text-base font-bold border border-rose-600 transition-colors hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
              >
                {isCancelling ? <IconLoader2 size={18} className="animate-spin" /> : <IconBan size={18} stroke={1.6} />}
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxIdx(null)}
          dir="rtl"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx(null);
            }}
            aria-label="إغلاق"
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <IconX size={22} />
          </button>
          {images && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((lightboxIdx - 1 + (images?.length ?? 0)) % (images?.length ?? 1));
                }}
                aria-label="السابق"
                className="absolute end-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <IconChevronRight size={22} stroke={1.6} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((lightboxIdx + 1) % (images?.length ?? 1));
                }}
                aria-label="التالي"
                className="absolute start-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <IconChevronLeft size={22} stroke={1.6} />
              </button>
            </>
          )}
          <img
            src={images[lightboxIdx].filePath}
            alt={images[lightboxIdx].fileName}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
          {images && images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold">
              {lightboxIdx + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RequestDetailsPage() {
  const params = useParams<{ requestId: string }>();
  const parsed = Number(params.requestId);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return <ErrorState message="معرف الطلب غير صالح." />;
  }
  return <RequestDetailsContent requestId={parsed} />;
}
