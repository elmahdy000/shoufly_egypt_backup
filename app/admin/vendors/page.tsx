"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  Ban,
  Briefcase,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Mail,
  MoreVertical,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Store,
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
  DetailsDrawer,
  DetailRow,
  type StatusTone,
} from "@/components/admin/primitives";

interface Vendor {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  walletBalance: string | number;
  createdAt: string;
  vendorCategories?: { category: { name: string } }[];
}

const FILTER_OPTIONS = [
  { value: "ALL", label: "جميع الموردين" },
  { value: "VERIFIED", label: "موثقين" },
  { value: "ACTIVE", label: "نشطين" },
  { value: "BLOCKED", label: "محظورين" },
];

const VENDOR_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "نشط", tone: "emerald" },
  BLOCKED: { label: "محظور", tone: "rose" },
};

export default function AdminVendorsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const [vendorActionLoading, setVendorActionLoading] = useState<string | null>(null);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.type === "ok" ? 4000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const apiFilter = statusFilter !== "ALL" ? statusFilter.toLowerCase() : undefined;
  const { data: result, loading, refresh } = useAsyncData<
    Vendor[] | { data: Vendor[]; total: number }
  >(
    () => {
      const params = new URLSearchParams({
        limit: String(itemsPerPage),
        offset: String((page - 1) * itemsPerPage),
      });
      if (apiFilter) params.set("filter", apiFilter);
      if (search.trim()) params.set("search", search.trim());
      return apiFetch(`/api/admin/vendors?${params}`, "ADMIN");
    },
    [page, apiFilter, search],
  );

  const vendors: Vendor[] = Array.isArray(result) ? result : (result as { data?: Vendor[] })?.data ?? [];
  const totalItems: number = Array.isArray(result) ? vendors.length : (result as { total?: number })?.total ?? vendors.length;

  const filtered = useMemo(() => {
    if (!search.trim() || !Array.isArray(result)) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(
      (v) =>
        v.fullName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        (v.phone ?? "").includes(q),
    );
  }, [vendors, search, result]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const hasActiveFilters = statusFilter !== "ALL" || search.trim().length > 0;

  const handleAction = useCallback(
    async (vendorId: number, action: string) => {
      setVendorActionLoading(action);
      try {
        await apiFetch(`/api/admin/users/${vendorId}/moderation`, "ADMIN", {
          method: "PATCH",
          body: { action },
        });
        setToast({
          type: "ok",
          message:
            action === "verify"
              ? "تم توثيق المورد بنجاح! 🛡️"
              : action === "unverify"
                ? "تم إلغاء توثيق المورد. ⚠️"
                : action === "block"
                  ? "تم إيقاف حساب المورد بنجاح. ❌"
                  : "تم تفعيل حساب المورد بنجاح. ✅",
        });
        refresh();
        if (selected?.id === vendorId) {
          setSelected((prev) =>
            prev
              ? {
                  ...prev,
                  isVerified: action === "verify" ? true : action === "unverify" ? false : prev.isVerified,
                  isActive: action === "unblock" ? true : action === "block" ? false : prev.isActive,
                }
              : null,
          );
        }
      } catch {
        setToast({ type: "err", message: "فشل تنفيذ الإجراء، يرجى المحاولة مرة أخرى." });
      } finally {
        setVendorActionLoading(null);
      }
    },
    [refresh, selected],
  );

  const columns: DataTableColumn<Vendor>[] = useMemo(
    () => [
      {
        key: "vendor",
        header: "المورد / المتجر",
        render: (v) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
              {v.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{v.fullName}</p>
              <p className="text-[10px] font-medium text-slate-400 font-outfit uppercase tracking-tighter">{v.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "الحالة",
        thClassName: "text-center",
        className: "text-center",
        render: (v) => {
          const meta = VENDOR_STATUS_META[v.isActive ? "ACTIVE" : "BLOCKED"] ?? {
            label: "غير معروف",
            tone: "slate" as StatusTone,
          };
          return (
            <div className="flex flex-col items-center gap-1">
              <StatusBadge tone={meta.tone} label={meta.label} dot size="xs" />
              {v.isVerified && (
                <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                  <ShieldCheck size={10} /> موثق
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "categories",
        header: "التصنيفات",
        render: (v) => (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {v.vendorCategories?.slice(0, 2).map((c, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-bold rounded"
              >
                {c.category.name}
              </span>
            )) || <span className="text-[9px] font-bold text-slate-300">بدون تصنيف</span>}
            {(v.vendorCategories?.length ?? 0) > 2 && (
              <span className="text-[9px] font-bold text-slate-400">+{(v.vendorCategories?.length ?? 0) - 2}</span>
            )}
          </div>
        ),
      },
      {
        key: "wallet",
        header: "المحفظة",
        thClassName: "text-left",
        className: "text-left",
        render: (v) => (
          <span className="text-sm font-bold font-outfit text-slate-900">
            {formatCurrency(Number(v.walletBalance))}
          </span>
        ),
      },
    ],
    [],
  );

  if (loading && !vendors.length) {
    return (
      <>
        <PageHeader
          eyebrow="نظام إدارة الموردين"
          eyebrowTone="emerald"
          title={
            <>
              إدارة <span className="text-primary">الموردين</span>
            </>
          }
          subtitle="التحكم في حسابات التجار، مراجعة التوثيقات، ومتابعة المحافظ الموردة."
        />
        <PageLoading label="جاري تحميل سجل الموردين..." />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="نظام إدارة الموردين"
        eyebrowTone="emerald"
        title={
          <>
            إدارة <span className="text-primary">الموردين</span>
          </>
        }
        subtitle="التحكم في حسابات التجار، مراجعة التوثيقات، ومتابعة المحافظ الموردة."
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="بحث بالاسم أو البريد..."
              className="sm:w-[320px]"
              ariaLabel="بحث في الموردين"
            />
            <AdminIconButton
              icon={RefreshCw}
              variant="soft"
              size="md"
              label="تحديث"
              onClick={() => refresh()}
              isLoading={loading}
            />
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* KPI Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="إجمالي الموردين"
            value={totalItems}
            icon={Briefcase}
            tone="blue"
            href="/admin/vendors"
          />
          <StatCard
            label="المتاجر الموثقة"
            value={vendors?.filter((v) => v.isVerified).length ?? 0}
            icon={ShieldCheck}
            tone="emerald"
            badge={{ label: "هذه الصفحة", tone: "neutral" }}
          />
          <StatCard
            label="إجمالي السيولة"
            value={formatCurrency(
              vendors?.reduce((acc, v) => acc + Number(v.walletBalance), 0) ?? 0,
            )}
            icon={CreditCard}
            tone="blue"
            badge={{ label: "هذه الصفحة", tone: "neutral" }}
          />
          <StatCard
            label="بانتظار التوثيق"
            value={vendors?.filter((v) => !v.isVerified).length ?? 0}
            icon={Clock}
            tone="amber"
            badge={{ label: "هذه الصفحة", tone: "neutral" }}
          />
        </section>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <AdminFilterChip
              key={opt.value}
              label={opt.label}
              count={
                opt.value === "ACTIVE"
                  ? vendors?.filter((v) => v.isActive).length
                  : opt.value === "VERIFIED"
                    ? vendors?.filter((v) => v.isVerified).length
                    : opt.value === "BLOCKED"
                      ? vendors?.filter((v) => !v.isActive).length
                      : vendors?.length
              }
              active={statusFilter === opt.value}
              tone="primary"
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
            />
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setSearch("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 h-9 px-3 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent transition-colors"
            >
              <RotateCcw size={12} /> إعادة ضبط
            </button>
          )}
        </div>

        <div className="space-y-3">
          <TableCard flush>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(v) => v.id}
              minWidth={800}
              loading={loading}
              onRowClick={(v) => setSelected(v)}
              mobileCard={(v) => (
                <button
                  type="button"
                  onClick={() => setSelected(v)}
                  className={`w-full text-right bg-white border rounded-xl p-3 transition-colors ${
                    selected?.id === v.id
                      ? "border-orange-300 bg-orange-50/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                        {v.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{v.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{v.email}</p>
                      </div>
                    </div>
                    <StatusBadge
                      tone={v.isActive ? "emerald" : "rose"}
                      label={v.isActive ? "نشط" : "محظور"}
                      dot
                      size="xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">
                      {formatCurrency(Number(v.walletBalance))}
                    </span>
                    <span className="text-[10px]">
                      {v.vendorCategories?.length ?? 0} تصنيف
                    </span>
                  </div>
                </button>
              )}
              empty={
                <EmptyState
                  icon={Store}
                  title="لا توجد سجلات موردين مطابقة"
                  description="حاول تعديل معايير الفلترة أو البحث"
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
      </div>

      {/* Details Drawer */}
      <DetailsDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.fullName || ""}
        subtitle={
          selected && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge
                tone={selected.isActive ? "emerald" : "rose"}
                label={selected.isActive ? "نشط" : "محظور"}
                dot
                size="xs"
              />
              {selected.isVerified && (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                  موثق
                </span>
              )}
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            {/* Info Fields */}
            <div className="space-y-2">
              <DetailRow label="البريد الإلكتروني" value={selected.email} icon={Mail} />
              <DetailRow label="رقم الهاتف" value={selected.phone || "غير مسجل"} icon={Phone} />
              <DetailRow
                label="رصيد المحفظة"
                value={formatCurrency(Number(selected.walletBalance))}
                icon={CreditCard}
                highlight
              />
              <DetailRow label="تاريخ الانضمام" value={formatDate(selected.createdAt)} icon={Clock} />
              {selected.vendorCategories && selected.vendorCategories.length > 0 && (
                <DetailRow
                  label="التصنيفات"
                  value={selected.vendorCategories.map((c) => c.category.name).join("، ")}
                  icon={Store}
                />
              )}
            </div>

            {/* Actions Panel */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <AdminButton
                variant={selected.isVerified ? "soft" : "primary"}
                size="md"
                fullWidth
                leadingIcon={selected.isVerified ? ShieldAlert : ShieldCheck}
                isLoading={vendorActionLoading === (selected.isVerified ? "unverify" : "verify")}
                onClick={() => handleAction(selected.id, selected.isVerified ? "unverify" : "verify")}
              >
                {selected.isVerified ? "إلغاء التوثيق" : "توثيق المتجر"}
              </AdminButton>
              <AdminButton
                variant={selected.isActive ? "danger" : "success"}
                size="md"
                fullWidth
                leadingIcon={selected.isActive ? Ban : CheckCircle2}
                isLoading={vendorActionLoading === (selected.isActive ? "block" : "unblock")}
                onClick={() => handleAction(selected.id, selected.isActive ? "block" : "unblock")}
              >
                {selected.isActive ? "إيقاف الحساب" : "تفعيل الحساب"}
              </AdminButton>
              <AdminButton variant="soft" size="md" fullWidth leadingIcon={ExternalLink}>
                عرض سجل النشاط
              </AdminButton>
            </div>
          </div>
        )}
      </DetailsDrawer>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-full max-w-sm px-4">
          <InlineToast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}

// InspectorItem replaced by DetailPanel from primitives
