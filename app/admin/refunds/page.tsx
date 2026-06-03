"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { refundAdminRequest } from "@/lib/api/transactions";
import {
  AlertTriangle, CheckCircle, FileText, Hash,
  Loader2, Package, RefreshCw, Search, XCircle,
} from "lucide-react";
type RequestStatus =
  | "PENDING_ADMIN_REVISION"
  | "OPEN_FOR_BIDDING"
  | "BIDS_RECEIVED"
  | "OFFERS_FORWARDED"
  | "ORDER_PAID_PENDING_DELIVERY"
  | "CLOSED_SUCCESS"
  | "CLOSED_CANCELLED"
  | "REJECTED";

type AdminRequest = {
  id: number;
  title: string;
  status: RequestStatus;
  client?: { fullName?: string | null } | null;
};

export default function AdminRefundsPage() {
  const [requestId, setRequestId] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: allRequests, loading: loadingReq } = useAsyncData<AdminRequest[]>(
    () => apiFetch("/api/admin/requests", "ADMIN"),
    []
  );

  const refundable = useMemo(() => {
    const list = allRequests ?? [];
    const base = list.filter((r) => r.status === "ORDER_PAID_PENDING_DELIVERY");
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((r) =>
      r.title?.toLowerCase().includes(q) ||
      String(r.id).includes(q) ||
      r.client?.fullName?.toLowerCase().includes(q)
    );
  }, [allRequests, search]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await refundAdminRequest(Number(requestId), reason || "استرداد يدوي من لوحة الإدارة");
      setMessage(`تم إصدار استرداد بنجاح للطلب #${result.request?.id ?? requestId} ✓`);
      setRequestId("");
      setReason("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشلت عملية الاسترداد");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="admin-page admin-page--spacious" dir="rtl">
      
      {/* 🚀 Header: Refund & Settlement Center */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40 overflow-hidden">
        <div className="px-6 lg:px-10 py-8 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">مركز تسوية المستحقات</span>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-r-4 border-rose-500 pr-4">رد <span className="text-rose-600">الأموال</span></h1>
             <p className="text-sm text-slate-500 font-medium max-w-xl">إدارة وتسوية طلبات استرجاع المبالغ وضمان حقوق الأطراف.</p>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           <div className="lg:col-span-8 space-y-8">
              {/* Refund Center Form */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-rose-600 shadow-sm"><RefreshCw size={20} /></div>
                       <h2 className="text-lg font-bold text-slate-900">إطلاق طلب استرداد</h2>
                    </div>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Direct Process</span>
                 </div>
                 
                 <div className="p-8 space-y-8">
                    <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 shadow-sm shadow-amber-500/5">
                       <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                       <div>
                          <p className="text-xs font-bold text-amber-900 mb-1 leading-none uppercase tracking-tighter">تحذير أمني</p>
                          <p className="text-sm font-medium text-amber-800/80 leading-relaxed">
                             هذا الإجراء سيقوم بسحب المبالغ وإعادتها فوراً للعميل مع إلغاء الطلب نهائياً. تأكد من صحة البيانات قبل التأكيد.
                          </p>
                       </div>
                    </div>

                    
                       {message && (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-2">
                             <CheckCircle size={16} /> {message}
                          </div>
                       )}
                       {error && (
                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                             <XCircle size={16} /> {error}
                          </div>
                       )}
                    

                    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 tracking-wide pr-2">رقم الطلب المستهدف</label>
                          <div className="relative group">
                             <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-slate-400 group-focus-within:text-rose-600 transition-colors border-l border-slate-100">
                                 <Hash size={18} />
                             </div>
                             <input
                               type="number"
                               value={requestId}
                               onChange={(e) => setRequestId(e.target.value)}
                               placeholder="إدخال المعرف الرقمي..."
                               className="w-full h-12 pr-16 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                               required
                             />
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 tracking-wide pr-2">سبب التسوية / الاسترداد</label>
                          <div className="relative group">
                             <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-slate-400 group-focus-within:text-rose-600 transition-colors border-l border-slate-100">
                                <FileText size={18} />
                             </div>
                             <input
                               value={reason}
                               onChange={(e) => setReason(e.target.value)}
                               placeholder="تفاصيل سبب الاسترداد..."
                               className="w-full h-12 pr-16 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-400"
                             />
                          </div>
                       </div>

                       <div className="md:col-span-2 pt-4">
                          <button
                            type="submit"
                            disabled={isLoading || !requestId}
                            className="w-full h-14 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-rose-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                          >
                             {isLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                             معالجة وإتمام عملية الاسترداد المالي
                          </button>
                       </div>
                    </form>
                 </div>
              </div>

              {/* 📋 Refundable Requests List */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                 <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                    <div>
                       <h2 className="text-lg font-bold text-slate-900">الطلبات المرشحة للاسترداد</h2>
                       <p className="text-xs text-slate-500 mt-1 font-medium">الطلبات التي تم دفع قيمتها ولم يتم تسليمها بعد.</p>
                    </div>
                    <div className="relative group">
                       <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" size={16} />
                       <input
                         value={search}
                         onChange={(e) => setSearch(e.target.value)}
                         placeholder="بحث بالاسم أو المعرف..."
                         className="h-11 pr-11 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all w-full md:w-64 shadow-sm"
                       />
                    </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[800px]">
                       <thead>
                          <tr className="bg-slate-50 text-slate-500">
                             <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">الشحنة المستهدفة</th>
                             <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider hidden md:table-cell">صاحب الطلب</th>
                             <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-center">الإدارة التنفيذية</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {loadingReq ? (
                             [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={3} className="h-20 bg-slate-50/50" /></tr>)
                          ) : refundable.length === 0 ? (
                             <tr><td colSpan={3} className="py-24 text-center text-slate-400 font-bold text-lg opacity-40 italic">لا توجد طلبات قابلة للاسترداد حالياً</td></tr>
                          ) : (
                             refundable.map(r => (
                                <tr key={r.id} className="group hover:bg-slate-50/80 transition-all cursor-pointer">
                                   <td className="px-8 py-5">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-inner"><Package size={18} /></div>
                                         <div>
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate max-w-[200px] leading-tight mb-1">{r.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">SHP_#{r.id}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-8 py-5 hidden md:table-cell text-xs font-bold text-slate-600">{r.client?.fullName}</td>
                                   <td className="px-8 py-5 text-center">
                                      <button
                                        onClick={() => { setRequestId(String(r.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="h-10 px-5 bg-white text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold hover:bg-rose-600 hover:text-white hover:border-rose-700 transition-all shadow-sm active:scale-95"
                                      >
                                         تجهيز الاسترداد
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
  
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8 sticky top-28 shadow-sm">
                 <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">بروتوكول تسوية الأموال</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refunding Policy v2.0</p>
                 </div>
                 <div className="space-y-6">
                    <Guideline color="bg-indigo-500" label="التدقيق المالي" text="عمليات الاسترداد متاحة فقط للطلبات التي تتبع دورة الدفع الكاملة بنجاح." />
                    <Guideline color="bg-amber-500" label="تحويل الحالة" text="يتم إيقاف المندوب فوراً وإخطاره بإلغاء الطلب من قبل الإدارة بعد الاسترداد." />
                    <Guideline color="bg-emerald-500" label="سرعة التسوية" text="يتم تحديث ميزانية النظام ورد المبلغ لمحفظة العميل بشكل آني ودقيق." />
                 </div>
                 
                 <div className="pt-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium text-slate-400 leading-relaxed italic">
                       * كافة العمليات المسجلة هنا تخضع للمراقبة الأمنية ويتم أرشفة بيانات المسؤول القائم بالعملية.
                    </div>
                 </div>
              </div>
           </div>
  
        </div>
      </div>
    </div>
  );
}

function Guideline({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="space-y-1">
       <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
          <span className="text-sm font-bold text-slate-900">{label}</span>
       </div>
       <p className="text-xs text-slate-500 tracking-tight leading-relaxed lg:mr-3">{text}</p>
    </div>
  );
}
