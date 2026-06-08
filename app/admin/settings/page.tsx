"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, DollarSign, Loader2, Navigation, Save, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commission, setCommission] = useState(15);
  const [vat, setVat] = useState(14);
  const [radius, setRadius] = useState(50);
  const [minOrder, setMinOrder] = useState(100);
  const [autoPayout, setAutoPayout] = useState(true);
  const [verifyRequired, setVerifyRequired] = useState(true);
  const [otpDelivery, setOtpDelivery] = useState(true);

  // Stored timeout so the success toast can be cleared on unmount or re-save.
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // 🔄 Load current settings on mount — use the admin endpoint (returns all 7 fields)
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiFetch<{
          commission?: number;
          vat?: number;
          radius?: number;
          minOrder?: number;
          minVendorMatch?: number;
          initialRadius?: number;
          radiusStep?: number;
          autoPayout?: boolean;
          verifyRequired?: boolean;
          otpDelivery?: boolean;
        }>("/api/admin/settings", "ADMIN");
        if (data) {
          setCommission(data.commission ?? 15);
          setVat(data.vat ?? 14);
          setRadius(data.radius ?? 50);
          setMinOrder(data.minOrder ?? 100);
          setAutoPayout(data.autoPayout ?? true);
          setVerifyRequired(data.verifyRequired ?? true);
          setOtpDelivery(data.otpDelivery ?? true);
        }
      } catch (err: any) {
        setError("فشل تحميل الإعدادات الحالية");
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  function validate(): string | null {
    if (commission < 0 || commission > 100) return "عمولة المنصة يجب أن تكون بين 0 و 100";
    if (vat < 0 || vat > 100) return "ضريبة القيمة المضافة يجب أن تكون بين 0 و 100";
    if (radius < 1) return "قطر التغطية يجب أن يكون 1 كم على الأقل";
    if (minOrder < 1) return "الحد الأدنى للطلب يجب أن يكون 1 ج.م على الأقل";
    return null;
  }

  const hasUnsaved = useRef(false);
  useEffect(() => {
    hasUnsaved.current = true;
  }, [commission, vat, radius, minOrder, autoPayout, verifyRequired, otpDelivery]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved.current && !success) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [success]);

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch("/api/admin/settings", "ADMIN", {
        method: "POST",
        body: { commission, vat, radius, minOrder, autoPayout, verifyRequired, otpDelivery },
      });
      setSuccess(true);
      hasUnsaved.current = false;
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حفظ الإعدادات");
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 font-cairo antialiased min-h-screen bg-slate-50" dir="rtl">
      
      {/* 🌟 PREMIUM HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            <span className="text-[10px] font-black tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 uppercase">النظام المركزي v4.0</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">إعدادات المنصة</h1>
          <p className="text-base text-slate-500 font-medium">التحكم الكامل في الضوابط التشغيلية، السياسات المالية، وبروتوكولات الأمان.</p>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="animate-spin" size={24} />
            <span className="font-medium">جاري تحميل الإعدادات...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3 mb-6">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="mr-auto px-4 py-2 bg-rose-100 hover:bg-rose-200 rounded-lg text-sm font-bold transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-8">
          
          {/* 💰 Financial Policies */}
          <section className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100/50">
                <DollarSign size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">السياسات المالية</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Financial Regulation</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">عمولة المنصة (%)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300 group-focus-within:text-primary transition-colors">%</span>
                    <input
                      type="number"
                      value={commission}
                      onChange={(e) => setCommission(Number(e.target.value))}
                      className="w-full h-12 pr-6 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 opacity-70">النسبة التي يتم اقتطاعها آلياً من كل معاملة ناجحة.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">ضريبة القيمة المضافة (%)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300 group-focus-within:text-primary transition-colors">%</span>
                    <input
                      type="number"
                      value={vat}
                      onChange={(e) => setVat(Number(e.target.value))}
                      className="w-full h-12 pr-6 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 opacity-70">الضرائب المطبقة حسب القوانين المحلية الحالية.</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900">التسوية التلقائية للموردين</h3>
                  <p className="text-xs text-slate-400 font-medium">جدولة تحويل الأرباح آلياً لمحافظ الموردين عند اكتمال الطلب.</p>
                </div>
                <button
                  onClick={() => setAutoPayout(!autoPayout)}
                  className={`relative h-7 w-14 rounded-full transition-all duration-300 ${autoPayout ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-slate-200"}`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${autoPayout ? "right-1" : "left-8"}`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* 📍 Operational Scope */}
          <section className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm border border-primary/20">
                <Navigation size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">نطاق العمليات</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Operational Boundary</p>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">قطر التغطية (كم)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">KM</span>
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full h-12 pr-6 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 opacity-70">أقصى مسافة للربط الذكي بين أطراف العملية.</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">الحد الأدنى للطلب (ج.م)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">EGP</span>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full h-12 pr-6 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 opacity-70">أقل قيمة مقبولة لفتح طلب مزايدة جديد.</p>
              </div>
            </div>
          </section>

          {/* 🛡️ Security Protocols */}
          <section className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100/50">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">بروتوكولات الأمان</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Security Compliance</p>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              <SettingToggle
                title="توثيق الهوية الإلزامي"
                desc="منع الموردين من استلام الطلبات قبل اعتماد الوثائق الرسمية."
                active={verifyRequired}
                onToggle={() => setVerifyRequired(!verifyRequired)}
              />
              <SettingToggle
                title="رمز التحقق عند التسليم (OTP)"
                desc="فرض طبقة أمان إضافية لضمان وصول الشحنة للعميل الصحيح."
                active={otpDelivery}
                onToggle={() => setOtpDelivery(!otpDelivery)}
                last
              />
            </div>
          </section>

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
            <AlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={20} />
            <p className="text-xs font-bold text-amber-800 leading-relaxed">
              تنبيه هام: تعديل السياسات المالية والتشغيلية يؤثر فوراً على العمليات الجديدة فقط. الطلبات القائمة ستحافظ على القواعد التي بدأت بها لضمان استقرار العقود.
            </p>
          </div>
        </div>

        {/* 💾 Sidebar Actions */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-lg font-black mb-1">ملخص التغييرات</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration Snapshot</p>
              </div>

              <div className="space-y-4">
                <SummaryRow label="عمولة المنصة" val={`${commission}%`} />
                <SummaryRow label="الضريبة المضافة" val={`${vat}%`} />
                <SummaryRow label="نطاق التغطية" val={`${radius} كم`} />
                <SummaryRow label="الحد الأدنى" val={`${minOrder} ج.م`} />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-sm font-black transition-all active:scale-95 shadow-lg ${success ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-primary hover:bg-orange-600 shadow-orange-500/20'} disabled:opacity-50`}
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : success ? <CheckCircle size={20} /> : <Save size={20} />}
                {isSaving ? "جاري مزامنة البيانات..." : success ? "تم الحفظ بنجاح" : "حفظ الضوابط الجديدة"}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function SettingToggle({
  title,
  desc,
  active,
  onToggle,
  last,
}: {
  title: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 p-5 ${!last ? "border-b border-slate-100" : ""}`}>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <p className="mt-1 text-xs text-slate-500">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${active ? "bg-orange-500" : "bg-slate-200"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${active ? "right-1" : "left-1"}`} />
      </button>
    </div>
  );
}

function SummaryRow({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white tabular-nums">{val}</span>
    </div>
  );
}
