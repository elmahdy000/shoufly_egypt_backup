"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/shoofly/button";
import { ErrorState } from "@/components/shared/error-state";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency } from "@/lib/formatters";
import { 
  FiPackage, 
  FiMapPin, 
  FiPhone, 
  FiCheckCircle, 
  FiClock, 
  FiArrowLeft, 
  FiUser, 
  FiMessageSquare,
  FiArrowUpRight,
  FiLoader
} from "react-icons/fi";

export default function VendorOrderDetailsPage() {
  const params = useParams<{ bidId: string }>();
  const bidId = parseInt(params.bidId);

  const { data: bid, loading, error, refresh } = useAsyncData(
    () => apiFetch<any>(`/api/vendor/bids/${bidId}`, "VENDOR"),
    [bidId]
  );

  const [updating, setUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function updateStatus(status: string) {
    setUpdating(true);
    setActionMsg(null);
    try {
      await apiFetch(`/api/vendor/bids/${bidId}/status`, "VENDOR", {
        method: "PATCH",
        body: { status }
      });
      setActionMsg({ text: "تم تحديث الحالة بنجاح", ok: true });
      refresh();
    } catch (err) {
      setActionMsg({ text: err instanceof Error ? err.message : "فشل تحديث الحالة", ok: false });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="flex flex-col items-center text-[#767684]">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">جاري تحميل التفاصيل...</p>
      </div>
    </div>
  );
  
  if (error || !bid) return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <ErrorState message={error || "لم يتم العثور على هذا العرض"} />
    </div>
  );

  const isAccepted = bid.status === 'ACCEPTED_BY_CLIENT';
  const request = bid.request;
  
  const currentStatus = request.deliveryTracking?.[0]?.status ?? 'ACCEPTED_BY_CLIENT';
  const statusLabel = 
    currentStatus === 'VENDOR_PREPARING' ? 'جاري التحضير' :
    currentStatus === 'READY_FOR_PICKUP' ? 'جاهز للاستلام' :
    'أوردر نشط';

  return (
    <div className="font-sans dir-rtl text-right">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 space-y-4">
        {actionMsg && (
          <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            actionMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}>
            {actionMsg.ok ? <FiCheckCircle size={15} /> : null}
            {actionMsg.text}
          </div>
        )}
        {/* Status Banner */}
        <div className={`p-3 rounded-lg border ${
          currentStatus === 'READY_FOR_PICKUP' 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              currentStatus === 'READY_FOR_PICKUP' 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'bg-amber-100 text-amber-600'
            }`}>
              <FiPackage size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F1111]">الحالة</p>
              <p className={`text-xs font-medium ${
                currentStatus === 'READY_FOR_PICKUP' ? 'text-emerald-700' : 'text-amber-700'
              }`}>{statusLabel}</p>
            </div>
          </div>
        </div>

        {/* Price Card */}
        <div className="bg-white rounded-xl border border-[#E7E7E7] shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FiArrowUpRight size={16} />
            </div>
            <div>
              <p className="text-[10px] text-[#565959] font-medium">المستحقات</p>
              <p className="text-xl font-bold text-[#0F1111]">
                {formatCurrency(bid.netPrice).split(' ')[0]}
                <span className="text-sm font-medium text-[#767684] mr-1">ج.م</span>
              </p>
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
             في المحفظة
          </p>
        </div>

        {/* Action Buttons */}
        {isAccepted && (
          <div className="bg-white rounded-xl border border-[#E7E7E7] shadow-sm p-5 space-y-2">
            <h2 className="font-semibold text-[#0F1111] flex items-center gap-2 mb-2 text-xs">
              <FiCheckCircle size={14} className="text-primary" /> تحديث الحالة
            </h2>
            <Button 
              onClick={() => updateStatus('VENDOR_PREPARING')}
              disabled={updating}
              variant="soft"
              className="w-full"
              isLoading={updating && currentStatus !== 'VENDOR_PREPARING'}
            >
              أنا بجهز الأوردر دلوقتي
            </Button>
            <Button 
              onClick={() => updateStatus('READY_FOR_PICKUP')}
              disabled={updating}
              variant="success"
              className="w-full"
              isLoading={updating && currentStatus === 'VENDOR_PREPARING'}
            >
              الأوردر خلاص جاهز
            </Button>
            
            <Link href="/vendor/chat" className="block">
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 font-bold">
                <FiMessageSquare size={16} className="text-primary" /> تواصل مع الدعم الفني
              </Button>
            </Link>

            <p className="text-xs text-[#767684] text-center">
              سيتم إخطار العميل فوراً بأي تغيير في حالة الطلب
            </p>
          </div>
        )}

        {/* Bid Images - Show if exists */}
        {bid.images && bid.images.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E7E7E7] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E7E7E7]">
              <h2 className="font-semibold text-[#0F1111] text-sm flex items-center gap-2">
                <FiPackage size={16} className="text-[#565959]" /> صور المنتجات
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {bid.images.map((img: any, index: number) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-[#E7E7E7]">
                    <img 
                      src={img.filePath} 
                      alt={img.fileName || `Product ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Request Details */}
        <div className="bg-white rounded-2xl border border-[#E7E7E7] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E7E7E7]">
            <h2 className="font-semibold text-[#0F1111] text-sm flex items-center gap-2">
              <FiPackage size={16} className="text-[#565959]" /> تفاصيل الطلب
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs text-[#565959] font-medium mb-1">وصف المشكلة</p>
              <p className="text-sm text-[#0F1111] bg-slate-50 p-4 rounded-xl">
                {request.description}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <FiMapPin size={16} />
              </div>
              <div>
                <p className="text-xs text-[#565959] font-medium mb-0.5">العنوان</p>
                <p className="text-sm font-semibold text-[#0F1111]">{request.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <FiUser size={16} />
              </div>
              <div>
                <p className="text-xs text-[#565959] font-medium mb-0.5">العميل</p>
                <p className="text-sm font-semibold text-[#0F1111]">عميل #{request.clientId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-slate-50 rounded-lg p-3 border border-[#E7E7E7]">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <FiClock size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F1111] mb-0.5">خطوات إتمام الصفقة</p>
              <p className="text-[10px] text-[#565959]">
                بعد التسليم، اطلب من العميل فتح QR Code للتأكيد
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
