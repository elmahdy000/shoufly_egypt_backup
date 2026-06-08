import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import SupportChatWidget from "@/components/support/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "شوفلي — اطلب أي خدمة في ثانية",
    template: "%s | شوفلي",
  },
  description:
    "منصة شوفلي بتوصلك بأحسن الصنايعية والموردين المعتمدين في مصر. اطلب خدمتك واستلم عروض أسعار في لحظتها من مئات المتخصصين.",
  applicationName: "شوفلي",
  keywords: [
    "خدمات منزلية",
    "صيانة",
    "شوفلي",
    "توصيل",
    "مزادات خدمات",
    "موردين مصر",
    "أحسن أسعار",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "شوفلي",
    title: "شوفلي — اطلب أي خدمة في ثانية",
    description:
      "منصة شوفلي بتوصلك بأحسن الصنايعية والموردين المعتمدين في مصر.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "شوفلي — منصة الخدمات الذكية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شوفلي — اطلب أي خدمة في ثانية",
    description: "اطلب خدمتك واستلم عروض أسعار في لحظتها من مئات المتخصصين.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "شوفلي",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ff6a00",
  viewportFit: "cover",
};

import { PageTransition } from "@/components/providers/page-transition";
import { MobileBottomNav } from "@/components/landing/MobileBottomNav";
import { getCurrentUserFromCookie } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserFromCookie();

  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body 
        className="min-h-full font-tajawal bg-slate-50 text-foreground selection:bg-primary/20"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ToastProvider>
            <div className="min-h-screen">
              <PageTransition>
                {children}
              </PageTransition>
              <MobileBottomNav userRole={user?.role} />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
