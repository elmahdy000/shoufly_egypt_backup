"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { reviewAdminWithdrawal } from "@/lib/api/transactions";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  Activity,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  DollarSign,
  Hash,
  History,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
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
  WITHDRAWAL_STATUS_META,
  type StatusTone,
  ConfirmDialog,
} from "@/components/admin/primitives";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const FILTER_OPTIONS = [
  { value: "ALL", label: "كل الحالات" },
  { value: "PENDING", label: "بانتظار الفحص" },
  { value: "APPROVED", label: "تم الصرف" },
  { value: "REJECTED", label: "مرفوض" },
];

export default function AdminWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; message: string } | null>(null);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  const { data: withdrawals, loading, setData, refresh } = useAsyncData<any[]>(
    async () => {
      const res = await apiFetch<any>("/api/admin/withdrawals", "ADMIN");
      return res.items || [];
    },
    [],
  );

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.type === "ok" ? 4000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const list = Array.isArray(withdrawals) ? withdrawals : [];
    let result = [...list];
    if (statusFilter !== "ALL") result = result.filter((w: any) => w.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w: any) =>
          w.vendor?.fullName?.toLowerCase().includes(q) || String(w.id).includes(q),
      );
    }
    return result;
  }, [withdrawals, statusFilter, search]);

  const stats = useMemo(() => {
    const all = Array.isArray(withdrawals) ? withdrawals : [];
    return {
      total: all.length,
      pending: all.filter((w: any) => w.status === "PENDING").length,
      approved: all.filter((w: any) => w.status === "APPROVED").length,
      pendingAmount: all
        .filter((w: any) => w.status === "PENDING")
        .reduce((s: number, w: any) => s + Number(w.amount), 0),
    };
  }, [withdrawals]);

  async function handleReview(id: number, action: "APPROVE" | "REJECT") {
    setActionLoading(action === "APPROVE" ? "approve" : "reject");
    try {
      const note = action === "REJECT" ? (rejectNote || "تم الرفض من قبل الإدارة") : undefined;
      await reviewAdminWithdrawal(id, action.toLowerCase() as "approve" | "reject", note);
      const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
      setData(
        (prev: any[] | null) =>
          (prev ?? []).map((w) => (w.id === id ? { ...w, status: newStatus, reviewNote: note } : w)),
      );
      setSelected((prev: any) =>
        prev?.id === id ? { ...prev, status: newStatus, reviewNote: note } : prev,
      );
      setToast({
        type: "ok",
        message:
          action === "APPROVE"
            ? "تم اعتماد الطلب وصرف المبلغ بنجاح ✓"
            : "تم تنفيذ إجراء الرفض",
      });
      if (action === "REJECT") {
        setRejectNote("");
        setConfirmRejectOpen(false);
      }
    } catch (e: any) {
      setToast({ type: "err", message: e.message || "فشلت العملية" });
    } finally {
      setActionLoading(null);
    }
  }

  const columns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        key: "vendor",
        header: "المستفيد / التاريخ",
        render: (w) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
              {w.vendor?.fullName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">{w.vendor?.fullName}</p>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase">
                {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true, locale: ar })}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "amount",
        header: "المبلغ",
        thClassName: "text-center",
        className: "text-center",
        render: (w) => (
          <span className="text-lg font-black text-slate-900 tabular-nums">
            {formatCurrency(Number(w.amount))}
          </span>
        ),
      },
      {
        key: "status",
        header: "الحالة",
        thClassName: "text-center",
        className: "text-center",
        render: (w) => {
          const meta = WITHDRAWAL_STATUS_META[w.status] ?? {
            label: w.status,
            tone: "slate" as StatusTone,
          };
          return <StatusBadge tone={meta.tone} label={meta.label} dot size="xs" />;
        },
      },
      {
        key: "action",
        header: "إجراء",
        thClassName: "text-left",
        className: "text-left",
        render: (w) => (
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-slate-300 flex items-center justify-center">
            <ChevronLeft size={16} />
          </div>
        ),
      },
    ],
    [],
  );

  if (loading && !withdrawals) {
    return <PageLoading label="جاري تحميل طلبات السحب..." />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="التدقيق المالي"
        eyebrowTone="amber"
        title="سحوبات الأموال"
        subtitle="مراجعة واعتماد طلبات تحويل الأرصدة للبنوك والمحافظ الإلكترونية."
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="soft"
              size="md"
              leadingIcon={RefreshCw}
              onClick={handleRefresh}
              isLoading={loading}
            >
              تحديث البيانات
            </AdminButton>
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* Metrics Strip */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="بانتظار الفحص"
            value={stats.pending}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="قيمة المعلق"
            value={formatCurrency(stats.pendingAmount)}
            icon={DollarSign}
            tone="amber"
            badge={{ label: "معلق", tone: "amber" }}
          />
          <StatCard
            label="طلبات مكتملة"
            value={stats.approved}
            icon={CheckCircle}
            tone="emerald"
          />
          <StatCard
            label="إجمالي الحركات"
            value={stats.total}
            icon={Activity}
            tone="primary"
          />
        </section>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="ابحث باسم المستفيد أو رقم الطلب..."
              ariaLabel="بحث في طلبات السحب"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <AdminFilterChip
                key={opt.value}
                label={opt.label}
                active={statusFilter === opt.value}
                tone="primary"
                onClick={() => setStatusFilter(opt.value)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Withdrawal List */}
          <div className="lg:col-span-8 space-y-3">
            <TableCard flush>
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(w) => w.id}
                minWidth={750}
                loading={loading}
                onRowClick={(w) => setSelected(w)}
                mobileCard={(w) => {
                  const meta = WITHDRAWAL_STATUS_META[w.status] ?? {
                    label: w.status,
                    tone: "slate" as StatusTone,
                  };
                  return (
                    <button
                      type="button"
                      onClick={() => setSelected(w)}
                      className={`w-full text-right bg-white border rounded-xl p-3 transition-colors ${
                        selected?.id === w.id
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                            {w.vendor?.fullName?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {w.vendor?.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatDistanceToNow(new Date(w.createdAt), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </p>
                          </div>
                        </div>
                        <StatusBadge tone={meta.tone} label={meta.label} dot size="xs" />
                      </div>
                      <div className="text-lg font-black text-slate-900 tabular-nums">
                        {formatCurrency(Number(w.amount))}
                      </div>
                    </button>
                  );
                }}
                empty={
                  <EmptyState
                    icon={Landmark}
                    title="لا توجد طلبات سحب حالياً"
                    description="عند تقديم أي طلب سحب جديد سيظهر هنا"
                  />
                }
              />
            </TableCard>
          </div>

          {/* Withdrawal Auditor */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-primary">
                      <Landmark size={18} />
                    </div>
                    <h2 className="text-sm font-black text-slate-900">تفاصيل السحب</h2>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="إغلاق تفاصيل السحب"
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      القيمة المطلوب صرفها
                    </p>
                    <div className="space-y-2">
                      <h4 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                        {formatCurrency(Number(selected.amount))}
                      </h4>
                      <div>
                        <StatusBadge
                          tone={
                            (WITHDRAWAL_STATUS_META[selected.status] ?? { tone: "slate" as StatusTone }).tone
                          }
                          label={
                            (WITHDRAWAL_STATUS_META[selected.status] ?? { label: selected.status }).label
                          }
                          dot
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <InfoRow icon={<User size={16} />} label="المستفيد الرسمي" val={selected.vendor?.fullName} />
                    <InfoRow icon={<Hash size={16} />} label="رقم العملية" val={`#WTH-${selected.id}`} />
                    <InfoRow
                      icon={<Calendar size={16} />}
                      label="تاريخ الطلب"
                      val={formatDate(selected.createdAt)}
                    />
                  </div>

                  {toast && (
                    <InlineToast
                      type={toast.type}
                      message={toast.message}
                      onClose={() => setToast(null)}
                    />
                  )}

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {selected.status === "PENDING" && (
                      <>
                        <AdminButton
                          variant="primary"
                          size="lg"
                          fullWidth
                          leadingIcon={ShieldCheck}
                          isLoading={actionLoading === "approve"}
                          onClick={() => {
                            setConfirmRejectOpen(false);
                            handleReview(selected.id, "APPROVE");
                          }}
                          className="shadow-lg shadow-primary/20"
                        >
                          اعتماد وصرف المبلغ
                        </AdminButton>

                        <div className="space-y-2 pt-2 border-t border-slate-50">
                          <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="اكتب سبب الرفض هنا (إلزامي للرفض)..."
                            rows={2}
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all resize-none shadow-sm placeholder:text-slate-400"
                          />
                          <AdminButton
                            variant="danger"
                            size="md"
                            fullWidth
                            leadingIcon={XCircle}
                            isLoading={actionLoading === "reject"}
                            disabled={!rejectNote.trim()}
                            onClick={() => setConfirmRejectOpen(true)}
                          >
                            رفض الطلب
                          </AdminButton>
                        </div>
                      </>
                    )}

                    <Link
                      href={`/admin/audit-logs?entityType=WITHDRAWAL&entityId=${selected.id}`}
                      className="w-full h-10 text-slate-400 hover:text-slate-600 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <History size={14} /> سجل التدقيق المالي
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Landmark size={28} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-500">اختر طلباً لعرض تفاصيل الصرف</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={() => handleReview(selected?.id, "REJECT")}
        title="رفض طلب السحب"
        description={
          <div className="space-y-1">
            <p>هل أنت متأكد من رفض طلب السحب رقم <strong>#{selected?.id}</strong>؟</p>
            <p className="text-xs text-slate-500">سبب الرفض: {rejectNote || "لم يُكتب سبب"}</p>
          </div>
        }
        confirmText="تأكيد الرفض"
        cancelText="تراجع"
        variant="danger"
        loading={actionLoading === "reject"}
      />
    </div>
  );
}

function InfoRow({ icon, label, val }: { icon: React.ReactNode; label: string; val: string }) {
  return (
    <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900 truncate max-w-[150px]">{val}</span>
    </div>
  );
}
