"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/shoofly/button";
import { formatDate, splitCurrency } from "@/lib/formatters";
import { listClientTransactions, topupClientWallet, withdrawClientWallet, getClientBalance } from "@/lib/api/transactions";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import { 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiClock, 
  FiPlusCircle, 
  FiShield, 
  FiTrendingUp, 
  FiDownload,
  FiArrowLeft,
  FiDollarSign,
  FiHelpCircle,
  FiInfo,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiHome,
  FiCreditCard
} from "react-icons/fi";

// Payment Provider Types
type PaymentProvider = 'vodafone_cash' | 'instapay' | 'stripe' | 'wallet';

// Custom Payment Provider Icons
const VodafoneCashIcon = () => (
  <svg viewBox="0 0 40 40" className="w-8 h-8">
    <circle cx="20" cy="20" r="18" fill="#E60000"/>
    <text x="20" y="24" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">V</text>
  </svg>
);

const InstaPayIcon = () => (
  <svg viewBox="0 0 40 40" className="w-8 h-8">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="#7C3AED"/>
    <circle cx="14" cy="20" r="4" fill="white"/>
    <circle cx="26" cy="14" r="3" fill="white" opacity="0.8"/>
    <circle cx="26" cy="26" r="3" fill="white" opacity="0.6"/>
    <path d="M18 20 L23 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M18 20 L23 25" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const StripeIcon = () => (
  <svg viewBox="0 0 40 40" className="w-8 h-8">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="#635BFF"/>
    <path d="M20 12 C14 12 12 16 12 20 C12 26 16 28 20 28 C24 28 28 26 28 20 C28 16 26 12 20 12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M16 18 L18 22 L24 16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 40 40" className="w-8 h-8">
    <rect x="4" y="8" width="32" height="24" rx="6" fill="#10B981"/>
    <rect x="8" y="12" width="24" height="4" rx="2" fill="white" opacity="0.3"/>
    <circle cx="28" cy="20" r="3" fill="white"/>
  </svg>
);

interface PaymentMethod {
  id: PaymentProvider;
  name: string;
  nameAr: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBorder: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fees: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'vodafone_cash',
    name: 'Vodafone Cash',
    nameAr: 'فودافون كاش',
    icon: <VodafoneCashIcon />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    hoverBorder: 'hover:border-red-300',
    description: 'تحويل فوري عبر محفظة فودافون كاش',
    minAmount: 10,
    maxAmount: 50000,
    processingTime: 'فوري',
    fees: 'بدون رسوم'
  },
  {
    id: 'instapay',
    name: 'InstaPay',
    nameAr: 'إنستا باي',
    icon: <InstaPayIcon />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-100',
    hoverBorder: 'hover:border-violet-300',
    description: 'تحويل سريع عبر شبكة إنستا باي',
    minAmount: 5,
    maxAmount: 100000,
    processingTime: 'فوري',
    fees: 'بدون رسوم'
  },
  {
    id: 'stripe',
    name: 'Stripe / Card',
    nameAr: 'بطاقة ائتمان',
    icon: <StripeIcon />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-300',
    description: 'دفع آمن ببطاقة Visa أو Mastercard',
    minAmount: 1,
    maxAmount: 999999,
    processingTime: 'فوري',
    fees: '2.9% + 3 جنيه'
  },
  {
    id: 'wallet',
    name: 'Other Wallet',
    nameAr: 'محفظة إلكترونية',
    icon: <WalletIcon />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    hoverBorder: 'hover:border-emerald-300',
    description: 'أورانج كاش، وي باي، أو أي محفظة أخرى',
    minAmount: 10,
    maxAmount: 50000,
    processingTime: 'فوري',
    fees: 'بدون رسوم'
  }
];

// Payment Steps
type PaymentStep = 'select_method' | 'enter_amount' | 'confirm_details' | 'processing' | 'success' | 'error';

