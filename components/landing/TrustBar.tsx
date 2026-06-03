import React from "react";
import { TrustMetric } from "@/lib/types/landing";
import { LandingCard } from "./shared/Primitives";

interface TrustBarProps {
  metrics: TrustMetric[];
}

export const TrustBar = React.memo(({ metrics }: TrustBarProps) => {
  if (metrics.length === 0) return null;

  return (
    <section className="space-y-4">
      <p className="text-[11px] font-black text-slate-500 pr-3 border-r-4 border-primary/20">ليه الناس بتعتمد على شوفلي؟</p>
      <LandingCard variant="dark" className={`p-8 md:p-10 grid grid-cols-2 lg:grid-cols-${Math.min(metrics.length, 4)} gap-y-12 gap-x-0`}>
        {metrics.map((stat, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col items-center text-center px-6 relative ${
              idx !== metrics.length - 1 && (idx + 1) % (metrics.length > 2 ? 4 : 2) !== 0 
              ? "lg:border-l lg:border-white/10" 
              : ""
            }`}
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-inner mb-5">
              <stat.icon size={22} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-2xl font-black tracking-tighter leading-none">{stat.value}</div>
              <div className="text-white text-[13px] font-extrabold">{stat.label}</div>
              <p className="text-[10px] font-bold text-white/40 leading-relaxed">{stat.sub}</p>
            </div>
          </div>
        ))}
      </LandingCard>
      <p className="text-[11px] text-center text-slate-400 font-extrabold">انضم لآلاف المستخدمين اللي بيثقوا فينا كل يوم</p>
    </section>
  );
});

TrustBar.displayName = "TrustBar";
