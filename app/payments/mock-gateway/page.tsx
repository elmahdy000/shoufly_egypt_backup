"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/shoofly/button';
import { FiShield, FiLock, FiCheckCircle, FiCreditCard } from 'react-icons/fi';

/**
 * MOCK PAYMENT GATEWAY
 * Simulates an external provider like Paymob or Fawry.
 * Allows testing the full integration lifecycle.
 */
function MockGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const txnId = searchParams.get('txnId');
  const amount = searchParams.get('amount');
  
  const [status, setStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When payment succeeds, redirect to the wallet after a short pause so users see the success state.
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => {
      router.push('/client/wallet');
    }, 3000);
    return () => clearTimeout(t);
  }, [status, router]);

  const handlePay = async () => {
    setStatus('processing');
    setErrorMsg(null);
    
    // Simulate network delay to the bank
    await new Promise(r => setTimeout(r, 2000));

    // Calling OUR webhook to confirm payment 
    // In real life, the PROVIDER (Paymob/Fawry) calls this from their server.
    try {
      // Get CSRF token for state-changing request
      const getCsrfToken = () => {
        const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
        return match ? match[2] : null;
      };
      
      // Generate a unique external id using timestamp + random suffix to avoid collisions
      const externalId = `EXT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      
      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken() || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: txnId,
          externalId,
          status: 'SUCCESS',
          amount: Number(amount)
        })
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setErrorMsg(`تعذر تأكيد الدفع (${res.status}). حاول مرة تانية.`);
        setStatus('pending');
      }
    } catch {
      setErrorMsg('حصلت مشكلة في الاتصال. تأكد من الإنترنت وحاول مرة تانية.');
      setStatus('pending');
    }
  };

  if (!txnId || !amount) return <div className="p-20 text-center">Invalid Payment Session</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans dir-rtl text-right">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 border-slate-900 border-x-2 border-b-2">
        
        {/* Gateway Header */}
        <div className="bg-slate-900 p-8 text-white text-center">
           <div className="flex items-center justify-center gap-2 mb-2">
              <FiShield className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Checkout Page</span>
           </div>
           <h2 className="text-2xl font-black ">Shoofly Checkouts</h2>
        </div>

        <div className="p-8 space-y-8">
           {status === 'success' ? (
             <div className="text-center space-y-4 py-10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                   <FiCheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">تم الدفع بنجاح!</h3>
                <p className="text-slate-500 font-bold">جاري تحويلك لمحفظة شوفلي...</p>
             </div>
           ) : (
             <>
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     <span className="text-slate-500 font-bold">المبلغ المطلوب سداده</span>
                     <span className="text-2xl font-black font-jakarta text-slate-900">{amount} ج.م</span>
                  </div>
                  <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                     <FiLock /> مرجع المعاملة: #{txnId}
                  </div>
               </div>

                <div className="space-y-6">
                   <p className="text-sm font-bold text-slate-500">اختر طريقة الدفع (للمحاكاة):</p>
                   <div className="grid gap-3">
                      <div className="p-4 border-2 border-slate-900 rounded-xl flex items-center gap-4 bg-slate-50">
                         <FiCreditCard size={24} />
                         <span className="font-bold text-sm">البطاقة البنكية (Visa / Master)</span>
                      </div>
                   </div>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-bold flex items-center gap-2" role="alert">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {errorMsg}
                  </div>
                )}

               <Button 
                onClick={handlePay} 
                isLoading={status === 'processing'}
                className="w-full h-16 text-lg font-black bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition-all"
               >
                 {status === 'processing' ? 'جاري معالجة العملية...' : 'أكد الدفع الآن'}
               </Button>

               <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                    By clicking pay, you agree to the terms of Shoofly Safe Payments. 
                    Your data is protected by AES-256 encryption.
                  </p>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">جاري التحميل...</p>
        </div>
      </div>
    }>
      <MockGatewayContent />
    </Suspense>
  );
}
