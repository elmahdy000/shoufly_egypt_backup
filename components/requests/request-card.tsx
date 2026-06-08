"use client";

import Link from "next/link";
import { IconMapPin, IconCalendar, IconChevronLeft } from "@tabler/icons-react";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { formatDate } from "@/lib/formatters";

interface RequestCardProps {
  request: {
    id: number;
    title: string;
    status: string;
    address: string | null;
    createdAt: Date | string;
  };
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <Link
      href={`/client/requests/${request.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      aria-label={`افتح طلب ${request.title}`}
    >
      <article className="surface-card flex flex-col gap-3 p-4 transition-all hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-slate-900 group-hover:text-primary">
              {request.title}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              #{request.id}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <IconMapPin size={14} stroke={1.7} className="shrink-0 text-slate-400" />
            <span className="truncate">{request.address || "لا يوجد عنوان"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <IconCalendar size={12} stroke={1.7} className="shrink-0" />
            <span>{formatDate(request.createdAt)}</span>
          </div>
        </div>

        <div className="-mx-4 -mb-4 mt-1 flex items-center justify-end gap-1 border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-primary">
          <span>عرض التفاصيل</span>
          <IconChevronLeft
            size={14}
            stroke={2}
            className="transition-transform group-hover:-translate-x-0.5"
          />
        </div>
      </article>
    </Link>
  );
}
