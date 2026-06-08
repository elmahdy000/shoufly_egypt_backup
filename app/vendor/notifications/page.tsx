"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FiTrendingUp,
  FiAlertCircle,
  FiMessageSquare,
  FiClock,
  FiExternalLink,
  FiChevronLeft,
  FiCalendar,
  FiZap,
  FiFilter
} from "react-icons/fi";

// Enhanced Notification type config for Vendor
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
  'NEW_REQUEST': { 
    icon: FiZap, 
    bg: 'bg-orange-50', 
    text: 'text-primary',
    border: 'border-primary/20',
    label: 'فرصة عمل جديدة',
    description: 'تمت الموافقة على طلب جديد في منطقتك',
    action: 'تقديم عرض سعر',
    route: (id) => `/vendor/requests/${id}`
  },
  'BID_ACCEPTED': { 
    icon: FiCheckCircle, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'مبروك! تم قبول عرضك',
    description: 'قام العميل بقبول عرض السعر الخاص بك',
    action: 'بدء التنفيذ',
    route: (id) => `/vendor/requests/${id}`
  },
  'PAYMENT_RECEIVED': { 
    icon: FiDollarSign, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'تم استلام دفعة',
    description: 'تم إضافة مبلغ إلى محفظتك بنجاح',
    action: 'عرض المحفظة',
    route: () => `/vendor/earnings`
  },
  'DISPUTE_RAISED': { 
    icon: FiAlertCircle, 
    bg: 'bg-rose-50', 
    text: 'text-rose-600',
    border: 'border-rose-200',
    label: 'نزاع مفتوح',
    description: 'قام العميل بفتح نزاع بخصوص هذا الطلب',
    action: 'مراجعة النزاع',
    route: (id) => `/vendor/requests/${id}`
  },
  'DISPUTE_RESOLVED': { 
    icon: FiCheckCircle, 
    bg: 'bg-blue-50', 
    text: 'text-blue-600',
    border: 'border-blue-200',
    label: 'تم إغلاق النزاع',
    description: 'تم الفصل في النزاع وإغلاق الطلب',
    action: 'عرض النتيجة',
    route: (id) => `/vendor/requests/${id}`
  },
  'WITHDRAWAL_APPROVED': { 
    icon: FiTrendingUp, 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    label: 'تمت الموافقة على السحب',
    description: 'تمت الموافقة على طلب سحب رصيدك',
    action: 'عرض الأرباح',
    route: () => `/vendor/earnings`
  },
  'NEW_MESSAGE': { 
    icon: FiMessageSquare, 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    label: 'رسالة جديدة',
    description: 'لديك رسالة جديدة من العميل',
    action: 'فتح المحادثة',
    route: (id) => `/vendor/chat/${id}`
  }
};

function getNotificationConfig(type: string) {
  return notificationConfig[type] || { 
    icon: FiBell, 
    bg: 'bg-slate-50', 
    text: 'text-slate-600',
    border: 'border-slate-200',
    label: 'تنبيه جديد',
    description: 'إشعار من منصة شوفلي',
    action: 'عرض التفاصيل',
  };
}

type FilterType = 'all' | 'unread' | 'requests' | 'earnings';

