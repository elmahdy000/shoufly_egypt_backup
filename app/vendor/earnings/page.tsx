"use client";

import { useMemo, useState, useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { TransactionSkeleton } from "@/components/shoofly/skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { listVendorTransactions, requestVendorWithdrawal } from "@/lib/api/transactions";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import {
  FiArrowUpRight,
  FiArrowDownLeft,
  FiClock,
  FiDownload,
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
} from "react-icons/fi";

export default function VendorEarningsPage() {
  const { data, loading, error, refresh } = useAsyncData(() => listVendorTransactions(), []);

  useEffect(() => {
    // Shared SSE — refresh on any financial event
    const REFRESH_ON = new Set([
      "PAYMENT_RECEIVED",
      "PAYMENT_FAILED",
      "VENDOR_PAYOUT",
      "WITHDRAWAL",
      "REFUND_TO_VENDOR",
    ]);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type !== "notification") return;
      const innerType = (payload.data as { type?: string } | null)?.type;
      if (innerType && REFRESH_ON.has(innerType)) refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawInput, setWithdrawInput] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const summary = useMemo(() => {
    const rows = data ?? [];
    const payout = rows
      .filter((r: any) => r.type === "VENDOR_PAYOUT" || r.type === "REFUND_TO_VENDOR")
      .reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);
    const withdrawals = rows
      .filter((r: any) => r.type === "WITHDRAWAL")
      .reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);

    return {
      totalEarned: payout,
      available: payout - withdrawals,
      totalWithdrawn: withdrawals,
    };
  }, [data]);

  const handleWithdrawal = async () => {
    const amount = Number(withdrawInput);
    if (isNaN(amount) || amount <= 0 || amount > summary.available) {
      setMessage({ text: "الرجاء إدخال مبلغ صحيح وضمن حدود رصيدك المتاح", type: "error" });
      return;
    }
    try {
      setIsProcessing(true);
      await requestVendorWithdrawal(amount);
      setMessage({ text: `تم تقديم طلب سحب بقيمة ${formatCurrency(amount)} بنجاح`, type: "success" });
      setWithdrawInput("");
      setIsWithdrawOpen(false);
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "حدث خطأ أثناء معالجة السحب",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="font-sans text-right" dir="rtl">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 space-y-4">

        {/* Page title */}
        <div>
          <h1 className="text-lg font-bold text-slate-900">الأرباح</h1>
          <p className="text-sm text-slate-500">نظرة شاملة على دخلك ومعاملاتك</p>
        </div>

        {/* Feedback message */}
        {message && (
          <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            {message.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {loading && <TransactionSkeleton />}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">جاري معالجة السحب...</p>
          </div>
        )}

        {error && <ErrorState message={error} />}

        {!(loading || isProcessing) && !error && (
          <>
            {/* Balance Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <FiShield size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">الرصيد المتاح للسحب</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      {formatCurrency(summary.available)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWithdrawOpen(!isWithdrawOpen)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary"
                >
                  <FiArrowUpRight size={15} />
                  {isWithdrawOpen ? "إلغاء" : "سحب"}
                </button>
              </div>

              {isWithdrawOpen && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    المبلغ (الحد الأقصى: {formatCurrency(summary.available)})
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 relative rounded-xl border-2 border-slate-200 bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all overflow-hidden flex items-stretch">
                      <div className="flex items-center justify-center bg-slate-50 border-r-2 border-slate-100 px-4 font-bold text-sm text-slate-400 shrink-0">
                        ج.م
                      </div>
                      <input
                        type="number"
                        value={withdrawInput}
                        onChange={(e) => setWithdrawInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent px-4 py-3 outline-none text-xl font-black text-slate-900 tracking-tighter placeholder:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        dir="ltr"
                      />
                    </div>
                    <button
                      onClick={handleWithdrawal}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 font-bold rounded-xl transition-colors text-sm"
                    >
                      تأكيد
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 mx-auto mb-2">
                  <FiTrendingUp size={17} />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-1">إجمالي الأرباح</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalEarned)}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 mx-auto mb-2">
                  <FiArrowUpRight size={17} />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-1">إجمالي المسحوبات</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalWithdrawn)}</p>
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">سجل المعاملات</h3>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1 cursor-not-allowed select-none">
                  <FiDownload size={12} /> تصدير (قريباً)
                </span>
              </div>

              {!data || data.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <FiDollarSign size={22} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">لا توجد معاملات</h3>
                  <p className="text-xs text-slate-500">ستظهر أرباحك هنا بعد إتمام أول عرض</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {(data ?? []).map((tx: any) => {
                    const isEarned = tx.type === "VENDOR_PAYOUT" || tx.type === "REFUND_TO_VENDOR";
                    const Icon = isEarned ? FiArrowDownLeft : FiArrowUpRight;

                    const txArabicMap: Record<string, string> = {
                      VENDOR_PAYOUT: "أرباح مستلمة",
                      REFUND_TO_VENDOR: "فلوس راجعة",
                      WITHDRAWAL: "سحب للمحفظة",
                    };
                    const txLabel = txArabicMap[tx.type] || "حركة مالية";

                    return (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isEarned ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{txLabel}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                        <p className={`font-bold text-sm ${isEarned ? "text-emerald-600" : "text-rose-600"}`}>
                          {isEarned ? "+" : "-"}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
