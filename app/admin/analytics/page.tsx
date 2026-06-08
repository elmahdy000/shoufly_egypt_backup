"use client";

import { useCallback, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency } from "@/lib/formatters";
import {
  BarChart3,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  ShoppingBag,
  Star,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Store,
  MapPin,
  XCircle,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalAdminCommission: number;
    totalGMV: number;
    fulfillmentRate: number;
    avgPlatformRating: number;
  };
  topCategories: { name: string; requestCount: number }[];
  trends: { day: string; requests: number; revenue: number }[];
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  createdAt: string;
}

interface Vendor {
  id: number;
  fullName: string;
  walletBalance: number;
  isVerified: boolean;
}

interface RequestListItem {
  id: number;
  title: string;
  status: string;
  address: string;
  createdAt: string;
}

const RANGE_OPTIONS = [
  { key: "7d", label: "٧ أيام" },
  { key: "30d", label: "٣٠ يوم" },
  { key: "90d", label: "٩٠ يوم" },
] as const;

const TX_LABEL_MAP: Record<string, string> = {
  WALLET_TOPUP: "شحن رصيد",
  ESCROW_DEPOSIT: "إيداع ضامن",
  WITHDRAWAL: "عمليات سحب",
  REFUND: "مرتجعات",
  ADMIN_COMMISSION: "عمولة النظام",
  VENDOR_PAYOUT: "صرف تجار",
  DELIVERY_PAYOUT: "صرف مناديب",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  PENDING_ADMIN_REVISION: "قيد المراجعة",
  OPEN_FOR_BIDDING: "مفتوح للعروض",
  BIDS_RECEIVED: "عروض واردة",
  OFFERS_FORWARDED: "عروض مُرسلة",
  ORDER_PAID_PENDING_DELIVERY: "مدفوع - بانتظار التوصيل",
  CLOSED_SUCCESS: "مكتمل",
  CLOSED_CANCELLED: "ملغى",
  CLOSED_FAILED: "فشل",
  REJECTED: "مرفوض",
  PENDING: "قيد الانتظار",
  SELECTED: "مختار",
  ACCEPTED_BY_CLIENT: "مقبول من العميل",
  APPROVED: "موافق عليه",
  WITHDRAWN: "مسحوب",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التوصيل",
  FAILED: "فشل التوصيل",
  READY_FOR_PICKUP: "جاهز للاستلام",
  ORDER_PLACED: "تم إنشاء الطلب",
  VENDOR_PREPARING: "المورد يجهز الطلب",
};

function formatCompactCurrency(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "٠ ج.م";
  return formatCurrency(Math.round(num));
}

function formatArabicNumber(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 }).format(num);
}

