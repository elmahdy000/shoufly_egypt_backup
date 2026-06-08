"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { sendChatMessage } from "@/lib/api/chat";
import { FiArrowLeft, FiSend, FiUser, FiRefreshCw } from "react-icons/fi";

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  sender: { id: number; fullName: string };
}

interface Me {
  id: number;
  fullName: string;
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const partnerId = Number(params.partnerId);
  const rawRequestId = searchParams.get('requestId');
  const parsedRequestId = rawRequestId ? Number(rawRequestId) : NaN;
  const requestId = Number.isFinite(parsedRequestId) && parsedRequestId > 0 ? parsedRequestId : null;

  const { data: me } = useAsyncData<Me>(() => apiFetch('/api/auth/me', 'CLIENT'), []);
  const { data: msgs, loading, error, refresh } = useAsyncData<Message[]>(
    () => {
      if (requestId == null) return Promise.resolve([] as Message[]);
      return apiFetch(`/api/messages/${partnerId}?requestId=${requestId}`, 'CLIENT');
    },
    [partnerId, requestId]
  );

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function send() {
    if (!text.trim() || requestId == null) {
        if (requestId == null) setSendError('لا يمكن إرسال رسالة بدون رقم طلب');
        return;
    }
    try {
      setSending(true);
      setSendError(null);
      await sendChatMessage(partnerId, text.trim(), requestId);
      setText('');
      refresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const partnerName = msgs?.find(m => m.sender.id === partnerId)?.sender.fullName ?? `مستخدم #${partnerId}`;

  return (
    <div className="flex flex-col h-[calc(100dvh-112px)] max-w-2xl mx-auto font-sans" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <Link href="/client/chat" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <FiArrowLeft size={18} />
        </Link>
        <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">
          {partnerName.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 text-sm">{partnerName}</p>
          <p className="text-xs text-slate-400">محادثة مباشرة</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
          <FiRefreshCw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {loading && (
          <div className="flex justify-center py-8 text-slate-400">
            <FiRefreshCw className="animate-spin" size={20} />
          </div>
        )}
        {error && (
          <div className="text-center text-rose-500 text-sm py-4">{error}</div>
        )}
        {!loading && !error && (msgs?.length ?? 0) === 0 && (
          <div className="text-center text-slate-400 text-sm py-12">
            <FiUser size={28} className="mx-auto mb-2 opacity-40" />
            <p>ابدأ المحادثة الآن</p>
          </div>
        )}
        {(msgs ?? []).map((msg) => {
          const isMe = msg.sender.id === me?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        {sendError && (
          <p className="text-xs text-rose-500 mb-2">{sendError}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="اكتب رسالتك..."
            rows={1}
            className="flex-1 resize-none border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors max-h-32 leading-relaxed"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white disabled:opacity-40 shrink-0 hover:bg-primary/90 transition-colors"
          >
            {sending
              ? <FiRefreshCw size={16} className="animate-spin" />
              : <FiSend size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
