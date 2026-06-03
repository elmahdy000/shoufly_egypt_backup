"use client";

import Link from "next/link";
import { useMemo } from "react";
import { 
  AlertCircle, ArrowLeft, BarChart3, Briefcase, 
  CircleDollarSign, Clock3, Eye, FileText, 
  Package, Settings, Sparkles, Truck, Users,
  TrendingUp, ShieldCheck, Zap, Layers,
  ChevronLeft, ArrowUpRight, TrendingDown
} from "lucide-react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { ShooflyLoader } from "@/components/shoofly/loader";

interface RecentRequest {
  id: number;
  title: string;
  createdAt: string;
  status: string;
  client?: { fullName?: string | null } | null;
}

interface DashboardStats {
  totalUsers: number;
  openRequests: number;
  totalVendors: number;
  todayRequests: number;
  totalGMV: number;
  totalRevenue: number;
  pendingAiReview: number;
  pendingWithdrawals: number;
  pendingComplaints: number;
  activeDeliveries: number;
  totalAdmins: number;
  onlineAdmins: number;
  recentRequests: RecentRequest[];
  dailyTrends: { date: string; count: number }[];
}

const quickActions = [
  { label: "إدارة الطلبات", href: "/admin/requests", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "المستخدمين", href: "/admin/users", icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "الموردين", href: "/admin/vendors", icon: Briefcase, color: "text-primary", bg: "bg-primary/5" },
  { label: "الشؤون المالية", href: "/admin/finance", icon: CircleDollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "سجل الأحداث", href: "/admin/audit-logs", icon: Layers, color: "text-slate-600", bg: "bg-slate-100" },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings, color: "text-slate-500", bg: "bg-slate-100" },
];

