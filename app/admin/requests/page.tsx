"use client";

import { useState, useMemo, useCallback, useEffect, memo } from "react";
import Link from "next/link";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { useDebounce } from "@/lib/hooks/use-performance";
import { apiFetch } from "@/lib/api/client";
import { formatDate, formatCurrency } from "@/lib/formatters";
import {
  AlertCircle,
  ArrowUpRight,
  Box,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Hash,
  History,
  Inbox,
  ListChecks,
  Phone,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Store,
  Truck,
  User,
  X,
} from "lucide-react";
import { AdminButton, AdminIconButton, AdminFilterChip } from "@/components/admin/ui";
import {
  PageHeader,
  DataTable,
  type DataTableColumn,
  TableCard,
  EmptyState,
  PageLoading,
  Pagination,
  SearchInput,
  RequestStatusBadge,
} from "@/components/admin/primitives";

interface OrderRequest {
  id: number;
  title: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt?: string;
  client?: { fullName?: string; phone?: string };
  vendor?: { fullName?: string } | null;
  items: unknown[];
  acceptedBidId?: number | null;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "جميع الحالات" },
  { value: "PENDING_ADMIN_REVISION", label: "بانتظار المراجعة" },
  { value: "OPEN_FOR_BIDDING", label: "مفتوح للعروض" },
  { value: "OFFERS_FORWARDED", label: "عروض مُرسلة" },
  { value: "ORDER_PAID_PENDING_DELIVERY", label: "قيد التوصيل" },
  { value: "CLOSED_SUCCESS", label: "تم التوصيل" },
  { value: "CLOSED_CANCELLED", label: "ملغي" },
];

const ITEMS_PER_PAGE = 10;

function localizeOrderTitle(title?: string | null, _id?: number): string {
  if (!title) return "طلب بدون عنوان";
  const trimmed = title.trim();
  if (!trimmed) return "طلب بدون عنوان";
  return trimmed;
}

function formatAmount(value: number | null | undefined, hasAcceptedBid: boolean): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num <= 0) {
    return hasAcceptedBid ? "0 ج.م" : "لم يتم تحديد السعر";
  }
  return formatCurrency(num);
}

