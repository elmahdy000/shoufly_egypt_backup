import React from "react";
import {
  FiBell, FiCheckCircle, FiInfo, FiAlertCircle, FiTrash2,
  FiPlusCircle, FiTag, FiLayers, FiAlertTriangle, FiArrowLeftCircle,
  FiPlus, FiXCircle, FiEdit, FiShield, FiFlag, FiClock,
  FiUserMinus, FiUserCheck, FiCpu, FiTruck, FiDollarSign, FiUser
} from "react-icons/fi";

export type UserRole = "CLIENT" | "VENDOR" | "ADMIN" | "DELIVERY";

export interface NotificationMeta {
  icon: React.ReactNode;
  bg: string;
  color: string;
  border: string;
  label: string;
  action: string;
  route: string;
}

const TYPE_CONFIGS: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  color: string;
  border: string;
  label: string;
  action: string;
  getRoute?: (requestId?: number, role?: UserRole) => string;
}> = {
  NEW_REQUEST: {
    icon: FiPlusCircle,
    bg: "bg-orange-50",
    color: "text-primary",
    border: "border-primary/20",
    label: "طلب جديد",
    action: "عرض التفاصيل",
    getRoute: (requestId, role) => {
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/requests/${requestId}`;
    }
  },
  NEW_BID: {
    icon: FiTag,
    bg: "bg-blue-50",
    color: "text-blue-600",
    border: "border-blue-200",
    label: "عرض سعر جديد",
    action: "عرض العروض",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/offers/request/${requestId}`;
    }
  },
  OFFER_RECEIVED: {
    icon: FiLayers,
    bg: "bg-purple-50",
    color: "text-purple-600",
    border: "border-purple-200",
    label: "عروض أسعار واردة",
    action: "عرض العروض",
    getRoute: (requestId) => `/client/offers/request/${requestId}`
  },
  BID_ACCEPTED: {
    icon: FiCheckCircle,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    label: "تم قبول العرض",
    action: "بدء التنفيذ",
    getRoute: (requestId, role) => {
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/requests/${requestId}`;
    }
  },
  DELIVERY_UPDATE: {
    icon: FiTruck,
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-200",
    label: "تحديث في التوصيل",
    action: "تتبع الشحنة",
    getRoute: (requestId, role) => {
      if (role === "DELIVERY") return `/delivery/tasks/${requestId}`;
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      return `/client/requests/${requestId}`;
    }
  },
  DELIVERY_FAILED: {
    icon: FiAlertTriangle,
    bg: "bg-rose-50",
    color: "text-rose-600",
    border: "border-rose-200",
    label: "فشل التوصيل",
    action: "عرض التفاصيل",
    getRoute: (requestId, role) => {
      if (role === "DELIVERY") return `/delivery/tasks/${requestId}`;
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/requests/${requestId}`;
    }
  },
  PAYMENT_RECEIVED: {
    icon: FiDollarSign,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    label: "تم تأكيد الدفع",
    action: "عرض التفاصيل",
    getRoute: (requestId, role) => {
      if (role === "VENDOR") return `/vendor/earnings`;
      if (role === "ADMIN") return `/admin/finance`;
      return `/client/requests/${requestId}`;
    }
  },
  REFUND_ISSUED: {
    icon: FiArrowLeftCircle,
    bg: "bg-cyan-50",
    color: "text-cyan-600",
    border: "border-cyan-200",
    label: "تم استرداد الأموال",
    action: "عرض المحفظة",
    getRoute: () => `/client/wallet`
  },
  REQUEST_DISPATCHED: {
    icon: FiTruck,
    bg: "bg-indigo-50",
    color: "text-indigo-600",
    border: "border-indigo-200",
    label: "مهمة توصيل جديدة",
    action: "عرض المهمة",
    getRoute: (requestId, role) => {
      if (role === "DELIVERY") return `/delivery/tasks/${requestId}`;
      return `/client/requests/${requestId}`;
    }
  },
  WALLET_TOPUP: {
    icon: FiPlus,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    label: "شحن محفظة",
    action: "عرض المحفظة",
    getRoute: () => `/client/wallet`
  },
  WITHDRAWAL_APPROVED: {
    icon: FiCheckCircle,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    label: "تمت الموافقة على السحب",
    action: "عرض الأرباح",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/withdrawals`;
      return `/vendor/earnings`;
    }
  },
  WITHDRAWAL_REJECTED: {
    icon: FiXCircle,
    bg: "bg-rose-50",
    color: "text-rose-600",
    border: "border-rose-200",
    label: "فشل طلب السحب",
    action: "عرض التفاصيل",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/withdrawals`;
      return `/vendor/earnings`;
    }
  },
  WITHDRAWAL_REQUESTED: {
    icon: FiDollarSign,
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-200",
    label: "طلب سحب جديد",
    action: "عرض طلبات السحب",
    getRoute: () => `/admin/withdrawals`
  },
  REQUEST_CANCELLED: {
    icon: FiXCircle,
    bg: "bg-slate-50",
    color: "text-slate-500",
    border: "border-slate-200",
    label: "تم إلغاء الطلب",
    action: "عرض التفاصيل",
    getRoute: (requestId, role) => {
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/requests/${requestId}`;
    }
  },
  REQUEST_REJECTED: {
    icon: FiXCircle,
    bg: "bg-rose-50",
    color: "text-rose-600",
    border: "border-rose-200",
    label: "تم رفض الطلب",
    action: "عرض التفاصيل",
    getRoute: (requestId, role) => {
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/requests/${requestId}`;
    }
  },
  REQUEST_NEEDS_REVISION: {
    icon: FiEdit,
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-200",
    label: "مراجعة الطلب مطلوبة",
    action: "تعديل الطلب",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/requests/${requestId}`;
    }
  },
  DISPUTE_RAISED: {
    icon: FiAlertCircle,
    bg: "bg-rose-50",
    color: "text-rose-600",
    border: "border-rose-200",
    label: "فتح نزاع جديد",
    action: "مراجعة النزاع",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/complaints`;
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      return `/client/requests/${requestId}`;
    }
  },
  DISPUTE_RESOLVED: {
    icon: FiCheckCircle,
    bg: "bg-blue-50",
    color: "text-blue-600",
    border: "border-blue-200",
    label: "تم حل النزاع",
    action: "عرض النتيجة",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/complaints`;
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      return `/client/requests/${requestId}`;
    }
  },
  KYC_APPROVED: {
    icon: FiShield,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    label: "توثيق الحساب مقبول",
    action: "الملف الشخصي",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/kyc`;
      if (role === "DELIVERY") return `/delivery/profile`;
      return `/vendor/profile`;
    }
  },
  KYC_REJECTED: {
    icon: FiAlertCircle,
    bg: "bg-rose-50",
    color: "text-rose-600",
    border: "border-rose-200",
    label: "توثيق الحساب مرفوض",
    action: "تعديل البيانات",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/kyc`;
      if (role === "DELIVERY") return `/delivery/profile`;
      return `/vendor/profile`;
    }
  },
  REQUEST_REPORTED: {
    icon: FiFlag,
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-200",
    label: "تم الإبلاغ عن طلب",
    action: "عرض الشكاوى",
    getRoute: () => `/admin/complaints`
  },
  REQUEST_AUTO_CLOSED: {
    icon: FiClock,
    bg: "bg-slate-50",
    color: "text-slate-500",
    border: "border-slate-200",
    label: "إغلاق تلقائي للطلب",
    action: "عرض التفاصيل",
    getRoute: (requestId, role) => {
      if (role === "VENDOR") return `/vendor/requests/${requestId}`;
      if (role === "ADMIN") return `/admin/requests`;
      return `/client/requests/${requestId}`;
    }
  },
  USER_SUSPENDED: {
    icon: FiUserMinus,
    bg: "bg-rose-50",
    color: "text-rose-600",
    border: "border-rose-200",
    label: "إيقاف الحساب",
    action: "تواصل معنا",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/users`;
      return "/";
    }
  },
  USER_REINSTATED: {
    icon: FiUserCheck,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    label: "تنشيط الحساب",
    action: "عرض الحساب",
    getRoute: (requestId, role) => {
      if (role === "ADMIN") return `/admin/users`;
      return "/";
    }
  },
  AI_FLAGGED_REQUEST: {
    icon: FiCpu,
    bg: "bg-orange-50",
    color: "text-primary",
    border: "border-primary/20",
    label: "طلب مشبوه بالذكاء الاصطناعي",
    action: "مركز الرؤية",
    getRoute: () => `/admin/vision`
  }
};

export function getNotificationMeta(
  type: string,
  requestId?: number | null,
  role?: UserRole
): NotificationMeta {
  const config = TYPE_CONFIGS[type];
  const fallbackIcon = FiBell;

  if (!config) {
    return {
      icon: React.createElement(fallbackIcon, { size: 14 }),
      bg: "bg-slate-50",
      color: "text-slate-500",
      border: "border-slate-200",
      label: "تنبيه جديد",
      action: "عرض التفاصيل",
      route: role ? (role === "ADMIN" ? "/admin" : `/${role.toLowerCase()}`) : "/"
    };
  }

  return {
    icon: React.createElement(config.icon, { size: 14 }),
    bg: config.bg,
    color: config.color,
    border: config.border,
    label: config.label,
    action: config.action,
    route: config.getRoute ? config.getRoute(requestId || undefined, role) : "/"
  };
}
