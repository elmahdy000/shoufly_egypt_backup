"use client";

import { useState, useMemo } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import {
  ShieldAlert, Shield, Search, X, MessageSquare, AlertCircle, CheckCircle, ArrowUpRight
} from "lucide-react";

import { ShooflyLoader } from "@/components/shoofly/loader";

interface Complaint {
  id: number;
  ticketNumber: string;
  reporterName: string;
  reporterRole: string;
  accusedName?: string;
  accusedRole?: string;
  type: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description: string;
  createdAt: string;
}

export default function AdminComplaintsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: complaints, loading, refresh } = useAsyncData<Complaint[]>(
    () => apiFetch("/api/admin/complaints", "ADMIN"),
    []
  );

  const filteredComplaints = useMemo(() => {
    let list = complaints || [];
    
    if (statusFilter === "OPEN") {
      list = list.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS");
    } else if (statusFilter === "RESOLVED") {
      list = list.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.ticketNumber.toLowerCase().includes(q) ||
          c.reporterName.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [complaints, search, statusFilter]);

  const stats = useMemo(() => {
    const list = complaints || [];
    return {
      total: list.length,
      open: list.filter((c) => c.status === "OPEN").length,
      resolved: list.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
    };
  }, [complaints]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await apiFetch(`/api/admin/complaints/${id}`, "ADMIN", {
        method: "PATCH",
        body: { status: newStatus },
      });
      setSuccessMessage(
        newStatus === "RESOLVED" ? "تم حل النزاع وإغلاق التذكرة بنجاح! ✅" :
        newStatus === "IN_PROGRESS" ? "تم تحويل حالة النزاع إلى قيد المراجعة. ⚠️" :
        "تم إعادة فتح النزاع بنجاح. 🔄"
      );
      refresh();
      if (selected?.id === id) {
        setSelected((prev) => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("حدث خطأ أثناء تحديث حالة النزاع.");
    }
  };

  if (loading && !complaints) {
    return <ShooflyLoader message="جاري جلب سجل النزاعات..." />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <div className="max-w-[1500px] mx-auto p-6 lg:p-10 space-y-10">
        
        {/* 📋 Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">إدارة <span className="text-rose-500">النزاعات</span></h1>
            <p className="text-sm text-slate-500 font-medium">متابعة وحل الشكاوى والنزاعات بين العملاء والموردين لضمان جودة المنصة.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative group w-full sm:w-72">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                <input
                   type="text"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="بحث برقم التذكرة أو الاسم..."
                   className="w-full pr-12 pl-4 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all shadow-sm"
                />
             </div>
             <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                {[
                  { id: "ALL", label: "الكل" },
                  { id: "OPEN", label: "مفتوح" },
                  { id: "RESOLVED", label: "مغلق" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === tab.id
                        ? "bg-white text-rose-600 border border-slate-200 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>
          </div>
        </header>

        {/* 📊 KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي النزاعات</p>
                 <p className="text-2xl font-black text-slate-900 font-outfit leading-none">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                 <Shield size={24} />
              </div>
           </div>
           <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">نزاعات مفتوحة</p>
                 <p className="text-2xl font-black text-rose-600 font-outfit leading-none">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-500">
                 <AlertCircle size={24} />
              </div>
           </div>
           <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">نزاعات محلولة</p>
                 <p className="text-2xl font-black text-emerald-600 font-outfit leading-none">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-500">
                 <CheckCircle size={24} />
              </div>
           </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
           
           {/* 📋 Complaints List */}
           <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
              <div className="overflow-x-auto">
                 <table className="w-full text-right border-collapse min-w-[800px]">
                    <thead>
                       <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">التذكرة</th>
                          <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">المُبلغ</th>
                          <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">المُدعى عليه</th>
                          <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">النوع</th>
                          <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">الحالة</th>
                          <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider">التاريخ</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredComplaints.length === 0 ? (
                          <tr>
                             <td colSpan={6} className="py-20 text-center">
                                <ShieldAlert size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-500 font-bold">لا توجد نزاعات مسجلة حالياً</p>
                             </td>
                          </tr>
                       ) : (
                          filteredComplaints.map((complaint) => (
                             <tr 
                                key={complaint.id}
                                onClick={() => setSelected(complaint)}
                                className={`group cursor-pointer transition-colors ${selected?.id === complaint.id ? "bg-rose-50/50" : "hover:bg-slate-50"}`}
                             >
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${selected?.id === complaint.id ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-500"}`}>
                                         <MessageSquare size={18} />
                                      </div>
                                      <span className="font-outfit font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                                         {complaint.ticketNumber}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <p className="text-sm font-bold text-slate-900">{complaint.reporterName}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase">{complaint.reporterRole}</p>
                                </td>
                                <td className="px-8 py-5">
                                   <p className="text-sm font-bold text-slate-900">{complaint.accusedName || "—"}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase">{complaint.accusedRole || "—"}</p>
                                </td>
                                <td className="px-8 py-5">
                                   <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                                      {complaint.type}
                                   </span>
                                </td>
                                <td className="px-8 py-5">
                                   <StatusBadge status={complaint.status} />
                                </td>
                                <td className="px-8 py-5 text-xs text-slate-500 font-bold tabular-nums">
                                   {formatDate(complaint.createdAt)}
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* 🛡️ Inspector Panel */}
           
             {selected && (
               <aside
                 className="xl:w-[450px] w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm sticky top-28 flex flex-col overflow-hidden"
               >
                 <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                          <ShieldAlert size={24} />
                       </div>
                       <div>
                          <h2 className="text-lg font-black text-slate-900">تفاصيل النزاع</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selected.ticketNumber}</p>
                       </div>
                    </div>
                    <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="flex-1 space-y-6">
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نوع النزاع</span>
                          <StatusBadge status={selected.status} />
                       </div>
                       <p className="text-sm font-bold text-slate-900 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          {selected.type}
                       </p>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تفاصيل الشكوى</p>
                       <div className="p-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 leading-relaxed shadow-sm">
                          {selected.description}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">المُبلغ</p>
                          <p className="text-sm font-black text-slate-900 mb-1">{selected.reporterName}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">{selected.reporterRole}</span>
                       </div>
                       <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">المُدعى عليه</p>
                          <p className="text-sm font-black text-slate-900 mb-1">{selected.accusedName || "—"}</p>
                          {selected.accusedRole && (
                             <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">{selected.accusedRole}</span>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
                    {selected.status === "OPEN" || selected.status === "IN_PROGRESS" ? (
                       <>
                          <button 
                             onClick={() => handleUpdateStatus(selected.id, "RESOLVED")}
                             className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                             <CheckCircle size={16} /> حل النزاع
                          </button>
                          <button 
                             onClick={() => handleUpdateStatus(selected.id, "IN_PROGRESS")}
                             className="h-12 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                             <ArrowUpRight size={16} /> قيد المراجعة
                          </button>
                       </>
                    ) : (
                       <button 
                          onClick={() => handleUpdateStatus(selected.id, "OPEN")}
                          className="col-span-2 h-12 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                       >
                          <AlertCircle size={16} /> إعادة فتح النزاع
                       </button>
                    )}
                 </div>
               </aside>
             )}
           
        </div>
      </div>

      {/* 🔔 Toast Notifications */}
      {(successMessage || errorMessage) && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in font-bold text-xs pointer-events-auto">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={16} />
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

function StatusBadge({ status }: { status: string }) {
  let badgeClass = "";
  let label = status;

  switch (status) {
    case "OPEN":
      badgeClass = "bg-rose-100 text-rose-700 border border-rose-200";
      label = "مفتوح";
      break;
    case "IN_PROGRESS":
      badgeClass = "bg-amber-100 text-amber-700 border border-amber-200";
      label = "قيد المراجعة";
      break;
    case "RESOLVED":
    case "CLOSED":
      badgeClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
      label = "محلول";
      break;
    default:
      badgeClass = "bg-slate-100 text-slate-600 border border-slate-200";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${badgeClass}`}>
      {label}
    </span>
  );
}
