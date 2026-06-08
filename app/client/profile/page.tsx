"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/shoofly/button";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency } from "@/lib/formatters";
import { logoutUser } from "@/lib/api/auth";
import {
  FiUser, FiShield, FiLogOut, FiBell,
  FiArrowRight, FiChevronLeft, FiPackage, FiPhone,
  FiMail, FiEdit3, FiX, FiCheck, FiRefreshCw,
  FiAlertCircle, FiCalendar, FiDollarSign, FiMessageSquare
} from "react-icons/fi";

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  role: string;
  isActive: boolean;
  walletBalance: number;
  createdAt: string;
}

export default function ClientProfilePage() {
  const router = useRouter();
  const { data: user, loading, error, refresh } = useAsyncData<UserProfile>(
    () => apiFetch('/api/user/profile', 'CLIENT'), []
  );

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone verification state
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyStep, setVerifyStep] = useState<'idle' | 'code' | 'done'>('idle');
  const [verifyMsg, setVerifyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyCountdown, setVerifyCountdown] = useState(0);

  useEffect(() => {
    if (verifyCountdown <= 0) return;
    const t = setTimeout(() => setVerifyCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [verifyCountdown]);

  function openEdit() {
    setEditName(user?.fullName ?? '');
    setEditPhone(user?.phone ?? '');
    setSaveMsg(null);
    setEditing(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveMsg(null);
      await apiFetch('/api/user/profile', 'CLIENT', {
        method: 'PATCH',
        body: { fullName: editName, phone: editPhone },
      });
      setSaveMsg({ type: 'success', text: 'تم حفظ التغييرات بنجاح' });
      refresh();
      setTimeout(() => setEditing(false), 1200);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ' });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logoutUser();
    document.cookie = 'session_token=; Max-Age=0; path=/';
    router.push("/login");
  }

  async function sendOtp() {
    if (!verifyPhone.trim()) {
      setVerifyMsg({ type: 'error', text: 'اكتب رقم موبايلك الأول.' });
      return;
    }
    setVerifySending(true);
    setVerifyMsg(null);
    try {
      await apiFetch('/api/auth/phone/request-otp', 'CLIENT', {
        method: 'POST',
        body: { phone: verifyPhone },
      });
      setVerifyStep('code');
      setVerifyCountdown(60);
      setVerifyMsg({ type: 'success', text: 'تم إرسال الكود على الموبايل.' });
    } catch (err) {
      setVerifyMsg({ type: 'error', text: err instanceof Error ? err.message : 'فشل إرسال الكود.' });
    } finally {
      setVerifySending(false);
    }
  }

  async function submitOtp() {
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      setVerifyMsg({ type: 'error', text: 'اكتب الكود المكوّن من 6 أرقام.' });
      return;
    }
    setVerifySending(true);
    setVerifyMsg(null);
    try {
      await apiFetch('/api/auth/phone/verify-otp', 'CLIENT', {
        method: 'POST',
        body: { phone: verifyPhone, code: verifyCode },
      });
      setVerifyStep('done');
      setVerifyMsg({ type: 'success', text: 'تم تأكيد رقمك بنجاح! تقدر تعمل طلبات دلوقتي.' });
      refresh();
    } catch (err) {
      setVerifyMsg({ type: 'error', text: err instanceof Error ? err.message : 'الكود غير صحيح.' });
    } finally {
      setVerifySending(false);
    }
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('')
    : '؟';

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-5 font-sans text-right pb-28" dir="rtl">

      {/* Header */}
      <div>
        <Link href="/client" className="text-sm text-slate-500 hover:text-primary flex items-center gap-1 mb-2">
          <FiArrowRight size={14} /> الرئيسية
        </Link>
        <h1 className="text-xl font-bold text-slate-900">الملف الشخصي</h1>
      </div>

      {/* Avatar + Name card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        {loading ? (
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FiUser size={28} className="text-slate-300" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
            {initials}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            <div className="h-5 bg-slate-100 rounded-lg w-32 mx-auto" />
            <div className="h-4 bg-slate-100 rounded-lg w-48 mx-auto" />
          </div>
        ) : error ? (
          <p className="text-rose-500 text-sm">{error}</p>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-900">{user?.fullName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${user?.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                <FiShield size={11} /> {user?.isActive ? 'حساب نشط' : 'حساب معلق'}
              </span>
            </div>
          </>
        )}

        <button
          onClick={openEdit}
          disabled={loading || !!error}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-40"
        >
          <FiEdit3 size={15} /> تعديل البيانات
        </button>
      </div>

      {/* 📱 Phone verification card — required for creating requests */}
      {!loading && user && user.role === 'CLIENT' && !user.phoneVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <FiPhone size={18} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">أكّد رقم موبايلك</h3>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                لازم تأكد رقمك قبل ما تقدر تعمل طلب جديد. هنبعتلك كود 6 أرقام على الموبايل.
              </p>
            </div>
          </div>

          {verifyStep === 'idle' && (
            <div className="flex items-center gap-2">
              <input
                type="tel"
                inputMode="tel"
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
                placeholder={user.phone ?? '01XXXXXXXXX'}
                className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 outline-none"
              />
              <Button
                onClick={sendOtp}
                isLoading={verifySending}
                className="rounded-xl !bg-amber-600 hover:!bg-amber-700"
              >
                ابعت الكود
              </Button>
            </div>
          )}

          {verifyStep === 'code' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-800">
                الكود المكوّن من 6 أرقام
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-center text-2xl font-bold tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-amber-500 outline-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={submitOtp}
                  isLoading={verifySending}
                  className="flex-1 rounded-xl !bg-amber-600 hover:!bg-amber-700"
                >
                  أكّد الكود
                </Button>
                <Button
                  onClick={sendOtp}
                  isLoading={verifySending}
                  disabled={verifyCountdown > 0}
                  variant="secondary"
                  className="rounded-xl"
                >
                  {verifyCountdown > 0 ? `إعادة بعد ${verifyCountdown}ث` : 'إعادة الإرسال'}
                </Button>
              </div>
            </div>
          )}

          {verifyMsg && (
            <div
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                verifyMsg.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
              role="status"
            >
              {verifyMsg.text}
            </div>
          )}
        </div>
      )}

      {/* Info rows */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        <InfoRow icon={<FiPhone size={16} className="text-slate-500" />} label="رقم الهاتف"
          value={user?.phone ?? '—'} loading={loading} />
        <InfoRow icon={<FiMail size={16} className="text-slate-500" />} label="البريد الإلكتروني"
          value={user?.email ?? '—'} loading={loading} />
        <InfoRow icon={<FiDollarSign size={16} className="text-slate-500" />} label="رصيد المحفظة"
          value={user ? formatCurrency(Number(user.walletBalance)) : '—'} loading={loading} />
        <InfoRow icon={<FiCalendar size={16} className="text-slate-500" />} label="تاريخ الانضمام"
          value={user ? new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} loading={loading} />
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        <QuickLink href="/client/notifications" icon={<FiBell size={18} className="text-amber-500" />} label="الإشعارات" desc="عرض إشعاراتك" />
        <QuickLink href="/client/requests" icon={<FiPackage size={18} className="text-blue-500" />} label="طلباتي" desc="متابعة الطلبات" />
        <QuickLink href="/client/chat" icon={<FiMessageSquare size={18} className="text-violet-500" />} label="المحادثات" desc="رسائلك مع التجار" />
        <QuickLink href="/client/complaints" icon={<FiAlertCircle size={18} className="text-rose-500" />} label="تقديم شكوى" desc="الإبلاغ عن مشكلة" />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-semibold hover:bg-rose-100 transition-colors"
      >
        <FiLogOut size={16} /> تسجيل الخروج
      </button>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">تعديل البيانات</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1.5">الاسم الكامل</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1.5">رقم الهاتف</label>
                <input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>

            {saveMsg && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${saveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                {saveMsg.type === 'success' ? <FiCheck size={15} /> : <FiAlertCircle size={15} />}
                {saveMsg.text}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheck size={14} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string; loading: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        {loading
          ? <div className="h-4 bg-slate-100 rounded w-32 mt-1" />
          : <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</p>}
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <FiChevronLeft size={16} className="text-slate-300" />
    </Link>
  );
}
