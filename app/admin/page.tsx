"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  CreditCard,
  Database,
  Eye,
  FileText,
  FileType,
  Layers,
  Map,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  PageHeader,
  StatCard,
  DataTable,
  type DataTableColumn,
  TableCard,
  EmptyState,
  ErrorState,
  PageLoading,
  RequestStatusBadge,
} from "@/components/admin/primitives";
import { AdminActionChip } from "@/components/admin/ui";

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
  const { data: stats, loading, error, refresh } = useAsyncData<DashboardStats>(
    () => apiFetch("/api/admin/stats", "ADMIN"),
    [],
  );

  const nowLabel = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const alerts = useMemo(
    () => [
      { label: "طلبات مراجعة", count: stats?.pendingAiReview ?? 0, href: "/admin/kyc", icon: Eye, color: "amber" as const },
      { label: "بلاغات نزاع", count: stats?.pendingComplaints ?? 0, href: "/admin/complaints", icon: AlertTriangle, color: "rose" as const },
      { label: "طلبات سحب", count: stats?.pendingWithdrawals ?? 0, href: "/admin/withdrawals", icon: CreditCard, color: "blue" as const },
    ],
    [stats],
  );

  const urgentAlerts = alerts.filter((a) => a.count > 0);
  const totalPending = (stats?.pendingAiReview ?? 0) + (stats?.pendingWithdrawals ?? 0) + (stats?.pendingComplaints ?? 0);

  const recentColumns: DataTableColumn<RecentRequest>[] = [
    {
      key: "title",
      header: "الطلب",
      render: (req) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
            <FileText size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px] leading-tight">{req.title}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">#{req.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "client",
      header: "العميل",
      className: "max-w-[140px]",
      render: (req) => (
        <span className="text-sm font-medium text-slate-600 truncate block max-w-[140px]">
          {req.client?.fullName || "مستخدم عام"}
        </span>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      thClassName: "text-center",
      className: "text-center",
      render: (req) => <RequestStatusBadge status={req.status} size="xs" />,
    },
    {
      key: "date",
      header: "التاريخ",
      render: (req) => (
        <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">{formatDate(req.createdAt)}</span>
      ),
    },
    {
      key: "action",
      header: "الإجراء",
      thClassName: "text-center",
      className: "text-center",
      render: (req) => (
        <Link href={`/admin/requests/${req.id}`}>
          <AdminActionChip label="فتح الطلب" tone="primary" />
        </Link>
      ),
    },
  ];

  if (loading && !stats) {
    return <PageLoading label="جاري تحميل لوحة التحكم..." />;
  }

  if (error) {
    return (
      <div className="p-6 lg:p-10 font-cairo text-right" dir="rtl">
        <ErrorState
          message="لم نتمكن من جلب إحصائيات النظام حالياً. يرجى التحقق من اتصال الخادم."
          onRetry={refresh}
          className="bg-white border border-rose-100 rounded-2xl max-w-xl mx-auto mt-12"
        />
      </div>
    );
  }

  const meta = (
    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium flex-wrap">
      <span>{nowLabel}</span>
      <span className="w-1 h-1 rounded-full bg-slate-200" />
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-emerald-600 font-bold">{stats?.onlineAdmins ?? 1}</span>
        <span className="text-slate-400">أدمن نشط</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <div className="max-w-[1500px] mx-auto p-4 lg:p-6 space-y-5">
        <PageHeader
          eyebrow="لوحة التحكم التشغيلية"
          eyebrowTone="emerald"
          title={
            <>
              نظرة عامة على <span className="text-primary">المنصة</span>
            </>
          }
          meta={meta}
        />

        {/* ─── Urgent Alerts Strip ─────────────────────────────── */}
        {urgentAlerts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 shrink-0">
              <Bell size={14} />
              <span>تنبيهات عاجلة</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {urgentAlerts.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <a.icon size={12} />
                  <span>{a.label}</span>
                  <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[8px] font-black">{a.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── Section 1: Platform KPIs ────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="إجمالي التداول"
            value={formatCurrency(stats?.totalGMV ?? 0)}
            icon={CircleDollarSign}
            trend={{ value: "+١٢.٥٪", up: true }}
            badge={{ label: "GMV", tone: "blue" }}
            tone="blue"
            href="/admin/finance"
          />
          <StatCard
            label="أرباح المنصة"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            icon={TrendingUp}
            trend={{ value: "مستقر", up: true }}
            badge={{ label: "صافي", tone: "emerald" }}
            tone="emerald"
            href="/admin/finance"
          />
          <StatCard
            label="بانتظار المراجعة"
            value={stats?.pendingAiReview ?? 0}
            icon={ShieldCheck}
            trend={{ value: stats?.pendingAiReview ? "مطلوب إجراء" : "مستقر", up: !stats?.pendingAiReview }}
            badge={stats?.pendingAiReview ? { label: "عاجل", tone: "amber" } : undefined}
            tone="amber"
            href="/admin/kyc"
          />
          <StatCard
            label="الطلبات النشطة"
            value={stats?.openRequests ?? 0}
            icon={Zap}
            trend={{ value: "مباشر", up: true }}
            badge={{ label: "فوري", tone: "blue" }}
            tone="primary"
            href="/admin/requests"
          />
        </section>

        {/* ─── Section 2: Operations + Pending Actions ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <TableCard
              flush
              title={
                <span className="flex items-center gap-2">
                  <Layers size={16} className="text-slate-400" />
                  أحدث العمليات
                </span>
              }
              titleAction={
                <div className="flex items-center gap-2">
                  {stats?.todayRequests ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {stats.todayRequests} اليوم
                    </span>
                  ) : null}
                  <Link
                    href="/admin/requests"
                    className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                  >
                    عرض الكل <ChevronLeft size={12} />
                  </Link>
                </div>
              }
            >
              <DataTable
                columns={recentColumns}
                rows={stats?.recentRequests?.slice(0, 6) ?? []}
                rowKey={(r) => r.id}
                minWidth={680}
                empty={
                  <EmptyState
                    icon={FileText}
                    title="لا توجد عمليات حديثة"
                    description="عند إنشاء أول طلب ستظهر التفاصيل هنا"
                  />
                }
                mobileCard={(req) => (
                  <Link
                    href={`/admin/requests/${req.id}`}
                    className="block bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-slate-900 truncate flex-1">{req.title}</p>
                      <RequestStatusBadge status={req.status} size="xs" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate">{req.client?.fullName || "مستخدم عام"}</span>
                      <span className="tabular-nums">{formatDate(req.createdAt)}</span>
                    </div>
                  </Link>
                )}
              />
            </TableCard>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <TableCard
              flush
              title={
                <span className="flex items-center gap-2">
                  <Bell size={15} className="text-slate-400" />
                  إجراءات معلقة
                </span>
              }
              titleAction={
                stats && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {totalPending} مهمة
                  </span>
                )
              }
            >
              <div className="p-3 space-y-1.5">
                {alerts.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cnDotColor(a.color)}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-bold text-slate-700 truncate">{a.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">
                        {a.count}
                      </span>
                      <ChevronLeft size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </TableCard>

            <TableCard
              flush
              title={
                <span className="flex items-center gap-2">
                  <Zap size={15} className="text-slate-400" />
                  التحكم السريع
                </span>
              }
            >
              <div className="grid grid-cols-3 gap-2 p-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}
                    >
                      <action.icon size={15} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors text-center leading-tight">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </TableCard>
          </div>
        </div>

        {/* ─── Section 3: System Health ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Network Health */}
          <div className="lg:col-span-5">
            <TableCard
              flush
              title={
                <span className="flex items-center gap-2">
                  <Activity size={15} className="text-slate-400" />
                  حالة الشبكة
                </span>
              }
              titleAction={
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-emerald-600">نشط</span>
                </div>
              }
            >
              <div className="p-5 grid grid-cols-3 gap-4">
                <NetworkStat icon={Users} value={stats?.totalUsers ?? 0} label="عملاء" />
                <NetworkStat icon={Briefcase} value={stats?.totalVendors ?? 0} label="موردين" />
                <NetworkStat icon={Truck} value={stats?.activeDeliveries ?? 0} label="توصيل نشط" />
              </div>
            </TableCard>
          </div>

          {/* Platform Overview Stats */}
          <div className="lg:col-span-4">
            <TableCard
              flush
              title={
                <span className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-slate-400" />
                  مؤشرات المنصة
                </span>
              }
            >
              <div className="p-5 space-y-4">
                <OverviewRow icon={Users} label="إجمالي المستخدمين" value={stats?.totalUsers ?? 0} />
                <OverviewRow icon={Briefcase} label="الموردين النشطين" value={stats?.totalVendors ?? 0} />
                <OverviewRow icon={Truck} label="شحنات قيد التوصيل" value={stats?.activeDeliveries ?? 0} />
                <OverviewRow icon={Zap} label="طلبات اليوم" value={stats?.todayRequests ?? 0} />
              </div>
            </TableCard>
          </div>

          {/* System Status */}
          <div className="lg:col-span-3">
            <TableCard
              flush
              title={
                <span className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-400" />
                  حالة النظام
                </span>
              }
            >
              <div className="p-5 space-y-4">
                <SystemRow icon={Database} label="قاعدة البيانات" />
                <SystemRow icon={FileType} label="خادم الملفات" />
                <SystemRow icon={Map} label="خدمة الخرائط" />
                <SystemRow icon={Wallet} label="بوابة الدفع" />
              </div>
            </TableCard>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components (dashboard-only) ─────────────────────────────────── */

function cnDotColor(color: "amber" | "rose" | "blue" | "slate") {
  const map: Record<string, string> = {
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    blue: "bg-blue-500",
    slate: "bg-slate-400",
  };
  return `w-2 h-2 rounded-full shrink-0 ${map[color] ?? map.slate}`;
}

function NetworkStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
      <p className="text-2xl font-black text-slate-900 font-outfit leading-tight">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function OverviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900 font-outfit">{value}</span>
    </div>
  );
}

function SystemRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500">{label}</span>
      </div>
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <CheckCircle2 size={12} className="hidden" aria-hidden="true" />
        متصل
      </span>
    </div>
  );
}
