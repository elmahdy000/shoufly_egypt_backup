"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/shoofly/button";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { 
  FiUser, 
  FiBriefcase, 
  FiCheckCircle, 
  FiSave, 
  FiLogOut, 
  FiSettings,
  FiAlertCircle, 
  FiCheck,
  FiPhone,
  FiMapPin,
  FiMap,
  FiChevronDown,
  FiChevronLeft,
  FiUpload,
  FiCamera,
  FiClock
} from "react-icons/fi";
import { logoutUser } from "@/lib/api/auth";
import { apiFetch } from "@/lib/api/client";

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: SubCategory[];
  _count: { subcategories: number };
}

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number;
  requiresBrand: boolean;
  brandType: string;
}

interface Brand {
  id: number;
  name: string;
  type: string;
}

export default function VendorProfilePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [allBrands, setAllBrands] = useState<Record<string, Brand[]>>({});
  // Tracks brand types that have an in-flight fetch to avoid duplicate concurrent requests
  // (and any re-render-induced ping-pong).
  const inflightBrandsRef = useRef<Set<string>>(new Set());

  // Fetch categories with subcategories tree
  const { data: cats, loading: catsLoading } = useAsyncData(() => apiFetch<Category[]>('/api/categories/tree', "VENDOR"), []);
  const { data: profile, loading: profileLoading, refresh: refreshProfile } = useAsyncData(() => apiFetch<any>('/api/auth/me', "VENDOR"), []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [kycFiles, setKycFiles] = useState<{ front: File | null; back: File | null }>({ front: null, back: null });
  const [uploadingKyc, setUploadingKyc] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setVendorAddress(profile.vendorAddress || "");
      if (profile.latitude && profile.longitude) {
        setCoords({ lat: profile.latitude, lng: profile.longitude });
      }
      setSelectedCats(profile.vendorCategories?.map((vc: any) => vc.categoryId) || []);
      setSelectedBrands(profile.vendorBrands?.map((vb: any) => vb.brandId) || []);
    }
  }, [profile]);

  // Fetch brands for needed types when categories or selections change
  useEffect(() => {
    if (!cats) return;
    const neededTypes = new Set<string>();
    cats.forEach(c => {
      c.subcategories.forEach(sub => {
        if (sub.requiresBrand && sub.brandType && selectedCats.includes(sub.id)) {
          neededTypes.add(sub.brandType);
        }
      });
    });

    neededTypes.forEach(type => {
      if (allBrands[type] || inflightBrandsRef.current.has(type)) return;
      inflightBrandsRef.current.add(type);
      apiFetch<Brand[]>(`/api/brands?type=${type}`, "VENDOR")
        .then(data => {
          setAllBrands(prev => ({ ...prev, [type]: data }));
        })
        .catch(() => {
          // Release the in-flight flag on failure so a future re-render can retry.
          inflightBrandsRef.current.delete(type);
        });
    });
  }, [cats, selectedCats, allBrands]);

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  const toggleCategory = (id: number) => {
    setSelectedCats(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleBrand = (id: number) => {
    setSelectedBrands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const isAllSubcategoriesSelected = (category: Category) => {
    if (category.subcategories.length === 0) return false;
    return category.subcategories.every(sub => selectedCats.includes(sub.id));
  };

  const selectAllSubcategories = (category: Category) => {
    const allSelected = isAllSubcategoriesSelected(category);
    if (allSelected) {
      // Deselect all subcategories
      setSelectedCats(prev => prev.filter(id => !category.subcategories.some(sub => sub.id === id)));
    } else {
      // Select all subcategories
      const subIds = category.subcategories.map(sub => sub.id);
      setSelectedCats(prev => [...new Set([...prev, ...subIds])]);
    }
  };

  const handleKycUpload = async () => {
    if (!kycFiles.front || !kycFiles.back) {
      setMessage({ text: "يا ريت ترفع صورة وش وضهر البطاقة الأول", type: 'error' });
      return;
    }

    setUploadingKyc(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('front', kycFiles.front);
      formData.append('back', kycFiles.back);

      const data = await apiFetch<any>('/api/upload/kyc', 'VENDOR', {
        method: 'POST',
        body: formData,
      });
      
      setMessage({ text: "تم رفع صور البطاقة بنجاح، الإدارة هتراجعها في أسرع وقت!", type: 'success' });
      refreshProfile();
      setKycFiles({ front: null, back: null });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "حصلت مشكلة وإحنا بنرفع الصور", type: 'error' });
    } finally {
      setUploadingKyc(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/api/vendor/profile', "VENDOR", {
        method: "PATCH",
        body: { 
          fullName, 
          phone, 
          vendorAddress,
          latitude: coords?.lat,
          longitude: coords?.lng,
          categoryIds: selectedCats, 
          brandIds: selectedBrands 
        }
      });
      setMessage({ text: "تم تحديث البيانات بنجاح!", type: 'success' });
      refreshProfile();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "فشل تحديث البيانات", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const isLoading = catsLoading || profileLoading;

  return (
    <div className="font-sans dir-rtl text-right">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 space-y-4">
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
             {message.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />} 
             {message.text}
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-xl border border-[#E7E7E7] shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                profile?.verificationStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
                profile?.verificationStatus === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <FiSettings size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-[#0F1111]">حالة الحساب</h2>
              <div className="flex items-center gap-2 mt-1">
                {profile?.verificationStatus === 'APPROVED' ? (
                  <>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-sm text-emerald-600 font-medium">حساب موثق وجاهز للشغل</span>
                  </>
                ) : profile?.verificationStatus === 'PENDING' ? (
                  <>
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-sm text-amber-600 font-medium">طلب التوثيق قيد المراجعة</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-slate-400 rounded-full" />
                    <span className="text-sm text-slate-500 font-medium">حساب غير موثق (ارفع البطاقة)</span>
                  </>
                )}
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 text-rose-500 font-medium hover:bg-rose-50 p-2 rounded-lg transition-all text-xs"
            >
               <FiLogOut size={16} /> خروج
            </button>
          </div>
        </div>

        {/* KYC Verification Card - hidden once verified (APPROVED) or while under review (PENDING) */}
        {profile?.verificationStatus !== 'APPROVED' && profile?.verificationStatus !== 'PENDING' && (
          <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 bg-amber-400 h-full" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <FiCamera size={16} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#0F1111]">توثيق الهوية (مهم جداً)</h2>
                <p className="text-[11px] text-[#565959]">عشان تقدر تسحب فلوسك، لازم ترفع صورة البطاقة الشخصية</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
               {/* Front Side */}
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">وش البطاقة</p>
                  <label className={`flex flex-col items-center justify-center aspect-[1.6/1] rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    kycFiles.front ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                  }`}>
                    {kycFiles.front ? (
                      <div className="text-center p-4">
                        <FiCheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-emerald-700">{kycFiles.front.name}</p>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <FiUpload size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-500">اضغط لرفع وش البطاقة</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => setKycFiles(p => ({ ...p, front: e.target.files?.[0] || null }))}
                    />
                  </label>
               </div>

               {/* Back Side */}
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ظهر البطاقة</p>
                  <label className={`flex flex-col items-center justify-center aspect-[1.6/1] rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    kycFiles.back ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                  }`}>
                    {kycFiles.back ? (
                      <div className="text-center p-4">
                        <FiCheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-emerald-700">{kycFiles.back.name}</p>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <FiUpload size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-500">اضغط لرفع ظهر البطاقة</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => setKycFiles(p => ({ ...p, back: e.target.files?.[0] || null }))}
                    />
                  </label>
               </div>
            </div>

            <Button 
              onClick={handleKycUpload}
              isLoading={uploadingKyc}
              disabled={profile?.verificationStatus === 'PENDING'}
              className={`w-full ${profile?.verificationStatus === 'PENDING' ? 'bg-slate-100 text-slate-400' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}
            >
               {profile?.verificationStatus === 'PENDING' ? (
                 <span className="flex items-center gap-2"><FiClock /> الطلب قيد المراجعة</span>
               ) : (
                 <span className="flex items-center gap-2"><FiSave /> إرسال لطلب التوثيق</span>
               )}
            </Button>
          </div>
        )}

        {/* Basic Info Card */}
        <div className="bg-white rounded-xl border border-[#E7E7E7] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FiUser size={16} />
            </div>
            <h2 className="font-semibold text-sm text-[#0F1111]">البيانات الأساسية</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#565959] font-medium block mb-2">الاسم / النشاط التجاري</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-[#E7E7E7] px-4 py-3 rounded-xl outline-none focus:border-primary font-semibold text-[#0F1111] transition-all" 
                placeholder="أدخل اسمك أو اسم شركتك"
              />
            </div>
            <div>
              <label className="text-xs text-[#565959] font-medium block mb-2">هاتف التواصل</label>
              <div className="relative">
                <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-[#767684]" size={18} />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-50 border border-[#E7E7E7] px-4 pr-12 py-3 rounded-xl outline-none focus:border-primary font-semibold text-[#0F1111] text-left transition-all" 
                  placeholder="+20 XXX XXX XXXX"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Store Location Card */}
        <div className="bg-white rounded-xl border border-[#E7E7E7] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FiMapPin size={16} />
            </div>
            <h2 className="font-semibold text-sm text-[#0F1111]">موقع المتجر / الاستلام</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#565959] font-medium block mb-2">العنوان بالتفصيل (للمندوب)</label>
              <textarea 
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-[#E7E7E7] px-4 py-3 rounded-xl outline-none focus:border-primary font-medium text-[#0F1111] transition-all text-sm" 
                placeholder="مثلاً: شارع التسعين، مول كذا، الدور الثاني..."
              />
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 mb-1">الإحداثيات الجغرافية (GPS)</p>
                    {coords ? (
                      <p className="text-[10px] text-emerald-600 font-mono">
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-rose-400">لم يتم تحديد الموقع بدقة</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-[11px] font-black text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm"
                  >
                    <FiMap size={14} /> تحديد موقعي الحالي
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Categories Card - Hierarchical Tree */}
        <div className="bg-white rounded-xl border border-[#E7E7E7] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <FiBriefcase size={16} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm text-[#0F1111]">تخصصات العمل</h2>
              <p className="text-xs text-[#565959]">اختر التخصصات والفئات الفرعية</p>
            </div>
            {selectedCats.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                {selectedCats.length} محدد
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-[#767684]">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">جاري تحميل التخصصات...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(cats ?? []).map((category: Category) => (
                <div key={category.id} className="border border-[#E7E7E7] rounded-xl overflow-hidden bg-slate-50">
                  {/* Parent Category Header */}
                  <div 
                    className="flex items-center gap-3 p-3 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(category.id)}
                  >
                    <div className="text-amber-500">
                      {expandedCategories.includes(category.id) ? (
                        <FiChevronDown size={20} />
                      ) : (
                        <FiChevronLeft size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm text-[#0F1111]">{category.name}</span>
                      <span className="text-xs text-[#565959] mr-2">
                        ({category._count.subcategories} فرعي)
                      </span>
                    </div>
                    {category._count.subcategories > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); selectAllSubcategories(category); }}
                        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                          isAllSubcategoriesSelected(category)
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary'
                        }`}
                      >
                        {isAllSubcategoriesSelected(category) ? 'إلغاء الكل' : 'تحديد الكل'}
                      </button>
                    )}
                  </div>
                  
                  {/* Subcategories List */}
                  {expandedCategories.includes(category.id) && category.subcategories.length > 0 && (
                    <div className="p-3 space-y-2 border-t border-[#E7E7E7]">
                      {category.subcategories.map((sub) => {
                        const brandsForThis = sub.requiresBrand ? allBrands[sub.brandType] || [] : [];
                        const isSelected = selectedCats.includes(sub.id);

                        return (
                          <div key={sub.id} className="space-y-2">
                             <label 
                               className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                 isSelected 
                                   ? 'bg-primary/5 border border-primary text-primary' 
                                   : 'bg-white border border-[#E7E7E7] hover:border-primary/30'
                               }`}
                             >
                               <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                                 isSelected 
                                   ? 'bg-primary border-primary text-white' 
                                   : 'bg-white border-[#E7E7E7]'
                               }`}>
                                 {isSelected && <FiCheck size={12} strokeWidth={3} />}
                               </div>
                               <span className="font-medium text-sm flex-1">{sub.name}</span>
                               <input 
                                 type="checkbox" 
                                 className="hidden"
                                 checked={isSelected}
                                 onChange={() => toggleCategory(sub.id)}
                               />
                             </label>

                             {/* Brands List for this Subcategory */}
                             {isSelected && sub.requiresBrand && (
                               <div className="mr-8 p-3 bg-white border border-dashed border-slate-200 rounded-xl">
                                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">الأنواع / الماركات المتاحة</p>
                                  <div className="flex flex-wrap gap-2">
                                     {brandsForThis.length === 0 ? (
                                       <span className="text-xs text-slate-400">جاري التحميل...</span>
                                     ) : brandsForThis.map(brand => (
                                       <button
                                         key={brand.id}
                                         type="button"
                                         onClick={() => toggleBrand(brand.id)}
                                         className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                           selectedBrands.includes(brand.id)
                                             ? 'bg-primary text-white border-primary border-b-2 active:border-b-0 translate-y-[-1px] active:translate-y-0'
                                             : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                                         }`}
                                       >
                                         {brand.name}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave} 
          isLoading={saving} 
          className="w-full h-11 text-sm font-semibold"
        >
          <FiSave size={16} className="ml-1.5" /> حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}
