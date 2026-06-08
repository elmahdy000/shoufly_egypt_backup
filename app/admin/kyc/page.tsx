"use client";

import { useEffect, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import {
  Check,
  CheckCircle,
  XCircle,
  X,
  User,
  Calendar,
  Image as ImageIcon,
  Eye,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { AdminButton } from "@/components/admin/ui";
import {
  PageHeader,
  EmptyState,
  PageLoading,
  ConfirmDialog,
  InlineToast,
} from "@/components/admin/primitives";

interface PendingKyc {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  kycSubmissionDate: string;
}

export default function AdminKycPage() {
  const { data: requests, loading, refresh } = useAsyncData<PendingKyc[]>(
    () => apiFetch("/api/admin/kyc", "ADMIN"),
    [],
  );
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [rejectionModalUser, setRejectionModalUser] = useState<PendingKyc | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.type === "ok" ? 4000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleReviewSubmit = async (userId: number, status: "APPROVED" | "REJECTED", reason?: string) => {
    setProcessingId(userId);
    try {
      await apiFetch(`/api/admin/kyc/${userId}`, "ADMIN", {
        method: "PATCH",
        body: { status, reason },
      });
      setToast({
        type: "ok",
        message: status === "APPROVED" ? "تم اعتماد وثائق المستخدم بنجاح! ✅" : "تم رفض طلب التوثيق بنجاح. ❌",
      });
      refresh();
    } catch {
      setToast({ type: "err", message: "حصلت مشكلة أثناء تحديث الحالة. يرجى المحاولة مرة أخرى." });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && !requests) {
    return (
      <>
        <PageHeader
          eyebrow="توثيق الحسابات"
          eyebrowTone="emerald"
          title={
            <>
              توثيق <span className="text-primary">الحسابات</span> (KYC)
            </>
          }
          subtitle="مراجعة بيانات الهوية والمستندات القانونية للموردين قبل التفعيل النهائي."
        />
        <PageLoading label="جاري جلب طلبات التوثيق..." />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="توثيق الحسابات"
        eyebrowTone="emerald"
        title={
          <>
            توثيق <span className="text-primary">الحسابات</span> (KYC)
          </>
        }
        subtitle="مراجعة بيانات الهوية والمستندات القانونية للموردين قبل التفعيل النهائي."
        actions={
          <div className="bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <ShieldCheck size={18} />
            يوجد {requests?.length || 0} طلب معلق
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {!loading && requests?.length === 0 && (
          <EmptyState
            icon={CheckCircle}
            title="النظام محدث بالكامل"
            description="تم مراجعة كافة الطلبات. لا توجد هويات بانتظار التوثيق حالياً."
            className="bg-white border-2 border-dashed border-slate-200 rounded-3xl h-[400px]"
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          {requests?.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <User size={28} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        طلب توثيق جديد
                      </p>
                      <h3 className="font-black text-slate-900 text-xl leading-none mb-1 truncate">
                        {req.fullName}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 tracking-wide font-outfit">
                        {req.email} • {req.phone}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span>تاريخ التقديم:</span>
                    <span className="font-outfit text-slate-900 mr-auto">{formatDate(req.kycSubmissionDate)}</span>
                  </div>

                  <div className="flex gap-3">
                    <AdminButton
                      variant="success"
                      size="md"
                      fullWidth
                      leadingIcon={Check}
                      isLoading={processingId === req.id}
                      onClick={() => handleReviewSubmit(req.id, "APPROVED")}
                    >
                      اعتماد الوثائق
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="md"
                      fullWidth
                      leadingIcon={XCircle}
                      isLoading={processingId === req.id}
                      onClick={() => {
                        setRejectionModalUser(req);
                        setRejectionReason("");
                      }}
                    >
                      رفض الطلب
                    </AdminButton>
                  </div>
                </div>

                {/* Images Section */}
                <div className="lg:w-[450px] grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon size={12} className="text-slate-400" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">صورة الهوية الأمامية</p>
                    </div>
                    <div
                      className="aspect-[1.6/1] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative group cursor-zoom-in shadow-sm"
                      onClick={() => setViewingImage(req.idCardFrontUrl)}
                    >
                      <img
                        src={req.idCardFrontUrl}
                        alt="Front ID"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                        <Eye size={22} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon size={12} className="text-slate-400" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">صورة الهوية الخلفية</p>
                    </div>
                    <div
                      className="aspect-[1.6/1] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative group cursor-zoom-in shadow-sm"
                      onClick={() => setViewingImage(req.idCardBackUrl)}
                    >
                      <img
                        src={req.idCardBackUrl}
                        alt="Back ID"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                        <Eye size={22} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md p-10 flex items-center justify-center"
          onClick={() => { setViewingImage(null); setImageLoading(false); }}
        >
          <button
            aria-label="إغلاق الصورة"
            className="absolute top-10 right-10 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
          >
            <X size={28} />
          </button>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={40} className="animate-spin text-white/60" />
            </div>
          )}
          <img
            src={viewingImage}
            alt="Fullscreen ID"
            onLoad={() => setImageLoading(false)}
            onLoadStart={() => setImageLoading(true)}
            className={`max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!rejectionModalUser}
        onClose={() => {
          setRejectionModalUser(null);
          setRejectionReason("");
        }}
        onConfirm={() => {
          if (rejectionModalUser) {
            handleReviewSubmit(rejectionModalUser.id, "REJECTED", rejectionReason || "البيانات غير واضحة");
            setRejectionModalUser(null);
            setRejectionReason("");
          }
        }}
        title="سبب رفض التوثيق"
        description={
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-bold">
              يرجى كتابة سبب رفض طلب توثيق الهوية الخاص بـ{" "}
              <span className="text-slate-950 font-black">{rejectionModalUser?.fullName}</span> ليتم توجيهه لتصحيح البيانات.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: صورة الهوية الأمامية غير واضحة، يرجى إعادة رفع صورة عالية الدقة..."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all font-semibold resize-none text-slate-800"
            />
          </div>
        }
        confirmText="تأكيد الرفض"
        cancelText="إلغاء"
        variant="danger"
        loading={processingId !== null}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-full max-w-sm px-4">
          <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
