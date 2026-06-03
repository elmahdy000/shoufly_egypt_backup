"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { useDebounce } from "@/lib/hooks/use-performance";
import { apiFetch } from "@/lib/api/client";
import { formatDate, formatCurrency } from "@/lib/formatters";
import {
  Search, RefreshCw,
  Truck, CheckCircle2,
  X, Calendar, User, Phone,
  History, Box, ArrowUpRight, Zap,
  ChevronLeft, ChevronRight, Filter,
  AlertCircle
} from "lucide-react";

interface OrderRequest {
  id: number;
  title: string;
  status: string;
  total: number;
  createdAt: string;
  client?: { fullName?: string; phone?: string };
  items: unknown[];
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "جميع الحالات", color: "bg-slate-100 text-slate-700" },
  { value: "PENDING_ADMIN_REVISION", label: "بانتظار المراجعة", color: "bg-amber-100 text-amber-700" },
  { value: "OPEN_FOR_BIDDING", label: "مفتوح للمزايدة", color: "bg-sky-100 text-sky-700" },
  { value: "OFFERS_FORWARDED", label: "تم إرسال العروض", color: "bg-blue-100 text-blue-700" },
  { value: "ORDER_PAID_PENDING_DELIVERY", label: "قيد التوصيل", color: "bg-indigo-100 text-indigo-700" },
  { value: "CLOSED_SUCCESS", label: "تم التوصيل", color: "bg-emerald-100 text-emerald-700" },
  { value: "CLOSED_CANCELLED", label: "ملغي", color: "bg-rose-100 text-rose-700" },
];

const ITEMS_PER_PAGE = 10;

