"use client";

import { useState, useMemo, useEffect, useCallback, useRef, memo, MouseEvent } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  MapPin, Truck, Box, RefreshCw, X, Clock, AlertCircle,
  Navigation, Zap, Phone, Timer, Target, Radio, Layers, ShieldAlert, Eye, Map
} from "lucide-react";
import dynamic from "next/dynamic";

const OperationsMap = dynamic(
  () => import("@/components/admin/OperationsMap").then((m) => ({ default: m.OperationsMap })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

interface TrackingOrder {
  id: number;
  title: string;
  status: string;
  rider: string;
  riderPhone?: string;
  client?: string;
  location?: string;
  vendor?: string;
  pickup?: string;
  dropoff?: string;
  eta?: string;
  isLate?: boolean;

  clientLat?: number | null;
  clientLng?: number | null;
  vendorLat?: number | null;
  vendorLng?: number | null;
  riderLat?: number | null;
  riderLng?: number | null;

  latitude?: number | null;
  longitude?: number | null;
  speed?: number;
  updatedAt: string;
}

interface MapObject {
  id: string;
  type: 'CLIENT' | 'VENDOR' | 'RIDER';
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  status?: string;
}

interface TrackingResponse {
  orders: TrackingOrder[];
  mapData: MapObject[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  "جاري التحضير":   { label: "جاري التحضير", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  "تم الاستلام":    { label: "تم الاستلام",  color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-500" },
  "في الطريق":      { label: "في الطريق",    color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  "قريب من العميل": { label: "قريب من العميل", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  "تم التسليم":     { label: "تم التسليم",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  "متأخر":          { label: "متأخر",        color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500" },
};

const STATUS_ALIASES: Record<string, string> = {
  "قيد التوصيل": "في الطريق",
  "خارج للتوصيل": "في الطريق",
  "قيد التحضير": "جاري التحضير",
  "جاهز للاستلام": "تم الاستلام",
  "تم الطلب": "قريب من العميل",
  "فشل التوصيل": "متأخر",
};

function resolveStatus(status: string): string {
  return STATUS_CONFIG[status] ? status : (STATUS_ALIASES[status] || "جاري التحضير");
}

const StatusBadge = memo(function StatusBadge({ status: rawStatus }: { status: string }) {
  const key = resolveStatus(rawStatus);
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG["جاري التحضير"];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.color} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
});

const StatCard = memo(function StatCard({
  label, val, icon: Icon, color, bg,
}: {
  label: string; val: string | number; icon: any; color: string; bg: string;
}) {
  return (
    <div className="bg-white border border-slate-200 p-2.5 lg:p-4 rounded-xl flex items-center gap-2.5 lg:gap-3.5 shadow-sm hover:shadow transition-all">
      <div className={`w-8 h-8 lg:w-10 lg:h-10 shrink-0 ${bg} ${color} rounded-lg flex items-center justify-center border border-black/5`}>
        <Icon size={16} className="lg:hidden" />
        <Icon size={18} className="hidden lg:block" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 tracking-wider mb-0.5 truncate">{label}</p>
        <p className="text-sm lg:text-base font-black text-slate-900 tracking-tight leading-tight">{val}</p>
      </div>
    </div>
  );
});

function InfoBox({ label, val, subVal, status = "normal", className = "" }: {
  label: string; val: string; subVal?: string; status?: "normal" | "late"; className?: string;
}) {
  return (
    <div className={`p-2 lg:p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5 lg:space-y-1 ${className}`}>
      <span className="text-[9px] font-bold text-slate-400 block leading-none">{label}</span>
      <p className={`text-[11px] lg:text-xs font-black truncate leading-tight ${status === "late" ? "text-rose-600" : "text-slate-800"}`}>
        {val}
      </p>
      {subVal && (
        <span className="text-[9px] text-slate-400 block leading-none font-medium mt-0.5">{subVal}</span>
      )}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex flex-col items-center gap-2.5 lg:gap-3 text-slate-400">
        <MapPin size={28} className="lg:hidden animate-pulse text-indigo-500" />
        <MapPin size={32} className="hidden lg:block animate-pulse text-indigo-500" />
        <p className="text-[11px] lg:text-xs font-bold text-slate-500">جاري تحميل خريطة التتبع...</p>
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-3 lg:p-5 border border-slate-200 shadow-sm space-y-3 lg:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 lg:gap-3">
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-slate-100 rounded-lg animate-pulse" />
          <div className="space-y-1.5 lg:space-y-2">
            <div className="w-20 lg:w-24 h-2.5 lg:h-3 bg-slate-100 rounded animate-pulse" />
            <div className="w-32 lg:w-40 h-2.5 lg:h-3 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-5 h-5 lg:w-6 lg:h-6 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-2 lg:p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 lg:space-y-2">
            <div className="w-10 lg:w-12 h-2 bg-slate-100 rounded animate-pulse" />
            <div className="w-16 lg:w-20 h-2.5 lg:h-3 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-1.5 lg:space-y-2 hidden lg:block">
        <div className="w-full h-3 lg:h-4 bg-slate-100 rounded animate-pulse" />
        <div className="w-full h-3 lg:h-4 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 pt-2.5 lg:pt-3 border-t border-slate-100">
        <div className="flex-1 h-7 lg:h-9 bg-slate-100 rounded-lg animate-pulse" />
        <div className="w-20 lg:w-24 h-7 lg:h-9 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="w-3/4 h-3 bg-slate-100 rounded animate-pulse" />
          <div className="w-1/2 h-2 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="w-16 h-5 bg-slate-100 rounded animate-pulse shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
        <div className="w-12 h-3 bg-slate-100 rounded animate-pulse mr-auto" />
      </div>
      <div className="flex gap-2 pt-2.5 border-t border-slate-100">
        <div className="flex-1 h-7 bg-slate-100 rounded-lg animate-pulse" />
        <div className="flex-1 h-7 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return Array.from({ length: 5 }, (_, i) => (
    <tr key={i} className="border-b border-slate-100">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-slate-100 animate-pulse shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
            <div className="w-16 h-2 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5"><div className="w-16 h-5 bg-slate-100 rounded mx-auto animate-pulse" /></td>
      <td className="px-3 py-2.5"><div className="w-12 h-2 bg-slate-100 rounded animate-pulse" /></td>
      <td className="px-3 py-2.5"><div className="w-7 h-7 bg-slate-100 rounded mx-auto animate-pulse" /></td>
    </tr>
  ));
}

const FilterTab = memo(function FilterTab({ label, active, onClick, className = "" }: {
  label: string; active: boolean; onClick: () => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${className} ${
        active
          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );
});

const MobileOrderCard = memo(function MobileOrderCard({
  order,
  isSelected,
  onSelect,
}: {
  order: TrackingOrder;
  isSelected: boolean;
  onSelect: (order: TrackingOrder) => void;
}) {
  const handleViewClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleTrackClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    onSelect(order);
  }, [order, onSelect]);

  return (
    <div
      onClick={() => onSelect(order)}
      className={`bg-white border rounded-xl p-3 shadow-sm transition-all cursor-pointer active:scale-[0.99] ${
        isSelected
          ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/30'
          : 'border-slate-200'
      }`}
    >
      {/* Row 1: Icon + Title + Status */}
      <div className="flex items-start gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all shrink-0 ${
          isSelected
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-400'
        }`}>
          <Box size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-bold text-slate-800 text-[13px] leading-tight truncate"
            title={order.title}
          >
            {order.title}
          </p>
          <p
            className="text-[10px] font-bold text-slate-400 mt-0.5 truncate"
            title={`#${order.id} · ${order.client || 'بدون عميل'}`}
          >
            #{order.id} · {order.client || 'بدون عميل'}
          </p>
        </div>
        <div className="shrink-0">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Row 2: Rider + Last activity */}
      <div className="mt-2.5 flex items-center gap-2.5 text-[10px] min-w-0">
        {order.rider ? (
          <span className="text-slate-500 font-bold flex items-center gap-1 min-w-0">
            <Truck size={10} className="shrink-0" />
            <span className="truncate max-w-[100px]" title={order.rider}>{order.rider}</span>
          </span>
        ) : (
          <span className="text-slate-400 font-bold">بدون مندوب</span>
        )}
        <span
          className="text-slate-400 font-bold mr-auto tabular-nums shrink-0"
          title={format(new Date(order.updatedAt), "yyyy-MM-dd hh:mm a", { locale: ar })}
        >
          {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: false, locale: ar })}
        </span>
      </div>

      {/* Row 3: Action buttons */}
      <div className="mt-2.5 flex gap-2 pt-2.5 border-t border-slate-100">
        <button
          onClick={handleTrackClick}
          className="flex-1 h-8 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <Target size={11} /> تتبع
        </button>
        <a
          href={`/admin/requests/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleViewClick}
          className="flex-1 h-8 bg-white text-slate-600 border border-slate-200 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye size={11} /> عرض
        </a>
      </div>
    </div>
  );
});

const OrdersEmptyState = memo(function OrdersEmptyState({ filter }: { filter: string }) {
  const message = useMemo(() => {
    if (filter === "ALL") return "لا توجد طلبات قيد التنفيذ حالياً. ستظهر الطلبات الجديدة هنا فور إسنادها لمناديب التوصيل.";
    if (filter === "ACTIVE") return "لا توجد طلبات في مرحلة التوصيل حالياً. الطلبات في الطريق ستظهر هنا.";
    if (filter === "WAITING") return "لا توجد طلبات قيد التحضير حالياً.";
    return "ممتاز! لا توجد شحنات متأخرة أو معلقة.";
  }, [filter]);

  return (
    <div className="py-8 lg:py-10 text-center">
      <div className="flex flex-col items-center justify-center max-w-[260px] mx-auto gap-2.5 text-slate-400">
        <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
          <Box size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700">لا توجد طلبات نشطة</p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
});

export default function AdminTrackingPage() {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<TrackingOrder | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);

  const { data: trackingData, loading, refresh } = useAsyncData<TrackingResponse>(
    () => apiFetch("/api/admin/tracking/live", "ADMIN"),
    []
  );

  const liveOrders = trackingData?.orders ?? null;
  const mapData = trackingData?.mapData ?? [];

  useEffect(() => {
    if (!trackingData) return;
    setLastRefresh(new Date());
    setSecondsSinceRefresh(0);
  }, [trackingData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceRefresh(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => setIsRefreshing(false), 500);
  }, [refresh]);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const stats = useMemo(() => {
    const orders = liveOrders ?? [];
    const activeOrders = orders.filter((o) => ["في الطريق", "قيد التوصيل", "خارج للتوصيل"].includes(o.status));
    return {
      total: orders.length,
      riders: new Set(orders.map((o) => o.rider).filter(Boolean)).size,
      active: activeOrders.length,
      failed: orders.filter((o) => o.isLate || o.status === "فشل التوصيل" || resolveStatus(o.status) === "متأخر").length,
      avgDeliveryTime: activeOrders.length > 0 ? "35 دقيقة" : "—",
      successRate: orders.length > 0
        ? Math.round(((orders.length - orders.filter((o) => o.status === "فشل التوصيل" || resolveStatus(o.status) === "متأخر").length) / orders.length) * 100)
        : 100,
    };
  }, [liveOrders]);

  const filteredOrders = useMemo(() => {
    const orders = liveOrders ?? [];
    if (filter === "ACTIVE") return orders.filter((o) => ["في الطريق", "قيد التوصيل", "خارج للتوصيل"].includes(o.status));
    if (filter === "WAITING") return orders.filter((o) => ["جاري التحضير", "قيد التحضير", "تم الاستلام", "جاهز للاستلام", "تم الطلب", "قريب من العميل"].includes(o.status));
    if (filter === "FAILED") return orders.filter((o) => o.isLate || o.status === "فشل التوصيل" || resolveStatus(o.status) === "متأخر");
    return orders;
  }, [liveOrders, filter]);

  const delayedCount = useMemo(() => {
    return (liveOrders ?? []).filter(o => o.isLate).length;
  }, [liveOrders]);

  const lastRefreshText = useMemo(() => {
    if (secondsSinceRefresh < 60) return `منذ ${secondsSinceRefresh} ثانية`;
    const mins = Math.floor(secondsSinceRefresh / 60);
    return `منذ ${mins} دقيقة`;
  }, [secondsSinceRefresh]);

  const handleSelectOrder = useCallback((order: TrackingOrder) => {
    setSelected(order);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      {/* Header - compact on mobile */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1700px] mx-auto px-3 lg:px-10 py-2 lg:py-3.5 flex items-center justify-between gap-2 lg:gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <div className="min-w-0">
              <div className="hidden lg:block text-[10px] font-black tracking-wider text-slate-400 uppercase mb-0.5 truncate">
                غرفة مراقبة الأسطول والعمليات الجارية
              </div>
              <h1 className="text-sm lg:text-lg font-bold tracking-tight text-slate-900 lg:pr-2 lg:border-r-4 lg:border-indigo-600 truncate">
                التتبع المباشر للطلبات
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-[9px] font-bold text-slate-400 tabular-nums hidden xl:block">
              آخر تحديث {lastRefreshText}
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`h-7 lg:h-8 px-2 lg:px-3 rounded-lg text-[9px] lg:text-[10px] font-bold transition-all flex items-center gap-1 lg:gap-1.5 border shadow-sm ${
                autoRefresh ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
              title={autoRefresh ? "إيقاف التحديث التلقائي" : "تشغيل التحديث التلقائي"}
            >
              <Radio size={11} />
              <span className="hidden sm:inline">{autoRefresh ? 'تحديث حي' : 'متوقفة'}</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-7 lg:h-8 px-2 lg:px-3 bg-white border border-slate-200 rounded-lg text-[9px] lg:text-[10px] font-bold text-slate-600 shadow-sm hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-1 lg:gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={11} className={isRefreshing ? "animate-spin text-indigo-500" : ""} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pause banner */}
      {!autoRefresh && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 lg:px-10 py-2">
          <div className="max-w-[1700px] mx-auto flex items-center gap-2 text-amber-800">
            <AlertCircle size={12} className="shrink-0 text-amber-500 lg:hidden" />
            <AlertCircle size={14} className="shrink-0 text-amber-500 hidden lg:block" />
            <p className="text-[10px] lg:text-[11px] font-bold leading-snug">
              <span className="lg:hidden">المراقبة متوقفة — اضغط "تحديث" لآخر البيانات.</span>
              <span className="hidden lg:inline">المراقبة متوقفة مؤقتًا — البيانات لا يتم تحديثها تلقائياً. اضغط على "تحديث" للحصول على آخر البيانات.</span>
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-[1700px] mx-auto px-3 lg:px-10 py-3 lg:py-6 space-y-3 lg:space-y-4" style={{ minHeight: 'calc(100vh - 120px)' }}>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 lg:gap-2.5">
          <StatCard label="إجمالي الشحنات" val={stats.total} icon={Layers} color="text-slate-600" bg="bg-slate-50" />
          <StatCard label="المناديب النشطة" val={stats.riders} icon={Truck} color="text-orange-600" bg="bg-orange-50/50" />
          <StatCard label="شحنات جارية" val={stats.active} icon={Zap} color="text-emerald-600" bg="bg-emerald-50/50" />
          <StatCard label="شحنات متأخرة" val={stats.failed} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50/50" />
          <StatCard label="معدل نجاح التوصيل" val={`${stats.successRate}%`} icon={Target} color="text-indigo-600" bg="bg-indigo-50/50" />
          <StatCard label="متوسط زمن التوصيل" val={stats.avgDeliveryTime} icon={Timer} color="text-amber-600" bg="bg-amber-50/50" />
        </div>

        {/* Delay alert */}
        {delayedCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 px-3 py-2.5 lg:px-4 lg:py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 lg:gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-2.5">
              <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-[11px] lg:text-xs font-black">تحذير تشغيلي: هناك {delayedCount} شحنات متأخرة أو غير نشطة حالياً!</p>
                <p className="text-[10px] text-rose-500 font-bold mt-0.5 hidden sm:block">يرجى متابعة المناديب والتحقق من حالة الطلبات المعلقة في أسرع وقت.</p>
              </div>
            </div>
            <button
              onClick={() => setFilter("FAILED")}
              className="bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors shrink-0 self-end sm:self-auto"
            >
              عرض الشحنات المعلقة
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 min-[1640px]:grid-cols-12 gap-3 lg:gap-4 items-start">

          {/* LEFT: Map + Selected Order (full width on default, col-span-8 on very large) */}
          <div className="min-[1640px]:col-span-8 space-y-3 lg:space-y-4">

            {/* Map */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative" style={{ height: 'clamp(300px, 50vh, 560px)' }}>
              {/* Map legend */}
              <div className="absolute top-2 left-2 lg:top-2.5 lg:left-2.5 z-10 flex flex-wrap gap-1 lg:gap-1.5 max-w-[calc(100%-1rem)] lg:max-w-none">
                <LegendMarker color="text-blue-500" label="عميل" />
                <LegendMarker color="text-orange-500" label="مورد" />
                <LegendMarker color="text-emerald-500" label="مندوب" />
                {selected && <LegendMarker color="text-indigo-500" label="طلب مختار" ring />}
              </div>
              {loading ? <MapSkeleton /> : (
                <OperationsMap data={mapData || []} selectedOrder={selected} />
              )}
            </div>

            {/* Selected Order Card */}
            {loading && !selected ? (
              <OrderCardSkeleton />
            ) : selected ? (
              <div className="bg-white rounded-xl p-3 lg:p-5 border border-slate-200 shadow-sm space-y-3 lg:space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 lg:pb-3 gap-2.5 lg:gap-3">
                  <div className="flex items-center gap-2.5 lg:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 lg:w-9 lg:h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <Navigation size={14} className="lg:hidden" />
                      <Navigation size={16} className="hidden lg:block" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400">طلب #{selected.id}</span>
                        {selected.isLate && (
                          <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 lg:px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                            <AlertCircle size={9} /> متأخر
                          </span>
                        )}
                        <StatusBadge status={selected.status} />
                      </div>
                      <h3 className="text-[13px] lg:text-sm font-black text-slate-800 mt-0.5 lg:mt-1 truncate" title={selected.title}>
                        {selected.title}
                      </h3>
                    </div>
                  </div>
                  <button onClick={handleClearSelection} className="p-1 lg:p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors shrink-0" title="إلغاء التحديد">
                    <X size={14} className="lg:hidden" />
                    <X size={15} className="hidden lg:block" />
                  </button>
                </div>

                {/* Grid Info - 2 cols on mobile (hide المورد), 4 on lg+ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-2.5">
                  <InfoBox label="العميل" val={selected.client || 'غير محدد'} />
                  <InfoBox label="المندوب" val={selected.rider || 'غير معين'} subVal={selected.riderPhone} />
                  <InfoBox label="المورد" val={selected.vendor || 'غير محدد'} className="hidden lg:block" />
                  <InfoBox
                    label="ETA"
                    val={selected.eta ? format(new Date(selected.eta), "hh:mm a", { locale: ar }) : 'غير محدد'}
                    status={selected.isLate ? "late" : "normal"}
                  />
                </div>

                {/* Pickup / Dropoff - desktop only */}
                <div className="hidden lg:block space-y-2">
                  <div className="flex gap-2.5 items-start text-xs">
                    <div className="w-5 h-5 rounded bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shrink-0 mt-0.5 text-[10px]">أ</div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-slate-400 block leading-none">موقع الاستلام</span>
                      <p className="font-semibold text-slate-700 mt-0.5 leading-normal truncate" title={selected.pickup || ''}>
                        {selected.pickup || '—'} {selected.vendor && <span className="text-slate-400 text-[10px]">({selected.vendor})</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0 mt-0.5 text-[10px]">ب</div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-slate-400 block leading-none">موقع التسليم</span>
                      <p className="font-semibold text-slate-700 mt-0.5 leading-normal truncate" title={selected.dropoff || ''}>
                        {selected.dropoff || '—'} {selected.client && <span className="text-slate-400 text-[10px]">({selected.client})</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Clock size={11} />
                    آخر تحديث: {formatDistanceToNow(new Date(selected.updatedAt), { addSuffix: true, locale: ar })}
                  </div>
                </div>

                {/* Mobile-only compact last-updated */}
                <div className="lg:hidden text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(selected.updatedAt), { addSuffix: true, locale: ar })}
                </div>

                {/* Actions - compact on mobile, full on desktop */}
                <div className="flex gap-1.5 lg:gap-2 pt-2.5 lg:pt-3 border-t border-slate-100 flex-wrap">
                  <a
                    href={`tel:${selected.riderPhone}`}
                    className="h-8 lg:h-9 px-3 lg:px-4 bg-emerald-600 text-white rounded-lg text-[10px] lg:text-[11px] font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 lg:gap-1.5"
                  >
                    <Phone size={11} className="lg:hidden" />
                    <Phone size={12} className="hidden lg:block" />
                    <span className="hidden sm:inline">اتصل بالمندوب</span>
                  </a>
                  <a
                    href={`/admin/requests/${selected.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 lg:h-9 px-3 lg:px-4 bg-indigo-600 text-white rounded-lg text-[10px] lg:text-[11px] font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 lg:gap-1.5"
                  >
                    <Eye size={11} className="lg:hidden" />
                    <Eye size={12} className="hidden lg:block" />
                    <span>تفاصيل التتبع</span>
                  </a>
                  <button
                    onClick={handleClearSelection}
                    className="h-8 lg:h-9 px-3 lg:px-4 bg-white text-slate-500 border border-slate-200 rounded-lg text-[10px] lg:text-[11px] font-bold hover:bg-slate-50 transition-colors hidden sm:flex items-center"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-2.5 lg:px-4 lg:py-3 flex items-center gap-2.5 lg:gap-3 text-slate-500">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Target size={12} className="lg:hidden" />
                  <Target size={14} className="hidden lg:block" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] lg:text-xs font-bold text-slate-700">لم يتم تحديد طلب</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">اختر طلبًا لعرض مساره وتفاصيله</p>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: Filters + Orders List (full width on default below, col-span-4 on very large) */}
          <div className="min-[1640px]:col-span-4 space-y-2.5 lg:space-y-3">

            {/* Filters - scrollable on mobile, segmented on desktop */}
            <div className="flex items-center gap-1 lg:gap-1 overflow-x-auto no-scrollbar bg-slate-50 lg:bg-slate-50 border border-slate-200 p-1.5 lg:p-1 rounded-xl shadow-sm">
              <FilterTab label="الكل" active={filter === "ALL"} onClick={() => setFilter("ALL")} className="shrink-0 lg:flex-1" />
              <FilterTab label="في الطريق" active={filter === "ACTIVE"} onClick={() => setFilter("ACTIVE")} className="shrink-0 lg:flex-1" />
              <FilterTab label="تحت التجهيز" active={filter === "WAITING"} onClick={() => setFilter("WAITING")} className="shrink-0 lg:flex-1" />
              <FilterTab label="المتأخرة" active={filter === "FAILED"} onClick={() => setFilter("FAILED")} className="shrink-0 lg:flex-1" />
            </div>

            {/* Mobile: Card list */}
            <div className="md:hidden bg-white border border-slate-200 rounded-xl shadow-sm p-2.5 space-y-2">
              {loading ? (
                <>
                  <MobileCardSkeleton />
                  <MobileCardSkeleton />
                  <MobileCardSkeleton />
                </>
              ) : filteredOrders.length === 0 ? (
                <OrdersEmptyState filter={filter} />
              ) : (
                filteredOrders.map((order) => (
                  <MobileOrderCard
                    key={order.id}
                    order={order}
                    isSelected={selected?.id === order.id}
                    onSelect={handleSelectOrder}
                  />
                ))
              )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-right border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                    <th className="px-3 py-2.5 text-[10px] font-bold">الطلب</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-center whitespace-nowrap w-[100px]">الحالة</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-right whitespace-nowrap w-[88px]">آخر نشاط</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-center whitespace-nowrap w-[56px]">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <TableSkeleton />
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <OrdersEmptyState filter={filter} />
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`group cursor-pointer transition-all text-xs ${
                          selected?.id === order.id
                            ? 'bg-indigo-50/40 border-r-2 border-r-indigo-400'
                            : 'hover:bg-slate-50/60 border-r-2 border-r-transparent'
                        }`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-all shrink-0 ${
                              selected?.id === order.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                            }`}>
                              <Box size={12} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors truncate"
                                title={`${order.title} • ${order.client || 'بدون عميل'}`}
                              >
                                {order.title}
                              </p>
                              <span
                                className="text-[9px] font-bold text-slate-400 mt-0.5 block truncate"
                                title={order.client || ''}
                              >
                                {order.client || 'بدون عميل'} · #{order.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-400 tabular-nums text-[10px]">
                          <span title={format(new Date(order.updatedAt), "yyyy-MM-dd hh:mm a", { locale: ar })}>
                            {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: false, locale: ar })}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOrder(order);
                            }}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                              selected?.id === order.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                            }`}
                            title="عرض تفاصيل الطلب"
                            aria-label="عرض تفاصيل الطلب"
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

function LegendMarker({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <div className={`bg-white/95 backdrop-blur px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md border shadow-sm flex items-center gap-1 lg:gap-1.5 whitespace-nowrap ${ring ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
      <svg viewBox="0 0 14 14" className={`w-2.5 h-2.5 lg:w-3 lg:h-3 ${color}`}>
        <circle cx="7" cy="7" r="5.5" fill="currentColor" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="2.5" fill="#ffffff" fillOpacity="0.9" />
      </svg>
      <span className="text-[8px] lg:text-[9px] font-bold text-slate-700">{label}</span>
    </div>
  );
}
