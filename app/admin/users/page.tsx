"use client";

import { useState, useMemo, useCallback } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { useDebounce } from "@/lib/hooks/use-performance";
import { apiFetch } from "@/lib/api/client";
import { formatDate, formatCurrency } from "@/lib/formatters";
import {
  Search, RefreshCw, User, Mail, Phone, 
  ShieldCheck, ShieldAlert, Ban, CheckCircle2, 
  X, Filter, MoreVertical, Wallet, Calendar,
  ArrowUpRight, TrendingUp, Users, Shield, 
  ChevronRight, ChevronLeft, AlertCircle, Truck
} from "lucide-react";
import { ShooflyLoader } from "@/components/shoofly/loader";

interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  walletBalance: number | string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    clientRequests: number;
    vendorBids: number;
    assignedDeliveries: number;
    transactions: number;
    complaints: number;
  };
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "جميع الأدوار", icon: Users },
  { value: "CLIENT", label: "عملاء", icon: User },
  { value: "VENDOR", label: "موردين", icon: Shield },
  { value: "DELIVERY", label: "مناديب", icon: Truck },
  { value: "ADMIN", label: "مديرين", icon: ShieldCheck },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [page, setPage] = useState(1);
  
  const debouncedSearch = useDebounce(search, 200);

  const ITEMS_PER_PAGE = 12;

  // Push role filter & pagination server-side — no more 100-row upfront load.
  const apiRole = selectedRole !== "ALL" ? selectedRole : undefined;
  const { data: result, loading, error, refresh } = useAsyncData<UserData[] | { data: UserData[]; total: number }>(
    () => {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String((page - 1) * ITEMS_PER_PAGE),
      });
      if (apiRole) params.set("role", apiRole);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      return apiFetch(`/api/admin/users?${params}`, "ADMIN");
    },
    [page, apiRole, debouncedSearch]
  );

  const users: UserData[] = Array.isArray(result) ? result : (result as any)?.data ?? [];
  const totalItems: number = Array.isArray(result) ? users.length : (result as any)?.total ?? users.length;

  // Client-side text filter fallback (when API doesn't yet support ?search)
  const paginated = useMemo(() => {
    if (!debouncedSearch.trim() || !Array.isArray(result)) return users;
    const q = debouncedSearch.toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      String(u.id).includes(q)
    );
  }, [users, debouncedSearch, result]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (loading && !users) {
    return <ShooflyLoader message="جاري جلب قاعدة بيانات المستخدمين..." />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <div className="max-w-[1500px] mx-auto p-6 lg:p-10 space-y-10">
        
        {/* 📋 Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">إدارة <span className="text-primary">المستخدمين</span></h1>
            <p className="text-sm text-slate-500 font-medium">التحكم الكامل في حسابات العملاء، الموردين، والمناديب.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative group w-full sm:w-[320px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="بحث بالاسم، الإيميل، أو الهاتف..."
                   className="w-full pr-12 pl-4 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
             </div>
             <button 
              onClick={() => refresh()} 
              className="h-11 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95"
             >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </header>

        {/* 📊 KPI Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SmallKpiCard label="إجمالي المستخدمين" value={users?.length ?? 0} icon={Users} color="blue" />
          <SmallKpiCard label="الموردين النشطين" value={users?.filter(u => u.role === 'VENDOR').length ?? 0} icon={Shield} color="emerald" />
          <SmallKpiCard label="حسابات محظورة" value={users?.filter(u => u.isBlocked).length ?? 0} icon={Ban} color="rose" />
          <SmallKpiCard label="في انتظار التوثيق" value={users?.filter(u => !u.isVerified && u.role !== 'CLIENT').length ?? 0} icon={AlertCircle} color="amber" />
        </section>

        {/* 🏷️ Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSelectedRole(opt.value); setPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                selectedRole === opt.value
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              <opt.icon size={14} />
              {opt.label}
              <span className={`mr-1 px-1.5 py-0.5 rounded text-[10px] ${selectedRole === opt.value ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                {opt.value === 'ALL' ? users?.length : users?.filter(u => u.role === opt.value).length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* 👥 Users Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-[600px]">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">المستخدم</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">الدور</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">الحالة</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-left">التوازن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map((user) => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedUser(user)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${selectedUser?.id === user.id ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover:bg-white transition-colors">
                              {user.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
                              <p className="text-[10px] font-medium text-slate-400 font-outfit uppercase tracking-tighter">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center gap-2">
                             {user.isBlocked ? (
                               <StatusIndicator color="rose" label="محظور" />
                             ) : user.isActive ? (
                               <StatusIndicator color="emerald" label="نشط" />
                             ) : (
                               <StatusIndicator color="slate" label="خامل" />
                             )}
                             {user.isVerified && <ShieldCheck size={14} className="text-blue-500" />}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-left font-outfit text-sm font-bold text-slate-900">
                          {formatCurrency(Number(user.walletBalance))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    مستخدم {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalItems)} من {totalItems}
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

          {/* 🛡️ User Inspector */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            {selectedUser ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg ring-4 ring-slate-50">
                        {selectedUser.fullName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-900">{selectedUser.fullName}</h2>
                        <RoleBadge role={selectedUser.role} />
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><X size={20} /></button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-3">
                      <InspectorItem icon={Mail} label="البريد الإلكتروني" value={selectedUser.email} copyable />
                      <InspectorItem icon={Phone} label="رقم الهاتف" value={selectedUser.phone || "غير مسجل"} copyable />
                      <InspectorItem icon={Wallet} label="رصيد المحفظة" value={formatCurrency(Number(selectedUser.walletBalance))} highlight />
                      <InspectorItem icon={Calendar} label="تاريخ الانضمام" value={formatDate(selectedUser.createdAt)} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <StatMiniBox label="طلبات" value={selectedUser._count?.clientRequests ?? 0} />
                      <StatMiniBox label="عروض" value={selectedUser._count?.vendorBids ?? 0} />
                      <StatMiniBox label="معاملات" value={selectedUser._count?.transactions ?? 0} />
                      <StatMiniBox label="بلاغات" value={selectedUser._count?.complaints ?? 0} color="rose" />
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-3">
                      {selectedUser.isBlocked ? (
                        <button 
                          onClick={async () => {
                            await apiFetch(`/api/admin/users/${selectedUser.id}/block`, "ADMIN", { method: 'DELETE' });
                            refresh();
                            setSelectedUser(prev => prev ? {...prev, isBlocked: false} : null);
                          }}
                          className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={16} /> فك الحظر عن الحساب
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            await apiFetch(`/api/admin/users/${selectedUser.id}/block`, "ADMIN", { method: 'POST' });
                            refresh();
                            setSelectedUser(prev => prev ? {...prev, isBlocked: true} : null);
                          }}
                          className="w-full h-12 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold text-sm hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Ban size={16} /> حظر هذا المستخدم
                        </button>
                      )}
                      
                      {!selectedUser.isVerified && selectedUser.role !== 'CLIENT' && (
                        <button 
                          onClick={async () => {
                            await apiFetch(`/api/admin/users/${selectedUser.id}/verify`, "ADMIN", { method: 'POST' });
                            refresh();
                            setSelectedUser(prev => prev ? {...prev, isVerified: true} : null);
                          }}
                          className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck size={16} /> توثيق الحساب يدوياً
                        </button>
                      )}
                      
                      <button className="w-full h-11 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <MoreVertical size={16} /> المزيد من الإجراءات
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm ring-1 ring-slate-100">
                    <User size={32} className="text-slate-200" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-500">معاينة تفاصيل المستخدم</p>
                    <p className="text-[11px] font-medium text-slate-400">حدد مستخدماً من القائمة لعرض إحصائياته<br/>وإدارة صلاحيات الوصول.</p>
                  </div>
                </div>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}

function SmallKpiCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
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

function RoleBadge({ role }: { role: string }) {
  const roles: any = {
    ADMIN: { label: "مدير", cls: "bg-slate-900 text-white" },
    VENDOR: { label: "مورد", cls: "bg-blue-50 text-blue-700 border-blue-100" },
    CLIENT: { label: "عميل", cls: "bg-slate-100 text-slate-600 border-slate-200" },
    DELIVERY: { label: "مندوب", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  };

  const r = roles[role] || { label: role, cls: "bg-slate-50 text-slate-500 border-slate-100" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider ${r.cls}`}>
      {r.label}
    </span>
  );
}

function StatusIndicator({ color, label }: { color: string; label: string }) {
  const colors: any = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    slate: "bg-slate-300",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[color]}`} />
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
    </div>
  );
}

function InspectorItem({ icon: Icon, label, value, highlight, copyable }: any) {
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

function StatMiniBox({ label, value, color }: any) {
  return (
    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-center">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-lg font-black font-outfit ${color === 'rose' ? 'text-rose-500' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