export default function WalletPage() {
  const { data: transactions, loading: txLoading, error: txError, refresh: refreshTxs } = useAsyncData(() => listClientTransactions(), []);
  const { data: balanceData, loading: balLoading, error: balError, refresh: refreshBal } = useAsyncData(() => getClientBalance(), []);

  useEffect(() => {
    // Shared SSE listener — refresh on any wallet-related notification
    const FINANCIAL_TYPES = new Set(["WALLET_TOPUP", "PAYMENT_RECEIVED", "PAYMENT_FAILED", "REFUND"]);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type !== "notification") return;
      const innerType = (payload.data as { type?: string } | null)?.type;
      if (innerType && FINANCIAL_TYPES.has(innerType)) {
        void refreshTxs();
        void refreshBal();
      }
    });
    return unsubscribe;
  }, [refreshTxs, refreshBal]);

  const ledger = useMemo(() => {
    const available = balanceData?.balance ?? 0;
    let onHold = 0;
    let totalDeposits = 0;

    (transactions ?? []).forEach((t: { amount?: number | string; type: string }) => {
      const amount = Number(t.amount ?? 0);
      if (t.type === "WALLET_TOPUP" || t.type === "REFUND") {
        totalDeposits += amount;
      }
      if (t.type === "ESCROW_DEPOSIT") {
        onHold += amount;
      }
    });

    return { 
      available,
      onHold, 
      totalDeposits 
    };
  }, [transactions, balanceData]);

  const loading = txLoading || balLoading;
  const error = txError || balError;

  // Enhanced Top-up State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select_method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Withdraw State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'wallet'>('wallet');

  const resetTopupFlow = () => {
    setShowTopupModal(false);
    setPaymentStep('select_method');
    setSelectedMethod(null);
    setAmountInput("");
    setPaymentError(null);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentStep('enter_amount');
  };

  const handleAmountConfirm = () => {
    const amount = Number(amountInput);
    if (!selectedMethod || isNaN(amount) || amount <= 0) {
      setPaymentError('الرجاء إدخال مبلغ صحيح');
      return;
    }
    if (amount < selectedMethod.minAmount) {
      setPaymentError(`الحد الأدنى للشحن ${selectedMethod.minAmount} جنيه`);
      return;
    }
    if (amount > selectedMethod.maxAmount) {
      setPaymentError(`الحد الأقصى للشحن ${selectedMethod.maxAmount} جنيه`);
      return;
    }
    setPaymentError(null);
    setPaymentStep('confirm_details');
  };

  const executeTopup = async () => {
    const amount = Number(amountInput);
    if (!selectedMethod || isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      const response = await topupClientWallet(amount, selectedMethod.id);

      if (response.redirectUrl) {
        const successUrl = new URL('/payments/success', window.location.origin);
        successUrl.searchParams.set('txnId', response.transactionId?.toString() || '');
        successUrl.searchParams.set('amount', amount.toString());
        const fullRedirectUrl = new URL(response.redirectUrl);
        fullRedirectUrl.searchParams.set('callback', successUrl.toString());
        // Browser is about to navigate — no need to reset state. The `finally`
        // would still fire, but isProcessing(true) on a page that's unloading is harmless.
        window.location.href = fullRedirectUrl.toString();
        return;
      }

      setPaymentStep('success');
      // Keep isProcessing=true: the page is about to reload.
      window.setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "فشلت عملية الشحن");
      setPaymentStep('error');
    } finally {
      // Only reset on the in-page paths. The redirect paths either
      // succeed (page unloads) or fail silently (we still recover control).
      setIsProcessing(false);
    }
  };

  const executeWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) { setPaymentError("الرجاء إدخال مبلغ صحيح"); return; }
    if (amount > ledger.available) { setPaymentError("رصيد غير كافٍ"); return; }
    setPaymentError(null);
    try {
      setIsProcessing(true);
      await withdrawClientWallet(amount, withdrawMethod);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      window.location.reload();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "فشلت عملية السحب");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 lg:pb-10 font-sans dir-rtl text-right">
      {/* Page Header - Consistent with Client Dashboard */}
      <div className="bg-white border-b border-[#E7E7E7]">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/client" 
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            >
              <FiArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0F1111]">المحفظة</h1>
              <p className="text-sm text-[#565959] font-medium mt-0.5">تابع رصيدك وفلوسك من هنا</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 space-y-6">

      {(loading || isProcessing) && !showTopupModal && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
           <FiShield size={32} className="mb-3 opacity-50 animate-pulse" />
           <p className="text-sm font-medium">جاري التحميل...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
          {error}
        </div>
      )}

      {!(loading || isProcessing) && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E7E7E7] shadow-sm p-6 space-y-6">
              
              {/* Balance Display */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#565959]">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center">
                    <FiDollarSign size={14} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium">الرصيد اللي معاك</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-[#0F1111]">
                    {splitCurrency(ledger.available).amount}
                  </span>
                  <span className="text-base font-semibold text-[#767684]">
                    {splitCurrency(ledger.available).unit}
                  </span>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-[#E7E7E7]" />
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowTopupModal(true)} 
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#E7E7E7] hover:border-[#FF5A00]/50 hover:bg-[#FF5A00]/5 bg-white transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <FiPlusCircle size={20} />
                  </div>
                  <span className="text-sm font-semibold text-[#0F1111]">اشحن</span>
                </button>
                
                <button 
                  onClick={() => setShowWithdrawModal(true)} 
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#E7E7E7] hover:border-amber-500/50 hover:bg-amber-50/50 bg-white transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <FiArrowDownLeft size={20} />
                  </div>
                  <span className="text-sm font-semibold text-[#0F1111]">اسحب</span>
                </button>
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* On Hold */}
              <Link href="/client/requests" className="block">
                <div className="bg-white rounded-2xl border border-[#E7E7E7] shadow-sm p-5 hover:border-[#FF5A00]/50 hover:shadow-md transition-all cursor-pointer group" title="المبلغ المحجوز للطلبات النشطة - اضغط لعرض طلباتك">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <FiShield size={20} />
                    </div>
                    <p className="text-sm text-[#565959] font-medium">فلوس محجوزة للطلبات</p>
                    <FiArrowLeft size={16} className="text-slate-300 mr-auto group-hover:text-[#FF5A00] transition-colors" />
                  </div>
                  <p className="text-xl font-bold text-[#0F1111]">{splitCurrency(ledger.onHold).amount} <span className="text-sm font-semibold text-[#767684]">{splitCurrency(ledger.onHold).unit}</span></p>
                </div>
              </Link>
              
              {/* Total Deposits */}
              <div className="bg-white rounded-2xl border border-[#E7E7E7] shadow-sm p-5 cursor-help hover:border-emerald-300 hover:shadow-md transition-all" title="إجمالي كل الشحنات التي قمت بها لمحفظتك">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <FiTrendingUp size={20} />
                  </div>
                  <p className="text-sm text-[#565959] font-medium">إجمالي شحناتك</p>
                  <FiInfo size={16} className="text-slate-300 mr-auto" />
                </div>
                <p className="text-xl font-bold text-[#0F1111]">{splitCurrency(ledger.totalDeposits).amount} <span className="text-sm font-semibold text-[#767684]">{splitCurrency(ledger.totalDeposits).unit}</span></p>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl border border-[#E7E7E7] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E7E7E7]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#0F1111]">سجل معاملاتك</h2>
                  <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5 cursor-not-allowed">
                    <FiDownload size={16} /> تصدير (قريباً)
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#E7E7E7]">
                {!transactions || transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <FiClock size={24} />
                    </div>
                    <h3 className="text-base font-semibold text-[#0F1111] mb-1">مفيش أي معاملات لسه</h3>
                    <p className="text-sm text-[#565959]">أي حركة هتعملها هتظهر هنا</p>
                  </div>
                ) : (
                  (transactions ?? []).map((tx: { id: number; type: string; amount: number | string; createdAt: string; requestId?: number | null }) => {
                    const isDeduction = tx.type === "ESCROW_DEPOSIT" || tx.type === "WITHDRAWAL";
                    const isRefund = tx.type === "REFUND";
                    const isTopup = tx.type === "WALLET_TOPUP";
                    
                    const Icon = isDeduction ? FiArrowUpRight : FiArrowDownLeft;
                    const txArabicMap: Record<string, string> = {
                      ESCROW_DEPOSIT: "دفع متجمد للطلب",
                      REFUND: "استرداد مبلغ",
                      WALLET_TOPUP: "شحن رصيد",
                      WITHDRAWAL: "سحب من المحفظة",
                      VENDOR_PAYOUT: "تحصيل أرباح",
                      DELIVERY_PAYOUT: "أجرة توصيل",
                    };
                    const txLabel = txArabicMap[tx.type] || "حركة مالية";

                    const getTxHelp = () => {
                      if (tx.type === "ESCROW_DEPOSIT") return "تجميد مبلغ للطلب حتى الاستلام";
                      if (isDeduction) return "سحب مبلغ من محفظتك";
                      if (isRefund) return "مبلغ تم إرجاعه لمحفظتك من طلب ملغي";
                      if (isTopup) return "شحن جديد لمحفظتك";
                      return "عملية مالية";
                    };

                    return (
                      <Link key={tx.id} href={tx.requestId ? `/client/requests/${tx.requestId}` : "#"}>
                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group" title={getTxHelp()}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDeduction ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-[#0F1111]">{txLabel}</p>
                              <p className="text-xs text-[#767684] mt-0.5">{formatDate(tx.createdAt)}</p>
                            </div>
                          </div>
                          <p className={`font-bold text-base ${isDeduction ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isDeduction ? '-' : '+'}{splitCurrency(tx.amount).amount} <span className="text-xs font-semibold opacity-80">{splitCurrency(tx.amount).unit}</span>
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top-up Modal */}
      {showTopupModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1111]/70 backdrop-blur-sm"
          onClick={resetTopupFlow}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E7E7E7] flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FiPlusCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F1111]">اشحن المحفظة</h3>
                  <p className="text-xs text-[#565959] mt-0.5">
                    {paymentStep === 'select_method' && 'اختار هتدفع إزاي'}
                    {paymentStep === 'enter_amount' && 'اكتب هتشحن بكام'}
                    {paymentStep === 'confirm_details' && 'أكد البيانات'}
                    {paymentStep === 'processing' && 'جاري المعالجة...'}
                    {paymentStep === 'success' && 'تم بنجاح!'}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetTopupFlow}
                className="p-2 rounded-xl hover:bg-slate-100 text-[#767684] transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Select Method */}
              {paymentStep === 'select_method' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#0F1111] mb-4">اختار طريقة الشحن اللي تريحك:</p>
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-right flex items-center gap-4 hover:shadow-md group ${method.borderColor} ${method.bgColor} ${method.hoverBorder}`}
                    >
                      <div className="shrink-0">
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#0F1111] text-sm">{method.nameAr}</p>
                          <span className="text-xs text-[#767684]">{method.name}</span>
                        </div>
                        <p className="text-xs text-[#565959] mt-1">{method.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px]">
                          <span className="px-2 py-0.5 bg-white rounded-full text-[#565959] font-medium border border-[#E7E7E7]">
                            {method.fees}
                          </span>
                          <span className="text-[#767684] flex items-center gap-1">
                            <FiClock size={10} /> {method.processingTime}
                          </span>
                        </div>
                      </div>
                      <FiArrowLeft size={16} className="text-[#E7E7E7] group-hover:text-[#FF5A00] transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Enter Amount */}
              {paymentStep === 'enter_amount' && selectedMethod && (
                <div className="space-y-5">
                  <div className={`p-4 rounded-xl ${selectedMethod.bgColor} ${selectedMethod.borderColor} border`}>
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {selectedMethod.icon}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F1111] text-sm">{selectedMethod.nameAr}</p>
                        <p className="text-xs text-[#565959] mt-0.5">{selectedMethod.description}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#0F1111] block mb-3">
                      هتشحن بكام؟ (بالجنيه)
                    </label>
                    <div className="relative rounded-xl border-2 border-[#E7E7E7] bg-white focus-within:border-[#FF5A00] focus-within:ring-4 focus-within:ring-[#FF5A00]/10 transition-all overflow-hidden flex items-stretch">
                      <div className="flex items-center justify-center bg-slate-50 border-r-2 border-slate-100 px-4 font-bold text-sm text-[#767684] shrink-0">
                        ج.م
                      </div>
                      <input
                        type="number"
                        value={amountInput}
                        onChange={(e) => {
                          setAmountInput(e.target.value);
                          setPaymentError(null);
                        }}
                        placeholder="0.00"
                        className="w-full bg-transparent px-4 py-3 outline-none text-2xl font-black text-[#0F1111] tracking-tighter placeholder:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        dir="ltr"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-[#767684] mt-3 text-center">
                      الحد الأدنى: <span className="font-semibold text-[#0F1111]">{selectedMethod.minAmount} ج</span> | الحد الأقصى: <span className="font-semibold text-[#0F1111]">{selectedMethod.maxAmount} ج</span>
                    </p>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm flex items-center gap-2">
                      <FiAlertCircle size={18} />
                      {paymentError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setPaymentStep('select_method')}
                      className="flex-1 py-3.5 px-4 bg-slate-100 text-[#0F1111] font-semibold rounded-xl hover:bg-slate-200 transition-all"
                    >
                      ارجع
                    </button>
                    <button
                      onClick={handleAmountConfirm}
                      className="flex-1 py-3.5 px-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
                    >
                      كمل
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm Details */}
              {paymentStep === 'confirm_details' && selectedMethod && (
                <div className="space-y-5">
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-[#E7E7E7]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#565959]">طريقة الدفع</span>
                      <span className="font-semibold text-[#0F1111]">{selectedMethod.nameAr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#565959]">المبلغ</span>
                      <span className="font-bold text-base text-[#0F1111]">
                        {splitCurrency(Number(amountInput)).amount} <span className="text-sm font-bold text-[#767684]">{splitCurrency(Number(amountInput)).unit}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#565959]">الرسوم</span>
                      <span className="font-medium text-[#0F1111]">{selectedMethod.fees}</span>
                    </div>
                    <div className="border-t border-[#E7E7E7] pt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0F1111]">الإجمالي</span>
                      <span className="font-bold text-lg text-emerald-600">
                        {splitCurrency(Number(amountInput)).amount} <span className="text-base font-bold text-emerald-500">{splitCurrency(Number(amountInput)).unit}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setPaymentStep('enter_amount')}
                      className="flex-1 py-3.5 px-4 bg-slate-100 text-[#0F1111] font-semibold rounded-xl hover:bg-slate-200 transition-all"
                    >
                      غيّر
                    </button>
                    <button
                      onClick={executeTopup}
                      className="flex-1 py-3.5 px-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <FiCheck size={18} />
                      أكد الشحن
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Processing */}
              {paymentStep === 'processing' && (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  <p className="text-[#0F1111] font-semibold">جاري معالجة طلب الشحن...</p>
                  <p className="text-xs text-[#767684]">يرجى عدم إغلاق النافذة</p>
                </div>
              )}

              {/* Step 5: Success */}
              {paymentStep === 'success' && (
                <div className="py-12 text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <FiCheck size={32} className="text-emerald-600" />
                  </div>
                  <p className="text-[#0F1111] font-bold text-base">تم الشحن بنجاح!</p>
                  <p className="text-sm text-[#565959]">سيتم تحديث رصيدك خلال ثوانٍ</p>
                </div>
              )}

              {/* Step 6: Error */}
              {paymentStep === 'error' && (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                    <FiAlertCircle size={32} className="text-rose-600" />
                  </div>
                  <p className="text-[#0F1111] font-bold text-sm">فشلت العملية</p>
                  <p className="text-sm text-rose-600">{paymentError}</p>
                  <button
                    onClick={() => setPaymentStep('confirm_details')}
                    className="py-2.5 px-6 bg-slate-100 text-[#0F1111] font-semibold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1111]/70 backdrop-blur-sm"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E7E7E7] flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <FiArrowDownLeft size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F1111]">اسحب من المحفظة</h3>
                  <p className="text-xs text-[#565959] mt-0.5">الرصيد المتاح: <span className="font-semibold text-[#0F1111]">{splitCurrency(ledger.available).amount} {splitCurrency(ledger.available).unit}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-[#767684] transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Withdraw Method Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWithdrawMethod('wallet')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    withdrawMethod === 'wallet' 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-[#E7E7E7] hover:border-emerald-200'
                  }`}
                >
                  <FiCreditCard size={24} className={withdrawMethod === 'wallet' ? 'text-emerald-600' : 'text-[#767684]'} />
                  <span className={`text-sm font-semibold ${withdrawMethod === 'wallet' ? 'text-emerald-700' : 'text-[#0F1111]'}`}>
                    محفظة إلكترونية
                  </span>
                </button>
                <button
                  onClick={() => setWithdrawMethod('bank')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    withdrawMethod === 'bank' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-[#E7E7E7] hover:border-blue-200'
                  }`}
                >
                  <FiHome size={24} className={withdrawMethod === 'bank' ? 'text-blue-600' : 'text-[#767684]'} />
                  <span className={`text-sm font-semibold ${withdrawMethod === 'bank' ? 'text-blue-700' : 'text-[#0F1111]'}`}>
                    تحويل بنكي
                  </span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-sm font-semibold text-[#0F1111] block mb-3">
                  عايز تسحب كام؟
                </label>
                <div className="relative rounded-xl border-2 border-[#E7E7E7] bg-white focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all overflow-hidden flex items-stretch">
                  <div className="flex items-center justify-center bg-slate-50 border-r-2 border-slate-100 px-4 font-bold text-sm text-[#767684] shrink-0">
                    ج.م
                  </div>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    max={ledger.available}
                    className="w-full bg-transparent px-4 py-3 outline-none text-2xl font-black text-[#0F1111] tracking-tighter placeholder:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    dir="ltr"
                  />
                </div>
                {Number(withdrawAmount) > ledger.available && (
                  <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                    <FiAlertCircle size={14} />
                    المبلغ أكبر من الرصيد المتاح
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3.5 px-4 bg-slate-100 text-[#0F1111] font-semibold rounded-xl hover:bg-slate-200 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={executeWithdraw}
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > ledger.available}
                  className="flex-1 py-3.5 px-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تأكيد السحب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