export default function AdminDashboard() {
  const { data: stats, loading, error } = useAsyncData<DashboardStats>(
    () => apiFetch("/api/admin/stats", "ADMIN"), 
    []
  );

  const nowLabel = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  if (loading && !stats) {
    return <ShooflyLoader message="جاري تحميل مؤشرات الأداء..." />;
  }

  if (error) {
    return (
      <div className="p-6 lg:p-10 font-cairo text-right" dir="rtl">
        <div className="p-12 bg-white border border-rose-100 rounded-2xl max-w-xl mx-auto mt-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">حدث خطأ في الاتصال</h2>
          <p className="mt-2 text-slate-500 text-sm">لم نتمكن من جلب إحصائيات النظام حالياً. يرجى التحقق من اتصال الخادم.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2.5 bg-rose-500 text-white text-sm font-bold rounded-lg hover:bg-rose-600 transition-all active:scale-95"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
        
        {/* 🏛 Operational Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">لوحة التحكم التشغيلية — الإصدار ٤.٠</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">نظرة عامة على <span className="text-primary">المنصة</span></h1>
            <p className="text-sm text-slate-500 font-medium">متابعة دقيقة لمؤشرات الأداء، حركات التداول، والنشاط اللوجستي الفوري.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end px-4 border-r border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">التوقيت الحالي</p>
              <p className="text-sm font-bold text-slate-700">{nowLabel}</p>
            </div>
            <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الأدمن النشطين</p>
                <p className="text-base font-bold text-slate-900">{stats?.onlineAdmins ?? 1}</p>
              </div>
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <Users size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* 📊 KPI Dashboard - Calm & Clear */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            label="إجمالي التداول (GMV)" 
            value={formatCurrency(stats?.totalGMV ?? 0)} 
            icon={CircleDollarSign} 
            trend="+١٢.٥٪" 
            trendUp={true} 
            color="blue"
          />
          <KpiCard 
            label="صافي أرباح المنصة" 
            value={formatCurrency(stats?.totalRevenue ?? 0)} 
            icon={TrendingUp} 
            trend="مستقر" 
            trendUp={true} 
            color="emerald"
          />
          <KpiCard 
            label="طلبات المراجعة" 
            value={stats?.pendingAiReview ?? 0} 
            icon={ShieldCheck} 
            trend={stats?.pendingAiReview ? "مطلوب إجراء" : "مستقر"} 
            trendUp={false} 
            color="amber"
          />
          <KpiCard 
            label="الطلبات النشطة" 
            value={stats?.openRequests ?? 0} 
            icon={Zap} 
            trend="مباشر" 
            trendUp={true} 
            color="primary"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* 📋 Central Ledger / Recent Activity */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Layers size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">أحدث العمليات</h2>
              </div>
              <Link href="/admin/requests" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                عرض كل الطلبات <ChevronLeft size={14} />
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">توصيف العملية</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">العميل</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">الحالة</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-left">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats?.recentRequests?.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 line-clamp-1">{req.title}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID: #{req.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {req.client?.fullName || "مستخدم عام"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusPill status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-left text-xs font-medium text-slate-400 tabular-nums">
                          {formatDate(req.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!stats?.recentRequests?.length && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <FileText size={32} />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">لا توجد عمليات حديثة مسجلة حالياً</p>
                </div>
              )}
            </div>
          </div>

          {/* 🛠 Command Center Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Actions Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">التحكم السريع</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-primary transition-colors">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">إجراءات معلقة</h3>
              <div className="space-y-3">
                <AlertItem 
                  label="طلبات السحب المعلقة" 
                  count={stats?.pendingWithdrawals ?? 0} 
                  href="/admin/withdrawals" 
                  color="emerald"
                />
                <AlertItem 
                  label="بلاغات النزاع النشطة" 
                  count={stats?.pendingComplaints ?? 0} 
                  href="/admin/complaints" 
                  color="amber"
                />
                <AlertItem 
                  label="مراجعة الحسابات (KYC)" 
                  count={stats?.pendingAiReview ?? 0} 
                  href="/admin/kyc" 
                  color="blue"
                />
              </div>
            </div>

            {/* Network Health */}
            <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-lg font-bold">حالة الشبكة</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Integrity</p>
                </div>
                <div className="space-y-4">
                  <StatLine label="إجمالي العملاء" value={stats?.totalUsers ?? 0} />
                  <StatLine label="إجمالي الموردين" value={stats?.totalVendors ?? 0} />
                  <StatLine label="شحنات قيد التوصيل" value={stats?.activeDeliveries ?? 0} />
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">النظام يعمل بكفاءة كاملة</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, trend, trendUp, color }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    primary: "text-primary bg-primary/5 border-primary/10",
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[color] || colorMap.primary}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 ${trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight font-outfit">{value}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: any = {
    PENDING_ADMIN_REVISION: { label: "قيد المراجعة", color: "bg-amber-50 text-amber-700 border-amber-100" },
    OPEN_FOR_BIDDING: { label: "مفتوح للمزايدة", color: "bg-blue-50 text-blue-700 border-blue-100" },
    BIDS_RECEIVED: { label: "عروض مستلمة", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    OFFERS_FORWARDED: { label: "تم التوجيه", color: "bg-sky-50 text-sky-700 border-sky-100" },
    ORDER_PAID_PENDING_DELIVERY: { label: "قيد التوصيل", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    CLOSED_SUCCESS: { label: "مكتمل بنجاح", color: "bg-slate-50 text-slate-600 border-slate-200" },
    CLOSED_CANCELLED: { label: "ملغي", color: "bg-rose-50 text-rose-700 border-rose-100" },
    REJECTED: { label: "مرفوض إدارياً", color: "bg-rose-50 text-rose-700 border-rose-100" },
  };

  const c = config[status] || { label: status, color: "bg-slate-50 text-slate-500 border-slate-100" };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold border ${c.color}`}>
      {c.label}
    </span>
  );
}

function AlertItem({ label, count, href, color }: any) {
  const colors: any = {
    emerald: "group-hover:bg-emerald-500 group-hover:text-white",
    amber: "group-hover:bg-amber-500 group-hover:text-white",
    blue: "group-hover:bg-blue-500 group-hover:text-white",
  };

  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <span className={`min-w-[24px] h-6 px-1.5 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-500 transition-all ${colors[color]}`}>
        {count}
      </span>
    </Link>
  );
}

function StatLine({ label, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-lg font-bold text-white font-outfit">{value}</span>
    </div>
  );
}
