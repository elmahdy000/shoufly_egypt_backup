"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiShield, FiZap, FiCpu } from "react-icons/fi";

export function ShooflyLoader({ 
  message = "بنجيبلك أحسن العروض في ثواني", 
  fullPage = true 
}: { 
  message?: string;
  fullPage?: boolean;
}) {
  return (
    <div className={`${fullPage ? 'fixed inset-0 z-[9999]' : 'w-full h-64'} flex flex-col items-center justify-center bg-white/80 backdrop-blur-md`}>
      <div className="relative">
        {/* Outer Orbiting Elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -m-12 w-[calc(100%+6rem)] h-[calc(100%+6rem)] border-2 border-dashed border-primary/20 rounded-full"
        >
           <motion.div 
             animate={{ scale: [1, 1.2, 1] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)]" 
           />
        </motion.div>

        {/* Pulsing Rings */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 -m-8 rounded-full border-2 border-primary/20"
        />

        {/* Central Logo Box */}
        <motion.div
          animate={{
            y: [-8, 8, -8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-24 h-24 bg-primary text-white rounded-[2rem] shadow-2xl flex items-center justify-center overflow-hidden"
        >
          {/* Shine effect */}
          <motion.div
            animate={{ left: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-12 bg-white/30 skew-x-[25deg] blur-sm"
          />
          
          <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <FiShield size={48} className="drop-shadow-lg" />
          </motion.div>
        </motion.div>

        {/* Orbiting Icons */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <OrbitIcon icon={<FiZap />} delay={0} radius={70} />
           <OrbitIcon icon={<FiCpu />} delay={1} radius={70} />
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-16 text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2"
        >
           <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
           <h2 className="text-2xl font-black text-slate-900 tracking-tight" dir="rtl">
             شوفلي <span className="text-primary">بيتحرك</span>...
           </h2>
        </motion.div>
        
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-slate-500 font-bold text-sm px-6"
          dir="rtl"
        >
          {message}
        </motion.p>
      </div>

      {/* Progress Bar (Decorative) */}
      <div className="mt-10 w-56 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-full w-2/3 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.4)]"
        />
      </div>
    </div>
  );
}

function OrbitIcon({ icon, delay, radius }: { icon: React.ReactNode, delay: number, radius: number }) {
  return (
    <motion.div
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      className="absolute flex items-center justify-center"
      style={{ width: radius * 2, height: radius * 2 }}
    >
      <motion.div
        animate={{ scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, delay }}
        className="absolute top-0 w-8 h-8 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center text-primary"
      >
        {icon}
      </motion.div>
    </motion.div>
  );
}

export default ShooflyLoader;

