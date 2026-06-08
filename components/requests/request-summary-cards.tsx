import {
  IconClipboardList,
  IconCircleCheck,
  IconTag,
  IconTruckDelivery,
  type Icon,
} from "@tabler/icons-react";

interface RequestSummaryCardsProps {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
}

interface SummaryCard {
  key: keyof Omit<RequestSummaryCardsProps, "total"> | "total";
  label: string;
  value: number;
  icon: Icon;
  iconClass: string;
  bgClass: string;
}

export function RequestSummaryCards({
  total,
  open,
  inProgress,
  completed,
}: RequestSummaryCardsProps) {
  const cards: SummaryCard[] = [
    {
      key: "total",
      label: "إجمالي الطلبات",
      value: total,
      icon: IconClipboardList,
      iconClass: "text-slate-700",
      bgClass: "bg-slate-50",
    },
    {
      key: "open",
      label: "مفتوح",
      value: open,
      icon: IconTag,
      iconClass: "text-blue-700",
      bgClass: "bg-blue-50",
    },
    {
      key: "inProgress",
      label: "قيد التنفيذ",
      value: inProgress,
      icon: IconTruckDelivery,
      iconClass: "text-violet-700",
      bgClass: "bg-violet-50",
    },
    {
      key: "completed",
      label: "مكتمل",
      value: completed,
      icon: IconCircleCheck,
      iconClass: "text-emerald-700",
      bgClass: "bg-emerald-50",
    },
  ];

  return (
    <section
      aria-label="ملخص الطلبات"
      className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${card.bgClass}`}
              aria-hidden="true"
            >
              <Icon size={18} stroke={1.8} className={card.iconClass} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
                {card.label}
              </p>
              <p className="mt-0.5 text-xl font-bold leading-none text-slate-900 sm:text-2xl">
                {card.value.toLocaleString("ar-EG")}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
