"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/shoofly/button";
import { formatCurrency } from "@/lib/formatters";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { listVendorBids } from "@/lib/api/bids";
import { listVendorTransactions } from "@/lib/api/transactions";
import { StatSkeleton, RequestSkeleton } from "@/components/shoofly/skeleton";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import {
  FiPackage,
  FiTrendingUp, FiPlusCircle,
  FiCheckCircle, FiInbox,
  FiActivity, FiSearch, FiChevronLeft, FiStar, FiClock
} from "react-icons/fi";
import { ShooflyLoader } from "@/components/shoofly/loader";

export default function VendorHomePage() {
  const { data: bidsData, loading: bidsLoading, refresh: refreshBids } = useAsyncData(() => listVendorBids(), []);
  const { data: txData, loading: txLoading, refresh: refreshTxs } = useAsyncData(() => listVendorTransactions(), []);

  const refreshAll = () => {
    refreshBids();
    refreshTxs();
  };

  useEffect(() => {
    // Shared SSE — refresh for any bid/financial event
    const REFRESH_ON = new Set([
      "NEW_BID",
      "ORDER_STATUS_CHANGED",
      "PAYMENT_RECEIVED",
      "PAYMENT_FAILED",
      "VENDOR_PAYOUT",
      "WITHDRAWAL",
      "REFUND_TO_VENDOR",
    ]);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type !== "notification") return;
      const innerType = (payload.data as { type?: string } | null)?.type;
      if (innerType && REFRESH_ON.has(innerType)) refreshAll();
    });
    return unsubscribe;
  }, [refreshBids, refreshTxs]);

  const totalEarnings = useMemo(() => {
    return (txData ?? [])
      .filter((tx: { type: string }) => tx.type === "VENDOR_PAYOUT" || tx.type === "REFUND")
      .reduce((sum: number, tx: { amount: unknown }) => sum + Number(tx.amount), 0);
  }, [txData]);

  const activeBidsCount = useMemo(() => {
    return (bidsData ?? []).filter((b: any) => b.status === "PENDING" || b.status === "ACCEPTED_BY_CLIENT").length;
  }, [bidsData]);

  const successRate = useMemo(() => {
    const bids = bidsData ?? [];
    if (bids.length === 0) return 0;
    const won = bids.filter((b: any) => b.status === "ACCEPTED_BY_CLIENT").length;
    return Math.round((won / bids.length) * 100);
  }, [bidsData]);

  const responseTime = useMemo(() => {
    const bidsWithReq = (bidsData ?? []).filter((b: any) => b.request?.createdAt);
    if (bidsWithReq.length === 0) return null;
    
    const totalDiff = bidsWithReq.reduce((sum: number, b: any) => {
      const bidTime = new Date(b.createdAt).getTime();
      const reqTime = new Date(b.request.createdAt).getTime();
      return sum + Math.max(0, bidTime - reqTime);
    }, 0);
    
    const avgMinutes = Math.round(totalDiff / bidsWithReq.length / 60000);
    return avgMinutes === 0 ? "أقل من دقيقة" : avgMinutes;
  }, [bidsData]);

  if ((bidsLoading || txLoading) && (!bidsData || !txData)) {
    return <ShooflyLoader message="بنحضرلك بيانات الشغل..." />;
  }

  return (
    <div className="font-sans dir-rtl text-right" dir="rtl">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 space-y-4">
        {/* Quick Actions */}
        <div className="flex items-center gap-3">
           <Link href="/vendor/requests" className="flex-1">
             <Button className="w-full h-12 rounded-xl font-bold gap-2 bg-primary text-white hover:bg-primary/90 transition-all">
                <FiPlusCircle size={18} /> طلبات السوق
             </Button>
           </Link>
           <Link href="/vendor/earnings" className="flex-1">
             <Button variant="secondary" className="w-full h-12 rounded-xl font-bold gap-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all">
                <FiTrendingUp size={18} /> فلوسي
             </Button>
           </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(bidsLoading || txLoading) ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              {/* Earnings Card */}
              <Link href="/vendor/earnings" className="md:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-emerald-300 hover:shadow-md transition-all group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">صافي الأرباح</span>
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <FiTrendingUp size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(totalEarnings).split(' ')[0]}
                    <span className="text-xs text-slate-400 mr-1">ج.م</span>
                  </p>
                </div>
              </Link>

              {/* Active Bids Card */}
              <Link href="/vendor/bids" className="md:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">العروض الشغالة</span>
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors text-xs font-black">
                      {activeBidsCount}
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {activeBidsCount} <span className="text-xs text-slate-400 mr-1 font-medium italic">عرض شغال</span>
                  </p>
                </div>
              </Link>

              {/* Success Rate Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full group hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">نسبة النجاح</span>
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <FiStar size={18} />
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-black text-slate-900">{successRate}%</p>
                  <div className="w-full bg-slate-100 h-1 rounded-full mb-2 overflow-hidden">
                    <div className="bg-amber-400 h-full" style={{ width: `${successRate}%` }} />
                  </div>
                </div>
              </div>

              {/* Response Time - Shows placeholder until backend implements tracking */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full group hover:bg-slate-50 transition-colors hidden md:block">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">سرعة الرد</span>
                  <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                    <FiClock size={18} />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {responseTime ?? "—"} 
                  {typeof responseTime === 'number' && <span className="text-xs text-slate-400 mr-1 font-medium italic">دقيقة</span>}
                </p>
              </div>
            </>
          )}
        </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Active Bids List */}
        <div className="lg:col-span-3 space-y-3">
           <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                 <FiInbox size={16} className="text-primary" /> آخر عروض قدمتها
              </h2>
              <Link href="/vendor/bids" className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors">شوف الكل</Link>
           </div>

           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {bidsLoading ? (
                <div className="p-8 text-center text-slate-500">
                   <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                   <p className="text-xs font-medium">بنحمل...</p>
                </div>
              ) : (bidsData?.length ?? 0) === 0 ? (
                <div className="p-8 text-center">
                   <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <FiInbox size={20} />
                   </div>
                   <p className="text-sm font-semibold text-slate-700 mb-1">مفيش عروض لسه</p>
                   <p className="text-xs text-slate-500 mb-3">دور في الطلبات الموجودة وقدم عروضك</p>
                   <Link href="/vendor/requests">
                      <Button variant="secondary" className="text-xs h-8 px-4">شوف الطلبات</Button>
                   </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                   {(bidsData ?? []).slice(0, 5).map((bid: any) => {
                     const isAccepted = bid.status === "ACCEPTED_BY_CLIENT";
                     return (
                       <Link key={bid.id} href={`/vendor/requests/${bid.requestId}`} className="group p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-3">
                             <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isAccepted ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                             }`}>
                                <FiPackage size={16} />
                             </div>
                             <div>
                                <h4 className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">طلب #{bid.requestId}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{bid.request?.title || "طلب خدمة"}</p>
                             </div>
                          </div>
                          
                          <div className="text-left flex items-center gap-3">
                             <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                               isAccepted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                             }`}>
                               {isAccepted ? "اتوافق عليه" : "مستني"}
                             </span>
                             <p className="text-sm font-bold text-slate-900">{formatCurrency(bid.netPrice || 0)}</p>
                             <FiChevronLeft size={14} className="text-slate-400" />
                          </div>
                       </Link>
                     );
                   })}
                </div>
              )}
           </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2 space-y-4">
           <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <FiActivity size={16} className="text-primary" /> في السريع
           </h2>
           
           <div className="grid gap-3">
              <Link href="/vendor/requests" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-sm group flex items-center gap-3 transition-all">
                 <div className="w-10 h-10 bg-orange-50 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <FiSearch size={17} />
                 </div>
                 <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">شوف الطلبات</p>
                    <p className="text-xs text-slate-500">طلبات لسه نازلة طازة</p>
                 </div>
                 <FiChevronLeft size={16} className="text-slate-400" />
              </Link>

              <Link href="/vendor/earnings" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-sm group flex items-center gap-3 transition-all">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                    <FiTrendingUp size={17} />
                 </div>
                 <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">الأرباح</p>
                    <p className="text-xs text-slate-500">تابع فلوسك وأرباحك</p>
                 </div>
                 <FiChevronLeft size={16} className="text-slate-400" />
              </Link>
           </div>

           {/* Tip Card */}
           <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                 <FiActivity size={14} className="text-primary" />
                 <p className="text-xs font-bold text-slate-900">نصيحة في السريع</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                 الزباين بيحبوا التفاصيل، ويفضل تديهم ضمان مابيقلش عن 3 شهور.
              </p>
           </div>
         </div>
      </div>
    </div>
    </div>
  );
}