export default function VendorNotificationsPage() {
  const router = useRouter();
  const { data, loading, error, markRead } = useNotificationsStream("VENDOR", 4000);
  const [filter, setFilter] = useState<FilterType>('all');

  const unreadCount = data?.filter((n: any) => !n.isRead).length ?? 0;

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = data?.filter((n: any) => !n.isRead).map((n: any) => n.id) || [];
    await Promise.all(unreadIds.map((id: number) => markRead(id)));
  }, [data, markRead]);

  const filteredNotifications = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    if (filter === 'unread') return data.filter((n: any) => !n.isRead);
    if (filter === 'requests') return data.filter((n: any) => ['NEW_REQUEST', 'BID_ACCEPTED', 'DISPUTE_RAISED', 'DISPUTE_RESOLVED'].includes(n.type));
    if (filter === 'earnings') return data.filter((n: any) => ['PAYMENT_RECEIVED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED'].includes(n.type));
    return data;
  }, [data, filter]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce((groups: any, item: any) => {
      const date = new Date(item.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
      return groups;
    }, {});
  }, [filteredNotifications]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans dir-rtl text-right">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/vendor" 
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all shadow-sm"
              >
                <FiArrowRight size={22} />
              </Link>
              <div className="h-10 w-px bg-slate-200 mx-2" />
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  الإشعارات
                  {unreadCount > 0 && (
                    <span className="inline-flex mr-4 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      {unreadCount} جديد
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">تابع عروضك، مستحقاتك المالية، والتنبيهات الهامة.</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/5 px-5 py-3 rounded-2xl transition-all border border-primary/10"
              >
                <FiCheck size={18} /> تعليم الكل كمقروء
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            {[
              { id: 'all', label: 'الكل', icon: FiBell, count: data?.length || 0 },
              { id: 'unread', label: 'غير مقروء', count: unreadCount },
              { id: 'requests', label: 'العمليات', icon: FiPackage },
              { id: 'earnings', label: 'المالية', icon: FiDollarSign },
            ].map((tab: any) => (
              <button 
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-5 py-2.5 text-xs font-black rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                  filter === tab.id 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tab.icon && <tab.icon size={14} />}
                {tab.label}
                {tab.count !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${filter === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                        {tab.count}
                    </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="w-14 h-14 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-sm font-bold">جاري تحديث سجل التنبيهات...</p>
          </div>
        )}

        {error && <ErrorState message={error} />}
        
        {!loading && filteredNotifications.length === 0 && (
          <div className="bg-white rounded-[32px] border border-slate-200 p-20 text-center shadow-sm">
             <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
               <FiCheckCircle size={56} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">السجل نظيف تماماً!</h3>
             <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">أنت مطلع على جميع تحديثات أعمالك. سيظهر أي جديد هنا فوراً.</p>
          </div>
        )}

        <div className="space-y-10">
          {Object.entries(groupedNotifications).map(([date, items]: [string, any]) => (
            <div key={date} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-3 bg-slate-50 rounded-full py-1">
                  <FiCalendar size={12} className="text-slate-300" />
                  {new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(date))}
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              
              <div className="space-y-3">
                {items.map((item: any) => {
                  const config = getNotificationConfig(item.type);
                  const Icon = config.icon;
                  const isUnread = !item.isRead;
                  const route = config.route?.(item.requestId);

                  const CardContent = (
                    <div className={`relative group rounded-[2rem] p-6 transition-all duration-300 border-2 ${
                      isUnread 
                        ? `bg-white ${config.border} shadow-md shadow-slate-200/50 hover:shadow-xl cursor-pointer` 
                        : 'bg-white/40 border-slate-100 opacity-80 hover:bg-white hover:opacity-100 cursor-pointer'
                    }`}>
                      {isUnread && (
                        <div className="absolute left-6 top-1/2 -translate-y-1/2">
                          <span className="w-3 h-3 bg-rose-500 rounded-full block shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse" />
                        </div>
                      )}
                      
                      <div className={`flex items-start gap-5 ${isUnread ? 'pl-10' : ''}`}>
                        <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${config.bg} ${config.text} border-2 border-white shadow-sm transition-transform group-hover:scale-110`}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <p className={`text-sm font-black ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>{config.label}</p>
                                {isUnread && (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black rounded-md">جديد</span>
                                )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <FiClock size={12} /> {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed mb-4 ${isUnread ? 'text-slate-700 font-bold' : 'text-slate-500 font-medium'}`}>{item.message}</p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <span className={`text-[11px] font-black flex items-center gap-1.5 ${isUnread ? 'text-primary' : 'text-slate-400'}`}>
                              {config.action} <FiExternalLink size={12} />
                            </span>
                            <FiChevronLeft size={20} className={`transition-transform group-hover:translate-x-1 ${isUnread ? 'text-primary' : 'text-slate-300'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  return route ? (
                    <Link 
                      key={item.id} 
                      href={route}
                      onClick={() => isUnread && markRead(item.id)}
                      className="block"
                    >
                      {CardContent}
                    </Link>
                  ) : (
                    <div key={item.id} onClick={() => isUnread && markRead(item.id)}>{CardContent}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
