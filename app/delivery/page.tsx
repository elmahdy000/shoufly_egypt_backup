"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { listDeliveryTasks } from "@/lib/api/delivery-agent";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import {
  Package,
  Map,
  ArrowLeft,
  Truck,
  Navigation,
  MapPin,
  Phone
} from "lucide-react";

import { ShooflyLoader } from "@/components/shoofly/loader";

export default function DeliveryDashboard() {
  const { data, loading, error, refresh } = useAsyncData(() => listDeliveryTasks(), []);

  useEffect(() => {
    // Shared SSE — refresh on order-ready or status-change events
    const REFRESH_ON = new Set([
      "ORDER_PAID_PENDING_DELIVERY",
      "ORDER_STATUS_CHANGED",
      "DELIVERY_ASSIGNED",
      "DELIVERY_PICKED_UP",
      "DELIVERY_DELIVERED",
    ]);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type !== "notification") return;
      const innerType = (payload.data as { type?: string } | null)?.type;
      if (innerType && REFRESH_ON.has(innerType)) refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const stats = useMemo(
    () => ({
      available: data?.available.length ?? 0,
      myTasks: data?.myTasks.length ?? 0,
    }),
    [data],
  );

  if (loading && !data) {
    return <ShooflyLoader message="بنحمل المشاوير المتاحة..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-10 font-sans dir-rtl text-right">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">مشاويري</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">الأوردرات المتاحة واللي معاك حالياً</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/delivery/tasks" className="block">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 p-5 hover:border-primary/30 hover:shadow-2xl transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Package size={20} />
                </div>
                <p className="text-sm text-slate-600 font-bold">أوردراتي الحالية</p>
              </div>
              <p className="text-3xl font-black text-slate-900">{stats.myTasks}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">اللي معاك في الطريق</p>
            </div>
          </Link>
          
          <Link href="/delivery/tasks" className="block">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 p-5 hover:border-primary/30 hover:shadow-2xl transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Map size={20} />
                </div>
                <p className="text-sm text-slate-600 font-bold">متاح في منطقتك</p>
              </div>
              <p className="text-3xl font-black text-slate-900">{stats.available}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">مستني اللي يوصله</p>
            </div>
          </Link>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
             <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-sm font-bold">بيحمل الأوردرات...</p>
          </div>
        )}
        
        {error && <ErrorState message={error} />}

        {/* Active Tasks Feed */}
        {data?.myTasks && data.myTasks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">أوردرات في الطريق</h2>
              <Link href="/delivery/tasks" className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                عرض الكل <ArrowLeft size={16} />
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {data.myTasks.map((task: any) => {
                const statusStr = task.deliveryTracking?.[0]?.status ?? "OUT_FOR_DELIVERY";
                return (
                  <Link
                    key={task.id}
                    href={`/delivery/tasks/${task.id}`}
                    className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/20 p-5 hover:border-primary/30 outline-none transition-all group block"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                        {task.title}
                      </h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
                        statusStr === "OUT_FOR_DELIVERY" 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {statusStr === "OUT_FOR_DELIVERY" ? "في الطريق للعميل" : "تحت التجهيز"}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-slate-400" />
                        </div>
                        <span className="truncate leading-relaxed">{task.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <Phone size={14} className="text-slate-400" />
                        </div>
                        <span dir="ltr">{task.deliveryPhone}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">رقم: {task.id}</span>
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5 group-hover:gap-2 transition-all">
                        <Navigation size={14} /> افتح الخريطة
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && stats.available === 0 && stats.myTasks === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 p-12 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
               <Package size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">مفيش مشواير جديدة</h3>
             <p className="text-sm font-medium text-slate-500">ريّح شوية دلوقتى، هنبلغك أول ما يظهر أوردر جديد في منطقتك.</p>
          </div>
        ) : null}

        {/* Available Tasks Link */}
        {stats.available > 0 && (
          <Link
            href="/delivery/tasks"
            className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 p-6 flex items-center justify-between hover:border-amber-300 hover:shadow-2xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                <Map size={24} />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 block mb-1">اكتشف أوردرات متاحة جنبك</span>
                <span className="text-sm font-medium text-slate-500">موجود {stats.available} أوردر تقدر تاخدهم دلوقتي!</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
              <ArrowLeft size={20} />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