function formatPercent(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "—";
  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(num)}%`;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<(typeof RANGE_OPTIONS)[number]["key"]>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const selectedRange = useMemo(
    () => RANGE_OPTIONS.find((opt) => opt.key === dateRange) ?? RANGE_OPTIONS[1],
    [dateRange]
  );

  const { data: analytics, loading: loadingAnalytics, refresh: refreshAnalytics } = useAsyncData<AnalyticsData>(
    () => apiFetch("/api/admin/analytics/overview", "ADMIN"),
    []
  );
  const { data: transactions, loading: loadingTx, refresh: refreshTx } = useAsyncData<{ data: Transaction[]; total: number }>(
    () => apiFetch(`/api/admin/finance/transactions?limit=200&days=${selectedRange.key === '7d' ? 7 : selectedRange.key === '30d' ? 30 : 90}`, "ADMIN"),
    [dateRange]
  );
  const { data: vendors, loading: loadingVendors, refresh: refreshVendors } = useAsyncData<{ data: Vendor[]; total: number }>(
    () => apiFetch("/api/admin/vendors?limit=10", "ADMIN"),
    []
  );
  const { data: recentRequests, loading: loadingRequests } = useAsyncData<{ data: RequestListItem[]; total: number }>(
    () => apiFetch("/api/admin/requests?limit=200", "ADMIN"),
    []
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshAnalytics(), refreshTx(), refreshVendors()]);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [refreshAnalytics, refreshTx, refreshVendors]);

  const txTypeCounts = useMemo(() => {
    const map = new Map<string, number>();
    (transactions?.data ?? []).forEach((tx) => {
      const key = tx.type === "ADMIN_COMMISSION" ? "PLATFORM_FEE" : tx.type;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const topVendors = useMemo(() => {
    return [...(vendors?.data ?? [])]
      .sort((a, b) => Number(b.walletBalance) - Number(a.walletBalance))
      .slice(0, 5);
  }, [vendors]);

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    (recentRequests?.data ?? []).forEach((r) => {
      const key = r.status ?? "UNKNOWN";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [recentRequests]);

  const topAreas = useMemo(() => {
    const map = new Map<string, number>();
    (recentRequests?.data ?? []).forEach((r) => {
      const raw = r.address ?? "";
      const area = raw.split("،")[0]?.split(",")[0]?.trim() || raw.split(" ").slice(0, 2).join(" ");
      if (!area) return;
      map.set(area, (map.get(area) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [recentRequests]);

  const cancellationRate = useMemo(() => {
    const list = recentRequests?.data ?? [];
    if (list.length === 0) return 0;
    const cancelled = list.filter((r) =>
      ["CLOSED_CANCELLED", "REJECTED", "FAILED", "CLOSED_FAILED"].includes(r.status)
    ).length;
    return (cancelled / list.length) * 100;
  }, [recentRequests]);

  const trends = analytics?.trends ?? [];
  const maxTrendRequests = Math.max(...trends.map((t) => t.requests), 1);

  const handleExportCsv = useCallback(() => {
    const rows = [
      ["metric", "value"],
      ["total_gmv", String(analytics?.overview.totalGMV ?? 0)],
      ["platform_commission", String(analytics?.overview.totalAdminCommission ?? 0)],
      ["fulfillment_rate", String(analytics?.overview.fulfillmentRate ?? 0)],
      ["avg_platform_rating", String(analytics?.overview.avgPlatformRating ?? 0)],
      ["cancellation_rate", String(cancellationRate.toFixed(2))],
      ["range", dateRange],
      ["transactions_in_range", String((transactions?.data ?? []).length)],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-analytics-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analytics, dateRange, transactions, cancellationRate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">

      {/* 🚀 Page Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">مركز تحليل البيانات</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-r-4 border-indigo-500 pr-4">
              تحليلات <span className="text-indigo-600">الأداء</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">مؤشرات المنصة، حجم التداول، والإيرادات التشغيلية للفترة المحددة</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setDateRange(range.key)}
                  className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
                    dateRange === range.key
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              className="w-10 h-10 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center shadow-sm"
              title="تحديث البيانات"
              aria-label="تحديث البيانات"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleExportCsv}
              className="h-10 px-4 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all shadow-sm flex items-center gap-2"
            >
              <Download size={14} />
              تصدير البيانات
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-6 space-y-6">

        {/* 📊 KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIStatCard
            title="إجمالي التداول (GMV)"
            value={loadingAnalytics ? null : formatCompactCurrency(analytics?.overview.totalGMV)}
            icon={ShoppingBag}
            tone="indigo"
            hint="حجم المبيعات الكلي"
          />
          <KPIStatCard
            title="أرباح المنصة"
            value={loadingAnalytics ? null : formatCompactCurrency(analytics?.overview.totalAdminCommission)}
            icon={DollarSign}
            tone="emerald"
            hint="صافي العمولات المحصلة"
          />
          <KPIStatCard
            title="معدل التنفيذ"
            value={loadingAnalytics ? null : formatPercent(analytics?.overview.fulfillmentRate)}
            icon={Target}
            tone="orange"
            hint="نسبة الطلبات المكتملة بنجاح"
            trend={{
              label: "معدل الإلغاء",
              value: `${cancellationRate.toFixed(0)}%`,
              positive: cancellationRate < 15,
            }}
          />
          <KPIStatCard
            title="متوسط التقييم"
            value={loadingAnalytics ? null : (analytics?.overview.avgPlatformRating ?? 0).toFixed(1)}
            icon={Star}
            tone="amber"
            hint="رضا العملاء والموردين"
          />
        </div>

        {/* 📉 Trends + Transactions Distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                اتجاه حجم الطلبات
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {loadingAnalytics ? "..." : `${trends.length} يوم`}
              </span>
            </div>

            {loadingAnalytics ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm font-medium">
                جاري تحميل البيانات...
              </div>
            ) : trends.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-200 rounded-xl">
                <BarChart3 size={36} className="opacity-30" />
                <p className="text-sm font-medium">لا توجد بيانات للفترة المحددة</p>
              </div>
            ) : (
              <div className="h-56 flex items-end gap-2" dir="ltr">
                {trends.map((item) => {
                  const pct = Math.max((item.requests / maxTrendRequests) * 100, 6);
                  return (
                    <div key={item.day} className="flex-1 h-full flex flex-col items-center gap-2 group min-w-0">
                      <div className="relative w-full flex-1 flex items-end justify-center">
                        <div
                          style={{ height: `${pct}%` }}
                          className="w-full max-w-[36px] rounded-t-md bg-indigo-500 group-hover:bg-indigo-400 transition-colors"
                        />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap z-10">
                          {item.requests} طلب
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate w-full text-center">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">توزيع المعاملات</h3>
            {loadingTx ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-9 rounded-lg bg-slate-50 animate-pulse" />
                ))}
              </div>
            ) : txTypeCounts.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-300 gap-2">
                <AlertCircle size={32} className="opacity-30" />
                <p className="text-xs font-medium">لا توجد معاملات للفترة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {txTypeCounts.slice(0, 8).map(([type, count]) => {
                  const label = TX_LABEL_MAP[type] || type;
                  const max = txTypeCounts[0]?.[1] ?? 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{label}</span>
                        <span className="font-black text-indigo-600 font-jakarta">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-indigo-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 🏆 Leaderboards: Vendors + Categories */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store size={16} className="text-indigo-500" />
                أكثر التجار سيولة
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">أعلى أرصدة</span>
            </div>
            <div className="p-4 space-y-2">
              {loadingVendors ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-50 animate-pulse" />
                ))
              ) : topVendors.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Store size={28} className="opacity-30" />
                  <p className="text-xs font-medium">لا يوجد تجار</p>
                </div>
              ) : (
                topVendors.map((vendor, idx) => (
                  <div
                    key={vendor.id}
                    className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold text-xs transition-all">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{vendor.fullName}</p>
                        {vendor.isVerified ? (
                          <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1 mt-0.5">
                            <CheckCircle size={10} /> مورّد موثّق
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">مورّد نشط</span>
                        )}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-black text-slate-900 font-jakarta">
                        {formatCompactCurrency(vendor.walletBalance)}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">رصيد المحفظة</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-orange-500" />
                أداء التصنيفات
              </h3>
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">حسب الطلبات</span>
            </div>
            <div className="p-4 space-y-4">
              {loadingAnalytics ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-slate-50 animate-pulse" />
                ))
              ) : (analytics?.topCategories ?? []).length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <BarChart3 size={28} className="opacity-30" />
                  <p className="text-xs font-medium">لا توجد بيانات تصنيفات</p>
                </div>
              ) : (
                (analytics?.topCategories ?? []).slice(0, 5).map((category) => {
                  const max = analytics?.topCategories?.[0]?.requestCount || 1;
                  const pct = Math.round((category.requestCount / max) * 100);
                  return (
                    <div key={category.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 truncate">{category.name}</span>
                        <span className="font-black text-slate-900 font-jakarta shrink-0 mr-2">
                          {formatArabicNumber(category.requestCount)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full rounded-full bg-orange-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 📍 Status Breakdown + Top Areas + Cancellation */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              توزيع حالات الطلبات
            </h3>
            {loadingRequests ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 rounded-lg bg-slate-50 animate-pulse" />
                ))}
              </div>
            ) : statusBreakdown.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-300 gap-2">
                <AlertCircle size={28} className="opacity-30" />
                <p className="text-xs font-medium">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="space-y-2">
                {statusBreakdown.map(([status, count]) => {
                  const max = statusBreakdown[0]?.[1] ?? 1;
                  const pct = Math.round((count / max) * 100);
                  const label = STATUS_LABEL_MAP[status] || status;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{label}</span>
                        <span className="font-black text-slate-900 font-jakarta">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin size={16} className="text-rose-500" />
              أكثر المناطق نشاطاً
            </h3>
            {loadingRequests ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-slate-50 animate-pulse" />
                ))}
              </div>
            ) : topAreas.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-300 gap-2">
                <MapPin size={28} className="opacity-30" />
                <p className="text-xs font-medium">لا توجد بيانات مناطق</p>
              </div>
            ) : (
              <div className="space-y-1">
                {topAreas.map(([area, count], idx) => (
                  <div
                    key={area + idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate">{area}</span>
                    </div>
                    <span className="text-xs font-black text-rose-600 font-jakarta shrink-0 mr-2">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle size={16} className="text-rose-500" />
              معدل الإلغاء والفشل
            </h3>
            {loadingRequests ? (
              <div className="h-24 rounded-lg bg-slate-50 animate-pulse" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-slate-900 font-jakarta leading-none">
                    {cancellationRate.toFixed(1)}
                    <span className="text-xl text-slate-400 mr-1">%</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium pb-1">
                    من إجمالي الطلبات الحديثة
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(cancellationRate, 100)}%` }}
                    className={`h-full rounded-full ${
                      cancellationRate < 10
                        ? "bg-emerald-500"
                        : cancellationRate < 20
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {cancellationRate < 10
                    ? "معدل ممتاز - المنصة تعمل بكفاءة عالية في إكمال الطلبات."
                    : cancellationRate < 20
                    ? "معدل مقبول - يمكن تحسينه بمتابعة حالات الفشل."
                    : "معدل مرتفع - يستحق مراجعة أسباب الإلغاء المتكررة."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIStatCard({
  title,
  value,
  icon: Icon,
  tone,
  hint,
  trend,
}: {
  title: string;
  value: string | null;
  icon: ElementType;
  tone: "indigo" | "emerald" | "orange" | "amber";
  hint?: string;
  trend?: { label: string; value: string; positive: boolean };
}) {
  const toneStyles: Record<typeof tone, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${toneStyles[tone]}`}>
          <Icon size={18} />
        </div>
        {value === null ? (
          <div className="h-6 w-12 rounded bg-slate-100 animate-pulse" />
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
          {title}
        </p>
        {value === null ? (
          <div className="h-7 w-24 rounded bg-slate-100 animate-pulse" />
        ) : (
          <h4 className="text-xl font-bold text-slate-900 tracking-tight font-jakarta leading-none">
            {value}
          </h4>
        )}
        {hint && <p className="text-[10px] font-medium text-slate-500">{hint}</p>}
        {trend && (
          <div className="flex items-center gap-1.5 pt-1.5 mt-2 border-t border-slate-100">
            {trend.positive ? (
              <TrendingDown size={12} className="text-emerald-500" />
            ) : (
              <TrendingUp size={12} className="text-rose-500" />
            )}
            <span className="text-[10px] font-bold text-slate-500">{trend.label}:</span>
            <span className={`text-[10px] font-black ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
              {trend.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
