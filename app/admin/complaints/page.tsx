"use client";

import { useEffect, useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  ChevronLeft,
  MessageSquare,
  Shield,
  ShieldAlert,
  X,
} from "lucide-react";
import { AdminButton, AdminIconButton, AdminFilterChip } from "@/components/admin/ui";
import {
  PageHeader,
  StatCard,
  DataTable,
  type DataTableColumn,
  TableCard,
  EmptyState,
  PageLoading,
  Pagination,
  SearchInput,
  StatusBadge,
  InlineToast,
  COMPLAINT_STATUS_META,
  type StatusTone,
  ConfirmDialog,
} from "@/components/admin/primitives";

interface Complaint {
  id: number;
  requestId: number;
  requestTitle: string;
  requestStatus: string;
  hasEscrow: boolean;
  escrowAmount: number | null;
  netPrice: number | null;
  ticketNumber: string;
  reporterName: string;
  reporterRole: string;
  accusedName?: string;
  accusedRole?: string;
  type: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  description: string;
  createdAt: string;
}

const STATUS_TABS = [
  { value: "ALL", label: "الكل" },
  { value: "OPEN", label: "مفتوح" },
  { value: "RESOLVED", label: "مغلق" },
];

export default function AdminComplaintsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [toast, setToast] = useState<{ type: "ok" | "err"; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: string } | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [penaltyPercentage, setPenaltyPercentage] = useState(50);
  const [confirmDisputeOpen, setConfirmDisputeOpen] = useState(false);
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    if (selected) {
      setPenaltyPercentage(50);
    }
  }, [selected]);


  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.type === "ok" ? 4000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const { data: result, loading, refresh } = useAsyncData<
    Complaint[] | { data: Complaint[]; total: number }
  >(
    () => {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String((page - 1) * ITEMS_PER_PAGE),
      });
      return apiFetch(`/api/admin/complaints?${params}`, "ADMIN");
    },
    [page],
  );

  const complaints: Complaint[] = Array.isArray(result) ? result : (result as { data?: Complaint[] })?.data ?? [];
  const totalItems: number = Array.isArray(result) ? complaints.length : (result as { total?: number })?.total ?? complaints.length;

  const filteredComplaints = useMemo(() => {
    let list = complaints || [];
    if (statusFilter === "OPEN") {
      list = list.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS");
    } else if (statusFilter === "RESOLVED") {
      list = list.filter((c) => c.status === "RESOLVED" || c.status === "REJECTED");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.ticketNumber.toLowerCase().includes(q) ||
          c.reporterName.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q),
      );
    }
    return list;
  }, [complaints, search, statusFilter]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const list = complaints ?? [];
    return {
      total: totalItems,
      open: list.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS").length,
      resolved: list.filter((c) => c.status === "RESOLVED" || c.status === "REJECTED").length,
    };
  }, [complaints, totalItems]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await apiFetch(`/api/admin/complaints/${id}`, "ADMIN", {
        method: "PATCH",
        body: { status: newStatus },
      });
      setToast({
        type: "ok",
        message:
          newStatus === "RESOLVED"
            ? "تم حل النزاع وإغلاق التذكرة بنجاح! ✅"
            : newStatus === "IN_PROGRESS"
              ? "تم تحويل حالة النزاع إلى قيد المراجعة. ⚠️"
              : "تم إعادة فتح النزاع بنجاح. 🔄",
      });
      refresh();
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status: newStatus as Complaint["status"] } : null));
      }
      setConfirmAction(null);
    } catch {
      setToast({ type: "err", message: "حدث خطأ أثناء تحديث حالة النزاع." });
    }
  };

  const handleResolveDispute = async (requestId: number, complaintId: number) => {
    setDisputeLoading(true);
    try {
      await apiFetch(`/api/admin/requests/${requestId}/resolve-dispute`, "ADMIN", {
        method: "POST",
        body: { penaltyPercentage },
      });

      await apiFetch(`/api/admin/complaints/${complaintId}`, "ADMIN", {
        method: "PATCH",
        body: { status: "RESOLVED" },
      });

      setToast({
        type: "ok",
        message: "تم تسوية النزاع مالياً وإغلاق التذكرة بنجاح! 💰⚖️",
      });

      setConfirmDisputeOpen(false);
      refresh();
      if (selected?.id === complaintId) {
        setSelected(null);
      }
    } catch (err: any) {
      setToast({ type: "err", message: err.message || "حدث خطأ أثناء تسوية النزاع." });
    } finally {
      setDisputeLoading(false);
    }
  };


  const columns: DataTableColumn<Complaint>[] = useMemo(
    () => [
      {
        key: "ticket",
        header: "التذكرة",
        render: (c) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <MessageSquare size={16} />
            </div>
            <span className="font-black text-slate-900 text-sm">{c.ticketNumber}</span>
          </div>
        ),
      },
      {
        key: "reporter",
        header: "المُبلغ",
        render: (c) => (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{c.reporterName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{c.reporterRole}</p>
          </div>
        ),
      },
      {
        key: "accused",
        header: "المُدعى عليه",
        render: (c) => (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{c.accusedName || "—"}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{c.accusedRole || "—"}</p>
          </div>
        ),
      },
      {
        key: "type",
        header: "النوع",
        render: (c) => (
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{c.type}</span>
        ),
      },
      {
        key: "status",
        header: "الحالة",
        render: (c) => {
          const meta = COMPLAINT_STATUS_META[c.status] ?? { label: c.status, tone: "slate" as StatusTone };
          return <StatusBadge tone={meta.tone} label={meta.label} dot size="xs" />;
        },
      },
      {
        key: "date",
        header: "التاريخ",
        render: (c) => (
          <span className="text-xs text-slate-500 font-bold tabular-nums whitespace-nowrap">
            {formatDate(c.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  if (loading && !complaints.length) {
    return (
      <>
        <PageHeader
          eyebrow="مركز النزاعات"
          eyebrowTone="rose"
          title={
            <>
              إدارة <span className="text-rose-500">النزاعات</span>
            </>
          }
          subtitle="متابعة وحل الشكاوى والنزاعات بين العملاء والموردين لضمان جودة المنصة."
        />
        <PageLoading label="جاري جلب سجل النزاعات..." />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="مركز النزاعات"
        eyebrowTone="rose"
        title={
          <>
            إدارة <span className="text-rose-500">النزاعات</span>
          </>
        }
        subtitle="متابعة وحل الشكاوى والنزاعات بين العملاء والموردين لضمان جودة المنصة."
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="بحث برقم التذكرة أو الاسم..."
              className="sm:w-72"
              ariaLabel="بحث في النزاعات"
            />
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value as typeof statusFilter);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === tab.value
                      ? "bg-white text-rose-600 border border-slate-200 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="إجمالي النزاعات" value={stats.total} icon={Shield} tone="blue" />
          <StatCard label="نزاعات مفتوحة" value={stats.open} icon={AlertCircle} tone="rose" />
          <StatCard label="نزاعات محلولة" value={stats.resolved} icon={CheckCircle} tone="emerald" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Complaints List */}
          <div className="xl:col-span-7 space-y-3">
            <TableCard flush>
              <DataTable
                columns={columns}
                rows={filteredComplaints}
                rowKey={(c) => c.id}
                minWidth={750}
                loading={loading}
                onRowClick={(c) => setSelected(c)}
                mobileCard={(c) => {
                  const meta = COMPLAINT_STATUS_META[c.status] ?? { label: c.status, tone: "slate" as StatusTone };
                  return (
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className={`w-full text-right bg-white border rounded-xl p-3 transition-colors ${
                        selected?.id === c.id
                          ? "border-rose-300 bg-rose-50/30"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{c.ticketNumber}</p>
                          <p className="text-[11px] text-slate-500 truncate">{c.reporterName}</p>
                        </div>
                        <StatusBadge tone={meta.tone} label={meta.label} dot size="xs" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{c.type}</span>
                        <span>{formatDate(c.createdAt)}</span>
                      </div>
                    </button>
                  );
                }}
                empty={
                  <EmptyState
                    icon={ShieldAlert}
                    title="لا توجد نزاعات مسجلة حالياً"
                  />
                }
              />

              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </TableCard>
          </div>

          {/* Inspector Panel */}
          <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-28">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shrink-0">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-slate-900 truncate">تفاصيل النزاع</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {selected.ticketNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نوع النزاع</span>
                      <StatusBadge
                        tone={(COMPLAINT_STATUS_META[selected.status] ?? { tone: "slate" as StatusTone }).tone}
                        label={(COMPLAINT_STATUS_META[selected.status] ?? { label: selected.status }).label}
                        dot
                        size="xs"
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                      {selected.type}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تفاصيل الشكوى</p>
                    <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 leading-relaxed">
                      {selected.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-slate-100 rounded-xl bg-white">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">المُبلغ</p>
                      <p className="text-sm font-black text-slate-900 mb-1">{selected.reporterName}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">
                        {selected.reporterRole}
                      </span>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-white">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">المُدعى عليه</p>
                      <p className="text-sm font-black text-slate-900 mb-1">{selected.accusedName || "—"}</p>
                      {selected.accusedRole && (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">
                          {selected.accusedRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  {selected.hasEscrow && ["ORDER_PAID_PENDING_DELIVERY", "CLOSED_CANCELLED", "PENDING_ADMIN_REVISION"].includes(selected.requestStatus) && (
                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 col-span-2 text-right mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <AlertCircle size={14} />
                        <span>نزاع مالي نشط (مبلغ الضمان: {selected.escrowAmount} ج.م)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        هذا الطلب يحتوي على دفعة ضمان معلقة. يرجى تحديد نسبة التعويض للمورد (تتراوح بين 0% و 100%) لتقسيم مبلغ الضمان بين العميل والمورد.
                      </p>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">نسبة تعويض المورد: {penaltyPercentage}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={penaltyPercentage}
                          onChange={(e) => setPenaltyPercentage(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>0% (إرجاع كامل للعميل)</span>
                          <span>100% (صرف كامل للمورد)</span>
                        </div>
                      </div>

                      {selected.netPrice && (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-1 text-[11px] font-bold text-slate-600">
                          <div className="flex justify-between">
                            <span>سعر الخدمة الصافي:</span>
                            <span className="text-slate-900">{selected.netPrice} ج.م</span>
                          </div>
                          <div className="flex justify-between text-emerald-600">
                            <span>سيتم إرجاع للعميل:</span>
                            <span>{(selected.netPrice * (100 - penaltyPercentage) / 100).toFixed(2)} ج.م</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>سيتم صرفه للمورد:</span>
                            <span>{(selected.netPrice * penaltyPercentage / 100).toFixed(2)} ج.م</span>
                          </div>
                          {selected.escrowAmount && (
                            <div className="flex justify-between text-indigo-600 border-t border-slate-50 pt-1 mt-1">
                              <span>عمولة المنصة (مستقطعة):</span>
                              <span>{(selected.escrowAmount - selected.netPrice).toFixed(2)} ج.م</span>
                            </div>
                          )}
                        </div>
                      )}

                      <AdminButton
                        variant="primary"
                        size="md"
                        fullWidth
                        leadingIcon={Shield}
                        onClick={() => setConfirmDisputeOpen(true)}
                        className="mt-2"
                      >
                        تسوية الضمان مالياً وحل النزاع
                      </AdminButton>
                    </div>
                  )}

                  {selected.status === "OPEN" || selected.status === "IN_PROGRESS" ? (
                    <>
                      <AdminButton
                        variant="success"
                        size="md"
                        fullWidth
                        leadingIcon={CheckCircle}
                        onClick={() => setConfirmAction({ id: selected.id, action: "RESOLVED" })}
                      >
                        حل النزاع
                      </AdminButton>
                      <AdminButton
                        variant="soft"
                        size="md"
                        fullWidth
                        leadingIcon={ArrowUpRight}
                        onClick={() => handleUpdateStatus(selected.id, "IN_PROGRESS")}
                      >
                        قيد المراجعة
                      </AdminButton>
                    </>
                  ) : (
                    <AdminButton
                      variant="soft"
                      size="md"
                      fullWidth
                      leadingIcon={AlertCircle}
                      onClick={() => handleUpdateStatus(selected.id, "OPEN")}
                      className="col-span-2"
                    >
                      إعادة فتح النزاع
                    </AdminButton>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <ShieldAlert size={28} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">اختر نزاعاً لعرض تفاصيله</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-full max-w-sm px-4">
          <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) handleUpdateStatus(confirmAction.id, confirmAction.action);
        }}
        title="تأكيد الإجراء"
        description="هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟"
        confirmText="تأكيد"
        cancelText="تراجع"
        variant="primary"
      />

      <ConfirmDialog
        open={confirmDisputeOpen}
        onClose={() => setConfirmDisputeOpen(false)}
        onConfirm={() => {
          if (selected) handleResolveDispute(selected.requestId, selected.id);
        }}
        title="تسوية النزاع المالي وتصفية الضمان"
        description={
          <div className="space-y-2 text-right" dir="rtl">
            <p>هل أنت متأكد من تصفية مبلغ الضمان للطلب <strong>#{selected?.requestId}</strong>؟</p>
            <p className="text-xs text-slate-500 font-bold">
              سيتم تقسيم المبلغ بنسبة <strong>{penaltyPercentage}%</strong> لصالح المورد و <strong>{100 - penaltyPercentage}%</strong> لصالح العميل. هذا الإجراء نهائي وسيتم تحويل المبالغ للمحافظ مباشرة.
            </p>
          </div>
        }
        confirmText="تأكيد التسوية المالية"
        cancelText="تراجع"
        variant="primary"
        loading={disputeLoading}
      />
    </div>
  );
}

