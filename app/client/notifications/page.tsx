"use client";

import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { formatDate } from "@/lib/formatters";
import { useNotificationsStream } from "@/lib/hooks/use-notifications-stream";
import { 
  FiBell, 
  FiCheckCircle, 
  FiInfo, 
  FiArrowRight, 
  FiCheck,
  FiDollarSign,
  FiPackage,
  FiTruck,
  FiStar,
  FiAlertCircle,
  FiMessageSquare,
  FiCheckSquare,
  FiXCircle,
  FiClock,
  FiExternalLink,
  FiChevronLeft,
  FiCalendar
} from "react-icons/fi";

// Notification type config with enhanced icons and colors
const notificationConfig: Record<string, { 
  icon: React.ElementType; 
  bg: string; 
  text: string; 
  border: string;
  label: string;
  description: string;
  action: string;
  route?: (id?: number) => string;
}> = {
  'NEW_BID': { 
    icon: FiDollarSign, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'عرض سعر جديد',
    description: 'تاجر أرسل عرض سعر لطلبك',
    action: 'عرض العرض',
    route: (id) => `/client/offers/request/${id}`
  },
  'BID_ACCEPTED': { 
    icon: FiCheckSquare, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'تم قبول العرض',
    description: 'تم قبول عرضك بنجاح',
    action: 'عرض التفاصيل',
    route: (id) => `/client/requests/${id}`
  },
  'REQUEST_CREATED': { 
    icon: FiPackage, 
    bg: 'bg-blue-50', 
    text: 'text-blue-600',
    border: 'border-blue-200',
    label: 'طلب جديد',
    description: 'تم إنشاء طلبك بنجاح',
    action: 'تتبع الطلب',
    route: (id) => `/client/requests/${id}`
  },
  'REQUEST_COMPLETED': { 
    icon: FiCheckCircle, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'تم إكمال الطلب',
    description: 'تم توصيل طلبك بنجاح',
    action: 'تقييم التجربة',
    route: (id) => `/client/requests/${id}`
  },
  'REQUEST_CANCELLED': { 
    icon: FiXCircle, 
    bg: 'bg-rose-50', 
    text: 'text-rose-600',
    border: 'border-rose-200',
    label: 'تم إلغاء الطلب',
    description: 'تم إلغاء طلبك',
    action: 'عرض التفاصيل',
    route: (id) => `/client/requests/${id}`
  },
  'DELIVERY_ASSIGNED': { 
    icon: FiTruck, 
    bg: 'bg-amber-50', 
    text: 'text-amber-600',
    border: 'border-amber-200',
    label: 'تم تعيين مندوب',
    description: 'تم تعيين مندوب لتوصيل طلبك',
    action: 'تتبع المندوب',
    route: (id) => `/client/requests/${id}`
  },
  'DELIVERY_PICKED_UP': { 
    icon: FiTruck, 
    bg: 'bg-amber-50', 
    text: 'text-amber-600',
    border: 'border-amber-200',
    label: 'تم استلام الطلب',
    description: 'المندوب استلم طلبك',
    action: 'تتبع المندوب',
    route: (id) => `/client/requests/${id}`
  },
  'DELIVERY_DELIVERED': { 
    icon: FiCheckCircle, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'تم التوصيل',
    description: 'تم توصيل طلبك بنجاح',
    action: 'تأكيد الاستلام',
    route: (id) => `/client/requests/${id}`
  },
  'NEW_MESSAGE': { 
    icon: FiMessageSquare, 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    label: 'رسالة جديدة',
    description: 'لديك رسالة جديدة',
    action: 'قراءة الرسالة',
    route: () => `/messages`
  },
  'PAYMENT_RECEIVED': { 
    icon: FiDollarSign, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'تم استلام الدفع',
    description: 'تم استلام دفعتك بنجاح',
    action: 'عرض الإيصال',
    route: (id) => `/client/requests/${id}`
  },
  'PAYMENT_FAILED': { 
    icon: FiAlertCircle, 
    bg: 'bg-rose-50', 
    text: 'text-rose-600',
    border: 'border-rose-200',
    label: 'فشل الدفع',
    description: 'حدث خطأ أثناء معالجة الدفع',
    action: 'إعادة المحاولة',
    route: (id) => `/client/requests/${id}`
  },
  'WALLET_TOPUP': { 
    icon: FiDollarSign, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'شحن محفظة',
    description: 'تم شحن رصيد محفظتك',
    action: 'عرض المحفظة',
    route: () => `/client/wallet`
  },
  'REVIEW_REQUEST': { 
    icon: FiStar, 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    label: 'طلب تقييم',
    description: 'ساعدنا بتقييم تجربتك',
    action: 'إضافة تقييم',
    route: (id) => `/client/requests/${id}`
  },
  'REQUEST_REJECTED': {
    icon: FiXCircle,
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-200',
    label: 'تم رفض طلبك',
    description: 'تم رفض طلبك من قبل نظام التدقيق آلياً',
    action: 'عرض الأسباب',
    route: (id) => `/client/requests/${id}`
  },
  'REQUEST_NEEDS_REVISION': {
    icon: FiAlertCircle,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    label: 'مراجعة مطلوبة',
    description: 'طلبك يحتاج لمراجعة إضافية من الإدارة',
    action: 'عرض التفاصيل',
    route: (id) => `/client/requests/${id}`
  },
  'SYSTEM': { 
    icon: FiInfo, 
    bg: 'bg-slate-50', 
    text: 'text-slate-600',
    border: 'border-slate-200',
    label: 'إشعار نظام',
    description: 'تحديثات وإشعارات مهمة',
    action: 'عرض التفاصيل',
  },
};

