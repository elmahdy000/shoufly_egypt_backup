"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback, memo } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { RequestGridSkeleton } from "@/components/shoofly/skeleton";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { listVendorOpenRequests } from "@/lib/api/requests";
import {
  FiBriefcase, FiMapPin, FiFilter, FiInbox, FiChevronLeft
} from "react-icons/fi";

// 🚀 Memoized request card for better performance
const RequestCard = memo(function RequestCard({ request }: { request: any }) {
  return (
    <Link
      href={`/vendor/requests/${request.id}`}
      className="block bg-white rounded-xl p-4 border border-slate-200 hover:border-primary hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-slate-900 line-clamp-2">{request.title}</h3>
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
          #{request.id}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <FiMapPin size={14} className="text-slate-400" />
        <span className="line-clamp-1">{request.address}</span>
      </div>
      {request.budget && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-sm font-bold text-emerald-600">
            {request.budget.toLocaleString()} ج.م
          </span>
        </div>
      )}
    </Link>
  );
});

const FILTERS = [
  { value: "ALL", label: "الكل" },
  { value: "OPEN_FOR_BIDDING", label: "جديدة 🔥" },
  { value: "OFFERS_FORWARDED", label: "عليها عروض 📦" },
];

import { ShooflyLoader } from "@/components/shoofly/loader";

export default function VendorRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedGov, setSelectedGov] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // Initial Fetch: Governorates
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => setGovernorates(data))
      .catch(err => console.error('Failed to load governorates', err));
  }, []);

  // Fetch Cities when gov changes
  const handleGovChange = (govId: string) => {
    setSelectedGov(govId);
    setSelectedCity("");
    if (!govId) {
      setCities([]);
      return;
    }
    fetch(`/api/locations?type=cities&governorateId=${govId}`)
      .then(res => res.json())
      .then(data => setCities(data))
      .catch(err => console.error('Failed to load cities', err));
  };

  const { data, loading, error, refresh } = useAsyncData(
    () => listVendorOpenRequests({ 
      governorateId: selectedGov ? Number(selectedGov) : undefined,
      cityId: selectedCity ? Number(selectedCity) : undefined
    }), 
    [selectedGov, selectedCity]
  );

  useEffect(() => {
    // REAL-TIME SSE FOR NEW REQUESTS
    let eventSource: EventSource;
    
    const connectSSE = () => {
      eventSource = new EventSource("/api/notifications/stream");
      
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_REQUEST' || payload.type === 'ORDER_STATUS_CHANGED') {
            refresh();
          }
        } catch (err) {
          console.error("SSE Marketplace Error:", err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setTimeout(connectSSE, 3000); // Retry after 3s
      };
    };

    connectSSE();
    return () => eventSource?.close();
  }, [refresh]);

  const rows = useMemo(() => {
    const list = data ?? [];
    if (statusFilter === "ALL") return list;
    return list.filter((item: any) => item.status === statusFilter);
  }, [data, statusFilter]);

  if (loading && !data) {
    return <ShooflyLoader message="بنحمل أحدث طلبات السوق..." />;
  }

  return (
    <div className="font-sans text-right" dir="rtl">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 space-y-4">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">طلبات السوق المتاحة</h1>
            <p className="text-sm text-slate-500">
              {loading ? "جاري التحميل..." : `${data?.length ?? 0} طلب متاح`}
            </p>
          </div>
        </div>

        {/* Location Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <select
              value={selectedGov}
              onChange={(e) => handleGovChange(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-primary transition-all appearance-none"
            >
              <option value="">كل المحافظات</option>
              {governorates.map((gov: any) => (
                <option key={gov.id} value={gov.id}>{gov.name}</option>
              ))}
            </select>
            <FiMapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>

          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-primary transition-all appearance-none"
              disabled={!selectedGov}
            >
              <option value="">كل المدن</option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
            <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  active
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && <RequestGridSkeleton />}

        {error && <ErrorState message={error} />}

        {/* Empty */}
        {!loading && !error && rows.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FiInbox size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">مفيش طلبات دلوقتي</h3>
            <p className="text-xs text-slate-500">هتجيلك تنبيه أول ما ينزل طلب جديد</p>
          </div>
        )}

        {/* Opportunities Grid */}
        {!loading && !error && rows.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((request: any) => {
              const isOpen = request.status === "OPEN_FOR_BIDDING";
              return (
                <Link
                  key={request.id}
                  href={`/vendor/requests/${request.id}`}
                  className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-primary">
                        {isOpen ? "مستني عروض" : "شغالين فيها"}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
                        {request.title}
                      </h3>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {isOpen ? "متاح" : "اكتفى"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {request.description || "لا يوجد وصف تفصيلي"}
                  </p>

                  {/* Location row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FiMapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{request.address}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                      {isOpen ? "قدم عرضك" : "التفاصيل"}
                      <FiChevronLeft size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