export default function AdminRequestsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OrderRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ type: "ok" | "err"; message: string } | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 150);

  const { data: result, loading, refresh } = useAsyncData<
    OrderRequest[] | { data: OrderRequest[]; total: number }
  >(
    () => {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String((page - 1) * ITEMS_PER_PAGE),
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      return apiFetch(`/api/admin/requests?${params}`, "ADMIN");
    },
    [page, statusFilter, debouncedSearch],
  );

  const requests: OrderRequest[] = Array.isArray(result) ? result : (result as { data?: OrderRequest[] })?.data ?? [];
  const totalItems: number = Array.isArray(result) ? requests.length : (result as { total?: number })?.total ?? requests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach((r) => {
      if (!r.status) return;
      map[r.status] = (map[r.status] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [requests]);

  const lastUpdated = useMemo(() => {
    if (!requests.length) return null;
    const ts = requests
      .map((r) => (r.updatedAt ? new Date(r.updatedAt).getTime() : 0))
      .sort((a, b) => b - a)[0];
    return ts ? formatDate(new Date(ts).toISOString()) : null;
  }, [requests]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.type === "ok" ? 4000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
    setSelected(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setStatusFilter("ALL");
    setSearch("");
    setPage(1);
    setSelected(null);
  }, []);

  const filtersActive = statusFilter !== "ALL" || search.trim().length > 0;

  const columns: DataTableColumn<OrderRequest>[] = useMemo(
    () => [
      {
        key: "id",
        header: "#",
        className: "w-[80px]",
        render: (req) => (
          <span className="text-[11px] font-black text-slate-500 font-jakarta">#{req.id}</span>
        ),
      },
      {
        key: "title",
        header: "الطلب",
        render: (req) => {
          const title = localizeOrderTitle(req.title, req.id);
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                <Box size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-900 leading-tight truncate max-w-[220px]">
                  {title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5" dir="ltr">
                  {formatDate(req.createdAt)}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: "client",
        header: "العميل",
        render: (req) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] shrink-0">
              {req.client?.fullName?.charAt(0) || "ع"}
            </div>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
              {req.client?.fullName || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "vendor",
        header: "المورّد",
        render: (req) =>
          req.vendor?.fullName ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Store size={12} />
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                {req.vendor.fullName}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">لم يُحدَّد</span>
          ),
      },
      {
        key: "status",
        header: "الحالة",
        thClassName: "text-center",
        className: "text-center",
        render: (req) => <RequestStatusBadge status={req.status} size="xs" />,
      },
      {
        key: "total",
        header: "المبلغ",
        thClassName: "text-left",
        className: "text-left",
        render: (req) => {
          const hasAcceptedBid = Boolean(req.acceptedBidId);
          return (
            <span
              className={`text-sm font-bold font-jakarta ${
                hasAcceptedBid && Number(req.total) > 0 ? "text-slate-900" : "text-slate-400"
              }`}
              dir="ltr"
            >
              {formatAmount(req.total, hasAcceptedBid)}
            </span>
          );
        },
      },
      {
        key: "action",
        header: "الإجراء",
        thClassName: "text-center",
        className: "text-center w-[120px]",
        render: (req) => (
          <Link
            href={`/admin/requests/${req.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md border border-slate-200 bg-white text-slate-600 text-[10px] font-bold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            فتح
          </Link>
        ),
      },
    ],
    [],
  );

  const initialLoad = loading && !result;
  if (initialLoad) {
    return (
      <>
        <PageHeader
          eyebrow="نظام إدارة الطلبات"
          eyebrowTone="emerald"
          title={
            <>
              سجل <span className="text-primary">الطلبات</span>
            </>
          }
          subtitle="متابعة فورية لجميع الطلبات، مراجعة حالات التوصيل، وحل مشكلات الشحنات."
        />
        <PageLoading label="جاري تحميل الطلبات..." />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="نظام إدارة الطلبات"
        eyebrowTone="emerald"
        title={
          <>
            سجل <span className="text-primary">الطلبات</span>
          </>
        }
        subtitle="متابعة فورية لجميع الطلبات، مراجعة حالات التوصيل، وحل مشكلات الشحنات."
        actions={
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="بحث برقم الطلب أو اسم العميل..."
              className="sm:w-[360px]"
              ariaLabel="بحث في الطلبات"
            />
            <AdminIconButton
              icon={RefreshCw}
              variant="soft"
              size="md"
              label="تحديث البيانات"
              onClick={() => refresh()}
              isLoading={loading}
            />
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* Status filter chips */}
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">الحالة:</span>
          {STATUS_OPTIONS.map((opt) => {
            const count =
              opt.value === "ALL"
                ? totalItems
                : requests.filter((r) => r.status === opt.value).length;
            const tone =
              opt.value === "CLOSED_CANCELLED"
                ? "rose"
                : opt.value === "CLOSED_SUCCESS"
                  ? "emerald"
                  : "primary";
            return (
              <AdminFilterChip
                key={opt.value}
                label={opt.label}
                count={count}
                active={statusFilter === opt.value}
                tone={tone}
                onClick={() => handleStatusChange(opt.value)}
              />
            );
          })}
          {filtersActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 h-9 px-3 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent transition-colors"
            >
              <RotateCcw size={12} /> إعادة ضبط
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Orders Table */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-slate-600">
                <ListChecks size={14} className="text-slate-400" />
                <span className="text-xs font-bold">{totalItems} طلب</span>
                {statusFilter !== "ALL" && (
                  <span className="text-[10px] text-slate-400">
                    • مفلتر حسب: {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
                  </span>
                )}
              </div>
            </div>

            <TableCard flush>
              <DataTable
                columns={columns}
                rows={requests}
                rowKey={(r) => r.id}
                minWidth={900}
                loading={loading}
                onRowClick={(req) => setSelected(req)}
                mobileCard={(req) => {
                  const title = localizeOrderTitle(req.title, req.id);
                  const hasAcceptedBid = Boolean(req.acceptedBidId);
                  return (
                    <button
                      type="button"
                      onClick={() => setSelected(req)}
                      className={`w-full text-right bg-white border rounded-xl p-3 transition-colors ${
                        selected?.id === req.id ? "border-orange-300 bg-orange-50/30" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-black text-slate-500 shrink-0">#{req.id}</span>
                          <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
                        </div>
                        <RequestStatusBadge status={req.status} size="xs" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">{req.client?.fullName || "—"}</span>
                        <span className="font-bold text-slate-700" dir="ltr">
                          {formatAmount(req.total, hasAcceptedBid)}
                        </span>
                      </div>
                    </button>
                  );
                }}
                empty={
                  <EmptyState
                    icon={Inbox}
                    title={filtersActive ? "لا توجد نتائج مطابقة" : "لا توجد طلبات حالياً"}
                    description={
                      filtersActive
                        ? "جرّب تغيير الفلاتر أو إعادة الضبط لعرض كل الطلبات"
                        : "عند إنشاء أول طلب ستظهر التفاصيل هنا"
                    }
                    action={
                      filtersActive ? (
                        <AdminButton
                          variant="soft"
                          size="sm"
                          onClick={handleResetFilters}
                          leadingIcon={RotateCcw}
                        >
                          إعادة ضبط الفلاتر
                        </AdminButton>
                      ) : undefined
                    }
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

          {/* Order Inspector */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
            {selected ? (
              <OrderDetailsPanel
                selected={selected}
                actingId={actingId}
                onClose={() => setSelected(null)}
                onApprove={async () => {
                  setActingId(selected.id);
                  try {
                    await apiFetch(`/api/admin/requests/${selected.id}/review`, "ADMIN", {
                      method: "PATCH",
                      body: { action: "approve" },
                    });
                    setToast({ type: "ok", message: "تمت الموافقة على الطلب بنجاح ✅" });
                    refresh();
                    setSelected(null);
                  } catch {
                    setToast({ type: "err", message: "حدث خطأ أثناء الموافقة على الطلب." });
                  } finally {
                    setActingId(null);
                  }
                }}
                onReject={async () => {
                  setActingId(selected.id);
                  try {
                    await apiFetch(`/api/admin/requests/${selected.id}/review`, "ADMIN", {
                      method: "PATCH",
                      body: { action: "reject" },
                    });
                    setToast({ type: "ok", message: "تم رفض الطلب ❌" });
                    refresh();
                    setSelected(null);
                  } catch {
                    setToast({ type: "err", message: "حدث خطأ أثناء رفض الطلب." });
                  } finally {
                    setActingId(null);
                  }
                }}
                onDispatch={async () => {
                  if (!selected.id) return;
                  setActingId(selected.id);
                  try {
                    await apiFetch(`/api/admin/requests/${selected.id}/dispatch`, "ADMIN", {
                      method: "PATCH",
                    });
                    setToast({ type: "ok", message: "تم تحديث مسار التوصيل بنجاح 🚚" });
                    refresh();
                  } catch (err) {
                    setToast({
                      type: "err",
                      message: err instanceof Error ? err.message : "فشل تحديث المسار",
                    });
                  } finally {
                    setActingId(null);
                  }
                }}
              />
            ) : (
              <EmptyDetailsPanel
                totalItems={totalItems}
                lastUpdated={lastUpdated}
                statusBreakdown={statusBreakdown}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
          <div
            className={`${
              toast.type === "ok"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            } border px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 font-bold text-xs pointer-events-auto`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "ok" ? (
                <CheckCircle2 className="text-emerald-500" size={14} />
              ) : (
                <AlertCircle className="text-rose-500" size={14} />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className={
                toast.type === "ok" ? "text-emerald-400 hover:text-emerald-600" : "text-rose-400 hover:text-rose-600"
              }
              aria-label="إغلاق الإشعار"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Side panel: Empty ───────────────────────────────────────────────── */

function EmptyDetailsPanel({
  totalItems,
  lastUpdated,
  statusBreakdown,
}: {
  totalItems: number;
  lastUpdated: string | null;
  statusBreakdown: [string, number][];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
          <Box size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">اختر طلباً لعرض التفاصيل</p>
          <p className="text-[10px] text-slate-400 mt-0.5">اضغط على أي صف في الجدول لعرض معلوماته</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <SummaryRow icon={<Hash size={12} />} label="إجمالي الطلبات" value={totalItems} />
        <SummaryRow icon={<Calendar size={12} />} label="آخر تحديث" value={lastUpdated ?? "—"} />
        {statusBreakdown.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              ملخص سريع حسب الحالة
            </p>
            {statusBreakdown.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-1">
                <RequestStatusBadge status={status} size="xs" />
                <span className="text-xs font-black text-slate-700 font-jakarta">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <span className="text-xs font-black text-slate-900 font-jakarta">{value}</span>
    </div>
  );
}

/* ─── Side panel: Selected ────────────────────────────────────────────── */

const OrderDetailsPanel = memo(function OrderDetailsPanel({
  selected,
  actingId,
  onClose,
  onApprove,
  onReject,
  onDispatch,
}: {
  selected: OrderRequest;
  actingId: number | null;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onDispatch: () => Promise<void>;
}) {
  const title = localizeOrderTitle(selected.title, selected.id);
  const hasAcceptedBid = Boolean(selected.acceptedBidId);
  const isActing = actingId === selected.id;

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">طلب رقم #{selected.id}</h2>
        </div>
        <AdminIconButton icon={X} variant="ghost" size="sm" label="إغلاق" onClick={onClose} />
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-900 leading-snug">{title}</p>
          <RequestStatusBadge status={selected.status} />
        </div>

        {selected.status === "PENDING_ADMIN_REVISION" && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
              <Sparkles size={12} /> نتائج تدقيق المحتوى
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
              {(selected as unknown as { notes?: string }).notes || "لا توجد ملاحظات آلية متوفرة لهذا الطلب."}
            </p>
          </div>
        )}

        <div className="space-y-1.5 pt-3 border-t border-slate-100">
          <DetailRow icon={<User size={12} />} label="العميل" value={selected.client?.fullName || "غير محدد"} />
          <DetailRow icon={<Phone size={12} />} label="الهاتف" value={selected.client?.phone || "غير مسجل"} />
          <DetailRow
            icon={<Store size={12} />}
            label="المورّد"
            value={selected.vendor?.fullName || "لم يُحدَّد بعد"}
            muted={!selected.vendor?.fullName}
          />
          <DetailRow icon={<Calendar size={12} />} label="تاريخ الإنشاء" value={formatDate(selected.createdAt)} />
          <DetailRow
            icon={<History size={12} />}
            label="آخر تحديث"
            value={selected.updatedAt ? formatDate(selected.updatedAt) : "—"}
          />
          <DetailRow
            icon={<ArrowUpRight size={12} />}
            label="المبلغ"
            value={formatAmount(selected.total, hasAcceptedBid)}
            highlight
          />
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-2 bg-slate-50/30">
        {selected.status === "PENDING_ADMIN_REVISION" ? (
          <div className="grid grid-cols-2 gap-2">
            <AdminButton
              variant="success"
              size="sm"
              fullWidth
              isLoading={isActing}
              onClick={onApprove}
              leadingIcon={CheckCircle2}
            >
              موافقة
            </AdminButton>
            <AdminButton
              variant="danger"
              size="sm"
              fullWidth
              isLoading={isActing}
              onClick={onReject}
              leadingIcon={X}
            >
              رفض
            </AdminButton>
          </div>
        ) : (
          <>
            <AdminButton
              variant="primary"
              size="md"
              fullWidth
              isLoading={isActing}
              onClick={onDispatch}
              leadingIcon={Truck}
            >
              تحديث مسار التوصيل
            </AdminButton>
            <Link href={`/admin/requests/${selected.id}`} className="block">
              <AdminButton variant="soft" size="md" fullWidth leadingIcon={History}>
                عرض التفاصيل الكاملة
              </AdminButton>
            </Link>
          </>
        )}
      </div>
    </aside>
  );
});

function DetailRow({
  icon,
  label,
  value,
  highlight,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={`text-xs font-bold font-jakarta ${
          highlight ? "text-orange-600" : muted ? "text-slate-400" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
