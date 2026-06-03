"use client";

import { useState, useMemo, useCallback } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { reviewAdminWithdrawal } from "@/lib/api/transactions";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  Search, X, User, Calendar, Hash, Loader2, Filter,
  CheckCircle, XCircle, Landmark, Activity, History, ChevronLeft,
  Clock, DollarSign, RefreshCw, ShieldCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:  { label: "قيد الفحص", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  APPROVED: { label: "تم الصرف",  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  REJECTED: { label: "تم الرفض",    color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

export default function AdminWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: withdrawals, loading, setData, refresh } = useAsyncData<any[]>(
    async () => {
      const res = await apiFetch<any>("/api/admin/withdrawals", "ADMIN");
      return res.items || [];
    }, []
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refresh]);

  const filtered = useMemo(() => {
    const list = Array.isArray(withdrawals) ? withdrawals : [];
    let result = [...list];
    if (statusFilter !== "ALL") result = result.filter((w: any) => w.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w: any) =>
        w.vendor?.fullName?.toLowerCase().includes(q) ||
        String(w.id).includes(q)
      );
    }
    return result;
  }, [withdrawals, statusFilter, search]);

  const stats = useMemo(() => {
    const all = Array.isArray(withdrawals) ? withdrawals : [];
    return {
      total: all.length,
      pending: all.filter((w: any) => w.status === "PENDING").length,
      approved: all.filter((w: any) => w.status === "APPROVED").length,
      pendingAmount: all.filter((w: any) => w.status === "PENDING").reduce((s: number, w: any) => s + Number(w.amount), 0),
    };
  }, [withdrawals]);

  async function handleReview(id: number, action: "APPROVE" | "REJECT") {
    setActionLoading(action === "APPROVE" ? "approve" : "reject");
    setActionMsg(null);
    try {
      const note = action === "REJECT" ? (rejectNote || "تم الرفض من قبل الإدارة") : undefined;
      await reviewAdminWithdrawal(id, action.toLowerCase() as "approve" | "reject", note);
      const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
      setData((prev: any[] | null) => (prev ?? []).map((w) => w.id === id ? { ...w, status: newStatus, reviewNote: note } : w));
      setSelected((prev: any) => prev?.id === id ? { ...prev, status: newStatus, reviewNote: note } : prev);
      setActionMsg({ text: action === "APPROVE" ? "تم اعتماد الطلب وصرف المبلغ بنجاح ✓" : "تم تنفيذ إجراء الرفض", ok: true });
      if (action === "REJECT") setRejectNote("");
    } catch (e: any) {
      setActionMsg({ text: e.message || "فشلت العملية", ok: false });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10 font-cairo antialiased min-h-screen bg-slate-50" dir="rtl">
      
      {/* 🌟 ELEGANT HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,106,0,0.5)]" />
            <span className="text-xs font-bold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">التدقيق المالي</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">سحوبات الأموال</h1>
          <p className="text-base text-slate-500 font-medium">مراجعة واعتماد طلبات تحويل الأرصدة للبنوك والمحافظ الإلكترونية.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={handleRefresh} className="h-12 px-6 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2 shadow-sm">
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              تحديث البيانات
           </button>
        </div>
      </header>

      {/* 📊 METRICS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatItem label="بانتظار الفحص" val={stats.pending} icon={Clock} color="text-amber-600 bg-amber-50" />
         <StatItem label="قيمة المعلق" val={formatCurrency(stats.pendingAmount)} icon={DollarSign} color="text-slate-600 bg-slate-100" isCurrency />
         <StatItem label="طلبات مكتملة" val={stats.approved} icon={CheckCircle} color="text-emerald-600 bg-emerald-50" />
         <StatItem label="إجمالي الحركات" val={stats.total} icon={Activity} color="text-primary bg-primary/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         
         {/* 📋 Withdrawal List */}
         <div className="lg:col-span-8 space-y-6">
            
            {/* 🛠 Toolbar */}
            <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
               <div className="relative flex-1 w-full group">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث باسم المستفيد أو رقم الطلب..."
                    className="w-full pr-11 pl-4 h-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary/50 outline-none transition-all placeholder:text-slate-400"
                  />
               </div>
               <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                     <Filter size={18} />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 px-6 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none transition-all shadow-sm focus:border-primary/50 min-w-[180px]"
                  >
                    <option value="ALL">كل الحالات</option>
                    <option value="PENDING">بانتظار الفحص</option>
                    <option value="APPROVED">تم الصرف</option>
                    <option value="REJECTED">مرفوض</option>
                  </select>
               </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
               <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[800px]">
                     <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                           <th className="px-4 lg:px-8 py-5 text-[11px] font-bold uppercase tracking-wider">المستفيد / التاريخ</th>
                           <th className="px-4 lg:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-center">المبلغ</th>
                           <th className="px-4 lg:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-center whitespace-nowrap">الحالة</th>
                           <th className="px-4 lg:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-left">إجراء</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                           [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-20 bg-slate-50/30" /></tr>)
                        ) : filtered.length === 0 ? (
                           <tr>
                             <td colSpan={4} className="py-24 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-4"><Landmark size={32} /></div>
                                <p className="text-lg font-bold text-slate-500">لا توجد طلبات سحب حالياً</p>
                             </td>
                           </tr>
                        ) : (
                           filtered.map((w: any) => (
                              <tr
                                key={w.id}
                                className={`group cursor-pointer transition-all ${selected?.id === w.id ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                                onClick={() => setSelected(w)}
                              >
                                 <td className="px-4 lg:px-8 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${selected?.id === w.id ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20'}`}>
                                          {w.vendor?.fullName?.charAt(0)}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{w.vendor?.fullName}</p>
                                          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase">{formatDistanceToNow(new Date(w.createdAt), { addSuffix: true, locale: ar })}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-4 lg:px-8 py-5 text-center">
                                    <span className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(Number(w.amount))}</span>
                                 </td>
                                 <td className="px-4 lg:px-8 py-5 text-center"><StatusBadge status={w.status} /></td>
                                 <td className="px-4 lg:px-8 py-5 text-left">
                                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all ${selected?.id === w.id ? 'bg-primary text-white' : 'bg-white border border-slate-100 text-slate-300 group-hover:bg-primary group-hover:border-primary group-hover:text-white'}`}>
                                       <ChevronLeft size={16} />
                                    </div>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* 🛡️ Withdrawal Auditor */}
            {selected ? (
               <aside
                  className="lg:col-span-4 bg-white rounded-3xl p-4 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 lg:sticky lg:top-28 space-y-8 overflow-hidden"
               >
                  <div className="flex items-center justify-between border-b border-slate-50 pb-6 text-slate-900">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm"><Landmark size={20} /></div>
                        <h2 className="text-lg font-black">تفاصيل السحب</h2>
                     </div>
                     <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"><X size={18} /></button>
                  </div>

                  <div className="space-y-6">
                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">القيمة المطلوب صرفها</p>
                        <div className="space-y-3">
                           <h4 className="text-3xl font-black tracking-tight text-slate-900 leading-none">{formatCurrency(Number(selected.amount))}</h4>
                           <div className="pt-1"><StatusBadge status={selected.status} /></div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <InfoRow icon={<User size={16} />} label="المستفيد الرسمي" val={selected.vendor?.fullName} />
                        <InfoRow icon={<Hash size={16} />} label="رقم العملية" val={`#WTH-${selected.id}`} />
                        <InfoRow icon={<Calendar size={16} />} label="تاريخ الطلب" val={formatDate(selected.createdAt)} />
                     </div>
                  </div>

                  {actionMsg && (
                     <div className={`p-4 rounded-xl text-xs font-bold border transition-all ${actionMsg.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {actionMsg.text}
                     </div>
                  )}

                  <div className="pt-6 border-t border-slate-50 space-y-4">
                     {selected.status === "PENDING" && (
                        <>
                           <button 
                             onClick={() => handleReview(selected.id, "APPROVE")}
                             disabled={!!actionLoading}
                             className="w-full h-14 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                           >
                              {actionLoading === "approve" ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                              اعتماد وصرف المبلغ
                           </button>
                           
                           <div className="space-y-3 pt-4 border-t border-slate-50">
                              <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="اكتب سبب الرفض هنا (إلزامي للرفض)..."
                                rows={2}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all resize-none shadow-sm placeholder:text-slate-400"
                              />
                              <button 
                                onClick={() => handleReview(selected.id, "REJECT")}
                                disabled={!!actionLoading}
                                className="w-full h-12 bg-white text-rose-600 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                              >
                                 {actionLoading === "reject" ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                 رفض الطلب
                              </button>
                           </div>
                        </>
                     )}
                     <button className="w-full h-11 text-slate-400 hover:text-slate-600 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-4">
                        <History size={14} /> سجل التدقيق المالي
                     </button>
                  </div>
               </aside>
            ) : (
              <div className="lg:col-span-4 h-[400px] bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-4">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm"><Landmark size={32} className="text-slate-300" /></div>
                 <p className="text-sm font-bold text-slate-500">اختر طلباً لعرض تفاصيل الصرف</p>
              </div>
            )}
      </div>
    </div>
  );
}

function StatItem({ label, val, icon: Icon, color, isCurrency }: any) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
       <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
          <Icon size={24} />
       </div>
       <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <p className="text-2xl font-black text-slate-900 leading-none">
             {isCurrency && typeof val === 'number' ? formatCurrency(val).split('.')[0] : val}
          </p>
       </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border ${cfg.bg} ${cfg.border} ${cfg.color} whitespace-nowrap uppercase tracking-wider`}>
       <div className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
       {cfg.label}
    </span>
  );
}

function InfoRow({ icon, label, val }: { icon: any; label: string; val: string }) {
  return (
    <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">{icon}</div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
       </div>
       <span className="text-sm font-black text-slate-900 truncate max-w-[150px]">{val}</span>
    </div>
  );
}
