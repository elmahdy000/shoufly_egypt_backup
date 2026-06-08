"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImprovedButton } from "@/components/ui/improved-button";
import { ImprovedAlert } from "@/components/ui/improved-alert";
import { FiMail, FiLock, FiShield, FiCpu, FiBriefcase, FiUser, FiZap } from "react-icons/fi";
import { loginUser } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("يا ريت تملى كل البيانات");
      return;
    }

    await performLogin(email, password);
  };

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginUser(loginEmail, loginPass);
      if (user.role === "ADMIN") router.push("/admin");
      else if (user.role === "CLIENT") router.push("/client");
      else if (user.role === "VENDOR") router.push("/vendor");
      else if (user.role === "DELIVERY") router.push("/delivery");
      else router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "فشل تسجيل الدخول. اتأكد من بياناتك وحاول تاني."
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col justify-center items-center p-4 sm:p-6 text-right dir-rtl font-sans"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Welcome */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex justify-center w-full mb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white shadow-lg hover:shadow-xl transition">
              <FiShield size={32} />
            </div>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">تسجيل الدخول</h1>
            <p className="text-slate-500 text-sm mt-1">أهلاً بيك في شوفلي</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">الإيميل</label>
              <div className="relative">
                <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-all text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">الباسورد</label>
                <Link href="#" className="text-xs text-primary hover:underline">نسيت الباسورد؟</Link>
              </div>
              <div className="relative">
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-all text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <ImprovedButton
              type="submit"
              full
              isLoading={isLoading}
              loadingText="بنسجل دخولك..."
            >
              تسجيل الدخول
            </ImprovedButton>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
             <p className="text-sm text-slate-500">
               معندكش حساب؟ <Link href="/register" className="text-primary font-medium hover:underline">اعمل حساب جديد</Link>
             </p>
          </div>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
               <div className="h-px bg-slate-200 flex-1" />
               <span className="text-xs text-slate-400">تسجيل سريع للمطورين</span>
               <div className="h-px bg-slate-200 flex-1" />
            </div>
            
            <div className="grid grid-cols-4 gap-3">
               <FastAccessBtn icon={<FiCpu />} label="أدمن" onClick={() => performLogin("admin@shoofly.com", "password123")} disabled={isLoading} />
               <FastAccessBtn icon={<FiUser />} label="عميل" onClick={() => performLogin("client1@shoofly.com", "password123")} disabled={isLoading} />
               <FastAccessBtn icon={<FiBriefcase />} label="تاجر" onClick={() => performLogin("vendor1@shoofly.com", "password123")} disabled={isLoading} />
               <FastAccessBtn icon={<FiZap />} label="مندوب" onClick={() => performLogin("delivery1@shoofly.com", "password123")} disabled={isLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FastAccessBtn({ icon, label, onClick, disabled }: { icon: React.ReactNode, label: string, onClick: () => void, disabled: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group disabled:opacity-50"
    >
       <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
         {icon}
       </div>
       <span className="text-xs font-medium text-slate-600">{label}</span>
    </button>
  );
}
