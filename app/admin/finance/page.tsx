"use client";

import { useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Download,
  FileText,
  History,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AdminFilterChip } from "@/components/admin/ui";
import {
  PageHeader,
  StatCard,
  DataTable,
  type DataTableColumn,
  TableCard,
  EmptyState,
  PageLoading,
  Pagination,
  SearchInput,
  StatusBadge,
  DetailPanel,
  TX_TYPE_META,
} from "@/components/admin/primitives";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

const IN_TYPES = ["ESCROW_DEPOSIT", "WALLET_TOPUP", "ADMIN_COMMISSION"];

const TX_TYPE_OPTIONS = [
  { value: "ALL", label: "جميع العمليات" },
  { value: "INCOME", label: "وارد" },
  { value: "EXPENSE", label: "صادر" },
] as const;

export default function AdminFinancePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const { data: transactions, loading } = useAsyncData<Transaction[]>(
    () => apiFetch("/api/admin/finance/transactions?limit=200&days=0", "ADMIN"),
    [],
  );

  const stats = useMemo(() => {
    const list = transactions ?? [];
    const totalIn = list.filter((t) => IN_TYPES.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = list.filter((t) => !IN_TYPES.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    return { income: totalIn, expense: totalOut, net: totalIn - totalOut };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let list = transactions ?? [];
    if (typeFilter === "INCOME") list = list.filter((tx) => IN_TYPES.includes(tx.type));
    else if (typeFilter === "EXPENSE") list = list.filter((tx) => !IN_TYPES.includes(tx.type));
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        String(tx.id).includes(q),
    );
  }, [transactions, typeFilter, search]);

  const hasActiveFilters = typeFilter !== "ALL" || search.trim().length > 0;

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, page]);

  const columns: DataTableColumn<Transaction>[] = useMemo(
    () => [
      {
        key: "type",
        header: "نوع العملية",
        render: (tx) => {
          const isIn = IN_TYPES.includes(tx.type);
          const meta = TX_TYPE_META[tx.type] ?? { label: tx.type, tone: "slate" as const };
          return (
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  isIn
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-rose-100 text-rose-700 border-rose-200"
                }`}
              >
                {isIn ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
              <StatusBadge tone={meta.tone} label={meta.label} size="xs" />
            </div>
          );
        },
      },
      {
        key: "date",
        header: "التاريخ",
        render: (tx) => (
          <span className="text-xs font-bold text-slate-400 font-jakarta whitespace-nowrap">
            {formatDate(tx.createdAt)}
          </span>
        ),
      },
      {
        key: "description",
        header: "الوصف",
        render: (tx) => (
          <span className="text-sm font-bold text-slate-900 max-w-[180px] truncate block">
            {tx.description}
          </span>
        ),
      },
      {
        key: "amount",
        header: "القيمة",
        thClassName: "text-left",
        className: "text-left",
        render: (tx) => {
          const isIn = IN_TYPES.includes(tx.type);
          return (
            <span
              className={`text-lg font-bold font-jakarta tracking-tight ${
                isIn ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isIn ? "+" : "-"}
              {formatCurrency(tx.amount)}
            </span>
          );
        },
      },
    ],
    [],
  );

  if (loading && !transactions) {
    return <PageLoading label="جاري تحميل المعاملات..." />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="نظام التدقيق المالي v3.4"
        eyebrowTone="emerald"
        title={
          <>
            الخزانة <span className="text-emerald-600">المركزية</span>
          </>
        }
        subtitle="رقابة شاملة على التدفقات النقدية، إدارة الميزانية، وتدقيق العمليات المالية."
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="بحث في قيود العمليات..."
              className="sm:w-[350px]"
              ariaLabel="بحث في المعاملات"
            />
            <button
              disabled
              title="قريباً"
              className="h-11 px-6 rounded-lg bg-white border border-slate-200 text-slate-400 font-bold cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Download size={18} /> استخراج تقارير
            </button>
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* Balance Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="صافي المحفظة"
            value={formatCurrency(stats.net).split(".")[0]}
            icon={Wallet}
            tone="blue"
            badge={stats.net < 0 ? { label: "سلبي", tone: "rose" } : undefined}
          />
          <StatCard
            label="إجمالي الإيرادات"
            value={formatCurrency(stats.income).split(".")[0]}
            icon={TrendingUp}
            tone="emerald"
            badge={{ label: "داخل", tone: "emerald" }}
          />
          <StatCard
            label="إجمالي المصروفات"
            value={formatCurrency(stats.expense).split(".")[0]}
            icon={TrendingDown}
            tone="rose"
            badge={{ label: "خارج", tone: "rose" }}
          />
        </section>

        {/* Type Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {TX_TYPE_OPTIONS.map((opt) => (
            <AdminFilterChip
              key={opt.value}
              label={opt.label}
              active={typeFilter === opt.value}
              tone={opt.value === "INCOME" ? "emerald" : opt.value === "EXPENSE" ? "rose" : "primary"}
              onClick={() => { setTypeFilter(opt.value); setPage(1); }}
            />
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => { setTypeFilter("ALL"); setSearch(""); setPage(1); }}
              className="inline-flex items-center gap-1 h-9 px-3 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent transition-colors"
            >
              <RotateCcw size={12} /> إعادة ضبط
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ledger Entries */}
          <div className="lg:col-span-8 space-y-3">
            <TableCard
              flush
              title={
                <span className="flex items-center gap-2">
                  <History size={20} />
                  سجل المعاملات
                </span>
              }
              description={filteredTransactions.length > 0 ? `${filteredTransactions.length} عملية` : "Audit Trail Active"}
            >
              <DataTable
                columns={columns}
                rows={paginatedTransactions}
                rowKey={(tx) => tx.id}
                minWidth={800}
                loading={loading}
                onRowClick={(tx) => setSelected(tx)}
                mobileCard={(tx) => {
                  const isIn = IN_TYPES.includes(tx.type);
                  const meta = TX_TYPE_META[tx.type] ?? { label: tx.type, tone: "slate" as const };
                  return (
                    <button
                      type="button"
                      onClick={() => setSelected(tx)}
                      className={`w-full text-right bg-white border rounded-xl p-3 transition-colors ${
                        selected?.id === tx.id
                          ? "border-emerald-300 bg-emerald-50/30"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <StatusBadge tone={meta.tone} label={meta.label} size="xs" />
                          <span className="text-[10px] text-slate-400 font-jakarta whitespace-nowrap">
                            {formatDate(tx.createdAt)}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-bold font-jakarta ${
                            isIn ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isIn ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{tx.description}</p>
                    </button>
                  );
                }}
                empty={
                  <EmptyState
                    icon={CreditCard}
                    title="لا توجد حركات مالية مسجلة"
                    description="عند إتمام أول معاملة ستظهر التفاصيل هنا"
                  />
                }
              />

              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={filteredTransactions.length}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </TableCard>
          </div>

          {/* Audit Inspector */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
            {selected ? (
              <DetailPanel
                title={`القيد المالي #TX_${selected.id}`}
                subtitle={
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                      IN_TYPES.includes(selected.type) ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {IN_TYPES.includes(selected.type) ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {IN_TYPES.includes(selected.type) ? "تحويل وارد" : "تحويل صادر"}
                  </span>
                }
                onClose={() => setSelected(null)}
                fields={[
                  {
                    label: "قيمة العملية",
                    value: (
                      <span className={`text-lg font-black ${IN_TYPES.includes(selected.type) ? "text-emerald-600" : "text-rose-600"}`}>
                        {IN_TYPES.includes(selected.type) ? "+" : "-"}
                        {formatCurrency(selected.amount)}
                      </span>
                    ),
                    icon: CreditCard,
                    highlight: true,
                    fullWidth: true,
                  },
                  { label: "تاريخ التنفيذ", value: formatDate(selected.createdAt), icon: Calendar },
                  { label: "وصف القيد", value: selected.description, icon: FileText },
                  { label: "حالة التدقيق", value: "عملية موثقة", icon: ShieldCheck },
                ]}
                actions={
                  <button
                    disabled
                    title="قريباً"
                    className="w-full h-11 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> استخراج الفاتورة
                  </button>
                }
              />
            ) : (
              <DetailPanel
                title="اختر عملية"
                subtitle="حدد عملية من القائمة لعرض تفاصيل التدقيق"
                onClose={() => {}}
                fields={[]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// FDetailBox replaced by DetailPanel from primitives
