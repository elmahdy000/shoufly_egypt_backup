"use client";

import { FormEvent, useRef, useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/shoofly/button";
import { ErrorState } from "@/components/shared/error-state";
import { createVendorBid } from "@/lib/api/bids";
import { getRequestDetails } from "@/lib/api/requests";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import {
  FileText,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Briefcase,
  Info,
  Send,
  AlertTriangle,
  Camera,
  X,
  Package,
  ArrowRight,
  ShieldCheck,
  CircleDollarSign,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REPORT_REASONS: Array<{ value: string; label: string }> = [
  { value: "SPAM", label: "سبام / إعلان" },
  { value: "FAKE", label: "طلب وهمي" },
  { value: "DUPLICATE", label: "مكرر" },
  { value: "OUT_OF_SCOPE", label: "خارج نطاق خدماتي" },
  { value: "OTHER", label: "سبب آخر" },
];

function VendorRequestDetails({ requestId }: { requestId: number }) {
  const router = useRouter();
  const { data, loading, error } = useAsyncData(() => getRequestDetails(requestId), [requestId]);
  
  const [description, setDescription] = useState("");
  const [netPrice, setNetPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [includesProduct, setIncludesProduct] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🚩 Report-this-request modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<
    { type: "ok" | "err"; text: string } | null
  >(null);

  // 🔄 Fetch platform commission rate from settings (dynamic)
  const [commissionRate, setCommissionRate] = useState(0.15); // default 15%
  
  useEffect(() => {
    apiFetch('/api/settings/public', 'VENDOR')
      .then((data: any) => {
        if (data?.commission) {
          setCommissionRate(data.commission / 100);
        }
      })
      .catch(() => {
        // Keep default on error
      });
  }, []);
  
  const financialBreakdown = useMemo(() => {
    const price = Number(netPrice) || 0;
    const commission = price * commissionRate;
    const clientPays = price + commission;
    return { price, commission, clientPays };
  }, [netPrice, commissionRate]);

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const data = await apiFetch<any>('/api/upload', 'VENDOR', { 
        method: 'POST', 
        body: formData 
      });
      return data.success ? data.fileUrl : null;
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    }
  }

  async function submitReport(e: FormEvent) {
    e.preventDefault();
    setReportSubmitting(true);
    setReportFeedback(null);
    try {
      const res = await apiFetch<{ ok: boolean; reportsCount: number; autoClosed: boolean }>(
        `/api/vendor/requests/${requestId}/report`,
        "VENDOR",
        { method: "POST", body: { reason: reportReason, details: reportDetails || undefined } },
      );
      if (res.autoClosed) {
        setReportFeedback({
          type: "ok",
          text: "شكراً. تم تأكيد البلاغ وتم إغلاق الطلب تلقائياً.",
        });
        setTimeout(() => router.push("/vendor/requests"), 2000);
      } else {
        setReportFeedback({
          type: "ok",
          text: `شكراً. تم تسجيل البلاغ (${res.reportsCount} بلاغ حتى الآن).`,
        });
        setTimeout(() => setReportOpen(false), 1500);
      }
    } catch (err) {
      setReportFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "حصل مشكلة في تسجيل البلاغ.",
      });
    } finally {
      setReportSubmitting(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) setImages(prev => [...prev, url]);
    }
    setUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function submitBid(e: FormEvent) {
    e.preventDefault();
    const priceNum = Number(netPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFeedback({ type: 'error', text: 'يرجى وضع تسعير صحيح وواقعي.' });
      return;
    }
    if (includesProduct && images.length === 0) {
      setFeedback({ type: 'error', text: 'يرجى رفع صور للمنتجات المقدمة.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await createVendorBid({ requestId, description, netPrice: priceNum, images });
      setFeedback({ type: 'success', text: 'تم إرسال تسعيرتك للعميل بنجاح!' });
      setTimeout(() => router.push("/vendor/bids"), 2000);
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : "حدث خطأ أثناء رفع العرض" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted text-sm font-medium">بنجهزلك تفاصيل الطلب...</p>
      </div>
    </div>
  );
  
  if (error || !data) return (
    <div className="p-6">
      <ErrorState message={error || "الطلب غير متوفر"} />
    </div>
  );

  const isOpen = data.status === 'OPEN_FOR_BIDDING';

  if (feedback?.type === 'success') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
          <CheckCircle size={48} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">عرضك اتبعت بنجاح!</h2>
        <p className="text-slate-500 max-w-xs mx-auto mb-8">هنبعت للعميل إشعار فوراً. وتقدر تتابع حالة عرضك من قايمة صفحة عروضي.</p>
        <Button onClick={() => router.push("/vendor/bids")} className="px-8 h-12 rounded-2xl">
          روح لعروضي <ArrowLeft className="mr-2" size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-32 lg:pb-12 text-right" dir="rtl">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 glass border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
          <ArrowRight size={20} />
        </button>
        <h1 className="font-black text-slate-900">تفاصيل الطلب #{requestId}</h1>
        <button
          onClick={() => {
            setReportFeedback(null);
            setReportOpen(true);
          }}
          className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors"
          aria-label="الإبلاغ عن الطلب"
          title="الإبلاغ عن الطلب"
        >
          <Flag size={18} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Step 1: Request Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest">
            <span className="w-6 h-[2px] bg-primary" />
            بيانات العميل
          </div>
          
          <div className="shoofly-card p-6 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} /> تفاصيل المشكلة
                </label>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-900 text-base leading-relaxed font-medium">
                  {data.description.includes(']') 
                    ? data.description.substring(data.description.indexOf(']') + 1).trim() 
                    : data.description}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-0.5">الموقع</label>
                    <p className="text-slate-900 font-bold">{data.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-0.5">نوع الخدمة / البراند</label>
                    <p className="text-slate-900 font-bold">
                       {data.category?.name || "خدمات عامة"} 
                       {data.brand ? ` - ${data.brand.name}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Your Bid */}
        {isOpen ? (
          <form onSubmit={submitBid} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest">
              <span className="w-6 h-[2px] bg-primary" />
              عرض السعر والتفاصيل
            </div>

            <div className="shoofly-card p-6 space-y-8">
              {/* Product Toggle */}
              <div 
                onClick={() => setIncludesProduct(!includesProduct)}
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  includesProduct ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-white border-slate-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  includesProduct ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Package size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-black">هل عرضك فيه مجسم يتباع؟</p>
                  <p className="text-slate-500 text-xs">زي قطع غيار أو أجهزة تبع المشكلة</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  includesProduct ? 'bg-primary border-primary' : 'border-slate-300'
                }`}>
                  {includesProduct && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner" />}
                </div>
              </div>

               {/* Description Box */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <label className="text-slate-800 font-black text-sm flex items-center gap-2">
                     <Send size={16} className="text-primary" /> اشرح عرضك للعميل
                   </label>
                   {description.length > 0 && (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 animate-in fade-in duration-300">
                        <div className={`w-2 h-2 rounded-full ${description.length < 50 ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`} />
                        <span className="text-[10px] font-bold text-slate-600">
                          {description.length < 50 ? 'جودة ضعيفة للرد' : 'جودة ممتازة للرد'} (توقع AI)
                        </span>
                     </div>
                   )}
                 </div>
                 <textarea 
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   required
                   rows={4}
                   placeholder="عرف العميل بخبرتك وإزاي هتحل المشكلة بالتفصيل..."
                   className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-3xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-base transition-all resize-none font-bold"
                 />
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Info size={12} />
                    نصيحة: كل ما زاد الشرح التقني، زادت فرصة ظهورك كـ "أفضل اختيار" للعميل.
                 </div>
               </div>

              {/* Price Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-3">
                  <label className="text-slate-800 font-black text-sm flex items-center gap-2">
                    <CircleDollarSign size={16} className="text-primary" /> اللي هتاخده صافي (ج.م)
                  </label>
                  <div className="relative rounded-3xl border-2 border-slate-200 bg-white focus-within:border-primary focus-within:ring-[6px] focus-within:ring-primary/10 transition-all overflow-hidden flex items-stretch">
                    <div className="flex items-center justify-center bg-slate-50 border-r-2 border-slate-100 px-6 font-bold text-lg text-slate-400 shrink-0">
                      ج.م
                    </div>
                    <input 
                      type="number"
                      value={netPrice}
                      onChange={(e) => setNetPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full bg-transparent px-6 py-6 outline-none text-4xl font-black text-slate-900 tracking-tighter placeholder:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[32px] p-6 text-white space-y-4 shadow-xl shadow-slate-900/20">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase">
                    <ShieldCheck size={14} /> فاتورة العميل المتوقعة (بكل شفافية)
                  </div>
                  <div className="space-y-2 text-sm font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">سعرك الصافي</span>
                      <span className="font-bold">{financialBreakdown.price.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">عمولة المنصة ({(commissionRate * 100).toFixed(0)}%)</span>
                      <span className="text-rose-400">+{financialBreakdown.commission.toFixed(2)} ج.م</span>
                    </div>
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">المبلغ اللي هيدفعه العميل</span>
                      <span className="text-primary font-black">{financialBreakdown.clientPays.toFixed(2)} ج.م</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">
                      عمولة المنصة: {(commissionRate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Block */}
              {includesProduct && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-slate-800 font-black text-sm flex items-center gap-2">
                    <Camera size={16} className="text-primary" /> صور المنتجات أو قطع الغيار
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 group">
                        <img src={url} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <button 
                          type="button" 
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-2 left-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition-all"
                    >
                      {uploadingImages ? <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Camera size={24} />}
                      <span className="text-xs font-bold">إضافة صورة</span>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                </div>
              )}
            </div>

            {/* ERROR Feedback */}
            {feedback?.type === 'error' && (
              <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-3xl text-rose-700 font-bold flex items-center gap-3">
                <AlertTriangle /> {feedback.text}
              </div>
            )}

            {/* Sticky Submit Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 lg:static lg:bg-transparent lg:border-0 lg:p-0 z-50">
              <Button 
                type="submit" 
                isLoading={isSubmitting} 
                className="w-full h-14 rounded-3xl text-lg font-black shadow-xl shadow-primary/20"
              >
                ابعت عرضك دلوقتي <Send className="mr-2" size={20} />
              </Button>
            </div>
          </form>
        ) : (
          <div className="shoofly-card p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Info size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900">عذراً، الطلب ده اتقفل</h3>
            <p className="text-slate-500">العميل اكتفى ومش بيستقبل عروض جديدة للطلب ده دلوقتي.</p>
            <Button variant="secondary" onClick={() => router.push("/vendor")} className="mt-4 rounded-2xl">ارجع للرئيسية</Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 overflow-hidden" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={32} /></button>
          <img src={selectedImage} className="max-w-full max-h-full object-contain rounded-2xl" />
        </div>
      )}

      {/* 🚩 Report modal */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div
            className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !reportSubmitting) setReportOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
          >
            <motion.div
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            >
              <form onSubmit={submitReport}>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600">
                    <Flag size={18} />
                    <h2 id="report-modal-title" className="font-black text-slate-900">
                      الإبلاغ عن الطلب
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    disabled={reportSubmitting}
                    className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors disabled:opacity-40"
                    aria-label="إغلاق"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    لو الطلب ده مزيف، سبام، أو خارج عن نطاقك، ابلّغنا وهنراجعه فوراً.
                    البلاغات المتكررة من موردين مختلفين بتتسبب في إغلاق الطلب تلقائياً.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      سبب البلاغ
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {REPORT_REASONS.map((r) => {
                        const active = reportReason === r.value;
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setReportReason(r.value)}
                            className={`px-3 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all text-right ${
                              active
                                ? "border-rose-500 bg-rose-50 text-rose-700"
                                : "border-slate-100 text-slate-600 hover:border-slate-200"
                            }`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      تفاصيل إضافية (اختياري)
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="لو عندك معلومة إضافية تساعد المراجعة..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:bg-white outline-none transition-colors resize-none"
                    />
                  </div>

                  {reportFeedback && (
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
                        reportFeedback.type === "ok"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                      role="status"
                    >
                      {reportFeedback.type === "ok" ? (
                        <CheckCircle size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                      {reportFeedback.text}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 justify-end bg-slate-50/50">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setReportOpen(false)}
                    disabled={reportSubmitting}
                    className="rounded-2xl"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    isLoading={reportSubmitting}
                    className="rounded-2xl !bg-rose-600 hover:!bg-rose-700"
                  >
                    ابعت البلاغ
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VendorRequestDetailsPage() {
  const params = useParams<{ requestId: string }>();
  const parsed = Number(params.requestId);
  if (!Number.isFinite(parsed) || parsed <= 0) return <ErrorState message="رقم الطلب مش مظبوط" />;
  return <VendorRequestDetails requestId={parsed} />;
}
