"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button 
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className="h-10 px-4 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-primary transition-colors shadow-sm gap-2"
      >
        <FiChevronRight size={16} /> السابق
      </button>
      
      <div className="h-10 px-6 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-xs font-black tracking-widest text-slate-500 shadow-sm">
        صفحة {page} من {totalPages}
      </div>
      
      <button 
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        className="h-10 px-4 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-primary transition-colors shadow-sm gap-2"
      >
        التالي <FiChevronLeft size={16} />
      </button>
    </div>
  );
}
