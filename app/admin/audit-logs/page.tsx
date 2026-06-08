"use client";

import { useState, useMemo } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import type { AuditAction } from "@/lib/services/admin/audit-log";
import {
  Search, RefreshCw, Shield, User, Package, Settings,
  CheckCircle, XCircle, ArrowLeftRight, CreditCard,
  ChevronLeft, ChevronRight, FileText, Clock, Scale
} from "lucide-react";

interface AuditLog {
  id: number;
  adminId: number;
  action: AuditAction;
  targetType: 'USER' | 'REQUEST' | 'BID' | 'WITHDRAWAL' | 'SETTINGS';
  targetId?: number;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  admin?: { fullName?: string | null; email?: string };
}

const ACTION_OPTIONS: { value: AuditAction | 'ALL'; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'ALL', label: 'جميع الأحداث', icon: <Shield size={14} />, color: 'bg-slate-100 text-slate-700' },
  { value: 'REQUEST_APPROVED', label: 'موافقة طلب', icon: <CheckCircle size={14} />, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'REQUEST_REJECTED', label: 'رفض طلب', icon: <XCircle size={14} />, color: 'bg-rose-100 text-rose-700' },
  { value: 'REQUEST_CANCELLED', label: 'إلغاء طلب', icon: <XCircle size={14} />, color: 'bg-rose-100 text-rose-700' },
  { value: 'REQUEST_DISPATCHED', label: 'تسليم طلب', icon: <ArrowLeftRight size={14} />, color: 'bg-blue-100 text-blue-700' },
  { value: 'OFFER_FORWARDED', label: 'توجيه عرض', icon: <ArrowLeftRight size={14} />, color: 'bg-sky-100 text-sky-700' },
  { value: 'USER_BLOCKED', label: 'حظر مستخدم', icon: <XCircle size={14} />, color: 'bg-rose-100 text-rose-700' },
  { value: 'USER_UNBLOCKED', label: 'فك حظر', icon: <CheckCircle size={14} />, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'USER_VERIFIED', label: 'توثيق حساب', icon: <Shield size={14} />, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'WITHDRAWAL_APPROVED', label: 'موافقة سحب', icon: <CreditCard size={14} />, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'WITHDRAWAL_REJECTED', label: 'رفض سحب', icon: <CreditCard size={14} />, color: 'bg-rose-100 text-rose-700' },
  { value: 'REFUND_ISSUED', label: 'استرداد مبلغ', icon: <CreditCard size={14} />, color: 'bg-amber-100 text-amber-700' },
  { value: 'DISPUTE_RESOLVED', label: 'حل نزاع', icon: <Scale size={14} />, color: 'bg-violet-100 text-violet-700' },
  { value: 'SETTINGS_UPDATED', label: 'تحديث إعدادات', icon: <Settings size={14} />, color: 'bg-slate-100 text-slate-700' },
];

const ITEMS_PER_PAGE = 20;

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, refresh } = useAsyncData<{ logs: AuditLog[]; total: number }>(
    () => {
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("offset", String((page - 1) * ITEMS_PER_PAGE));
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (search.trim()) params.set("search", search.trim());
      return apiFetch(
        `/api/admin/audit-logs?${params.toString()}`,
        "ADMIN",
      );
    },
    [page, actionFilter, search]
  );

  const filteredLogs = useMemo(() => {
    let logs = data?.logs ?? [];
    if (actionFilter !== 'ALL') {
      logs = logs.filter(l => l.action === actionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        l.admin?.fullName?.toLowerCase().includes(q) ||
        l.admin?.email?.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        String(l.targetId).includes(q)
      );
    }
    return logs;
  }, [data, actionFilter, search]);

  const totalPages = Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE);

  const getActionConfig = (action: AuditAction) =>
    ACTION_OPTIONS.find(a => a.value === action) || ACTION_OPTIONS[0];

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'USER': return <User size={14} />;
      case 'REQUEST': return <Package size={14} />;
      case 'SETTINGS': return <Settings size={14} />;
      case 'WITHDRAWAL': return <CreditCard size={14} />;
      default: return <FileText size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">سجل المراجعة</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">سجل <span className="text-primary">الأحداث</span></h1>
              <p className="text-sm text-slate-500 font-medium">تتبع جميع الإجراءات الإدارية على المنصة</p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => refresh()} className="p-3 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-primary hover:border-primary transition-all">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في السجل..."
                className="w-full pr-12 pl-4 h-11 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
              {ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActionFilter(opt.value as AuditAction | 'ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    actionFilter === opt.value
                      ? opt.color + " ring-2 ring-offset-1 ring-primary/30"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-primary/50"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">الحدث</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">الهدف</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">الأدمن</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="h-16 bg-slate-50/50" />
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={40} className="opacity-30" />
                        <p>لا توجد أحداث مسجلة</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const actionConfig = getActionConfig(log.action);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-lg ${actionConfig.color}`}>
                              {actionConfig.icon}
                            </span>
                            <span className="font-bold text-sm text-slate-800">
                              {actionConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-slate-400">{getTargetIcon(log.targetType)}</span>
                            <span className="font-mono text-sm">#{log.targetId}</span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                              {log.targetType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                              {log.admin?.fullName?.[0] || 'A'}
                            </div>
                            <div className="text-sm">
                              <p className="font-medium text-slate-800">{log.admin?.fullName || 'Admin'}</p>
                              <p className="text-xs text-slate-400">{log.admin?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Clock size={14} />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                الصفحة {page} من {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-primary disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-primary disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'إجمالي الأحداث المسجلة', value: data?.total || 0, icon: FileText, color: 'bg-blue-50 text-blue-600' },
            { label: 'المعروض بالصفحة الحالية', value: filteredLogs.length, icon: Package, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'إجمالي الصفحات', value: totalPages, icon: User, color: 'bg-amber-50 text-amber-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
