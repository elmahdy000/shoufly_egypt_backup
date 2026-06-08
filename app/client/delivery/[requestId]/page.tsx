"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/shoofly/button";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shoofly/status-badge";
import { confirmClientDelivery, listClientDeliveryTimeline } from "@/lib/api/delivery";
import { formatDate } from "@/lib/formatters";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { ApiDeliveryTimeline } from "@/lib/types/api";
import { FiMap, FiTruck, FiCheckCircle, FiClock, FiMaximize } from "react-icons/fi";

function DeliveryPageContent({ requestId }: { requestId: number }) {
  const router = useRouter();
  const { data, loading, error } = useAsyncData<ApiDeliveryTimeline>(() => listClientDeliveryTimeline(requestId), [requestId]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  async function confirmDelivery() {
    if (!data?.qrCode) {
      setFeedback({ type: 'error', text: "لا يوجد كود تأكيد لهذا الطلب" });
      return;
    }
    try {
      setIsConfirming(true);
      setFeedback(null);
      await confirmClientDelivery(requestId, data.qrCode);
      setFeedback({ type: 'success', text: "تم تأكيد استلام الخدمة وإغلاق الطلب بنجاح!" });
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = setTimeout(() => router.push(`/client/requests/${requestId}`), 3000);
    } catch (err) {
      setFeedback({ type: 'error', text: `${err instanceof Error ? err.message : "حدث خطأ أثناء التأكيد"}` });
    } finally {
      setIsConfirming(false);
    }
  }

  const timeline = [...(data?.timeline ?? [])].reverse();
  const latestItem = timeline[0];
  const isDelivered = latestItem?.status === 'DELIVERED';

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 pb-32 text-right">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FiMap className="text-primary" /> تتبع المندوب
          </h1>
          <p className="text-muted text-sm mt-1">تتبع التحديثات المرسلة من المندوب خطوة بخطوة للطلب رقم #{requestId}.</p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {feedback.type === 'success' ? <FiCheckCircle size={18} /> : <FiClock size={18} className="text-rose-500" />}
          {feedback.text}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted animate-pulse">
           <FiTruck size={40} className="mb-4 opacity-30" />
           <p className="font-bold">جاري فتح قنوات الاتصال بالمندوب...</p>
        </div>
      )}

      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && timeline.length === 0 ? (
        <div className="shoofly-card bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center border border-dashed border-slate-200">
           <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mb-4">
             <FiTruck size={24} />
           </div>
           <h3 className="text-xl font-bold mb-2">في انتظار تحديد مندوب</h3>
           <p className="text-muted">لم يبدأ المندوب بتسجيل أي تحركات على هذا الطلب بعد.</p>
        </div>
      ) : null}

      {!loading && !error && timeline.length > 0 && (
        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Main Timeline Board */}
          <div className="md:col-span-2 space-y-6">
            <div className="shoofly-card bg-white p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-2 h-full bg-slate-50" />
               <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                 <FiMap className="text-primary" /> سجل التحركات (Timeline)
               </h3>
               
               <div className="space-y-8 relative z-10">
                 {timeline.map((item: { id: number; status: string; createdAt: string; note?: string | null }, index: number) => {
                   const isFirst = index === 0;
                   return (
                     <div key={item.id} className={`flex items-start gap-4 ${isFirst ? 'opacity-100' : 'opacity-60'}`}>
                       {/* Timeline Node */}
                       <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold outline outline-4 outline-white ${isFirst ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-200 text-slate-500'}`}>
                         {isFirst ? <FiTruck size={16} /> : <FiClock size={16} />}
                       </div>
                       
                       {/* Content */}
                       <div className={`flex-1 pb-8 ${isFirst ? '' : 'border-r-2 border-slate-100 pr-4'}`} style={{ marginRight: isFirst ? '0' : '-22px' }}>
                         <div className={`${isFirst ? 'bg-slate-50 p-4 rounded-2xl border border-slate-100' : ''}`}>
                           <div className="flex items-center justify-between mb-2">
                             <StatusBadge status={item.status === 'DELIVERED' ? 'completed' : 'active'} label={item.status.toLowerCase().replace(/_/g, ' ')} />
                             <span className="text-[10px] uppercase font-bold text-muted font-jakarta">{formatDate(item.createdAt)}</span>
                           </div>
                           {item.note && (
                             <p className={`text-sm ${isFirst ? 'text-slate-800 font-medium' : 'text-slate-500'} mt-1 leading-relaxed`}>
                               {item.note}
                             </p>
                           )}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="space-y-4">
             <div className="shoofly-card bg-primary text-white p-6 shadow-xl shadow-primary/20 text-center">
                <FiMaximize size={32} className="mx-auto mb-4 opacity-80" />
                <h3 className="text-lg font-bold mb-2">تأكيد الاستلام الرقمي</h3>
                <p className="text-xs text-primary-100 mb-6 leading-relaxed">
                  عند وصول المندوب للحالة النهائية وتسلمك للخدمة، يرجى تأكيد العملية لإصدار الفاتورة وتصفية المستحقات للتاجر.
                </p>
                <Button 
                  variant="secondary"
                  onClick={confirmDelivery}
                  isLoading={isConfirming}
                  disabled={isDelivered}
                  className="w-full font-bold text-primary"
                >
                  {isDelivered ? 'تم تأكيد الاستلام مسبقاً' : 'اضغط لتأكيد الاستلام'}
                </Button>
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default function DeliveryPage() {
  const params = useParams<{ requestId: string }>();
  const parsed = Number(params.requestId);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return <ErrorState message="معرف الطلب غير صحيح." />;
  }

  return <DeliveryPageContent requestId={parsed} />;
}
