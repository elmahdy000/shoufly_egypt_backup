"use client";

import Link from "next/link";
import { IconMapPin, IconCalendar, IconChevronLeft } from "@tabler/icons-react";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { formatDate } from "@/lib/formatters";

function RequestRowComponent({ request }: { request: any }) {
  return (
    <tr className="border-b border-slate-100 transition-colors group hover:bg-slate-50/60">
      <td className="p-0 align-middle">
        <Link
          href={`/client/requests/${request.id}`}
          className="block px-5 py-4 focus:outline-none focus-visible:bg-primary/5 lg:px-6"
          aria-label={`افتح طلب ${request.title}`}
        >
          <div className="mb-1 line-clamp-1 text-[15px] font-semibold text-slate-900 transition-colors group-hover:text-primary">
            {request.title}
          </div>
          <div className="text-helper">#{request.id}</div>
        </Link>
      </td>
      <td className="p-4 align-middle">
        <RequestStatusBadge status={request.status} />
      </td>
      <td className="p-4 align-middle">
        <div className="mb-1.5 flex items-center gap-1.5 text-[13px] text-slate-700">
          <IconMapPin size={12} stroke={1.7} className="shrink-0 text-slate-400" />
          <span className="max-w-[180px] truncate">{request.address || "لا يوجد عنوان"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <IconCalendar size={11} stroke={1.7} className="shrink-0" />
          {formatDate(request.createdAt)}
        </div>
      </td>
      <td className="p-4 align-middle text-center">
        <IconChevronLeft
          size={18}
          stroke={1.7}
          className="inline-block text-slate-300 transition-all group-hover:-translate-x-1 group-hover:text-primary"
        />
      </td>
    </tr>
  );
}

export const RequestRow = RequestRowComponent;
