"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiArrowRight,
  FiDollarSign,
  FiClock
} from "react-icons/fi";

type PaymentStatus = "loading" | "success" | "failed" | "pending";

const STATUS_CONFIG: Record<PaymentStatus, { icon: React.ReactNode; color: string; bgColor: string; title: string }> = {
  loading: {
    icon: <FiRefreshCw className="animate-spin" size={48} />,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    title: "جاري التحقق من الدفع...",
  },
  success: {
    icon: <FiCheckCircle size={48} />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    title: "تم الدفع بنجاح!",
  },
  failed: {
    icon: <FiAlertCircle size={48} />,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
    title: "فشل الدفع",
  },
  pending: {
    icon: <FiClock size={48} />,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    title: "في انتظار التأكيد",
  },
};

const MAX_POLL_RETRIES = 5;

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const retryCountRef = useRef(0);

  useEffect(() => {
    const txnId = searchParams.get("txnId");
    const success = searchParams.get("success");
    const amountParam = searchParams.get("amount");

    if (amountParam) {
      setAmount(Number(amountParam));
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const verifyPayment = async () => {
      if (cancelled) return;
      if (!txnId) {
        setStatus("failed");
        setMessage("معرف المعاملة غير موجود");
        return;
      }

      if (success === "true") {
        setStatus("success");
        setMessage("تم إضافة الرصيد إلى محفظتك بنجاح!");
        return;
      }

      if (success === "false") {
        setStatus("failed");
        setMessage("فشلت عملية الدفع. يرجى المحاولة مرة أخرى.");
        return;
      }

      try {
        const result = await apiFetch(`/api/client/wallet/verify/${txnId}`, "CLIENT") as { success: boolean; balance?: number; message?: string };
        if (cancelled) return;
        if (result.success) {
          setStatus("success");
          setMessage("تم إضافة الرصيد إلى محفظتك بنجاح!");
          if (result.balance !== undefined) {
            setAmount(result.balance);
          }
        } else {
          setStatus("pending");
          setMessage(result.message || "جاري التحقق من حالة الدفع...");
          // Bound retries so we don't poll forever if the provider never confirms.
          if (retryCountRef.current < MAX_POLL_RETRIES) {
            retryCountRef.current += 1;
            pollTimer = setTimeout(verifyPayment, 3000);
          } else {
            setStatus("failed");
            setMessage("استغرق التحقق وقتاً طويلاً. حاول تحديث الصفحة أو التواصل مع الدعم.");
          }
        }
      } catch (error) {
        if (cancelled) return;
        setStatus("failed");
        setMessage(error instanceof Error ? error.message : "فشلت عملية التحقق");
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [searchParams]);

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.loading;
  const title = config.title;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Status Icon */}
        <div className={`w-20 h-20 rounded-full ${config.bgColor} ${config.color} flex items-center justify-center mx-auto mb-6`}>
          {config.icon}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {title}
        </h1>

        {/* Message */}
        <p className="text-slate-600 mb-6">
          {message}
        </p>

        {/* Amount (if available) */}
        {status === "success" && amount > 0 && (
          <div className="bg-emerald-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-emerald-700">
              <FiDollarSign size={20} />
              <span className="text-lg font-bold">{amount.toFixed(2)} ج.م</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">تمت الإضافة إلى محفظتك</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {status === "success" && (
            <Link
              href="/client/wallet"
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            >
              <FiArrowRight size={18} />
              الذهاب للمحفظة
            </Link>
          )}

          {status === "failed" && (
            <Link
              href="/client/wallet"
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              المحاولة مرة أخرى
            </Link>
          )}

          {status === "pending" && (
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
            >
              <FiRefreshCw size={18} />
              تحديث الصفحة
            </button>
          )}

          <Link
            href="/client"
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}