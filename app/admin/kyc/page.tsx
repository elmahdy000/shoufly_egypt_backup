"use client";

import { useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  Image as ImageIcon, 
  Eye,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";
import Link from "next/link";
import { ShooflyLoader } from "@/components/shoofly/loader";

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
  const { data: requests, loading, refresh } = useAsyncData<PendingKyc[]>(() => apiFetch('/api/admin/kyc', "ADMIN"), []);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [rejectionModalUser, setRejectionModalUser] = useState<PendingKyc | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReviewSubmit = async (userId: number, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setProcessingId(userId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await apiFetch(`/api/admin/kyc/${userId}`, "ADMIN", {
        method: "PATCH",
        body: { status, reason }
      });
      setSuccessMessage(status === 'APPROVED' ? "تم اعتماد وثائق المستخدم بنجاح! ✅" : "تم رفض طلب التوثيق بنجاح. ❌");
      refresh();
    } catch (err) {
      setErrorMessage("حصلت مشكلة أثناء تحديث الحالة. يرجى المحاولة مرة أخرى.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReview = async (req: PendingKyc, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED') {
      setRejectionModalUser(req);
      setRejectionReason("");
    } else {
      handleReviewSubmit(req.id, 'APPROVED');
    }
  };

  if (loading && !requests) {
    return <ShooflyLoader message="جاري جلب طلبات التوثيق..." />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <div className="max-w-[1500px] mx-auto p-6 lg:p-10 space-y-10">
        
        {/* 📋 Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">توثيق <span className="text-primary">الحسابات</span> (KYC)</h1>
            <p className="text-sm text-slate-500 font-medium">مراجعة بيانات الهوية والمستندات القانونية للموردين قبل التفعيل النهائي.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 text-amber-600 border border-amber-200 px-5 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
              <ShieldCheck size={18} />
              يوجد {requests?.length || 0} طلب معلق
            </div>
          </div>
        </header>

        {!loading && requests?.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-sm h-[400px]">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
               <CheckCircle size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">النظام محدث بالكامل</h3>
             <p className="text-sm font-medium text-slate-500">تم مراجعة كافة الطلبات. لا توجد هويات بانتظار التوثيق حالياً.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {requests?.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row gap-10">
                {/* Info Section */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                      <User size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">طلب توثيق جديد</p>
                      <h3 className="font-black text-slate-900 text-xl leading-none mb-2">{req.fullName}</h3>
                      <p className="text-xs font-bold text-slate-500 tracking-wide font-outfit">{req.email} • {req.phone}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Calendar size={16} className="text-slate-400" /> 
                    <span>تاريخ التقديم:</span>
                    <span className="font-outfit text-slate-900 ml-auto">{formatDate(req.kycSubmissionDate)}</span>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      onClick={() => handleReview(req, 'APPROVED')}
                      disabled={processingId === req.id}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {processingId === req.id ? 'جاري...' : <><Check size={18} /> اعتماد الوثائق</>}
                    </button>
                    <button 
                      onClick={() => handleReview(req, 'REJECTED')}
                      disabled={processingId === req.id}
                      className="flex-1 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {processingId === req.id ? 'جاري...' : <><XCircle size={18} /> رفض الطلب</>}
                    </button>
                  </div>
                </div>

                {/* Images Section */}
                <div className="lg:w-[500px] grid grid-cols-2 gap-4">
                   <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <ImageIcon size={14} className="text-slate-400" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">صورة الهوية الأمامية</p>
                     </div>
                     <div 
                       className="aspect-[1.6/1] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative group cursor-zoom-in shadow-sm"
                       onClick={() => setViewingImage(req.idCardFrontUrl)}
                     >
                        <img src={req.idCardFrontUrl} alt="Front ID" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                          <Eye size={24} />
                        </div>
                     </div>
                   </div>
                   <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <ImageIcon size={14} className="text-slate-400" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">صورة الهوية الخلفية</p>
                     </div>
                     <div 
                       className="aspect-[1.6/1] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative group cursor-zoom-in shadow-sm"
                       onClick={() => setViewingImage(req.idCardBackUrl)}
                     >
                        <img src={req.idCardBackUrl} alt="Back ID" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                          <Eye size={24} />
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
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md p-10 flex items-center justify-center" onClick={() => setViewingImage(null)}>
           <button className="absolute top-10 right-10 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all">
              <XCircle size={32} />
           </button>
           <img src={viewingImage} alt="Fullscreen ID" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10" />
        </div>
      )}

      {/* ⚠️ Rejection Reason Modal */}
      {rejectionModalUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-md w-full border border-slate-100 shadow-xl space-y-6 text-right" dir="rtl">
              <div className="flex items-center gap-3 text-rose-600">
                 <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center animate-pulse">
                    <AlertCircle size={20} />
                 </div>
                 <h3 className="text-lg font-black">سبب رفض التوثيق</h3>
              </div>
              
              <p className="text-xs text-slate-500 font-bold">يرجى كتابة سبب رفض طلب توثيق الهوية الخاص بـ <span className="text-slate-950 font-black">{rejectionModalUser.fullName}</span> ليتم توجيهه لتصحيح البيانات.</p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: صورة الهوية الأمامية غير واضحة، يرجى إعادة رفع صورة عالية الدقة..."
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all font-semibold resize-none text-slate-800"
              />
              
              <div className="flex gap-3">
                 <button
                   onClick={() => {
                     setRejectionModalUser(null);
                     setRejectionReason("");
                   }}
                   className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all text-xs"
                 >
                    إلغاء
                 </button>
                 <button
                   onClick={() => {
                     handleReviewSubmit(rejectionModalUser.id, 'REJECTED', rejectionReason || "البيانات غير واضحة");
                     setRejectionModalUser(null);
                     setRejectionReason("");
                   }}
                   className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm text-xs"
                 >
                    تأكيد الرفض
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 🔔 Toast Notifications */}
      {(successMessage || errorMessage) && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in font-bold text-xs pointer-events-auto">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={16} />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-600"><XCircle size={14} /></button>
            </div>
          )}
          {errorMessage && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in font-bold text-xs pointer-events-auto">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={16} />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600"><XCircle size={14} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
