"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useMemo } from "react";
import {
  IconMapPin,
  IconLoader2,
  IconCheck,
  IconAlertCircle,
  IconHome,
  IconDeviceMobile,
} from "@tabler/icons-react";

const MapPicker = dynamic(() => import("@/components/shoofly/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex items-center justify-center text-slate-400 gap-2">
      <IconLoader2 size={20} stroke={1.6} className="animate-spin text-primary" />
      <span className="text-helper">جاري تحميل الخريطة...</span>
    </div>
  ),
});

export interface AddressFormProps {
  governorates: Array<{ id: number; name: string; nameAr: string }>;
  cities: Array<{ id: number; name: string; nameAr: string; governorateId: number }>;
  selectedGov: string;
  selectedCity: string;
  onSelectGov: (id: string) => void;
  onSelectCity: (id: string) => void;
  address: string;
  onAddressChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  latitude: string;
  longitude: string;
  onLocationChange: (lat: number, lng: number) => void;
  errors?: {
    governorate?: string;
    city?: string;
    address?: string;
    phone?: string;
  };
}

export function AddressForm({
  governorates,
  cities,
  selectedGov,
  selectedCity,
  onSelectGov,
  onSelectCity,
  address,
  onAddressChange,
  phone,
  onPhoneChange,
  notes,
  onNotesChange,
  latitude,
  longitude,
  onLocationChange,
  errors = {},
}: AddressFormProps) {
  const [locStatus, setLocStatus] = useState<"idle" | "detecting" | "success" | "error">("idle");

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocStatus("success");
        onLocationChange(lat, lng);
      },
      () => setLocStatus("error"),
      { timeout: 10000 },
    );
  }, [onLocationChange]);

  const selectedGovName = useMemo(
    () => governorates.find((g) => g.id.toString() === selectedGov)?.nameAr || "",
    [governorates, selectedGov],
  );
  const selectedCityName = useMemo(
    () => cities.find((c) => c.id.toString() === selectedCity)?.nameAr || "",
    [cities, selectedCity],
  );

  return (
    <div className="space-y-4">
      {/* Map Card */}
      <div className="surface-card-soft overflow-hidden">
        <div className="relative h-[280px] sm:h-[360px] md:h-[400px] bg-slate-100">
          <MapPicker
            initialLat={Number(latitude) || 30.0444}
            initialLng={Number(longitude) || 31.2357}
            onLocationChange={onLocationChange}
          />

          <button
            type="button"
            onClick={detectLocation}
            aria-label="استخدم موقعي الحالي"
            className={`absolute top-3 left-3 z-10 flex items-center gap-2 h-10 px-3.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
              locStatus === "detecting"
                ? "bg-primary text-white border-primary"
                : locStatus === "success"
                ? "bg-success text-white border-success"
                : locStatus === "error"
                ? "bg-danger-bg text-danger border-danger/30"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {locStatus === "detecting" ? (
              <IconLoader2 size={14} stroke={1.6} className="animate-spin" />
            ) : locStatus === "success" ? (
              <IconCheck size={14} stroke={2} />
            ) : locStatus === "error" ? (
              <IconAlertCircle size={14} stroke={1.6} />
            ) : (
              <IconMapPin size={14} stroke={1.6} />
            )}
            <span>
              {locStatus === "detecting"
                ? "جاري التحديد..."
                : locStatus === "success"
                ? "تم تحديد موقعك"
                : locStatus === "error"
                ? "فشل — حاول مرة أخرى"
                : "موقعي الحالي"}
            </span>
          </button>
        </div>

        {(address || selectedGovName) && (
          <div className="px-4 py-3 bg-primary/5 border-t border-primary/10 flex items-start gap-2.5">
            <IconMapPin size={15} stroke={1.8} className="text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-slate-800 leading-relaxed">
              {address && <p className="font-medium">{address}</p>}
              {(selectedGovName || selectedCityName) && (
                <p className="text-helper mt-0.5">
                  {[selectedCityName, selectedGovName].filter(Boolean).join("، ")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location Fields */}
      <div className="surface-card-soft p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IconHome size={16} stroke={1.6} />
          </div>
          <h3 className="text-section-title">أين يتواجد العطل؟</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="gov" className="sf-label">
              المحافظة <span className="text-danger">*</span>
            </label>
            <select
              id="gov"
              value={selectedGov}
              onChange={(e) => {
                onSelectGov(e.target.value);
                onSelectCity("");
              }}
              aria-invalid={!!errors.governorate}
              className="sf-input"
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr || g.name}
                </option>
              ))}
            </select>
            {errors.governorate && <p className="sf-error">{errors.governorate}</p>}
          </div>

          <div>
            <label htmlFor="city" className="sf-label">
              المدينة <span className="text-danger">*</span>
            </label>
            <select
              id="city"
              value={selectedCity}
              onChange={(e) => onSelectCity(e.target.value)}
              disabled={!selectedGov}
              aria-invalid={!!errors.city}
              className="sf-input disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">{selectedGov ? "اختر المدينة" : "اختر المحافظة أولاً"}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr || c.name}
                </option>
              ))}
            </select>
            {errors.city && <p className="sf-error">{errors.city}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address-details" className="sf-label">
            العنوان بالتفصيل <span className="text-danger">*</span>
          </label>
          <textarea
            id="address-details"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            rows={2}
            aria-invalid={!!errors.address}
            placeholder="مثال: 12 شارع التسعين، عمارة الأمل، الدور الثاني، شقة 4"
            className="sf-input resize-none"
          />
          {errors.address ? (
            <p className="sf-error">{errors.address}</p>
          ) : (
            <p className="sf-helper">اكتب العنوان بالتفصيل علشان المورد يلاقيك بسهولة.</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="surface-card-soft p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IconDeviceMobile size={16} stroke={1.6} />
          </div>
          <h3 className="text-section-title">بيانات التواصل</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="phone" className="sf-label">
              رقم الهاتف (11 رقم) <span className="text-danger">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                onPhoneChange(digits);
              }}
              required
              inputMode="numeric"
              aria-invalid={!!errors.phone}
              placeholder="01xxxxxxxxx"
              className="sf-input tracking-widest"
              dir="ltr"
              maxLength={11}
            />
            {errors.phone ? (
              <p className="sf-error">{errors.phone}</p>
            ) : (
              <p className="sf-helper">رقم مصري يبدأ بـ 010 أو 011 أو 012 أو 015.</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="sf-label">
              ملاحظات إضافية <span className="text-helper">(اختياري)</span>
            </label>
            <input
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="مثال: اتصل قبل الحضور بنص ساعة"
              className="sf-input"
              maxLength={200}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
