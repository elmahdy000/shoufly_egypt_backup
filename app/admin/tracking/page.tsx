"use client";

import { ReactNode, useState, useMemo, useEffect, useCallback } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  MapPin, Truck, Box, RefreshCw, X, Clock, AlertCircle,
  Navigation, Zap, Phone, User, Timer, Target, Radio, Layers, ShieldAlert, ChevronLeft
} from "lucide-react";
import dynamic from "next/dynamic";

const OperationsMap = dynamic(
  () => import("@/components/admin/OperationsMap").then((m) => ({ default: m.OperationsMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <MapPin size={32} className="animate-pulse text-indigo-500" />
          <p className="text-xs font-bold text-slate-500">جاري تحميل خريطة العمليات المباشرة...</p>
        </div>
      </div>
    ),
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "في الطريق": { label: "في الطريق", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
  "قيد التوصيل": { label: "في الطريق", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
  "خارج للتوصيل": { label: "في الطريق", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
  "تم التسليم": { label: "تم التسليم", color: "text-emerald-700", bg: "bg-emerald-50/80", border: "border-emerald-100" },
  "قيد التحضير": { label: "جاري التحضير", color: "text-amber-700", bg: "bg-amber-50/80", border: "border-amber-100" },
  "تم الاستلام": { label: "تم الاستلام", color: "text-indigo-700", bg: "bg-indigo-50/80", border: "border-indigo-100" },
  "جاهز للاستلام": { label: "تم الاستلام", color: "text-indigo-700", bg: "bg-indigo-50/80", border: "border-indigo-100" },
  "تم الطلب": { label: "قريب من العميل", color: "text-purple-700", bg: "bg-purple-50/80", border: "border-purple-100" },
  "فشل التوصيل": { label: "متأخر", color: "text-rose-700", bg: "bg-rose-50/80", border: "border-rose-100" },
  DEFAULT: { label: "جاري المعالجة", color: "text-slate-600", bg: "bg-slate-50/80", border: "border-slate-100" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </div>
  );
}

export default function AdminTrackingPage() {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<TrackingOrder | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: trackingData, loading, refresh } = useAsyncData<TrackingResponse>(
    () => apiFetch("/api/admin/tracking/live", "ADMIN"),
    []
  );

  const liveOrders = trackingData?.orders ?? null;
  const mapData    = trackingData?.mapData ?? [];

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refresh]);

  const stats = useMemo(() => {
    const orders = liveOrders ?? [];
    const activeOrders = orders.filter((o) => ["قيد التوصيل", "خارج للتوصيل", "في الطريق"].includes(o.status));
    return {
      total: orders.length,
      riders: new Set(orders.map((o) => o.rider).filter(Boolean)).size,
      active: activeOrders.length,
      failed: orders.filter((o) => o.isLate || o.status === "فشل التوصيل").length,
      avgDeliveryTime: activeOrders.length > 0 ? "35 دقيقة" : "—",
      successRate: orders.length > 0 ? Math.round(((orders.length - orders.filter((o) => o.status === "فشل التوصيل").length) / orders.length) * 100) : 100,
    };
  }, [liveOrders]);

  const filteredOrders = useMemo(() => {
    const orders = liveOrders ?? [];
    if (filter === "ACTIVE") return orders.filter((o) => ["قيد التوصيل", "خارج للتوصيل", "في الطريق"].includes(o.status));
    if (filter === "WAITING") return orders.filter((o) => ["قيد التحضير", "تم الطلب", "جاهز للاستلام", "تم الاستلام"].includes(o.status));
    if (filter === "FAILED") return orders.filter((o) => o.isLate || o.status === "فشل التوصيل");
    return orders;
  }, [liveOrders, filter]);

  const delayedCount = useMemo(() => {
    return (liveOrders ?? []).filter(o => o.isLate).length;
  }, [liveOrders]);

  return (
    <div className="admin-page admin-page--spacious pb-10" dir="rtl">
      
      {/* 🚀 Header */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 py-4 sm:px-6 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black tracking-wider text-slate-400 uppercase">غرفة مراقبة الأسطول والعمليات الجارية</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 pr-2 border-r-4 border-indigo-600">
              التتبع المباشر للطلبات
            </h1>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`h-9 px-3.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                autoRefresh ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <Radio size={12} className={autoRefresh ? 'animate-pulse' : ''} />
              {autoRefresh ? 'متابعة حية نشطة' : 'المراقبة مجمدة'}
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-9 px-3.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin text-indigo-500" : ""} />
              تحديث حي
            </button>
          </div>
        </div>
      </section>

      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-5">

        {/* 📊 Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <StatCard label="إجمالي الشحنات" val={stats.total} icon={Layers} color="text-slate-600" bg="bg-slate-50" />
          <StatCard label="المناديب النشطة" val={stats.riders} icon={Truck} color="text-orange-600" bg="bg-orange-50/50" />
          <StatCard label="شحنات جارية" val={stats.active} icon={Zap} color="text-emerald-600" bg="bg-emerald-50/50" />
          <StatCard label="شحنات متأخرة" val={stats.failed} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50/50" />
          <StatCard label="معدل نجاح التوصيل" val={`${stats.successRate}%`} icon={Target} color="text-indigo-600" bg="bg-indigo-50/50" />
          <StatCard label="متوسط زمن التوصيل" val={stats.avgDeliveryTime} icon={Timer} color="text-amber-600" bg="bg-amber-50/50" />
        </div>

        {/* 🚨 Alert Strip */}
        {delayedCount > 0 && (
          <div className="bg-rose-50 border border-rose-100 text-rose-900 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-xs font-black">تحذير تشغيلي: هناك {delayedCount} شحنات متأخرة أو غير نشطة حالياً!</p>
                <p className="text-[10px] text-rose-500 font-bold mt-0.5">يرجى متابعة المناديب والتحقق من حالة الطلبات المعلقة في أسرع وقت.</p>
              </div>
            </div>
            <button 
              onClick={() => setFilter("FAILED")}
              className="bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors shrink-0"
            >
              عرض الشحنات المعلقة
            </button>
          </div>
        )}

        {/* 🛠 TWO PANELS LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* RIGHT PANEL (col-span-5): Active Shipments List */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 w-full bg-slate-50 p-1 rounded-lg border border-slate-100">
                {["ALL", "ACTIVE", "WAITING", "FAILED"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                      filter === t 
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t === "ALL" ? "الكل" : t === "ACTIVE" ? "في الطريق" : t === "WAITING" ? "تحت التجهيز" : "المتأخرة"}
                  </button>
                ))}
              </div>
            </div>

            {/* Shipments Table Card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[600px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">الشحنة / الطلب</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">العميل</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">المندوب</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center">الحالة</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-left">آخر نشاط</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-slate-100 animate-pulse shrink-0" />
                              <div className="space-y-1">
                                <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
                                <div className="w-12 h-2 bg-slate-100 rounded animate-pulse" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><div className="w-16 h-3 bg-slate-100 rounded animate-pulse" /></td>
                          <td className="px-4 py-3.5"><div className="w-16 h-3 bg-slate-100 rounded animate-pulse" /></td>
                          <td className="px-4 py-3.5 text-center"><div className="w-16 h-5 bg-slate-100 rounded mx-auto animate-pulse" /></td>
                          <td className="px-4 py-3.5 text-left"><div className="w-12 h-3 bg-slate-100 rounded animate-pulse" /></td>
                          <td className="px-4 py-3.5 text-center"><div className="w-10 h-6 bg-slate-100 rounded mx-auto animate-pulse" /></td>
                        </tr>
                      ))
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center max-w-[280px] mx-auto gap-3 text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200/50">
                              <Box size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">لا توجد شحنات مطابقة حالياً</p>
                              <p className="text-[10px] text-slate-400 mt-1">لا توجد طلبات جارية تحت هذا التصنيف. يمكنك تغيير فلتر البحث أو مراجعة الحالات التشغيلية الأخرى.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`group cursor-pointer transition-all border-b border-slate-100 text-xs ${
                            selected?.id === order.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60'
                          }`}
                          onClick={() => setSelected(order)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${
                                selected?.id === order.id 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                              }`}>
                                <Box size={14} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors truncate max-w-[120px]">{order.title}</p>
                                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">ID_{order.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-600 truncate max-w-[80px]">{order.client || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-slate-600 truncate max-w-[80px]">{order.rider || '—'}</td>
                          <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                          <td className="px-4 py-3 text-left font-bold text-slate-400 tabular-nums uppercase text-[10px]">
                            {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true, locale: ar })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(order);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                selected?.id === order.id 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                              }`}
                            >
                              تتبع
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

          {/* LEFT PANEL (col-span-7): Interactive Map & Selected Details */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Live Operations Map Wrapper */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[320px] sm:h-[400px] lg:h-[450px] relative z-0">
              <div className="absolute top-3 left-3 z-10 flex gap-2">
                <div className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> عملاء
                </div>
                <div className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" /> موردين
                </div>
                <div className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> مناديب
                </div>
              </div>
              <OperationsMap data={mapData || []} selectedOrder={selected} />
            </div>

            {/* Selected Shipment Details */}
            {selected ? (
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                      <Navigation size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">طلب #{selected.id}</span>
                        {selected.isLate && (
                          <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1 animate-pulse">
                            <AlertCircle size={10} /> متأخر
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-black text-slate-800 mt-0.5">{selected.title}</h3>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoBox label="العميل" val={selected.client || 'غير محدد'} />
                  <InfoBox label="المورد" val={selected.vendor || 'غير محدد'} />
                  <InfoBox label="المندوب" val={selected.rider || 'غير معين'} subVal={selected.riderPhone} />
                  <InfoBox 
                    label="وقت الوصول المتوقع (ETA)" 
                    val={selected.eta ? format(new Date(selected.eta), "hh:mm a", { locale: ar }) : 'غير محدد'} 
                    status={selected.isLate ? "late" : "normal"}
                  />
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex gap-2 items-start text-xs">
                    <div className="w-5 h-5 rounded bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0 mt-0.5">أ</div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block leading-none">موقع الاستلام (المورد)</span>
                      <p className="font-semibold text-slate-700 mt-0.5 leading-normal">{selected.pickup || '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start text-xs">
                    <div className="w-5 h-5 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 mt-0.5">ب</div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block leading-none">موقع التسليم (العميل)</span>
                      <p className="font-semibold text-slate-700 mt-0.5 leading-normal">{selected.dropoff || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <a 
                    href={`tel:${selected.riderPhone}`}
                    className="flex-1 h-9 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Phone size={12} /> اتصل بالمندوب
                  </a>
                  <button 
                    onClick={() => setSelected(null)}
                    className="h-9 px-4 bg-white text-slate-500 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
                <Target size={28} className="text-slate-300" />
                <div>
                  <p className="text-xs font-bold text-slate-600">لم يتم اختيار أي شحنة للتتبع</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto">
                    اضغط على أي صف في الجدول أو زر "تتبع" لعرض تفاصيل المسار والـ ETA وقنوات الاتصال المباشر.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

function StatCard({
  label,
  val,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  val: string | number;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm hover:shadow transition-all">
      <div className={`w-10 h-10 shrink-0 ${bg} ${color} rounded-lg flex items-center justify-center border border-black/5`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{label}</p>
        <p className="text-base font-black text-slate-900 tracking-tight leading-tight">{val}</p>
      </div>
    </div>
  );
}

function InfoBox({ 
  label, 
  val, 
  subVal,
  status = "normal"
}: { 
  label: string; 
  val: string; 
  subVal?: string;
  status?: "normal" | "late"
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
      <span className="text-[9px] font-bold text-slate-400 block leading-none">{label}</span>
      <p className={`text-xs font-black truncate leading-tight ${
        status === "late" ? "text-rose-600" : "text-slate-800"
      }`}>
        {val}
      </p>
      {subVal && (
        <span className="text-[9px] text-slate-400 block leading-none font-medium mt-0.5">{subVal}</span>
      )}
    </div>
  );
}
