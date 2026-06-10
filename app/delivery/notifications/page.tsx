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
  FiArrowRight, 
  FiCheck,
  FiTruck,
  FiClock,
  FiExternalLink,
  FiChevronLeft,
  FiCalendar
} from "react-icons/fi";

import { getNotificationMeta } from "@/lib/utils/notifications-meta";

export default function DeliveryNotificationsPage() {
  const { data, loading, error, markRead } = useNotificationsStream("DELIVERY", 4000);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = data?.filter((n: any) => !n.isRead).length ?? 0;

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = data?.filter((n: any) => !n.isRead).map((n: any) => n.id) || [];
    await Promise.all(unreadIds.map((id: number) => markRead(id)));
  }, [data, markRead]);

  const filteredNotifications = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    return data.filter((n: any) => !n.isRead);
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
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Link href="/delivery" className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                <FiArrowRight size={20} />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">الإشعارات</h1>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-sm font-medium text-slate-600 px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
                <FiCheck size={16} /> تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                filter === 'all' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              الكل ({data?.length || 0})
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                filter === 'unread' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              غير مقروء ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {loading && <div className="py-20 text-center text-slate-400 font-medium">جاري تحديث التنبيهات...</div>}
        {error && <ErrorState message={error} />}
        
        {!loading && filteredNotifications.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <FiTruck size={40} />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">مفيش إشعارات جديدة</h3>
             <p className="text-sm text-slate-500">خليك مستعد لأي مهمة توصيل جديدة.</p>
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([date, items]: [string, any]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <FiCalendar size={14} />
                {new Date(date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              
              <div className="space-y-3">
                {items.map((item: any) => {
                  const meta = getNotificationMeta(item.type, item.requestId, "DELIVERY");
                  const isUnread = !item.isRead;

                  const CardContent = (
                    <div className={`relative group rounded-2xl p-5 transition-all border-2 ${
                      isUnread ? `bg-white ${meta.border} shadow-sm cursor-pointer` : 'bg-white/40 border-slate-100 opacity-80 cursor-pointer'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color} border-2 border-white shadow-sm`}>
                          <span className="scale-125">{meta.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-bold ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>{meta.label}</p>
                            <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                          </div>
                          <p className={`text-sm leading-relaxed mb-4 ${isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>{item.message}</p>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <span className={`text-xs font-bold flex items-center gap-1.5 ${isUnread ? 'text-primary' : 'text-slate-400'}`}>
                              {meta.action} <FiExternalLink size={12} />
                            </span>
                            <FiChevronLeft size={18} className={isUnread ? 'text-primary' : 'text-slate-300'} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  return meta.route && meta.route !== "/" ? (
                    <Link 
                      key={item.id} 
                      href={meta.route}
                      onClick={() => isUnread && markRead(item.id)}
                      className="block"
                    >
                      {CardContent}
                    </Link>
                  ) : (
                    <div key={item.id} onClick={() => isUnread && markRead(item.id)} className="block">
                      {CardContent}
                    </div>
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
