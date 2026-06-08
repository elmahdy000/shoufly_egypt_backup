"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { refundAdminRequest } from "@/lib/api/transactions";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Hash,
  Loader2,
  Package,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { AdminButton } from "@/components/admin/ui";
import {
  PageHeader,
  DataTable,
  type DataTableColumn,
  TableCard,
  EmptyState,
  PageLoading,
  SearchInput,
  InlineToast,
  RequestStatusBadge,
  ConfirmDialog,
} from "@/components/admin/primitives";

type RequestStatus =
  | "PENDING_ADMIN_REVISION"
  | "OPEN_FOR_BIDDING"
  | "BIDS_RECEIVED"
  | "OFFERS_FORWARDED"
  | "ORDER_PAID_PENDING_DELIVERY"
  | "CLOSED_SUCCESS"
  | "CLOSED_CANCELLED"
  | "REJECTED";

type AdminRequest = {
  id: number;
  title: string;
  status: RequestStatus;
  client?: { fullName?: string | null } | null;
};

export default function AdminRefundsPage() {
  const [requestId, setRequestId] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.type === "ok" ? 4000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const { data: allRequests, loading: loadingReq } = useAsyncData<AdminRequest[]>(
    () =>
      apiFetch<{ data: AdminRequest[]; total: number }>(
        "/api/admin/requests?limit=100&status=ORDER_PAID_PENDING_DELIVERY",
        "ADMIN",
      ).then((res) => res?.data ?? []),
    [],
  );

  const refundable = useMemo(() => {
    const list = allRequests ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        String(r.id).includes(q) ||
        r.client?.fullName?.toLowerCase().includes(q),
    );
  }, [allRequests, search]);

  async function processRefund() {
    setIsLoading(true);
    try {
      const result = await refundAdminRequest(Number(requestId), reason || "استرداد يدوي من لوحة الإدارة");
      setToast({
        type: "ok",
        message: `تم إصدار استرداد بنجاح للطلب #${result.request?.id ?? requestId} ✓`,
      });
      setRequestId("");
      setReason("");
    } catch (err: unknown) {
      setToast({
        type: "err",
        message: err instanceof Error ? err.message : "فشلت عملية الاسترداد",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const columns: DataTableColumn<AdminRequest>[] = useMemo(
    () => [
      {
        key: "title",
        header: "الشحنة المستهدفة",
        render: (r) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
              <Package size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] leading-tight mb-0.5">
                {r.title}
              </p>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">SHP_#{r.id}</p>
            </div>
          </div>
        ),
      },
      {
        key: "client",
        header: "صاحب الطلب",
        render: (r) => (
          <span className="text-xs font-bold text-slate-600">{r.client?.fullName || "—"}</span>
        ),
      },
      {
        key: "action",
        header: "الإدارة التنفيذية",
        thClassName: "text-center",
        className: "text-center",
        render: (r) => (
          <AdminButton
            variant="danger"
            size="sm"
            onClick={() => {
              setRequestId(String(r.id));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            تجهيز الاسترداد
          </AdminButton>
        ),
      },
    ],
    [],
  );

  if (loadingReq && !allRequests) {
    return (
      <>
        <PageHeader
          eyebrow="مركز تسوية المستحقات"
          eyebrowTone="rose"
          title={
            <>
              رد <span className="text-rose-600">الأموال</span>
            </>
          }
          subtitle="إدارة وتسوية طلبات استرجاع المبالغ وضمان حقوق الأطراف."
        />
        <PageLoading label="جاري تحميل..." />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="مركز تسوية المستحقات"
        eyebrowTone="rose"
        title={
          <>
            رد <span className="text-rose-600">الأموال</span>
          </>
        }
        subtitle="إدارة وتسوية طلبات استرجاع المبالغ وضمان حقوق الأطراف."
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Refund Center Form */}
            <TableCard
              title={
                <span className="flex items-center gap-2">
                  <RefreshCw size={18} className="text-rose-600" />
                  إطلاق طلب استرداد
                </span>
              }
              titleAction={
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  Direct Process
                </span>
              }
            >
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 mb-6 shadow-sm">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-amber-900 mb-1 uppercase tracking-tighter">
                    تحذير أمني
                  </p>
                  <p className="text-sm font-medium text-amber-800/80 leading-relaxed">
                    هذا الإجراء سيقوم بسحب المبالغ وإعادتها فوراً للعميل مع إلغاء الطلب نهائياً. تأكد من صحة البيانات قبل التأكيد.
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 tracking-wide">رقم الطلب المستهدف</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-slate-400 border-l border-slate-100">
                        <Hash size={16} />
                      </div>
                      <input
                        type="number"
                        value={requestId}
                        onChange={(e) => setRequestId(e.target.value)}
                        placeholder="إدخال المعرف الرقمي..."
                        className="w-full h-11 pr-12 pl-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 tracking-wide">سبب التسوية / الاسترداد</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-slate-400 border-l border-slate-100">
                        <FileText size={16} />
                      </div>
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="تفاصيل سبب الاسترداد..."
                        className="w-full h-11 pr-12 pl-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <AdminButton
                  type="submit"
                  variant="danger"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  disabled={!requestId}
                  loadingText="معالجة..."
                >
                  معالجة وإتمام عملية الاسترداد المالي
                </AdminButton>
              </form>
            </TableCard>

            {/* Refundable Requests List */}
            <TableCard
              flush
              title="الطلبات المرشحة للاسترداد"
              description="الطلبات التي تم دفع قيمتها ولم يتم تسليمها بعد."
              toolbar={
                <SearchInput
                  value={search}
                  onChange={(v) => setSearch(v)}
                  placeholder="بحث بالاسم أو المعرف..."
                  ariaLabel="بحث في الطلبات المرشحة"
                  className="sm:max-w-xs"
                />
              }
            >
              <DataTable
                columns={columns}
                rows={refundable}
                rowKey={(r) => r.id}
                minWidth={600}
                loading={loadingReq}
                mobileCard={(r) => (
                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                        <p className="text-[10px] text-slate-400">SHP_#{r.id}</p>
                      </div>
                      <RequestStatusBadge status={r.status} size="xs" />
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{r.client?.fullName || "—"}</p>
                    <AdminButton
                      variant="danger"
                      size="xs"
                      fullWidth
                      onClick={() => {
                        setRequestId(String(r.id));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      تجهيز الاسترداد
                    </AdminButton>
                  </div>
                )}
                empty={
                  <EmptyState
                    icon={RefreshCw}
                    title="لا توجد طلبات قابلة للاسترداد حالياً"
                  />
                }
              />
            </TableCard>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <TableCard
              title="بروتوكول تسوية الأموال"
              description="Refunding Policy v2.0"
            >
              <div className="space-y-5">
                <Guideline color="bg-indigo-500" label="التدقيق المالي" text="عمليات الاسترداد متاحة فقط للطلبات التي تتبع دورة الدفع الكاملة بنجاح." />
                <Guideline color="bg-amber-500" label="تحويل الحالة" text="يتم إيقاف المندوب فوراً وإخطاره بإلغاء الطلب من قبل الإدارة بعد الاسترداد." />
                <Guideline color="bg-emerald-500" label="سرعة التسوية" text="يتم تحديث ميزانية النظام ورد المبلغ لمحفظة العميل بشكل آني ودقيق." />
              </div>

              <div className="mt-5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium text-slate-400 leading-relaxed italic">
                * كافة العمليات المسجلة هنا تخضع للمراقبة الأمنية ويتم أرشفة بيانات المسؤول القائم بالعملية.
              </div>
            </TableCard>
          </div>
        </div>
      </div>

      {/* Confirm Refund Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await processRefund();
        }}
        title="تأكيد عملية الاسترداد المالي"
        description={
          <div className="space-y-2">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
              هل أنت متأكد من رد المبلغ للطلب <strong>#{requestId}</strong>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيتم إخطار العميل فوراً.
            </div>
            {reason && (
              <p className="text-xs text-slate-500">سبب الاسترداد: {reason}</p>
            )}
          </div>
        }
        confirmText="تأكيد الاسترداد"
        cancelText="تراجع"
        variant="danger"
        loading={isLoading}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-full max-w-sm px-4">
          <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}

function Guideline({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-sm font-bold text-slate-900">{label}</span>
      </div>
      <p className="text-xs text-slate-500 tracking-tight leading-relaxed mr-3">{text}</p>
    </div>
  );
}
