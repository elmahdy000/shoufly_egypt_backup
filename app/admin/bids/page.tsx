"use client";

import Link from "next/link";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { listPendingAdminRequests } from "@/lib/api/requests";
import {
  Package, ChevronLeft, Activity, AlertCircle
} from "lucide-react";

interface Request {
  id: number;
  title: string;
  status: string;
  _count?: { bids: number };
}

export default function AdminBidsPage() {
  const { data, loading, error } = useAsyncData<Request[]>(() => listPendingAdminRequests(), []);

  return (
    <div className="admin-page admin-page--spacious" dir="rtl">
      
      {/* 🚀 Header: Bid Monitoring Hub */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40 overflow-hidden">
        <div className="px-6 lg:px-10 py-8 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">مراقبة العروض النشطة</span>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-r-4 border-orange-500 pr-4">تحليل <span className="text-orange-600">العروض</span></h1>
             <p className="text-sm text-slate-500 font-medium max-w-xl">متابعة حركة عروض الموردين على الطلبات المفتوحة في الميدان.</p>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 space-y-8">
        
        {/* ℹ️ Strategy Alert */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-start gap-4 shadow-sm">
           <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <AlertCircle size={20} />
           </div>
           <div>
              <p className="text-xs font-bold text-slate-900 mb-1 leading-none uppercase tracking-tighter">مركز التدقيق</p>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                 هذه الصفحة توفر نظرة بانورامية على حركة العروض للطلبات الجارية. لاعتماد عرض معين أو مراجعة الشروط، يرجى الانتقال لتفاصيل الطلب.
              </p>
           </div>
        </div>

        {/* 📊 Active Bids Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[800px]">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                       <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">الطلب النشط / المعرف</th>
                       <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-center">كثافة العروض</th>
                       <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-center">حالة السوق</th>
                       <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-left">الإدارة</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-20 bg-slate-50/50" /></tr>)
                    ) : error ? (
                      <tr><td colSpan={4} className="py-20 text-center text-rose-500 font-black tracking-tight">{error}</td></tr>
                    ) : !data || data.length === 0 ? (
                      <tr><td colSpan={4} className="py-32 text-center text-slate-400 font-bold opacity-50 bg-slate-50/30">لا توجد عروض قيد الانتظار حالياً</td></tr>
                    ) : (
                      data.map((req) => (
                        <tr key={req.id} className="group hover:bg-slate-50 transition-all cursor-pointer">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner">
                                   <Package size={20} />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-tight mb-1">{req.title}</p>
                                   <span className="text-[10px] font-bold text-slate-400 tracking-wider">REQ_ID: {req.id}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-sm">
                                {req._count?.bids || 0} عرض
                             </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border ${
                               req.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                               req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                               'bg-slate-100 text-slate-600 border-slate-200'
                             }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  req.status === 'OPEN' ? 'bg-emerald-600' :
                                  req.status === 'PENDING' ? 'bg-amber-600' :
                                  'bg-slate-500'
                                }`} />
                                {req.status === 'OPEN' ? 'سوق مفتوح' : req.status === 'PENDING' ? 'قيد المراجعة' : req.status}
                             </div>
                          </td>
                          <td className="px-8 py-5 text-left">
                             <Link
                               href={`/admin/requests/${req.id}`}
                               className="h-10 px-5 bg-white text-slate-500 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-orange-600 hover:text-white hover:border-orange-700 transition-all shadow-sm inline-flex items-center gap-2 active:scale-95"
                             >
                                إدارة الطلب <ChevronLeft size={14} />
                             </Link>
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
  );
}


