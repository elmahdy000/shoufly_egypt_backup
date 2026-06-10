"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  FiBell, FiX, FiCheck, FiCheckCircle,
  FiRefreshCw, FiExternalLink
} from "react-icons/fi";
import {
  listAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import type { ApiNotification } from "@/lib/types/api";
import { useToast } from "@/components/providers/toast-provider";
import { playNotificationSound } from "@/lib/utils/sounds";
import { getNotificationMeta } from "@/lib/utils/notifications-meta";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

export function NotificationsDrawer({ isOpen, onClose, onUnreadCountChange }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    onUnreadCountChange(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAllNotifications("ADMIN");
      setNotifications(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    // Shared SSE — refresh for any notification, toast on critical events
    const TOAST_ON = new Set(["WITHDRAWAL", "PAYMENT_RECEIVED", "PAYMENT_FAILED", "NEW_USER"]);
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type !== "notification" || !payload.data) return;
      const inner = payload.data as { type?: string; message?: string };
      void fetchNotifications();
      playNotificationSound();
      if (inner.type && TOAST_ON.has(inner.type)) {
        toast("تنبيه إداري 🛡️", inner.message || "حدث جديد على المنصة", "info");
      }
    });
    return unsubscribe;
  }, [fetchNotifications, toast]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  async function handleMarkOne(id: number, route: string) {
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      try {
        await markNotificationRead("ADMIN", id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      } catch {
        // silent
      }
    }
    if (route && route !== "/") {
      router.push(route);
      onClose();
    }
  }

  async function handleMarkAll() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead("ADMIN");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — right side (RTL start side, near sidebar) */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 w-[380px] max-w-[95vw] bg-white shadow-2xl flex flex-col animate-slide-in-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <FiBell size={16} className="text-slate-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-none">الإشعارات</h2>
              {unreadCount > 0 && (
                <p className="text-[11px] text-slate-400 mt-0.5">{unreadCount} غير مقروء</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <FiRefreshCw size={12} className="animate-spin" />
                ) : (
                  <FiCheck size={12} />
                )}
                تحديد الكل كمقروء
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            >
              <FiX size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <FiRefreshCw size={22} className="animate-spin text-slate-300" />
              <p className="text-sm text-slate-400">جاري التحميل...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <FiBell size={24} className="text-slate-300" />
              </div>
              <div>
                <p className="font-semibold text-slate-600 text-sm">لا توجد إشعارات</p>
                <p className="text-xs text-slate-400 mt-1">ستظهر هنا الأحداث المهمة على المنصة</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const meta = getNotificationMeta(n.type, n.requestId, "ADMIN");
                return (
                  <button
                    key={n.id}
                    onClick={() => handleMarkOne(n.id, meta.route)}
                    className={`w-full text-right px-5 py-4 flex gap-3 hover:bg-slate-50 transition-colors ${
                      !n.isRead ? "border-r-[3px] border-amber-400 bg-amber-50/30" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${meta.bg}`}>
                      <span className={meta.color}>{meta.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className={`text-sm leading-snug ${!n.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 leading-relaxed ${!n.isRead ? "text-slate-600" : "text-slate-400"}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] text-slate-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                        </p>
                        {meta.route && meta.route !== "/" && (
                          <span className="text-[10px] font-bold text-primary hover:text-orange-600 flex items-center gap-0.5">
                            {meta.action} <FiExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400 text-center">
              {notifications.length} إشعار · آخر تحديث الآن
            </p>
          </div>
        )}
      </div>
    </>
  );
}
