"use client";

import { FormEvent, useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientRequest } from "@/lib/api/requests";
import { apiFetch } from "@/lib/api/client";
import { ErrorState } from "@/components/shared/error-state";
import {
  IconLayoutGrid,
  IconCheck,
  IconPhoto,
  IconCar,
  IconDeviceMobile,
  IconWashMachine,
  IconBuildingFactory,
  IconStethoscope,
  IconPill,
  IconBook,
  IconPaw,
  IconTruckDelivery,
  IconTool,
  IconClipboardList,
  IconMapPin,
  IconPhone,
  IconTag,
  IconAlertCircle,
  IconCash,
  type Icon,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";

import { RequestStepper } from "@/components/requests/RequestStepper";
import { CategoryCard } from "@/components/requests/CategoryCard";
import { SubCategoryChips } from "@/components/requests/SubCategoryChips";
import { BrandSelector } from "@/components/requests/BrandSelector";
import { UploadBox } from "@/components/requests/UploadBox";
import { AddressForm } from "@/components/requests/AddressForm";
import { RequestReview } from "@/components/requests/RequestReview";
import { StickyActionBar } from "@/components/requests/StickyActionBar";
import { CreateRequestHeader } from "@/components/requests/CreateRequestHeader";
import { ProblemDescriptionField } from "@/components/requests/ProblemDescriptionField";
import { displayName } from "@/lib/i18n/display-names";

const DRAFT_KEY = "shoofly_new_request_draft";

const getCategoryIcon = (name: string): Icon => {
  const n = name || "";
  if (n.includes("سيارات") || n.includes("محركات")) return IconCar;
  if (n.includes("إلكترونيات") || n.includes("موبايل") || n.includes("هاتف")) return IconDeviceMobile;
  if (n.includes("أجهزة") || n.includes("منزلية") || n.includes("ثلاجة") || n.includes("غسالة")) return IconWashMachine;
  if (n.includes("منزل") || n.includes("تشطيب") || n.includes("سباكة") || n.includes("كهرباء")) return IconBuildingFactory;
  if (n.includes("صيدلية") || n.includes("أدوية")) return IconPill;
  if (n.includes("جمال") || n.includes("صحة")) return IconStethoscope;
  if (n.includes("تعليم") || n.includes("تدريب")) return IconBook;
  if (n.includes("حيوانات")) return IconPaw;
  if (n.includes("نقل") || n.includes("شحن") || n.includes("توصيل")) return IconTruckDelivery;
  return IconTool;
};

const STEPS = [
  { key: "service", shortLabel: "الخدمة", label: "نوع الخدمة", icon: IconClipboardList },
  { key: "images", shortLabel: "الصور", label: "الصور", icon: IconPhoto },
  { key: "address", shortLabel: "العنوان", label: "العنوان", icon: IconMapPin },
  { key: "review", shortLabel: "نشر", label: "نشر الطلب", icon: IconCheck },
];

interface FieldErrors {
  title?: string;
  description?: string;
  categoryId?: string;
  governorate?: string;
  city?: string;
  address?: string;
  phone?: string;
  budget?: string;
}

const PHONE_REGEX = /^01[0125][0-9]{8}$/;

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category");
  const queryService = searchParams.get("service");

  const draftLoadedRef = useRef(false);

  // Form state
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Data state
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [latitude, setLatitude] = useState("30.0444");
  const [longitude, setLongitude] = useState("31.2357");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Locations
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedGov, setSelectedGov] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [brandOptions, setBrandOptions] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  // Per-field errors (inline, on the form)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Load brands when subcategory changes
  useEffect(() => {
    if (!categoryId) {
      setBrandOptions([]);
      setSelectedBrand("");
      return;
    }
    const flatSubs = categoryList.flatMap((c: any) => c.subcategories || []);
    const sub = flatSubs.find((s: any) => s.id === categoryId);
    if (sub?.requiresBrand && sub?.brandType) {
      fetch(`/api/brands?type=${sub.brandType}`)
        .then((r) => r.json())
        .then(setBrandOptions)
        .catch(() => setBrandOptions([]));
    } else {
      setBrandOptions([]);
      setSelectedBrand("");
    }
  }, [categoryId, categoryList]);

  // Initial load: categories, locations, profile
  useEffect(() => {
    fetch("/api/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((cats: any[]) => {
        setCategoryList(cats);

        const draft = localStorage.getItem(DRAFT_KEY);
        let hasDraftedCategory = false;
        if (draft) {
          try {
            const d = JSON.parse(draft);
            if (d.categoryId && d.selectedParentId) hasDraftedCategory = true;
          } catch {
            /* ignore */
          }
        }

        if (queryService && !title) setTitle(queryService);

        if (!hasDraftedCategory) {
          if (queryCategory && cats?.length > 0) {
            const matched = cats.find(
              (c) => c.name.includes(queryCategory) || queryCategory.includes(c.name),
            );
            if (matched) {
              setSelectedParentId(matched.id);
              if (matched.subcategories?.length > 0) {
                setCategoryId(matched.subcategories[0].id);
              }
            } else if (cats.length > 0) {
              setSelectedParentId(cats[0].id);
              if (cats[0].subcategories?.length > 0) setCategoryId(cats[0].subcategories[0].id);
            }
          } else if (cats?.length > 0) {
            setSelectedParentId(cats[0].id);
            if (cats[0].subcategories?.length > 0) {
              setCategoryId(cats[0].subcategories[0].id);
            }
          }
        }
      })
      .catch(() => setError("فشل تحميل الفئات. يرجى تحديث الصفحة."));

    fetch("/api/locations")
      .then((r) => r.json())
      .then(setGovernorates)
      .catch(() => {});

    apiFetch<any>("/api/user/profile", "CLIENT")
      .then((user) => {
        if (user?.phone) setDeliveryPhone((prev) => prev || user.phone);
      })
      .catch(() => {});
     
  }, []);

  // Load cities when governorate changes
  useEffect(() => {
    if (!selectedGov) {
      setCities([]);
      return;
    }
    fetch(`/api/locations?type=cities&governorateId=${selectedGov}`)
      .then((r) => r.json())
      .then(setCities)
      .catch(() => setCities([]));
  }, [selectedGov]);

  const currentParent = useMemo(
    () => categoryList.find((c) => c.id === selectedParentId),
    [categoryList, selectedParentId],
  );

  const subCategories = useMemo(
    () => (currentParent?.subcategories ?? []) as Array<{ id: number; name: string }>,
    [currentParent],
  );

  const handleLocationChange = useCallback(
    (lat: number, lng: number) => {
      setLatitude((prev) => (prev === String(lat) ? prev : String(lat)));
      setLongitude((prev) => (prev === String(lng) ? prev : String(lng)));

      if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          if (status === "OK" && results && results[0]) {
            const formattedAddress = results[0].formatted_address;
            setAddress((prev) => (prev === formattedAddress ? prev : formattedAddress));

            let govName = "";
            let cityName = "";
            results[0].address_components.forEach((comp: any) => {
              if (comp.types.includes("administrative_area_level_1")) {
                govName = comp.long_name;
              }
              if (
                comp.types.includes("locality") ||
                comp.types.includes("sublocality") ||
                comp.types.includes("neighborhood")
              ) {
                cityName = comp.long_name;
              }
            });

            const matchedGov = governorates.find(
              (g: any) =>
                formattedAddress.includes(g.nameAr) ||
                formattedAddress.includes(g.name) ||
                (govName &&
                  (govName.includes(g.name) ||
                    govName.includes(g.nameAr) ||
                    g.nameAr.includes(govName))),
            );

            if (matchedGov) {
              setSelectedGov(String(matchedGov.id));
              fetch(`/api/locations?type=cities&governorateId=${matchedGov.id}`)
                .then((r) => r.json())
                .then((cts: any[]) => {
                  setCities(cts);
                  const matchedCity = cts.find(
                    (c: any) =>
                      formattedAddress.includes(c.nameAr) ||
                      formattedAddress.includes(c.name) ||
                      (cityName &&
                        (cityName.includes(c.name) ||
                          cityName.includes(c.nameAr) ||
                          c.nameAr.includes(cityName))),
                  );
                  if (matchedCity) setSelectedCity(String(matchedCity.id));
                })
                .catch(() => {});
            }
          }
        });
      }
    },
    [governorates],
  );

  // ---- Draft persistence ----
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        setTitle(d.title || "");
        setDescription(d.description || "");
        setAddress(d.address || "");
        setDeliveryPhone(d.deliveryPhone || "");
        setBudget(d.budget || "");
        setNotes(d.notes || "");
        setStep(d.step || 1);
        if (d.categoryId) setCategoryId(d.categoryId);
        if (d.selectedParentId) setSelectedParentId(d.selectedParentId);
        if (d.selectedBrand) setSelectedBrand(d.selectedBrand);
        if (d.selectedGov) setSelectedGov(d.selectedGov);
        if (d.selectedCity) setSelectedCity(d.selectedCity);
        if (d.latitude) setLatitude(d.latitude);
        if (d.longitude) setLongitude(d.longitude);
        setFieldErrors({});
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
    queueMicrotask(() => {
      draftLoadedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!draftLoadedRef.current) return;
    const payload = {
      title,
      description,
      address,
      deliveryPhone,
      budget,
      notes,
      step,
      categoryId,
      selectedParentId,
      selectedBrand,
      selectedGov,
      selectedCity,
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [
    title,
    description,
    address,
    deliveryPhone,
    budget,
    notes,
    step,
    categoryId,
    selectedParentId,
    selectedBrand,
    selectedGov,
    selectedCity,
    latitude,
    longitude,
  ]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  // ---- Step validation ----
  const validateStep = (targetStep: number): FieldErrors => {
    const errs: FieldErrors = {};
    if (targetStep >= 2) {
      if (!title || title.trim().length < 3) {
        errs.title = "اكتب عنوان مناسب للطلب (3 أحرف على الأقل).";
      }
      if (!description || description.trim().length < 10) {
        errs.description = "اكتب وصف تفصيلي للمشكلة (10 أحرف على الأقل).";
      }
      if (!categoryId) {
        errs.categoryId = "اختر القسم الفراعي المناسب لطلبك.";
      }
    }
    if (targetStep >= 4) {
      if (!selectedGov) errs.governorate = "اختر المحافظة.";
      if (!selectedCity) errs.city = "اختر المدينة.";
      if (!address || address.trim().length < 5) {
        errs.address = "اكتب العنوان بالتفصيل (5 أحرف على الأقل).";
      }
      if (!PHONE_REGEX.test(deliveryPhone)) {
        errs.phone = "اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015).";
      }
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(step + 1);
    const fieldKeys = Object.keys(errs) as Array<keyof FieldErrors>;
    setFieldErrors(errs);
    if (fieldKeys.length === 0) {
      setError(null);
      setStep((s) => s + 1);
    } else {
      setError("من فضلك أكمل البيانات الناقصة قبل المتابعة.");
      // Scroll to first error
      requestAnimationFrame(() => {
        const el = document.querySelector('[data-has-error="true"]');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  const prevStep = () => {
    setError(null);
    setFieldErrors({});
    setStep((s) => s - 1);
  };

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const result = await apiFetch<any>("/api/upload", "CLIENT", {
      method: "POST",
      body: fd,
    });
    return {
      filePath: result.fileUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("اختر القسم الفرعي قبل نشر الطلب.");
      return;
    }

    if (budget) {
      const n = Number(budget);
      if (isNaN(n) || n <= 0 || n > 500000) {
        setFieldErrors({ budget: "الميزانية لازم تكون بين 1 و 500,000 ج.م." });
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const settled = await Promise.allSettled(images.map((f) => uploadImage(f)));
      const uploaded = settled
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadImage>>> => r.status === "fulfilled")
        .map((r) => r.value);
      const failed = settled.length - uploaded.length;

      if (images.length > 0 && uploaded.length === 0) {
        throw new Error("فشل رفع كل الصور. حاول مرة أخرى بصور أصغر.");
      }
      if (failed > 0) {
        setError(`تم رفع ${uploaded.length} من ${images.length} صور. هننشر الطلب بالصور المتاحة.`);
      }

      const cleanPhone = deliveryPhone.replace(/\D/g, "");
      const created = await createClientRequest({
        title,
        description,
        budget: budget ? Number(budget) : undefined,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        deliveryPhone: cleanPhone,
        notes: notes || undefined,
        categoryId: categoryId,
        images: uploaded,
        governorateId: Number(selectedGov),
        cityId: Number(selectedCity),
        brandId: selectedBrand ? Number(selectedBrand) : undefined,
      });
      clearDraft();
      router.push(`/client/requests/${created.id}?new=true`);
    } catch (err: any) {
      const msg = err?.message || "حصل مشكلة أثناء نشر الطلب.";
      if (
        msg.includes("401") ||
        msg.includes("403") ||
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("forbidden")
      ) {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            title,
            description,
            address,
            deliveryPhone,
            budget,
            notes,
            step,
            categoryId,
            selectedParentId,
            selectedBrand,
            selectedGov,
            selectedCity,
            latitude,
            longitude,
            updatedAt: new Date().toISOString(),
          }),
        );
        router.push(`/login?callbackUrl=${encodeURIComponent("/client/requests/new")}`);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Step content ----
  const categoryError = fieldErrors.categoryId;

  const isStep1Valid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !!categoryId;

  const isStep3Valid =
    !!selectedGov &&
    !!selectedCity &&
    address.trim().length >= 5 &&
    PHONE_REGEX.test(deliveryPhone);

  const nextDisabled =
    (step === 1 && !isStep1Valid) ||
    (step === 3 && !isStep3Valid);

  const isStep1Missing =
    !title.trim() || !description.trim() || !categoryId;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-7 pb-44">
        {/* Header */}
        <div className="mb-4 sm:mb-7">
          <CreateRequestHeader
            title="اطلب خدمتك في دقائق"
            subtitle="اكتب تفاصيل الطلب وسيصلك أفضل عرض مناسب."
          />
        </div>

        {/* Stepper */}
        <div className="mb-3 sm:mb-6">
          <RequestStepper steps={STEPS} current={step} />
        </div>

        {/* Top-level error */}
        {error && <ErrorState message={error} />}

        <form onSubmit={onSubmit} noValidate>
          <AnimatePresence mode="wait">
            {/* === Step 1: Service Type === */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 sm:space-y-4"
              >
                {/* Title */}
                <div className="surface-card-soft p-4 sm:p-6" data-has-error={!!fieldErrors.title}>
                  <label htmlFor="title" className="sf-label">
                    عنوان الطلب <span className="text-danger">*</span>
                  </label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: undefined });
                    }}
                    placeholder="مثال: تصليح شاشة موبايل سامسونج"
                    aria-invalid={!!fieldErrors.title}
                    className="sf-input"
                    maxLength={120}
                  />
                  {fieldErrors.title ? (
                    <p className="sf-error">{fieldErrors.title}</p>
                  ) : (
                    <p className="sf-helper">اكتب جملة قصيرة توضّح طلبك.</p>
                  )}
                </div>

                {/* Main categories */}
                <div className="surface-card-soft p-4 sm:p-6" data-has-error={!!categoryError}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="sf-label !mb-0 flex items-center gap-1.5">
                      <IconLayoutGrid size={14} className="text-primary" stroke={1.6} />
                      <span>القسم الأساسي <span className="text-danger">*</span></span>
                    </div>
                    <span className="text-helper">{categoryList.length} أقسام</span>
                  </div>

                  {categoryList.length === 0 ? (
                    <div className="text-helper text-center py-6">جاري تحميل الأقسام...</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {categoryList.map((cat) => (
                        <CategoryCard
                          key={cat.id}
                          id={cat.id}
                          name={displayName(cat.name)}
                          icon={getCategoryIcon(cat.name)}
                          isSelected={selectedParentId === cat.id}
                          onClick={() => {
                            setSelectedParentId(cat.id);
                            if (cat.subcategories?.length > 0) {
                              setCategoryId(cat.subcategories[0].id);
                            } else {
                              setCategoryId(null);
                            }
                            if (fieldErrors.categoryId) {
                              setFieldErrors({ ...fieldErrors, categoryId: undefined });
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {categoryError && <p className="sf-error">{categoryError}</p>}
                </div>

                {/* Subcategories */}
                {subCategories.length > 0 && (
                  <SubCategoryChips
                    items={subCategories.map((s) => ({ id: s.id, name: displayName(s.name) }))}
                    selectedId={categoryId}
                    onSelect={(id) => {
                      setCategoryId(id);
                      if (fieldErrors.categoryId) {
                        setFieldErrors({ ...fieldErrors, categoryId: undefined });
                      }
                    }}
                    required
                  />
                )}

                {/* Brand */}
                {brandOptions.length > 0 && (
                  <BrandSelector
                    items={brandOptions}
                    selectedId={selectedBrand}
                    onSelect={setSelectedBrand}
                  />
                )}

                {/* Description (shown once user picked a category) */}
                {categoryId && (
                  <ProblemDescriptionField
                    value={description}
                    onChange={(v) => {
                      setDescription(v);
                      if (fieldErrors.description) {
                        setFieldErrors({ ...fieldErrors, description: undefined });
                      }
                    }}
                    error={fieldErrors.description}
                  />
                )}

                {categoryId && isStep1Missing && (
                  <div className="surface-card-soft p-2.5 bg-danger-bg border-danger/30 text-danger text-[12px] sm:text-sm font-medium flex items-center gap-2 rounded-xl">
                    <IconAlertCircle size={14} stroke={1.6} />
                    في حاجة ناقصة في القسم ده.
                  </div>
                )}
              </motion.div>
            )}

            {/* === Step 2: Images === */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 sm:space-y-4"
              >
                <UploadBox
                  files={images}
                  onChange={(next) => {
                    setImages(next);
                    setUploadError(null);
                  }}
                  errorMessage={uploadError}
                />
              </motion.div>
            )}

            {/* === Step 3: Address === */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 sm:space-y-4"
              >
                <AddressForm
                  governorates={governorates}
                  cities={cities}
                  selectedGov={selectedGov}
                  selectedCity={selectedCity}
                  onSelectGov={(v) => {
                    setSelectedGov(v);
                    setSelectedCity("");
                    if (fieldErrors.governorate) {
                      setFieldErrors({ ...fieldErrors, governorate: undefined });
                    }
                  }}
                  onSelectCity={(v) => {
                    setSelectedCity(v);
                    if (fieldErrors.city) {
                      setFieldErrors({ ...fieldErrors, city: undefined });
                    }
                  }}
                  address={address}
                  onAddressChange={(v) => {
                    setAddress(v);
                    if (fieldErrors.address) {
                      setFieldErrors({ ...fieldErrors, address: undefined });
                    }
                  }}
                  phone={deliveryPhone}
                  onPhoneChange={(v) => {
                    setDeliveryPhone(v);
                    if (fieldErrors.phone) {
                      setFieldErrors({ ...fieldErrors, phone: undefined });
                    }
                  }}
                  notes={notes}
                  onNotesChange={setNotes}
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={handleLocationChange}
                  errors={fieldErrors}
                />
              </motion.div>
            )}

            {/* === Step 4: Review === */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <RequestReview
                  title={title}
                  items={[
                    {
                      label: "القسم الرئيسي",
                      value: displayName(currentParent?.name) || "—",
                      icon: IconLayoutGrid,
                    },
                    {
                      label: "التخصص الفرعي",
                      value:
                        displayName(
                          subCategories.find((s) => s.id === categoryId)?.name,
                        ) || "—",
                      icon: IconTag,
                    },
                    ...(selectedBrand
                      ? [
                          {
                            label: "الماركة",
                            value:
                              displayName(
                                brandOptions.find(
                                  (b: any) => b.id.toString() === selectedBrand,
                                )?.name,
                              ) || "—",
                            icon: IconDeviceMobile,
                          },
                        ]
                      : []),
                    {
                      label: "الموقع",
                      value: [
                        cities.find((c) => c.id.toString() === selectedCity)?.nameAr,
                        governorates.find((g) => g.id.toString() === selectedGov)?.nameAr,
                      ]
                        .filter(Boolean)
                        .join("، ") || "—",
                      icon: IconMapPin,
                    },
                    {
                      label: "العنوان",
                      value: address || "—",
                      icon: IconMapPin,
                      action: (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="text-[11px] sm:text-xs font-semibold text-primary hover:underline"
                        >
                          تعديل
                        </button>
                      ),
                    },
                    {
                      label: "رقم التواصل",
                      value: deliveryPhone,
                      icon: IconPhone,
                    },
                    {
                      label: "الصور المرفقة",
                      value: `${images.length} صورة`,
                      icon: IconPhoto,
                    },
                  ]}
                  notes={notes ? { label: "ملاحظات", value: notes } : null}
                  budgetSlot={
                    <div>
                      <label htmlFor="budget" className="sf-label flex items-center gap-1.5">
                        <IconCash size={14} className="text-primary" stroke={1.6} />
                        ميزانية تقديرية (اختياري)
                      </label>
                      <div className="relative">
                        <input
                          id="budget"
                          type="number"
                          value={budget}
                          onChange={(e) => {
                            setBudget(e.target.value);
                            if (fieldErrors.budget) {
                              setFieldErrors({ ...fieldErrors, budget: undefined });
                            }
                          }}
                          placeholder="مثال: 500"
                          aria-invalid={!!fieldErrors.budget}
                          className="sf-input pe-16"
                          dir="rtl"
                          min={1}
                          max={500000}
                        />
                        <span className="absolute top-1/2 -translate-y-1/2 start-4 text-sm font-bold text-slate-500">
                          ج.م
                        </span>
                      </div>
                      {fieldErrors.budget && <p className="sf-error">{fieldErrors.budget}</p>}
                    </div>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Bottom Navigation — sits above the global ClientNav */}
          <StickyActionBar
            onPrev={step > 1 ? prevStep : undefined}
            onNext={step < 4 ? nextStep : undefined}
            nextDisabled={nextDisabled}
            nextLoading={saving}
            isLastStep={step === 4}
            lastStepLabel={saving ? "جاري النشر..." : "نشر الطلب"}
          />
        </form>
      </div>
    </div>
  );
}
