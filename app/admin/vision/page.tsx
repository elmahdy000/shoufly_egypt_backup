"use client";

import { useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import { 
  Eye, ShieldAlert, Sparkles, AlertTriangle, 
  CheckCircle, XCircle, Search, Filter, Clock,
  MessageSquare, FileText, Zap, ChevronLeft
} from "lucide-react";
import { StatusBadge } from "@/components/admin/primitives";
import { AdminFilterChip } from "@/components/admin/ui";

interface FlaggedContent {
  id: number;
  type: 'REQUEST' | 'BID' | 'MESSAGE' | 'REVIEW';
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  content: string;
  metadata: any;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

export default function AdminVisionPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FlaggedContent['severity'] | 'ALL'>("ALL");
  const [selected, setSelected] = useState<FlaggedContent | null>(null);

  const { data: flaggedItems, loading, refresh, setData } = useAsyncData<FlaggedContent[]>(
    () =>
      apiFetch<{ data: FlaggedContent[]; total: number }>(
        "/api/admin/vision/flagged",
        "ADMIN",
      ).then((res) => res?.data ?? []),
    []
  );

  const filtered = useMemo(() => {
    let list = flaggedItems ?? [];
    if (filter !== "ALL") list = list.filter(item => item.severity === filter);
    if (search.trim()) {
      list = list.filter(item => 
        item.content.toLowerCase().includes(search.toLowerCase()) ||
        item.reason.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [flaggedItems, filter, search]);

  const stats = useMemo(() => {
    const list = flaggedItems ?? [];
    return {
      total: list.length,
      critical: list.filter(i => i.severity === 'CRITICAL').length,
      pending: list.filter(i => i.status === 'PENDING').length,
    };
  }, [flaggedItems]);

  async function handleAction(id: number, action: 'RESOLVED' | 'DISMISSED') {
    try {
      await apiFetch(`/api/admin/vision/flagged/${id}`, "ADMIN", {
        method: 'PATCH',
        body: { status: action }
      });
      setData(prev => (prev ?? []).map(item => item.id === id ? { ...item, status: action } : item));
      setSelected(null);
    } catch (err) {
      console.error("Action failed:", err);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      
      {/* 🚀 Header: AI Monitoring Hub */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40 overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-8 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">نظام المراقبة الذكية AI WATCHTOWER</span>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-r-4 border-primary pr-4">مركز <span className="text-primary">الرؤية</span></h1>
             <p className="text-sm text-slate-500 font-medium max-w-xl">تحليل فوري للمحتوى، رصد المخالفات الآلية، والتدخل البشري السريع.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
             <div className="relative group w-full sm:w-[350px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={18} />
                <input
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="بحث في البلاغات أو المحتوى..."
                   className="w-full pr-12 pl-4 h-11 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-primary outline-none transition-all"
                />
             </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-8 space-y-8">
        
        {/* 📊 KPI Strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VisionStat label="إجمالي البلاغات" val={stats.total} icon={Eye} color="text-slate-600 bg-slate-100" />
          <VisionStat label="حالات حرجة" val={stats.critical} icon={ShieldAlert} color="text-rose-600 bg-rose-50" />
          <VisionStat label="بانتظار القرار" val={stats.pending} icon={Clock} color="text-amber-600 bg-amber-50" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* 📋 Flagged Content Feed */}
           <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 mb-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  { key: 'ALL', label: 'الكل' },
                  { key: 'CRITICAL', label: 'حرجة جداً' },
                  { key: 'HIGH', label: 'HIGH' },
                  { key: 'MEDIUM', label: 'MEDIUM' },
                  { key: 'LOW', label: 'LOW' },
                ].map((s) => (
                  <AdminFilterChip
                    key={s.key}
                    label={s.label}
                    active={filter === s.key}
                    tone={s.key === 'CRITICAL' ? 'rose' : s.key === 'HIGH' ? 'amber' : 'primary'}
                    onClick={() => setFilter(s.key as any)}
                  />
                ))}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl space-y-4">
                  <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">النظام آمن تماماً</h3>
                  <p className="text-sm text-slate-400">لا توجد بلاغات معلقة حالياً من قبل الذكاء الاصطناعي.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={`p-6 rounded-2xl border transition-all cursor-pointer group bg-white hover:shadow-xl hover:-translate-y-0.5 ${selected?.id === item.id ? 'border-primary ring-2 ring-primary/10' : 'border-slate-100'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${item.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                            {item.type === 'MESSAGE' ? <MessageSquare size={22} /> : item.type === 'REQUEST' ? <FileText size={22} /> : <Zap size={22} />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${item.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                {item.severity}
                              </span>
                              <span className="text-[10px] font-bold text-slate-300">•</span>
                              <span className="text-[10px] font-bold text-slate-400">{formatDate(item.createdAt)}</span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 line-clamp-1">{item.reason}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 opacity-80">{item.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            tone={item.status === "PENDING" ? "amber" : item.status === "RESOLVED" ? "emerald" : "slate"}
                            label={item.status === "PENDING" ? "معلق" : item.status === "RESOLVED" ? "تم الحل" : "تم التجاهل"}
                            dot
                            size="xs"
                          />
                          <ChevronLeft size={16} className="text-slate-300 group-hover:text-primary transition-all" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           {/* 🛡️ Decision Side Panel */}
              {selected ? (
                <aside
                  className="lg:col-span-4 bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl sticky top-28 space-y-8 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Sparkles size={20} /></div>
                      <h2 className="text-lg font-black text-slate-900">قرار الإدارة</h2>
                    </div>
                    <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><XCircle size={20} className="text-slate-400" /></button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحليل الذكاء الاصطناعي</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                          <AlertTriangle size={16} /> انتهاك محتمل للسياسات
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{selected.reason}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">محتوى البلاغ</p>
                      <div className="p-4 bg-white border border-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed font-medium">
                        {selected.content}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleAction(selected.id, 'RESOLVED')}
                        className="h-12 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <XCircle size={16} /> حظر/حذف
                      </button>
                      <button 
                        onClick={() => handleAction(selected.id, 'DISMISSED')}
                        className="h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <CheckCircle size={16} /> تجاهل الخطأ
                      </button>
                    </div>
                  </div>
                </aside>
              ) : (
                <div className="lg:col-span-4 h-[500px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-4">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Eye size={32} />
                   </div>
                   <p className="text-sm font-medium">اختر بلاغاً لبدء المراجعة والقرار</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

function VisionStat({ label, val, icon: Icon, color }: any) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-3xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all group">
       <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-105 transition-transform`}>
          <Icon size={26} />
       </div>
       <div className="space-y-0.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{label}</p>
          <p className="text-3xl font-black text-slate-900 leading-none mt-1.5">{val}</p>
       </div>
    </div>
  );
}


