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
  DollarSign,
  RefreshCw,
  ShoppingBag,
  Star,
  Target,
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

const RANGE_OPTIONS = [
  { key: "7d", label: "٧ أيام", days: 7 },
  { key: "30d", label: "٣٠ يوم", days: 30 },
  { key: "90d", label: "٩٠ يوم", days: 90 },
] as const;

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<(typeof RANGE_OPTIONS)[number]["key"]>("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const selectedRange = useMemo(
    () => RANGE_OPTIONS.find((opt) => opt.key === dateRange) ?? RANGE_OPTIONS[0],
    [dateRange]
  );

  const { data: analytics, loading: loadingAnalytics, refresh: refreshAnalytics } = useAsyncData<AnalyticsData>(
    () => apiFetch("/api/admin/analytics/overview", "ADMIN"),
    []
  );
  const { data: transactions, loading: loadingTx, refresh: refreshTx } = useAsyncData<Transaction[]>(
    () => apiFetch(`/api/admin/finance/transactions?limit=200&days=${selectedRange.days}`, "ADMIN"),
    [selectedRange.days]
  );
  const { data: vendors, loading: loadingVendors, refresh: refreshVendors } = useAsyncData<Vendor[]>(
    () => apiFetch("/api/admin/vendors?limit=10", "ADMIN"),
    []
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshAnalytics(), refreshTx(), refreshVendors()]);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [refreshAnalytics, refreshTx, refreshVendors]);

  const filteredTransactions = useMemo(() => {
    const list = transactions ?? [];
    const minDate = lastUpdated.getTime() - selectedRange.days * 24 * 60 * 60 * 1000;
    return list.filter((tx) => new Date(tx.createdAt).getTime() >= minDate);
  }, [transactions, selectedRange.days, lastUpdated]);

  const txTypeCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach((tx) => {
      const key = tx.type === "ADMIN_COMMISSION" ? "PLATFORM_FEE" : tx.type;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  const topVendors = useMemo(() => {
    return [...(vendors ?? [])]
      .sort((a, b) => Number(b.walletBalance) - Number(a.walletBalance))
      .slice(0, 5);
  }, [vendors]);

  const trends = analytics?.trends ?? [];
  const maxTrendRequests = Math.max(...trends.map((t) => t.requests), 1);

  const handleExportCsv = useCallback(() => {
    const rows = [
      ["metric", "value"],
      ["total_gmv", String(analytics?.overview.totalGMV ?? 0)],
      ["platform_commission", String(analytics?.overview.totalAdminCommission ?? 0)],
      ["fulfillment_rate", String(analytics?.overview.fulfillmentRate ?? 0)],
      ["avg_platform_rating", String(analytics?.overview.avgPlatformRating ?? 0)],
      ["range_days", String(selectedRange.days)],
      ["transactions_in_range", String(filteredTransactions.length)],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-analytics-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analytics, dateRange, filteredTransactions.length, selectedRange.days]);

  return (
    <div className="admin-page admin-page--spacious" dir="rtl">

      {/* 🚀 Header: Insights & Intelligence */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40 overflow-hidden">
        <div className="px-6 lg:px-10 py-8 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">مركز تحليل البيانات الضخمة</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-r-4 border-indigo-500 pr-4">تحليلات <span className="text-indigo-600">الأداء</span></h1>
            <p className="text-sm text-slate-500 font-medium max-w-xl">مراقبة المؤشرات الحيوية وحجم التداول ونمو الأرباح التشغيلية.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setDateRange(range.key)}
                  className={`rounded-md px-5 py-1.5 text-[11px] font-bold transition-all uppercase tracking-tight ${dateRange === range.key ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="w-11 h-11 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center shadow-sm"
                title="تحديث البيانات"
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              </button>

              <button
                onClick={handleExportCsv}
                className="h-11 px-6 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-all shadow-sm flex items-center gap-2 border border-orange-500"
              >
                <Download size={16} />
                تصدير البيانات
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 space-y-8">

        {/* 📊 High-Level Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="إجمالي التداول (GMV)"
            value={loadingAnalytics ? "—" : formatCurrency(analytics?.overview.totalGMV ?? 0).split('.')[0]}
            icon={ShoppingBag}
            tone="indigo"
            hint="حجم المبيعات الكلي"
          />
          <MetricCard
            title="أرباح المنصة"
            value={loadingAnalytics ? "—" : formatCurrency(analytics?.overview.totalAdminCommission ?? 0).split('.')[0]}
            icon={DollarSign}
            tone="emerald"
            hint="صافي العمولات"
          />
          <MetricCard
            title="معدل التنفيذ"
            value={loadingAnalytics ? "—" : `${Math.round(analytics?.overview.fulfillmentRate ?? 0)}%`}
            icon={Target}
            tone="orange"
            hint="نجاح توصيل الطلبات"
          />
          <MetricCard
            title="متوسط التقييم"
            value={loadingAnalytics ? "—" : `${(analytics?.overview.avgPlatformRating ?? 0).toFixed(1)}`}
            icon={Star}
            tone="amber"
            hint="رضا العملاء والموردين"
          />
        </div>

        {/* 📉 Main Trends & Analysis */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" />
                اتجاه حجم الطلبات
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">Analytics Flow</span>
            </div>

            <div className="h-72 flex items-end gap-3" dir="ltr">
              {trends.map((item, i) => {
                const pct = Math.max((item.requests / maxTrendRequests) * 100, 8);
                return (
                  <div key={item.day} className="flex-1 h-full flex flex-col items-center gap-3 group">
                    <div className="relative w-full flex-1 flex items-end justify-center">
                      <div
                        style={{ height: `${pct}%` }}
                        className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all shadow-sm"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-md whitespace-nowrap z-20">
                        {item.requests} طلب
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">توزيع المعاملات</h3>
            {loadingTx ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-lg bg-slate-50 animate-pulse" />)}
              </div>
            ) : txTypeCounts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-3">
                <AlertCircle size={40} className="opacity-20" />
                <p className="text-sm font-medium">لا توجد بيانات للفترة المحددة</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {txTypeCounts.map(([type, count]) => {
                  const txArabicMap: Record<string, string> = {
                    WALLET_TOPUP: "شحن رصيد",
                    ESCROW_DEPOSIT: "إيداع ضامن",
                    ESCROW_RELEASE: "تحرير مبالغ",
                    WITHDRAWAL: "عمليات سحب",
                    REFUND: "مرتجعات",
                    REFUND_TO_VENDOR: "مرتجع لمورد",
                    REFUND_TO_CLIENT: "مرتجع لعميل",
                    PLATFORM_FEE: "رسوم الخدمة",
                    VENDOR_PAYOUT: "صرف تجار",
                    DELIVERY_PAYOUT: "صرف مناديب",
                    ADMIN_COMMISSION: "عمولة النظام",
                    PAYMENT: "مدفوعات مباشرة",
                    CLIENT_PAYMENT: "دفع عميل",
                  };
                  const arType = txArabicMap[type] || type;
                  return (
                    <div key={type} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 hover:border-indigo-200 hover:bg-white transition-all group">
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900">{arType}</span>
                      <span className="text-sm font-black text-indigo-600 font-jakarta">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 🏆 Leaderboards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">أكثر التجار سيولة</h3>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Top Capital</span>
            </div>
            <div className="p-6 space-y-4">
              {loadingVendors ? (
                Array(5).fill(0).map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-50 animate-pulse" />)
              ) : (
                topVendors.map((vendor) => (
                  <div key={vendor.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-inner uppercase font-jakarta">
                        {vendor.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{vendor.fullName}</p>
                        {vendor.isVerified && <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1 mt-0.5"><CheckCircle size={10} /> Verified Partner</span>}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900 font-jakarta">{formatCurrency(vendor.walletBalance).split('.')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase">EGP Balance</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">أداء التصنيفات</h3>
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Category Flow</span>
            </div>
            <div className="p-6 space-y-6">
              {(analytics?.topCategories ?? []).slice(0, 5).map((category) => {
                const max = analytics?.topCategories?.[0]?.requestCount || 1;
                const pct = Math.round((category.requestCount / max) * 100);
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{category.name}</span>
                      <span className="text-xs font-black text-slate-900 font-jakarta">{category.requestCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-inner">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
  hint
}: {
  title: string;
  value: string;
  icon: ElementType;
  tone: "indigo" | "emerald" | "orange" | "amber";
  hint?: string;
}) {
  const styles = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100"
  };

  return (
    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -mr-12 -mt-12 transition-all group-hover:scale-125 ${tone === 'indigo' ? 'bg-indigo-400' : tone === 'emerald' ? 'bg-emerald-400' : 'bg-orange-400'}`} />

      <div className="relative z-10 space-y-4">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${styles[tone]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 tracking-tight font-jakarta mb-1 leading-none">{value}</h4>
          {hint && <p className="text-[10px] font-medium text-slate-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
