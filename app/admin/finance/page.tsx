"use client";

import { useMemo, useState } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  TrendingUp, TrendingDown, DollarSign, 
  Search, Calendar, Filter, Download,
  ArrowUpRight, ArrowDownRight, CreditCard,
  History, ShieldCheck, X, FileText,
  PieChart, Activity, Wallet
} from "lucide-react";

interface Transaction {
  id: number;
  amount: number;
  type: string; // Real enum type
  description: string;
  createdAt: string;
}

const IN_TYPES = ["ESCROW_DEPOSIT", "WALLET_TOPUP", "ADMIN_COMMISSION"];

export default function AdminFinancePage() {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { data: transactions, loading } = useAsyncData<Transaction[]>(
    () => apiFetch("/api/admin/finance/transactions", "ADMIN"),
    []
  );

  const stats = useMemo(() => {
    const list = transactions ?? [];
    const totalIn = list.filter(t => IN_TYPES.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = list.filter(t => !IN_TYPES.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    return { income: totalIn, expense: totalOut, net: totalIn - totalOut };
  }, [transactions]);

  return (
    <div className="admin-page admin-page--spacious" dir="rtl">
      
      {/* 🚀 Header: Modern Financial Hub */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40 overflow-hidden">
        <div className="px-6 lg:px-10 py-8 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">نظام التدقيق المالي v3.4</span>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-r-4 border-emerald-500 pr-4">الخزانة <span className="text-emerald-600">المركزية</span></h1>
             <p className="text-sm text-slate-500 font-medium max-w-xl">رقابة شاملة على التدفقات النقدية، إدارة الميزانية، وتدقيق العمليات المالية.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
             <div className="relative group w-full sm:w-[350px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-all" size={18} />
                <input
                   placeholder="بحث في قيود العمليات..."
                   className="w-full pr-12 pl-4 h-11 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                />
             </div>
             <button className="h-11 px-6 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-2 text-sm">
                <Download size={18} /> استخراج تقارير
             </button>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 space-y-8">
        
        {/* 📊 Balance Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <FinMetric label="صافي المحفظة" val={stats.net} icon={Wallet} color="text-slate-600 bg-slate-100" net />
           <FinMetric label="إجمالي الإيرادات" val={stats.income} icon={TrendingUp} color="text-emerald-600 bg-emerald-50" />
           <FinMetric label="إجمالي المصروفات" val={stats.expense} icon={TrendingDown} color="text-rose-600 bg-rose-50" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* 📋 Ledger Entries */}
           <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                       <History size={20} />
                    </div>
                    <div>
                       <h2 className="text-lg font-bold text-slate-900">سجل المعاملات</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Audit Trail Active</p>
                    </div>
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-right border-collapse min-w-[800px]">
                    <thead>
                       <tr className="bg-slate-50 text-slate-500">
                          <th className="px-4 lg:px-8 py-4 text-[11px] font-bold uppercase tracking-wider">نوع العملية</th>
                          <th className="px-4 lg:px-8 py-4 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">التاريخ</th>
                          <th className="px-4 lg:px-8 py-4 text-[11px] font-bold uppercase tracking-wider">الوصف</th>
                          <th className="px-4 lg:px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-left">القيمة</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                         [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-20 bg-slate-50/30" /></tr>)
                       ) : transactions?.length === 0 ? (
                         <tr><td colSpan={4} className="py-20 text-center text-slate-300 text-lg font-bold opacity-40">لا توجد حركات مالية مسجلة</td></tr>
                       ) : (
                         transactions!.map(tx => {
                            const isIn = IN_TYPES.includes(tx.type);
                            const txLabel = {
                                ESCROW_DEPOSIT: "إيداع ضامن",
                                WALLET_TOPUP: "شحن محفظة",
                                ADMIN_COMMISSION: "عمولة منصة",
                                VENDOR_PAYOUT: "تحويل للمورد",
                                DELIVERY_PAYOUT: "تحويل للمندوب",
                                WITHDRAWAL: "طلب سحب",
                                REFUND: "استرداد مبلغ"
                            }[tx.type] || tx.type;

                            return (
                            <tr
                              key={tx.id}
                              onClick={() => setSelected(tx)}
                              className={`group cursor-pointer transition-all ${selected?.id === tx.id ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                            >
                               <td className="px-4 lg:px-8 py-5">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isIn ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                        {isIn ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                     </div>
                                     <span className="text-sm font-bold text-slate-700">{txLabel}</span>
                                  </div>
                               </td>
                               <td className="px-4 lg:px-8 py-5 text-xs font-bold text-slate-400 font-jakarta whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                               <td className="px-4 lg:px-8 py-5 text-sm font-bold text-slate-900 max-w-[150px] lg:max-w-none truncate">{tx.description}</td>
                               <td className={`px-4 lg:px-8 py-5 text-left font-jakarta text-lg font-bold tracking-tight ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isIn ? '+' : '-'}{formatCurrency(tx.amount)}
                               </td>
                            </tr>
                            );
                          })
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* 🛡️ Audit Inspector */}
              {selected ? (
                 <aside
                    className="lg:col-span-4 bg-white rounded-2xl p-4 lg:p-8 border border-slate-200 shadow-sm lg:sticky lg:top-28 space-y-8 overflow-hidden"
                 >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6 text-slate-900">
                       <h2 className="text-lg font-bold">تدقيق العملية</h2>
                       <button onClick={() => setSelected(null)} className="p-2 bg-slate-100 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-all"><X size={18} /></button>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">القيد المالي #TX_{selected.id}</p>
                          <div className="space-y-2">
                             <h4 className="text-2xl font-bold tracking-tight text-slate-900 font-jakarta leading-none">{formatCurrency(selected.amount)}</h4>
                             <p className={`text-sm font-bold flex items-center gap-2 ${IN_TYPES.includes(selected.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {IN_TYPES.includes(selected.type) ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {IN_TYPES.includes(selected.type) ? 'تحويل وارد' : 'تحويل صادر'}
                             </p>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <FDetailBox icon={<Calendar size={18} />} label="تاريخ التنفيذ" value={formatDate(selected.createdAt)} />
                          <FDetailBox icon={<FileText size={18} />} label="وصف القيد" value={selected.description} highlight />
                          <FDetailBox icon={<ShieldCheck size={18} />} label="الحالة الأمنية" value="عملية موثقة" />
                       </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                       <button className="w-full h-14 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                          <Download size={24} /> استخراج الفاتورة
                       </button>
                    </div>
                 </aside>
              ) : (
                <div className="lg:col-span-4 h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-4">
                   <CreditCard size={48} className="opacity-20" />
                   <p className="text-sm font-medium">اختر عملية لعرض تفاصيل التدقيق</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

function FinMetric({ label, val, icon: Icon, color, net }: any) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-2xl flex items-center gap-8 shadow-sm hover:shadow-md transition-all">
       <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center shadow-sm border border-black/5`}>
          <Icon size={28} />
       </div>
       <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <p className={`text-2xl font-bold font-jakarta leading-none mt-1 ${net && val < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
             {formatCurrency(val).split('.')[0]}
          </p>
       </div>
    </div>
  );
}

function FDetailBox({ icon, label, value, highlight }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
       <div className="flex items-center gap-3">
          <span className="text-slate-400">{icon}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
       </div>
       <span className={`text-sm font-bold ${highlight ? 'text-emerald-700' : 'text-slate-900'} font-jakarta`}>{value}</span>
    </div>
   );
}
