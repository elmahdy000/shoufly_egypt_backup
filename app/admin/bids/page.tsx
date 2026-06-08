"use client";

import Link from "next/link";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { listPendingAdminRequests } from "@/lib/api/requests";
import {
  Package, ChevronLeft, Activity, AlertCircle, Box, RefreshCw
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  type DataTableColumn,
  TableCard,
  EmptyState,
  PageLoading,
  StatusBadge,
} from "@/components/admin/primitives";
import { AdminButton, AdminIconButton } from "@/components/admin/ui";

interface Request {
  id: number;
  title: string;
  status: string;
  _count?: { bids: number };
}

const STATUS_META: Record<string, { label: string; tone: "emerald" | "amber" | "slate" }> = {
  OPEN: { label: "سوق مفتوح", tone: "emerald" },
  PENDING: { label: "قيد المراجعة", tone: "amber" },
};

export default function AdminBidsPage() {
  const { data, loading, refresh } = useAsyncData<Request[]>(() => listPendingAdminRequests(), []);

  const columns: DataTableColumn<Request>[] = [
    {
      key: "request",
      header: "الطلب النشط / المعرف",
      render: (req) => (
        <Link href={`/admin/requests/${req.id}`} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
            <Package size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate max-w-[220px]">{req.title}</p>
            <span className="text-[10px] font-bold text-slate-400">REQ_ID: {req.id}</span>
          </div>
        </Link>
      ),
    },
    {
      key: "bids",
      header: "كثافة العروض",
      thClassName: "text-center",
      className: "text-center",
      render: (req) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-sm">
          {req._count?.bids || 0} عرض
        </span>
      ),
    },
    {
      key: "status",
      header: "حالة السوق",
      thClassName: "text-center",
      className: "text-center",
      render: (req) => {
        const meta = STATUS_META[req.status] ?? { label: req.status, tone: "slate" as const };
        return <StatusBadge tone={meta.tone} label={meta.label} dot size="xs" />;
      },
    },
    {
      key: "action",
      header: "الإدارة",
      thClassName: "text-left",
      className: "text-left",
      render: (req) => (
        <Link
          href={`/admin/requests/${req.id}`}
          className="inline-flex items-center gap-2 h-9 px-4 bg-white text-slate-500 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-95"
        >
          إدارة الطلب <ChevronLeft size={14} />
        </Link>
      ),
    },
  ];

  if (loading && !data) {
    return (
      <>
        <PageHeader
          eyebrow="مراقبة العروض النشطة"
          eyebrowTone="emerald"
          title={<>تحليل <span className="text-primary">العروض</span></>}
          subtitle="متابعة حركة عروض الموردين على الطلبات المفتوحة في الميدان."
        />
        <PageLoading label="جاري تحميل العروض..." />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="مراقبة العروض النشطة"
        eyebrowTone="emerald"
        title={<>تحليل <span className="text-primary">العروض</span></>}
        subtitle="متابعة حركة عروض الموردين على الطلبات المفتوحة في الميدان."
        actions={
          <AdminIconButton
            icon={RefreshCw}
            variant="soft"
            size="md"
            label="تحديث"
            onClick={() => refresh()}
            isLoading={loading}
          />
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* Info Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
            هذه الصفحة توفر نظرة بانورامية على حركة العروض للطلبات الجارية. لاعتماد عرض معين أو مراجعة الشروط، يرجى الانتقال لتفاصيل الطلب.
          </p>
        </div>

        <TableCard flush>
          <DataTable
            columns={columns}
            rows={data ?? []}
            rowKey={(r) => r.id}
            minWidth={750}
            loading={loading}
            mobileCard={(req) => (
              <Link
                href={`/admin/requests/${req.id}`}
                className="block bg-white border border-slate-200 rounded-xl p-3 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <Box size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{req.title}</p>
                      <span className="text-[10px] font-bold text-slate-400">REQ_ID: {req.id}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                    {req._count?.bids || 0} عرض
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <StatusBadge
                    tone={(STATUS_META[req.status] ?? { tone: "slate" }).tone as "slate" | "emerald" | "amber"}
                    label={(STATUS_META[req.status] ?? { label: req.status }).label}
                    dot
                    size="xs"
                  />
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    إدارة <ChevronLeft size={10} />
                  </span>
                </div>
              </Link>
            )}
            empty={
              <EmptyState
                icon={Package}
                title="لا توجد عروض قيد الانتظار حالياً"
                description="عند تقديم الموردين عروضاً على الطلبات ستظهر هنا"
              />
            }
          />
        </TableCard>
      </div>
    </div>
  );
}


