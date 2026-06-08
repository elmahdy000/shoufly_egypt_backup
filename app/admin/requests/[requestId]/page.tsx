"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { forwardAdminBid, listAdminRequestBids } from "@/lib/api/bids";
import { getRequestDetails } from "@/lib/api/requests";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import type { ApiBid } from "@/lib/types/api";
import {
  Inbox,
  Clock,
  MapPin,
  User,
  ArrowRight,
  FileText,
  Activity,
  CheckCircle,
  Image,
  MessageSquare,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { AdminButton, AdminIconButton } from "@/components/admin/ui";
import {
  PageHeader,
  DataCard,
  EmptyState,
  ErrorState,
  PageLoading,
  ConfirmDialog,
  RequestStatusBadge,
  StatusBadge,
  BID_STATUS_META,
} from "@/components/admin/primitives";
// Icons migrated to lucide-react
import { apiFetch } from "@/lib/api/client";

const TIMELINE_LABEL_MAP: Record<string, string> = {
  ORDER_PLACED: "تم إنشاء الطلب",
  VENDOR_PREPARING: "المورد يجهز الطلب",
  READY_FOR_PICKUP: "جاهز للاستلام",
  OUT_FOR_DELIVERY: "خرج للتوصيل",
  DELIVERED: "تم التسليم",
  CLOSED_SUCCESS: "مكتمل بنجاح",
  ACCEPTED_BY_CLIENT: "تم قبول العرض من العميل",
  REJECTED: "تم رفض الطلب",
  CANCELLED: "تم إلغاء الطلب",
  FAILED: "فشل التوصيل",
  PENDING: "قيد الانتظار",
  PENDING_ADMIN_REVISION: "بانتظار مراجعة الأدمن",
  OPEN_FOR_BIDDING: "تم فتح العروض",
  BIDS_RECEIVED: "وصلت عروض",
  OFFERS_FORWARDED: "تم إرسال العروض للعميل",
  ORDER_PAID_PENDING_DELIVERY: "تم الدفع - بانتظار التوصيل",
  CLOSED_CANCELLED: "تم الإلغاء",
  CLOSED_FAILED: "فشل الطلب",
  WITHDRAWN: "تم السحب",
  APPROVED: "تمت الموافقة",
  SELECTED: "تم اختيار المورّد",
};

function localizeStatus(status?: string | null): string {
  if (!status) return "غير محدد";
  return TIMELINE_LABEL_MAP[status] ?? status;
}

function localizeTitle(title?: string | null, fallbackId?: number): string {
  if (!title) return "طلب خدمة من شوفلي";
  const looksLikeEnglish = /^[\x00-\x7F\s]+$/.test(title);
  if (looksLikeEnglish) {
    const numericPart = title.replace(/[^0-9]/g, "").slice(0, 6);
    const suffix = numericPart || (fallbackId != null ? String(fallbackId) : "");
    return `طلب خدمة #${suffix}`;
  }
  return title;
}

function AdminRequestDetails({ requestId }: { requestId: number }) {
  const router = useRouter();
  const request = useAsyncData(() => getRequestDetails(requestId), [requestId]);
  const bids = useAsyncData(() => listAdminRequestBids(requestId), [requestId]);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleForward(bidId: number) {
    setActiveActionId(bidId);
    try {
      await forwardAdminBid(bidId);
      bids.setData((rows) =>
        (rows ?? []).map((b) => ({
          ...b,
          status: b.id === bidId ? ("SELECTED" as const) : b.status === "SELECTED" ? ("REJECTED" as const) : b.status,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActiveActionId(null);
    }
  }

  if (request.loading) {
    return <PageLoading label="بنجهز تفاصيل الطلب..." />;
  }

  if (request.error) {
    return (
      <ErrorState
        message={request.error}
        onRetry={request.refresh}
        className="m-6"
      />
    );
  }

  const req = request.data;
  if (!req) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-cairo p-10" dir="rtl">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto">
          <p className="text-slate-700 font-bold">لا يمكن تحميل بيانات الطلب حاليًا.</p>
          <AdminButton variant="soft" size="md" onClick={() => router.push("/admin/requests")}>
            الرجوع للطلبات
          </AdminButton>
        </div>
      </div>
    );
  }

  const tracking: { id?: number; status: string; createdAt: string; deliveryAgent?: { fullName?: string } }[] =
    ((req as unknown as { deliveryTracking?: unknown[] }).deliveryTracking ?? []) as never[];
  const images: { id: number; filePath: string; fileName?: string }[] =
    ((req as unknown as { images?: unknown[] }).images ?? []) as never[];
  const displayTitle = localizeTitle(req.title, req.id);
  const bidsList: ApiBid[] = bids.data ?? [];
  const clientName = (req as unknown as { clientName?: string }).clientName;
  const clientPhone = (req as unknown as { clientPhone?: string }).clientPhone;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        crumbs={[
          { label: "الطلبات", href: "/admin/requests" },
          { label: `طلب #${requestId}` },
        ]}
        title={
          <span className="flex items-center gap-3 flex-wrap">
            {displayTitle}
            <RequestStatusBadge status={req.status} />
          </span>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-jakarta">
              <Clock size={12} /> رقم الطلب: {requestId}
            </span>
            {req.address && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                {req.address}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MessageSquare size={14} /> التواصل مع العميل مفعل
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/messages?otherId=${req?.clientId}`}>
              <AdminButton variant="soft" size="lg" leadingIcon={MessageSquare}>
                شات مع العميل
              </AdminButton>
            </Link>
            <AdminButton
              variant="danger"
              size="lg"
              onClick={() => setShowCancelConfirm(true)}
            >
              إيقاف الطلب
            </AdminButton>
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Details & Bids */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-orange-500" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText className="text-primary" />
                  <span>شرح المشكلة</span>
                </div>
                <div className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  {req?.description || "لا يوجد وصف تفصيلي لهذا الطلب."}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Image /> المرفقات البصرية ({images.length})
                </p>
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {images.map((img, idx) => (
                      <a
                        key={img.id}
                        href={img.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-200 hover:border-orange-400 transition-all group relative block"
                      >
                        <img
                          src={img.filePath}
                          alt={img.fileName || `صورة ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                          <Image size={24} />
                          <span className="text-[10px] mt-1 font-bold">صورة {idx + 1}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-400">
                    <Image size={20} />
                    <span className="text-xs font-medium">لا توجد صور مرفقة بهذا الطلب</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="text-primary" /> عروض الموردين
                </h2>
                <span className="text-xs font-black px-3 py-1.5 bg-orange-50 text-primary rounded-full border border-orange-100">
                  {bidsList.length} عرض
                </span>
              </div>

              <div className="space-y-3">
                {bids.loading ? (
                  <div className="text-center py-12 text-slate-400 font-bold animate-pulse text-sm">
                    بنفرز عروض الأسعار...
                  </div>
                ) : bids.error ? (
                  <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center text-rose-700 font-bold text-sm">
                    {bids.error}
                  </div>
                ) : bidsList.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                    <EmptyState
                      icon={Inbox}
                      title="لسه مفيش عروض وصلت للطلب ده"
                      description="العروض هتظهر هنا فور وصولها"
                    />
                  </div>
                ) : (
                  bidsList.map((bid) => (
                    <BidCard
                      key={bid.id}
                      bid={bid}
                      isActing={activeActionId === bid.id}
                      onForward={handleForward}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Meta & Audit */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                بطاقة العميل
              </h3>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
                  {clientName?.[0] || <User />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base text-slate-900 truncate">
                    {clientName || `عميل #${req?.clientId}`}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <CheckCircle size={11} /> حساب موثّق
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                <InfoRow label="تاريخ إنشاء الطلب" value={req?.createdAt ? formatDate(req.createdAt) : "—"} />
                <InfoRow label="آخر تحديث" value={req?.updatedAt ? formatDate(req.updatedAt) : "—"} />
                <InfoRow label="معرّف العميل" value={`#${req?.clientId}`} mono />
                {clientPhone && (
                  <InfoRow label="رقم الهاتف" value={clientPhone} mono icon={<Phone size={11} />} />
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle className="text-primary" /> التسلسل الزمني
              </h3>

              <div className="space-y-5 relative before:absolute before:right-[11px] before:top-1 before:bottom-1 before:w-[2px] before:bg-slate-100">
                {tracking.length > 0 ? (
                  tracking.map((track, i) => (
                    <TimelineItem
                      key={track.id ?? i}
                      isLast={i === tracking.length - 1}
                      status={track.status}
                      actor={track.deliveryAgent?.fullName}
                      date={track.createdAt}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <Activity size={20} className="mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs font-medium">لا توجد أحداث مسجلة حالياً</p>
                    <p className="text-[10px] mt-1 text-slate-400">سيتم تحديث هذا القسم تلقائياً</p>
                  </div>
                )}

                {req?.status === "PENDING_ADMIN_REVISION" && (
                  <TimelineItem
                    isLast={true}
                    status="بانتظار موافقة الأدمن"
                    actor="الأدمن"
                    date={null}
                    pending
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => (isCancelling ? null : setShowCancelConfirm(false))}
        onConfirm={async () => {
          setIsCancelling(true);
          setCancelError(null);
          try {
            await apiFetch(`/api/admin/requests/${requestId}/cancel`, "ADMIN", { method: "PATCH" });
            setShowCancelConfirm(false);
            request.refresh();
          } catch (err) {
            setCancelError(err instanceof Error ? err.message : "فشل إيقاف الطلب");
          } finally {
            setIsCancelling(false);
          }
        }}
        title="إيقاف الطلب"
        description={
          <div className="space-y-2">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              هل أنت متأكد من إيقاف الطلب <strong>#{requestId}</strong>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيتم إخطار العميل والموردين.
            </div>
            {cancelError && (
              <div className="p-3 bg-rose-100 text-rose-700 rounded-lg text-xs">{cancelError}</div>
            )}
          </div>
        }
        confirmText="إيقاف الطلب"
        cancelText="تراجع"
        variant="danger"
        loading={isCancelling}
      />
    </div>
  );
}

function InfoRow({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 font-medium">
      <span className="text-slate-500 text-xs flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`text-slate-900 text-xs font-bold ${mono ? "font-jakarta" : ""}`}>{value}</span>
    </div>
  );
}

function TimelineItem({
  isLast,
  status,
  actor,
  date,
  pending,
}: {
  isLast: boolean;
  status: string;
  actor?: string | null;
  date?: string | null;
  pending?: boolean;
}) {
  const label = useMemo(() => {
    if (pending) return status;
    return localizeStatus(status);
  }, [status, pending]);

  return (
    <div className="relative pr-9">
      <div
        className={`absolute right-0 top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center z-10 ${
          pending ? "bg-slate-100 text-slate-300" : "bg-orange-500 text-white"
        }`}
      >
        {pending ? <div className="w-1.5 h-1.5 bg-current rounded-full" /> : <CheckCircle size={12} />}
      </div>
      <div className="space-y-0.5">
        <p className={`text-sm font-bold ${pending ? "text-slate-400 italic" : "text-slate-900"}`}>{label}</p>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wider">
          <span>المنفذ: {actor || "النظام"}</span>
          <span className="font-jakarta">{date ? formatDate(date) : "قيد الانتظار"}</span>
        </div>
      </div>
    </div>
  );
}

function BidCard({
  bid,
  isActing,
  onForward,
}: {
  bid: ApiBid;
  isActing: boolean;
  onForward: (id: number) => void;
}) {
  const isSelected = bid.status === "SELECTED";
  const isRejected = bid.status === "REJECTED";
  const price = Number(bid.clientPrice ?? bid.netPrice ?? 0);
  const meta = BID_STATUS_META[bid.status] ?? { label: localizeStatus(bid.status), tone: "slate" as const };

  return (
    <div
      className={`bg-white border rounded-2xl p-5 transition-all group ${
        isSelected ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200 hover:border-orange-300"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-lg shrink-0 ${
              isSelected ? "bg-emerald-500" : "bg-orange-500"
            }`}
          >
            {bid.vendor?.fullName?.[0] || "V"}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base text-slate-900 truncate">
              {bid.vendor?.fullName || `مورّد #${bid.vendorId}`}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge tone={meta.tone} label={meta.label} size="xs" />
              <span className="text-[10px] text-slate-400 font-jakarta">UID-{bid.vendorId}</span>
            </div>
          </div>
        </div>
        <div
          className={`shrink-0 w-full md:w-auto text-left px-4 py-2.5 rounded-xl border ${
            isSelected ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
          }`}
        >
          <p
            className={`text-[10px] font-bold tracking-wider mb-0.5 text-center ${
              isSelected ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            تكلفة العميل النهائية
          </p>
          <p
            className={`text-lg font-bold font-jakarta text-center ${
              isSelected ? "text-emerald-700" : "text-slate-900"
            }`}
          >
            {formatCurrency(price)}
          </p>
        </div>
      </div>

      {bid.description && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-xs text-slate-600 italic leading-relaxed">
          &quot;{bid.description}&quot;
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-2 border-t border-slate-100 pt-3">
        <Link href={`/messages?otherId=${bid.vendorId}`} className="w-full sm:w-auto">
          <AdminButton
            variant="soft"
            size="md"
            fullWidth
            leadingIcon={MessageSquare}
            className="sm:w-auto"
          >
            شات مع المورّد
          </AdminButton>
        </Link>
        <AdminButton
          variant={isSelected ? "success" : isRejected ? "soft" : "primary"}
          size="md"
          fullWidth
          isLoading={isActing}
          disabled={isSelected || isRejected}
          onClick={() => onForward(bid.id)}
          className="sm:flex-1"
        >
          {isSelected ? "✓ تم توجيهه للعميل" : isRejected ? "مرفوض" : "توجيه العرض للعميل"}
        </AdminButton>
      </div>
    </div>
  );
}

export default function AdminRequestDetailsPage() {
  const params = useParams<{ requestId: string }>();
  const parsed = Number(params.requestId);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-cairo p-20 text-center text-slate-700 font-bold" dir="rtl">
        معرّف الطلب غير صالح.
      </div>
    );
  }

  return <AdminRequestDetails requestId={parsed} />;
}
