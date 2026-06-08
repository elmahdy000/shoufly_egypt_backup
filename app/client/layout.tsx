import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { ClientNav } from "@/components/navigation/client-nav";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserFromCookie();

  if (!user) {
    redirect("/login?callbackUrl=/client");
  }

  if (user.role !== "CLIENT") {
    if (user.role === "VENDOR") redirect("/vendor");
    if (user.role === "DELIVERY") redirect("/delivery");
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/");
  }

  // Handle deactivated client accounts
  if (!user.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-rose-100">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-tajawal">حسابك معطل حالياً</h2>
          <p className="text-slate-600 mb-6 font-tajawal">
            عذراً، يبدو أن حسابك تم تعطيله من قبل الإدارة. يرجى التواصل مع الدعم الفني للمزيد من المعلومات.
          </p>
          <a 
            href="/logout" 
            className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold font-tajawal"
          >
            تسجيل الخروج
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader title="شوفلي" subtitle="اطلب أي خدمة من موردين موثوقين" />
      <PageShell>{children}</PageShell>
      <ClientNav />
    </div>
  );
}