export default function AdminRequestsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OrderRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🚀 Debounced search for better performance
  const debouncedSearch = useDebounce(search, 150);

  const { data: requests, loading, refresh } = useAsyncData<OrderRequest[]>(
    () => apiFetch(`/api/admin/requests?limit=100`, "ADMIN"),
    []
  );

  const filtered = useMemo(() => {
    let list = requests ?? [];
    if (statusFilter !== "ALL") {
      list = list.filter(r => r.status === statusFilter);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.client?.fullName?.toLowerCase().includes(q) ||
        String(r.id).includes(q)
      );
    }
    return list;
  }, [requests, statusFilter, debouncedSearch]);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
    setSelected(null);
  }, []);

  return (
    <div className="admin-page admin-page--spacious" dir="rtl">
      
      {/* 🚀 Header: Professional Control */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40 overflow-hidden">
        <div className="px-6 lg:px-10 py-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">نظام إدارة الطلبات</span>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-r-4 border-orange-500 pr-4">سجل <span className="text-orange-600">الطلبات</span></h1>
             <p className="text-sm text-slate-500 font-medium max-w-xl">متابعة فورية لجميع الطلبات الصادرة، مراجعة حالات التوصيل، وحل مشكلات الشحنات.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
             <div className="relative group w-full sm:w-[400px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-all" size={18} />
                <input
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="بحث برقم الطلب أو اسم العميل..."
                   className="w-full pr-12 pl-4 h-11 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                />
             </div>
             <button onClick={() => refresh()} className="p-3 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === opt.value
                    ? opt.color + " ring-2 ring-offset-1 ring-orange-300"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-orange-300"
                }`}
              >
                {opt.label}
                {opt.value !== "ALL" && (
                  <span className="mr-1.5 text-[10px] opacity-70">
                    ({(requests ?? []).filter(r => r.status === opt.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* 📋 Order Ledger */}
           <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[600px]">
              <div className="overflow-x-auto">
                 <table className="w-full text-right min-w-[800px]">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">الطلب</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-center text-slate-500">الحالة</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">المرسل إليه</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-left text-slate-500">المبلغ</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                         [1,2,3,4,5,6].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-20 bg-slate-50/50" /></tr>)
                       ) : paginated.length === 0 ? (
                         <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-medium">لا توجد طلبات تطابق البحث</td></tr>
                       ) : paginated.map(req => (
                         <tr 
                          key={req.id} 
                          onClick={() => setSelected(req)}
                          className={`group cursor-pointer transition-all ${selected?.id === req.id ? 'bg-orange-50/50' : 'hover:bg-slate-50'}`}
                         >
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selected?.id === req.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
                                     <Box size={20} />
                                  </div>
                                   <div>
                                      <p className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{req.title || `طلب رقم #${req.id}`}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                         <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">#{req.id}</span>
                                         <span className="text-[10px] font-medium text-slate-400" dir="ltr">{formatDate(req.createdAt)}</span>
                                      </div>
                                   </div>
                                </div>
                             </td>
                            <td className="px-6 py-5 text-center">
                               <StatusBadge status={req.status} />
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">{req.client?.fullName?.charAt(0) || "U"}</div>
                                  <span className="text-sm font-semibold text-slate-700">{req.client?.fullName || "عميل النظام"}</span>
                               </div>
                            </td>
                            <td className="px-6 py-5 text-left font-jakarta text-lg font-bold text-slate-900 tracking-tight" dir="ltr">
                               {formatCurrency(req.total)}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <span className="text-xs text-slate-500">
                    عرض {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, filtered.length)} من {filtered.length} طلب
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700 px-3 py-1 bg-white rounded-lg border border-slate-200">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              )}
           </div>

           {/* 🛡️ Order Inspector */}
              {selected ? (
                 <aside
                    className="lg:col-span-4 bg-white rounded-2xl p-4 lg:p-8 border border-slate-200 shadow-sm lg:sticky lg:top-32 overflow-hidden"
                 >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                       <h2 className="text-lg font-bold text-slate-900">تفاصيل الشحنة</h2>
                       <button onClick={() => setSelected(null)} className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-lg text-slate-400 transition-all"><X size={18} /></button>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الحالة اللوجستية</p>
                          <div className="flex flex-col gap-3">
                             <h3 className="text-xl font-bold leading-tight text-slate-900">{selected.title}</h3>
                             <StatusBadge status={selected.status} large />
                          </div>
                       </div>

                       {/* 🧠 AI Audit Reasoning Display */}
                       {selected.status === 'PENDING_ADMIN_REVISION' && (
                          <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                             <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                                <Zap size={16} /> نتائج تدقيق المحتوى (AI Watchtower)
                             </div>
                             <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                {(selected as any).notes || "لا توجد ملاحظات آلية متوفرة لهذا الطلب."}
                             </p>
                          </div>
                       )}

                       <div className="space-y-3">
                          <DetailRow icon={<User size={16} />} label="صاحب الطلب" value={selected.client?.fullName || 'غير محدد'} />
                          <DetailRow icon={<Phone size={16} />} label="هاتف التواصل" value={selected.client?.phone || 'غير مسجل'} />
                          <DetailRow icon={<Calendar size={16} />} label="توقيت الإنشاء" value={formatDate(selected.createdAt)} />
                          <DetailRow icon={<ArrowUpRight size={16} />} label="القيمة الإجمالية" value={formatCurrency(selected.total)} highlight />
                       </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 space-y-3">
                        {selected.status === 'PENDING_ADMIN_REVISION' ? (
                           <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={async () => {
                                  setErrorMessage(null);
                                  setSuccessMessage(null);
                                  try {
                                    await apiFetch(`/api/admin/requests/${selected.id}/review`, "ADMIN", { method: 'PATCH', body: { action: 'approve' } });
                                    setSuccessMessage("تمت الموافقة على الطلب بنجاح! ✅");
                                    refresh();
                                    setSelected(null);
                                  } catch (err) {
                                    setErrorMessage("حدث خطأ أثناء الموافقة على الطلب.");
                                  }
                                }}
                                className="h-12 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                              >
                                 <CheckCircle2 size={16} /> موافقة
                              </button>
                              <button 
                                onClick={async () => {
                                  setErrorMessage(null);
                                  setSuccessMessage(null);
                                  try {
                                    await apiFetch(`/api/admin/requests/${selected.id}/review`, "ADMIN", { method: 'PATCH', body: { action: 'reject' } });
                                    setSuccessMessage("تم رفض الطلب بنجاح. ❌");
                                    refresh();
                                    setSelected(null);
                                  } catch (err) {
                                    setErrorMessage("حدث خطأ أثناء رفض الطلب.");
                                  }
                                }}
                                className="h-12 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                              >
                                 <X size={16} /> رفض الطلب
                              </button>
                           </div>
                        ) : (
                           <>
                              <button 
                                onClick={async () => {
                                  if (!selected.id) return;
                                  setErrorMessage(null);
                                  setSuccessMessage(null);
                                  try {
                                    await apiFetch(`/api/admin/requests/${selected.id}/dispatch`, "ADMIN", { method: 'PATCH' });
                                    setSuccessMessage("تم تحديث مسار التوصيل بنجاح! 🚚");
                                    refresh();
                                  } catch (err) {
                                    setErrorMessage(err instanceof Error ? err.message : 'فشل تحديث المسار');
                                  }
                                }}
                                className="w-full h-14 bg-orange-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-orange-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                              >
                                 <Truck size={20} /> تحديث مسار التوصيل
                              </button>
                              <button className="w-full h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                 <History size={16} /> عرض سجل التغييرات
                              </button>
                           </>
                        )}
                     </div>
                 </aside>
              ) : (
                <div className="lg:col-span-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center gap-4 text-slate-400">
                   <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Box size={32} />
                   </div>
                   <p className="text-sm font-medium">اختر طلباً من القائمة لعرض تفاصيله بالكامل</p>
                </div>
              )}
         </div>
      </div>

      {/* 🔔 Toast Notifications */}
      {(successMessage || errorMessage) && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in font-bold text-xs pointer-events-auto">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={16} />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-600"><X size={14} /></button>
            </div>
          )}
          {errorMessage && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in font-bold text-xs pointer-events-auto">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={16} />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600"><X size={14} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  const statusMap: Record<string, { label: string; cls: string }> = {
    "PENDING_ADMIN_REVISION": { label: "في انتظار المراجعة", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    "OPEN_FOR_BIDDING": { label: "مفتوح للمزايدة", cls: "bg-sky-100 text-sky-700 border-sky-200" },
    "OFFERS_FORWARDED": { label: "تم إرسال العروض", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    "ORDER_PAID_PENDING_DELIVERY": { label: "تم الدفع - قيد التوصيل", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    "CLOSED_SUCCESS": { label: "تم التوصيل بنجاح", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    "CLOSED_CANCELLED": { label: "ملغي / مرتجع", cls: "bg-rose-100 text-rose-700 border-rose-200" },
    "default": { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" }
  };

  const { label, cls } = statusMap[status] || statusMap.default;
  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border font-bold transition-all ${cls} ${large ? 'px-6 py-3 text-base' : 'px-3 py-1 text-[10px]'}`}>
       {label}
       {(status === "CLOSED_SUCCESS" || status === "تم التوصيل") && <CheckCircle2 size={large ? 18 : 12} />}
       {(status === "قيد التحضير") && <RefreshCw size={large ? 18 : 12} className="animate-spin opacity-50" />}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
          {label}
        </span>
      </div>
      <span
        className={`font-jakarta text-sm font-bold ${
          highlight ? "text-orange-600" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
