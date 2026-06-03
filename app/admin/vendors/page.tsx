"use client";

import { useCallback, useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  Search, RefreshCw, Store, ShieldCheck,
  TrendingUp, Mail, Phone, Clock,
  Ban, X, ExternalLink,
  ShieldAlert, ChevronLeft, Building2,
  CreditCard, Filter, CheckCircle2,
  MapPin, Briefcase, User, Layers,
  ChevronRight, ArrowUpRight
} from "lucide-react";
import { ShooflyLoader } from "@/components/shoofly/loader";

interface Vendor {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  walletBalance: string | number;
  createdAt: string;
  vendorCategories?: { category: { name: string } }[];
}

const FILTER_OPTIONS = [
  { value: "ALL", label: "جميع الموردين" },
  { value: "VERIFIED", label: "موثقين" },
  { value: "ACTIVE", label: "نشطين" },
  { value: "BLOCKED", label: "محظورين" },
];

export default function AdminVendorsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Server-side pagination + filter — replaces the 200-row bulk load.
  const apiFilter = statusFilter !== "ALL" ? statusFilter.toLowerCase() : undefined;
  const { data: result, loading, refresh } = useAsyncData<Vendor[] | { data: Vendor[]; total: number }>(
    () => {
      const params = new URLSearchParams({
        limit: String(itemsPerPage),
        offset: String((page - 1) * itemsPerPage),
      });
      if (apiFilter) params.set("filter", apiFilter);
      if (search.trim()) params.set("search", search.trim());
      return apiFetch<Vendor[] | { data: Vendor[]; total: number }>(`/api/admin/vendors?${params}`, "ADMIN");
    },
    [page, apiFilter, search]
  );

  const vendors: Vendor[] = Array.isArray(result) ? result : (result as any)?.data ?? [];
  const totalItems: number = Array.isArray(result) ? vendors.length : (result as any)?.total ?? vendors.length;

  // Client-side filter fallback
  const paginated = useMemo(() => {
    if (!search.trim() || !Array.isArray(result)) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v =>
      v.fullName.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      (v.phone ?? "").includes(q)
    );
  }, [vendors, search, result]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleAction = async (vendorId: number, action: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await apiFetch(`/api/admin/users/${vendorId}/moderation`, "ADMIN", { 
        method: "PATCH", 
        body: { action } 
      });
      setSuccessMessage(
        action === "verify" ? "تم توثيق المورد بنجاح! 🛡️" :
        action === "unverify" ? "تم إلغاء توثيق المورد. ⚠️" :
        action === "block" ? "تم إيقاف حساب المورد بنجاح. ❌" :
        "تم تفعيل حساب المورد بنجاح. ✅"
      );
      refresh();
      if (selected?.id === vendorId) {
        setSelected(prev => prev ? {
          ...prev,
          isVerified: action === "verify" ? true : action === "unverify" ? false : prev.isVerified,
          isActive: action === "unblock" ? true : action === "block" ? false : prev.isActive
        } : null);
      }
    } catch (e) {
      setErrorMessage("فشل تنفيذ الإجراء، يرجى المحاولة مرة أخرى.");
    }
  };

  if (loading && !vendors) {
    return <ShooflyLoader message="جاري تحميل سجل الموردين..." />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <div className="max-w-[1500px] mx-auto p-6 lg:p-10 space-y-10">
        
        {/* 📋 Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">إدارة <span className="text-primary">الموردين</span></h1>
            <p className="text-sm text-slate-500 font-medium">التحكم في حسابات التجار، مراجعة التوثيقات، ومتابعة المحافظ الموردة.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative group w-full sm:w-[320px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="بحث بالاسم أو البريد..."
                   className="w-full pr-12 pl-4 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
             </div>
             <button 
              onClick={() => refresh()} 
              className="h-11 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
             >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </header>

        {/* 📊 KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SmallStatCard label="إجمالي الموردين" value={vendors?.length ?? 0} icon={Briefcase} color="blue" />
          <SmallStatCard label="المتاجر الموثقة" value={vendors?.filter(v => v.isVerified).length ?? 0} icon={ShieldCheck} color="emerald" />
          <SmallStatCard label="إجمالي السيولة" value={formatCurrency(vendors?.reduce((acc, v) => acc + Number(v.walletBalance), 0) ?? 0)} icon={CreditCard} color="indigo" />
          <SmallStatCard label="طلبات توثيق" value={vendors?.filter(v => !v.isVerified).length ?? 0} icon={Clock} color="amber" />
        </section>

        {/* 🏷️ Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === opt.value
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {opt.label}
              {opt.value !== "ALL" && (
                <span className={`mr-2 px-1.5 py-0.5 rounded text-[10px] ${statusFilter === opt.value ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                  {opt.value === 'ACTIVE' ? vendors?.filter(v => v.isActive).length : 
                   opt.value === 'VERIFIED' ? vendors?.filter(v => v.isVerified).length :
                   vendors?.filter(v => !v.isActive).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* 👥 Vendors Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-[600px]">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">المورد / المتجر</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">الحالة</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">التصنيفات</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-left">المحفظة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map((v) => (
                      <tr 
                        key={v.id} 
                        onClick={() => setSelected(v)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${selected?.id === v.id ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover:bg-white transition-colors">
                              {v.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{v.fullName}</p>
                              <p className="text-[10px] font-medium text-slate-400 font-outfit uppercase tracking-tighter">{v.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                             <StatusBadge status={v.isActive ? "ACTIVE" : "BLOCKED"} />
                             {v.isVerified && <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1"><ShieldCheck size={10} /> موثق</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {v.vendorCategories?.slice(0, 2).map((c, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-bold rounded">
                                {c.category.name}
                              </span>
                            )) || <span className="text-[9px] font-bold text-slate-300">بدون تصنيف</span>}
                            {(v.vendorCategories?.length ?? 0) > 2 && <span className="text-[9px] font-bold text-slate-400">+{v.vendorCategories!.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left font-outfit text-sm font-bold text-slate-900">
                          {formatCurrency(Number(v.walletBalance))}
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-24 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-300">
                            <Store size={48} strokeWidth={1} />
                            <p className="text-sm font-bold text-slate-400">لا توجد سجلات موردين مطابقة</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    مورد {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, totalItems)} من {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:text-primary transition-all shadow-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:text-primary transition-all shadow-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🛡️ Vendor Inspector */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            {selected ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg ring-4 ring-slate-50">
                        {selected.fullName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-900">{selected.fullName}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                           <StatusBadge status={selected.isActive ? "ACTIVE" : "BLOCKED"} />
                           {selected.isVerified && <span className="text-[10px] text-emerald-500 font-bold tracking-tighter"><ShieldCheck size={12} className="inline mr-1" /> موثق</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><X size={20} /></button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-3">
                      <InspectorItem icon={Mail} label="المراسلات الرسمية" value={selected.email} />
                      <InspectorItem icon={Phone} label="هاتف التواصل" value={selected.phone || "غير مسجل"} />
                      <InspectorItem icon={CreditCard} label="رصيد المحفظة" value={formatCurrency(Number(selected.walletBalance))} highlight />
                      <InspectorItem icon={Clock} label="تاريخ الانضمام" value={formatDate(selected.createdAt)} />
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-3">
                      <button 
                        onClick={() => handleAction(selected.id, selected.isVerified ? "unverify" : "verify")}
                        className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${selected.isVerified ? 'bg-white border-slate-200 text-slate-600' : 'bg-primary text-white border-primary shadow-lg shadow-primary/10 hover:bg-primary/90'}`}
                      >
                        {selected.isVerified ? <ShieldAlert size={16} className="text-rose-500" /> : <ShieldCheck size={16} />}
                        {selected.isVerified ? "إلغاء التوثيق" : "توثيق المتجر"}
                      </button>
                      
                      <button 
                        onClick={() => handleAction(selected.id, selected.isActive ? "block" : "unblock")}
                        className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${selected.isActive ? 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50' : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'}`}
                      >
                        {selected.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                        {selected.isActive ? "إيقاف الحساب" : "تفعيل الحساب"}
                      </button>

                      <button className="w-full h-11 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <ExternalLink size={14} /> عرض سجل النشاط
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm ring-1 ring-slate-100">
                    <Store size={32} className="text-slate-200" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-500">معاينة تفاصيل المورد</p>
                    <p className="text-[11px] font-medium text-slate-400">حدد مورداً من القائمة لعرض إحصائياته<br/>وإدارة حالة التوثيق والحظر.</p>
                  </div>
                </div>
              )}
          </div>

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
                <ShieldAlert className="text-rose-500" size={16} />
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

function SmallStatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  };

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900 tracking-tight font-outfit leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    ACTIVE: { label: "نشط", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    BLOCKED: { label: "محظور", cls: "bg-rose-50 text-rose-700 border-rose-100" },
  };

  const c = configs[status] || { label: status, cls: "bg-slate-50 text-slate-500 border-slate-100" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
}

function InspectorItem({ icon: Icon, label, value, highlight }: any) {
  return (
    <div className="flex items-start justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-slate-200 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
          <Icon size={14} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-slate-900'} leading-tight mt-0.5`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
