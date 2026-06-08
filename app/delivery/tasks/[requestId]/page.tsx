"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/shoofly/button";
import { ErrorState } from "@/components/shared/error-state";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import {
  completeDeliveryTask,
  failDeliveryTask,
} from "@/lib/api/delivery-agent";
import { apiFetch } from "@/lib/api/client";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import {
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  Package,
  Clock,
  AlertCircle
} from "lucide-react";

interface TaskDetailData {
  id: number;
  title: string;
  address: string;
  deliveryPhone: string;
  status: string;
  category?: { name: string };
  deliveryTracking?: Array<{ status: string; createdAt: string }>;
}

function TaskDetail({ requestId }: { requestId: number }) {
  const router = useRouter();
  const { data, loading, error, refresh } = useAsyncData(
    () => apiFetch<TaskDetailData>(`/api/delivery/tasks/${requestId}`, "DELIVERY"),
    [requestId],
  );

  useEffect(() => {
    // Shared SSE — refresh on any event for this specific request
    const REFRESH_ON = new Set([
      "ORDER_STATUS_CHANGED",
      "DELIVERY_ASSIGNED",
      "DELIVERY_PICKED_UP",
      "DELIVERY_DELIVERED",
    ]);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type !== "notification" || !payload.data) return;
      const inner = payload.data as { type?: string; requestId?: number };
      if (inner.requestId === requestId) {
        refresh();
        return;
      }
      if (inner.type && REFRESH_ON.has(inner.type)) refresh();
    });
    return unsubscribe;
  }, [requestId, refresh]);
  const [message, setMessage] = useState<string | null>(null);
  const [failReason, setFailReason] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Stored redirect timers so we can clear them on unmount or on a
  // second action (avoids leaving the buttons disabled after unmount,
  // and avoids double-redirects).
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const task = data;

  async function handleComplete() {
    if (!qrCode) {
      setQrError(true);
      setMessage("يرجى إدخال كود التحقق من شاشة العميل أولاً");
      return;
    }

    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    setIsCompleting(true);
    setQrError(false);
    try {
      await completeDeliveryTask(requestId, qrCode);
      setMessage("تم تأكيد التسليم بنجاح");
      redirectTimerRef.current = setTimeout(() => {
        router.push("/delivery");
      }, 1500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "فشلنا في تأكيد التسليم");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleFail() {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    setIsFailing(true);
    try {
      await failDeliveryTask(requestId, failReason || undefined);
      setMessage("سجلنا المشكلة بنجاح");
      redirectTimerRef.current = setTimeout(() => {
        router.push("/delivery");
      }, 1500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "فشل تسجيل المشكلة");
    } finally {
      setIsFailing(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center text-slate-500">
        <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold">بيحمل بيانات الأوردر...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ErrorState message={error} />
    </div>
  );
  
  if (!task) return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ErrorState message="الأوردر ده مش موجود أو مش معاك" />
    </div>
  );

  const lastStatus = task.deliveryTracking?.[0]?.status ?? "OUT_FOR_DELIVERY";
  const statusLabel = lastStatus === "OUT_FOR_DELIVERY" ? "في السكة" : "بيتجهز";
  const statusColor = lastStatus === "OUT_FOR_DELIVERY" ? "primary" : "amber";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-10 font-sans dir-rtl text-right">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/delivery/tasks" 
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all border border-slate-100 shadow-sm"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{task.title}</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">أوردر رقم #{task.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Status Banner */}
        <div className={`p-5 rounded-2xl border ${
          statusColor === "primary" 
            ? 'bg-primary/5 border-primary/20' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
              statusColor === "primary" ? 'bg-white text-primary' : 'bg-white text-amber-600'
            }`}>
              <Truck size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">حالة الأوردر</p>
              <p className={`text-base font-bold ${
                statusColor === "primary" ? 'text-primary' : 'text-amber-700'
              }`}>{statusLabel}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold shadow-sm ${
            message.includes('نجاح') 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.includes('نجاح') ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message}
            </div>
          </div>
        )}

        {/* Delivery Info Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package size={20} className="text-slate-400" /> تفاصيل التوصيل
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">العنوان بالتفصيل</p>
                <p className="text-sm font-medium text-slate-900 leading-relaxed">{task.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">رقم تليفون العميل</p>
                <p className="text-base font-bold text-slate-900" dir="ltr">{task.deliveryPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-500" /> المطلوب تعمله
          </h2>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border-2 transition-all ${qrError ? 'border-rose-400 bg-rose-50' : 'border-slate-100 bg-slate-50 focus-within:border-emerald-400 focus-within:bg-white'}`}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">كود الاستلام (موجود على موبايل العميل)</label>
              <input 
                value={qrCode}
                onChange={(e) => {
                  setQrCode(e.target.value);
                  if (qrError) setQrError(false);
                }}
                placeholder="أدخل الـ 6 أرقام هنا..."
                className="w-full bg-transparent border-none outline-none text-xl font-black text-slate-900 placeholder:text-slate-300 text-center tracking-[1em]"
                maxLength={6}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleComplete} 
            className="w-full gap-2 h-14 rounded-2xl text-lg bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 font-black transition-all active:scale-95"
            isLoading={isCompleting}
          >
            <CheckCircle size={22} /> 
            {isCompleting ? 'جاري التأكيد...' : 'تأكيد التسليم النهائي'}
          </Button>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={18} className="text-rose-500" />
              <p className="text-base font-bold text-slate-900">حصلت مشكلة؟ (اختياري)</p>
            </div>
            <input
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="مثلاً: العميل مابيردش، العنوان غلط..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-rose-400 focus:bg-white transition-colors mb-4"
            />
            <Button 
              variant="danger" 
              onClick={handleFail} 
              className="w-full gap-2 h-12 rounded-xl text-base font-bold"
              isLoading={isFailing}
            >
              <XCircle size={20} /> 
              {isFailing ? 'بنسجل...' : 'واجهت مشكلة في التوصيل'}
            </Button>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 border border-amber-200/50">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 mb-1">نصيحة في السريع</p>
              <p className="text-xs font-medium text-amber-700/80 leading-relaxed">
                كلم العميل قبل ما توصل عشان تتأكد إن العنوان صح، ولو ماردش استنى 10 دقايق قبل ما تسجل إن فيه مشكلة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryTaskDetailPage() {
  const params = useParams<{ requestId: string }>();
  const parsed = Number(params.requestId);
  if (!Number.isFinite(parsed) || parsed <= 0)
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <ErrorState message="رقم الأوردر مش صح" />
      </div>
    );
  return <TaskDetail requestId={parsed} />;
}