function getNotificationConfig(type: string) {
  return notificationConfig[type] || { 
    icon: FiBell, 
    bg: 'bg-slate-50', 
    text: 'text-slate-600',
    border: 'border-slate-200',
    label: type.split('_').join(' ').toLowerCase(),
    description: 'إشعار جديد',
    action: 'عرض التفاصيل',
  };
}

type FilterType = 'all' | 'unread' | 'orders' | 'financial' | 'delivery';

export default function ClientNotificationsPage() {
  const { data, loading, error, markRead, markAllRead } = useNotificationsStream("CLIENT", 4000);
  const [filter, setFilter] = useState<FilterType>('all');

  const unreadCount = data?.filter((n: { isRead: boolean }) => !n.isRead).length ?? 0;

  // Mark all as read (single bulk call, not N fan-out)
  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    await markAllRead();
  }, [unreadCount, markAllRead]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    if (filter === 'unread') return data.filter((n: { isRead: boolean }) => !n.isRead);
    if (filter === 'orders') return data.filter((n: { type: string }) => 
      ['NEW_BID', 'REQUEST_CREATED', 'REQUEST_COMPLETED', 'REQUEST_CANCELLED', 'BID_ACCEPTED', 'REVIEW_REQUEST'].includes(n.type)
    );
    if (filter === 'financial') return data.filter((n: { type: string }) => 
      ['PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'WALLET_TOPUP'].includes(n.type)
    );
    if (filter === 'delivery') return data.filter((n: { type: string }) => 
      ['DELIVERY_ASSIGNED', 'DELIVERY_PICKED_UP', 'DELIVERY_DELIVERED'].includes(n.type)
    );
    return data;
  }, [data, filter]);

  // Group notifications by local date (stable ISO key, formatted in ar-EG)
  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce((groups: Record<string, { createdAt: string }[]>, item: { createdAt: string }) => {
      const d = new Date(item.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }, [filteredNotifications]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans dir-rtl text-right">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link 
                href="/client" 
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
              >
                <FiArrowRight size={20} />
              </Link>
              <div className="h-8 w-px bg-slate-200 mx-1" />
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">الرئيسية</span>
            </div>

            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <FiCheck size={16} /> تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FiBell size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  الإشعارات
                  {unreadCount > 0 && (
                    <span className="inline-flex mr-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {unreadCount} جديد
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-500 mt-1">تابع تحديثات طلباتك والعروض والمدفوعات</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'all' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            الكل <span className="text-xs opacity-70">({data?.length ?? 0})</span>
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'unread' 
                ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            غير مقروء <span className="text-xs opacity-70">({unreadCount})</span>
          </button>
          <button 
            onClick={() => setFilter('orders')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'orders' 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FiPackage size={16} /> الطلبات
          </button>
          <button 
            onClick={() => setFilter('financial')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'financial' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FiDollarSign size={16} /> المالية
          </button>
          <button 
            onClick={() => setFilter('delivery')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'delivery' 
                ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FiTruck size={16} /> التوصيل
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-sm font-medium">جاري تحميل الإشعارات...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-center">
            <FiAlertCircle size={32} className="mx-auto mb-2" />
            {error}
          </div>
        )}

        {!loading && !error && (filteredNotifications?.length ?? 0) === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
             <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
               <FiCheckCircle size={48} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">
               {filter === 'unread' ? 'لا توجد إشعارات جديدة' : 'لا توجد إشعارات'}
             </h3>
             <p className="text-sm text-slate-500 max-w-sm mx-auto">
               {filter === 'unread' 
                 ? 'تم قراءة جميع إشعاراتك. ستظهر هنا الإشعارات الجديدة فور وصولها'
                 : 'ستظهر هنا جميع إشعاراتك المتعلقة بالطلبات والعروض والمدفوعات'}
             </p>
          </div>
        )}

        {/* Notifications Grouped by Date */}
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([dateKey, items]: [string, any]) => {
            const [y, m, d] = dateKey.split('-').map(Number);
            const headerDate = new Date(y, m - 1, d);
            return (
            <div key={dateKey} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <FiCalendar size={14} />
                {headerDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              
              <div className="space-y-3">
                {items.map((item: any) => {  
                  const isUnread = !item.isRead;
                  const config = getNotificationConfig(item.type);
                  const Icon = config.icon;
                  const notificationRoute = config.route?.(item.requestId);
                  
                  const handleClick = () => {
                    if (isUnread) markRead(item.id);
                  };
                  
                  const NotificationCard = (
                    <div 
                      className={`relative text-right rounded-2xl p-5 transition-all border-2 group ${
                        isUnread 
                          ? `bg-white ${config.border} shadow-sm hover:shadow-md` 
                          : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      {/* Unread indicator */}
                      {isUnread && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full block" />
                        </div>
                      )}
                      
                      <div className={`flex items-start gap-4 ${isUnread ? 'pl-8' : ''}`}>
                        {/* Icon */}
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} ${config.text} border-2 border-white shadow-sm`}>
                          <Icon size={22} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                                {config.label}
                              </p>
                              {isUnread && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full">
                                  جديد
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                              <FiClock size={12} />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          
                          <p className={`text-sm leading-relaxed mb-3 ${isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                            {item.message}
                          </p>
                          
                          {/* Action button */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold flex items-center gap-1.5 ${isUnread ? 'text-primary' : 'text-slate-400'}`}>
                              {config.action}
                              <FiExternalLink size={12} />
                            </span>
                            
                            <FiChevronLeft size={18} className={`transition-colors ${isUnread ? 'text-primary' : 'text-slate-300'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                
                return notificationRoute ? (
                    <Link 
                      key={item.id} 
                      href={notificationRoute}
                      onClick={handleClick}
                      className="block cursor-pointer"
                    >
                      {NotificationCard}
                    </Link>
                   ) : (
                    <div key={item.id} onClick={handleClick} className="cursor-pointer">
                      {NotificationCard}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
