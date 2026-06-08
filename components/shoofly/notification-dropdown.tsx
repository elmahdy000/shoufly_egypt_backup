"use client";

import { useState, useRef, useEffect } from "react";
import { FiBell, FiCheckCircle, FiInfo, FiAlertCircle, FiSettings, FiTrash2, FiExternalLink } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { apiFetch } from "@/lib/api/client";
import { markAllNotificationsRead } from "@/lib/api/notifications";
import { subscribeToSSE } from "@/lib/utils/sse-client";
import { useToast } from "@/components/providers/toast-provider";
import { playNotificationSound } from "@/lib/utils/sounds";

// Types based on Prisma
type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  requestId?: number;
};

type UserRole = "CLIENT" | "VENDOR" | "ADMIN" | "DELIVERY";

function detectUserRoleFromPath(): UserRole {
  if (typeof window === "undefined") return "CLIENT";
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "ADMIN";
  if (path.startsWith("/delivery")) return "DELIVERY";
  if (path.startsWith("/vendor")) return "VENDOR";
  return "CLIENT";
}

function getRequestLink(role: UserRole | null, requestId: number): string {
  if (!role) return `/client/requests/${requestId}`;
  switch (role) {
    case "ADMIN": return `/admin/requests/${requestId}`;
    case "VENDOR": return `/vendor/requests/${requestId}`;
    case "DELIVERY": return `/delivery/requests/${requestId}`;
    default: return `/client/requests/${requestId}`;
  }
}

function getNotificationsLink(role: UserRole | null): string {
  if (!role) return "/client/notifications";
  switch (role) {
    case "ADMIN": return "/admin/notifications";
    case "VENDOR": return "/vendor/notifications";
    case "DELIVERY": return "/delivery/notifications";
    default: return "/client/notifications";
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole] = useState<UserRole>(detectUserRoleFromPath);
    const { toast } = useToast();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { data: notifications, refresh, loading } = useAsyncData<Notification[]>(
      () => apiFetch("/api/notifications", userRole || "CLIENT"), 
      [userRole]
    );

    const unreadCount = (notifications ?? []).filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // Shared SSE listener (one connection per tab)
    const unsubscribe = subscribeToSSE((payload) => {
      if (payload.type === "notification" && payload.data && typeof payload.data === "object") {
        const data = payload.data as { title?: string; message?: string };
        if (data.title || data.message) {
          playNotificationSound();
          toast(data.title ?? "", data.message ?? "", "info");
        }
        refresh();
      }
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      unsubscribe();
    };
  }, [refresh, toast]);

  async function markAsRead(id: number) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, userRole || "CLIENT", { method: "PATCH" });
      refresh();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }

  async function markAllAsRead() {
    try {
      await markAllNotificationsRead(userRole || "CLIENT");
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative font-sans text-right dir-rtl" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all relative"
      >
        <FiBell size={18} className={isOpen ? 'text-primary' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[8px] font-medium text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <FiBell size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">الإشعارات</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-rose-500 font-medium">{unreadCount} جديد</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-medium text-primary hover:text-orange-600 transition-colors flex items-center gap-1 px-2 py-1 hover:bg-primary/5 rounded-lg"
              >
                <FiCheckCircle size={14} /> الكل
              </button>
            )}
          </div>

          {/* Notifications List - Compact */}
          <div className="max-h-[320px] overflow-y-auto bg-white">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-100 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">جاري التحميل...</p>
              </div>
            ) : (notifications ?? []).length === 0 ? (
              <div className="p-8 text-center space-y-3">
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <FiBell size={24} />
                 </div>
                 <p className="text-slate-400 text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications?.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-orange-50/30' : ''}`}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  {!n.isRead && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />}
                  <div className={`flex gap-3 ${!n.isRead ? 'pr-4' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === 'BID_ACCEPTED' || n.type === 'DISPUTE_RESOLVED' || n.type === 'KYC_APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                      n.type === 'DISPUTE_RAISED' || n.type === 'PAYMENT_FAILED' || n.type === 'KYC_REJECTED' ? 'bg-rose-100 text-rose-600' :
                      n.type === 'NEW_BID' || n.type === 'NEW_REQUEST' ? 'bg-blue-100 text-blue-600' :
                      n.type === 'DELIVERY_UPDATE' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {n.type === 'BID_ACCEPTED' || n.type === 'DISPUTE_RESOLVED' || n.type === 'KYC_APPROVED' ? <FiCheckCircle size={16} /> : 
                       n.type === 'DISPUTE_RAISED' || n.type === 'KYC_REJECTED' ? <FiAlertCircle size={16} /> :
                       n.type === 'PAYMENT_FAILED' ? <FiTrash2 size={16} /> :
                       <FiInfo size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-semibold leading-tight truncate ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between pt-1.5">
                         <span className="text-[10px] text-slate-400">
                           {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                         </span>
                         {n.requestId && (
                           <Link 
                             href={getRequestLink(userRole, n.requestId)} 
                             className="text-[10px] font-medium text-primary hover:text-orange-600 flex items-center gap-0.5"
                             onClick={(e) => {
                               e.stopPropagation();
                               setIsOpen(false);
                             }}
                           >
                             عرض <FiExternalLink size={10} />
                           </Link>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
             <Link 
               href={getNotificationsLink(userRole)}
               onClick={() => setIsOpen(false)}
               className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1"
             >
               عرض كل الإشعارات <FiExternalLink size={12} />
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
