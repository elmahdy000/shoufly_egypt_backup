import { getCurrentUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { IconPlus, IconPackage, IconInbox, IconSearch } from "@tabler/icons-react";
import { RequestRow } from "@/components/requests/RequestRow";
import { RequestCard } from "@/components/requests/request-card";
import { FiltersBar } from "@/components/requests/FiltersBar";
import { Pagination } from "@/components/requests/Pagination";
import { RequestSummaryCards } from "@/components/requests/request-summary-cards";

export const metadata = {
  title: "طلباتي | شوفلي",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; status?: string; search?: string };
}) {
  const user = await getCurrentUserFromCookie();
  if (!user || user.role !== "CLIENT") {
    return (
      <div className="p-10 text-center font-bold text-slate-700">
        غير مصرح لك بدخول هذه الصفحة
      </div>
    );
  }

  const params = await Promise.resolve(searchParams);

  const page = parseInt(params.page || "1") || 1;
  const limit = parseInt(params.limit || "10") || 10;
  const status = params.status || "ALL";
  const search = params.search || "";
  const skip = (page - 1) * limit;

  // Build Query
  const baseWhere: any = { clientId: user.id };
  if (status !== "ALL") baseWhere.status = status;
  if (search) {
    // If purely numeric, search by id; otherwise by title/address
    const idCandidate = parseInt(search);
    if (!isNaN(idCandidate) && String(idCandidate) === search.trim()) {
      baseWhere.OR = [{ id: idCandidate }];
    } else {
      baseWhere.OR = [
        { title: { contains: search } },
        { address: { contains: search } },
      ];
    }
  }

  // Summary counts ignore the search box (group/status filter still applies only as a baseline).
  // The summary is the user's "big picture" — counts by status across ALL of their requests.
  const summaryWhere: any = { clientId: user.id };

  const [total, requests, openCount, inProgressCount, completedCount] = await Promise.all([
    prisma.request.count({ where: baseWhere }),
    prisma.request.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        title: true,
        status: true,
        address: true,
        createdAt: true,
      },
    }),
    prisma.request.count({
      where: { ...summaryWhere, status: "OPEN_FOR_BIDDING" },
    }),
    prisma.request.count({
      where: { ...summaryWhere, status: "ORDER_PAID_PENDING_DELIVERY" },
    }),
    prisma.request.count({
      where: { ...summaryWhere, status: "CLOSED_SUCCESS" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = status !== "ALL" || search.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <IconPackage size={20} stroke={1.7} />
            </span>
            <h1 className="text-heading-1">طلباتي</h1>
          </div>
          <p className="text-body-soft">
            {hasActiveFilters
              ? `${total.toLocaleString("ar-EG")} نتيجة مطابقة للبحث`
              : `إجمالي ${total.toLocaleString("ar-EG")} طلب في حسابك`}
          </p>
        </div>
        <Link
          href="/client/requests/new"
          className="sf-btn-primary self-start sm:self-auto"
        >
          <IconPlus size={18} stroke={2} />
          <span>طلب جديد</span>
        </Link>
      </div>

      {/* Summary */}
      <RequestSummaryCards
        total={openCount + inProgressCount + completedCount}
        open={openCount}
        inProgress={inProgressCount}
        completed={completedCount}
      />

      {/* Filters */}
      <FiltersBar initialSearch={search} initialStatus={status} />

      {/* Requests — mobile cards (sm:hidden) */}
      {requests.length > 0 ? (
        <>
          <div className="grid gap-3 sm:hidden">
            {requests.map((req) => (
              <RequestCard key={`m-${req.id}`} request={req} />
            ))}
          </div>

          {/* Requests — desktop table (hidden below sm) */}
          <div className="surface-card hidden min-h-[400px] overflow-hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 lg:px-6">تفاصيل الطلب</th>
                    <th className="whitespace-nowrap px-5 py-4 lg:px-6">الحالة</th>
                    <th className="min-w-[160px] px-5 py-4 lg:px-6">العنوان والتاريخ</th>
                    <th className="w-16 px-5 py-4 text-center lg:px-6">—</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <RequestRow key={`d-${req.id}`} request={req} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="surface-card">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
              {hasActiveFilters ? (
                <IconSearch size={28} stroke={1.6} />
              ) : (
                <IconInbox size={28} stroke={1.6} />
              )}
            </div>
            <h3 className="text-section-title mb-2 text-slate-900">
              {hasActiveFilters ? "مفيش نتائج مطابقة" : "لسه ما عملتش أي طلب"}
            </h3>
            <p className="text-body-soft mb-6 max-w-sm">
              {hasActiveFilters
                ? "جرب تغيير الفلاتر أو كلمة البحث."
                : "ابدأ بإنشاء أول طلب ليك دلوقتي وهيوصل لأحسن الموردين في منطقتك."}
            </p>
            {!hasActiveFilters && (
              <Link href="/client/requests/new" className="sf-btn-primary">
                <IconPlus size={18} stroke={2} />
                <span>طلب جديد</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
