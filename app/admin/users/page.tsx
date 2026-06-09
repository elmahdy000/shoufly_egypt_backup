"use client";

import { useState, useMemo, useCallback } from "react";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { useDebounce } from "@/lib/hooks/use-performance";
import { apiFetch } from "@/lib/api/client";
import { formatDate, formatCurrency } from "@/lib/formatters";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Mail,
  MoreVertical,
  Phone,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { AdminButton, AdminIconButton, AdminFilterChip } from "@/components/admin/ui";
import {
  PageHeader,
  StatCard,
  DataTable,
  type DataTableColumn,
  TableCard,
  EmptyState,
  PageLoading,
  Pagination,
  SearchInput,
  StatusBadge,
  ConfirmDialog,
  DetailsDrawer,
  DetailRow,
  type StatusTone,
} from "@/components/admin/primitives";

interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  trustScore: number;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  walletBalance: number | string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    clientRequests: number;
    vendorBids: number;
    assignedDeliveries: number;
    transactions: number;
    complaints: number;
  };
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "جميع الأدوار", icon: Users },
  { value: "CLIENT", label: "عملاء", icon: User },
  { value: "VENDOR", label: "موردين", icon: Shield },
  { value: "DELIVERY", label: "مناديب", icon: User },
  { value: "ADMIN", label: "مديرين", icon: ShieldCheck },
];

const ROLE_META: Record<string, { label: string; tone: StatusTone }> = {
  ADMIN: { label: "مدير", tone: "slate" },
  VENDOR: { label: "مورد", tone: "blue" },
  CLIENT: { label: "عميل", tone: "slate" },
  DELIVERY: { label: "مندوب", tone: "emerald" },
};

function StatusIndicator({ tone, label }: { tone: StatusTone; label: string }) {
  return <StatusBadge tone={tone} label={label} dot size="xs" />;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [page, setPage] = useState(1);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState("7");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendError, setSuspendError] = useState("");
  const [reinstateDialogOpen, setReinstateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 200);

  const ITEMS_PER_PAGE = 12;

  const apiRole = selectedRole !== "ALL" ? selectedRole : undefined;
  const { data: result, loading, error, refresh } = useAsyncData<
    UserData[] | { data: UserData[]; total: number }
  >(
    () => {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String((page - 1) * ITEMS_PER_PAGE),
      });
      if (apiRole) params.set("role", apiRole);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      return apiFetch(`/api/admin/users?${params}`, "ADMIN");
    },
    [page, apiRole, debouncedSearch],
  );

  const users: UserData[] = Array.isArray(result) ? result : (result as { data?: UserData[] })?.data ?? [];
  const totalItems: number = Array.isArray(result) ? users.length : (result as { total?: number })?.total ?? users.length;

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim() || !Array.isArray(result)) return users;
    const q = debouncedSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        String(u.id).includes(q),
    );
  }, [users, debouncedSearch, result]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const hasActiveFilters = selectedRole !== "ALL" || search.trim().length > 0;

  const columns: DataTableColumn<UserData>[] = useMemo(
    () => [
      {
        key: "user",
        header: "المستخدم",
        render: (user) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
              <p className="text-[10px] font-medium text-slate-400 font-outfit uppercase tracking-tighter">
                {user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "الدور",
        thClassName: "text-center",
        className: "text-center",
        render: (user) => {
          const meta = ROLE_META[user.role] ?? { label: user.role, tone: "slate" as StatusTone };
          return <StatusBadge tone={meta.tone} label={meta.label} size="xs" />;
        },
      },
      {
        key: "status",
        header: "الحالة",
        thClassName: "text-center",
        className: "text-center",
        render: (user) => (
          <div className="flex items-center justify-center gap-1.5">
            {user.isBlocked ? (
              <StatusIndicator tone="rose" label="محظور" />
            ) : user.isActive ? (
              <StatusIndicator tone={user.suspendedUntil && new Date(user.suspendedUntil) > new Date() ? "amber" : "emerald"} label={user.suspendedUntil && new Date(user.suspendedUntil) > new Date() ? "موقوف" : "نشط"} />
            ) : (
              <StatusIndicator tone="slate" label="خامل" />
            )}
            {user.isVerified && <ShieldCheck size={13} className="text-blue-500" />}
          </div>
        ),
      },
      {
        key: "balance",
        header: "التوازن",
        thClassName: "text-left",
        className: "text-left",
        render: (user) => (
          <span className="text-sm font-bold font-outfit text-slate-900">
            {formatCurrency(Number(user.walletBalance))}
          </span>
        ),
      },
    ],
    [],
  );

  if (loading && !result) {
    return (
      <>
        <PageHeader
          eyebrow="نظام إدارة المستخدمين"
          eyebrowTone="emerald"
          title={
            <>
              إدارة <span className="text-primary">المستخدمين</span>
            </>
          }
          subtitle="التحكم الكامل في حسابات العملاء، الموردين، والمناديب."
        />
        <PageLoading label="جاري جلب قاعدة بيانات المستخدمين..." />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-cairo text-right antialiased" dir="rtl">
      <PageHeader
        eyebrow="نظام إدارة المستخدمين"
        eyebrowTone="emerald"
        title={
          <>
            إدارة <span className="text-primary">المستخدمين</span>
          </>
        }
        subtitle="التحكم الكامل في حسابات العملاء، الموردين، والمناديب."
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="بحث بالاسم، الإيميل، أو الهاتف..."
              className="sm:w-[320px]"
              ariaLabel="بحث في المستخدمين"
            />
            <AdminIconButton
              icon={RefreshCw}
              variant="soft"
              size="md"
              label="تحديث"
              onClick={() => refresh()}
              isLoading={loading}
            />
          </div>
        }
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* KPI Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="إجمالي المستخدمين"
            value={totalItems}
            icon={Users}
            tone="blue"
            href="/admin/users"
          />
          <StatCard
            label="الموردين النشطين"
            value={users?.filter((u) => u.role === "VENDOR").length ?? 0}
            icon={Shield}
            tone="emerald"
            badge={{ label: "هذه الصفحة", tone: "neutral" }}
          />
          <StatCard
            label="حسابات محظورة"
            value={users?.filter((u) => u.isBlocked).length ?? 0}
            icon={Ban}
            tone="rose"
            badge={{ label: "هذه الصفحة", tone: "neutral" }}
          />
          <StatCard
            label="في انتظار التوثيق"
            value={users?.filter((u) => !u.isVerified && u.role !== "CLIENT").length ?? 0}
            icon={Shield}
            tone="amber"
            badge={{ label: "هذه الصفحة", tone: "neutral" }}
          />
        </section>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <AdminFilterChip
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              count={
                opt.value === "ALL"
                  ? totalItems
                  : users?.filter((u) => u.role === opt.value).length
              }
              active={selectedRole === opt.value}
              tone="primary"
              onClick={() => {
                setSelectedRole(opt.value);
                setPage(1);
              }}
            />
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedRole("ALL");
                setSearch("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 h-9 px-3 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent transition-colors"
            >
              <RotateCcw size={12} /> إعادة ضبط
            </button>
          )}
        </div>

        <div className="space-y-3">
          <TableCard flush>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(u) => u.id}
              minWidth={800}
              loading={loading}
              onRowClick={(user) => setSelectedUser(user)}
              mobileCard={(user) => (
                <button
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-right bg-white border rounded-xl p-3 transition-colors ${
                    selectedUser?.id === user.id
                      ? "border-orange-300 bg-orange-50/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusIndicator
                        tone={user.isBlocked ? "rose" : user.isActive ? "emerald" : "slate"}
                        label={user.isBlocked ? "محظور" : user.isActive ? "نشط" : "خامل"}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">{formatCurrency(Number(user.walletBalance))}</span>
                    <StatusBadge
                      tone={(ROLE_META[user.role] ?? { tone: "slate" }).tone}
                      label={(ROLE_META[user.role] ?? { label: user.role }).label}
                      size="xs"
                    />
                  </div>
                </button>
              )}
              empty={
                <EmptyState
                  icon={Users}
                  title="لا يوجد مستخدمين"
                  description="حاول تعديل معايير البحث"
                />
              }
            />

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  onPageChange={setPage}
                />
              </div>
            )}
          </TableCard>
        </div>
      </div>

      {/* Details Drawer */}
      <DetailsDrawer
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.fullName || ""}
        subtitle={
          selectedUser && (
            <StatusBadge
              tone={(ROLE_META[selectedUser.role] ?? { tone: "slate" }).tone}
              label={(ROLE_META[selectedUser.role] ?? { label: selectedUser.role }).label}
              size="xs"
            />
          )
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "طلبات", value: selectedUser._count?.clientRequests ?? 0 },
                { label: "عروض", value: selectedUser._count?.vendorBids ?? 0 },
                { label: "معاملات", value: selectedUser._count?.transactions ?? 0 },
                { label: "بلاغات", value: selectedUser._count?.complaints ?? 0 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center"
                >
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Profile Fields */}
            <div className="space-y-2">
              <DetailRow label="البريد الإلكتروني" value={selectedUser.email} icon={Mail} />
              <DetailRow label="رقم الهاتف" value={selectedUser.phone || "غير مسجل"} icon={Phone} />
              <DetailRow
                label="رصيد المحفظة"
                value={formatCurrency(Number(selectedUser.walletBalance))}
                icon={Wallet}
                highlight
              />
              <DetailRow label="تاريخ الانضمام" value={formatDate(selectedUser.createdAt)} icon={Calendar} />
              {selectedUser.trustScore != null && (
                <DetailRow
                  label="درجة الثقة"
                  value={
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedUser.trustScore < 30
                          ? "bg-rose-100 text-rose-700"
                          : selectedUser.trustScore < 60
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Shield size={12} />
                      {selectedUser.trustScore}
                    </span>
                  }
                  icon={ShieldCheck}
                />
              )}
              {selectedUser.suspendedUntil && new Date(selectedUser.suspendedUntil) > new Date() && (
                <DetailRow
                  label="معلق حتى"
                  value={new Date(selectedUser.suspendedUntil).toLocaleDateString("ar-EG")}
                  icon={Calendar}
                />
              )}
            </div>

            {/* Moderation Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {selectedUser.isBlocked ? (
                <AdminButton
                  variant="success"
                  size="md"
                  fullWidth
                  leadingIcon={CheckCircle2}
                  isLoading={actionLoading === "unblock"}
                  onClick={async () => {
                    setActionLoading("unblock");
                    try {
                      await apiFetch(`/api/admin/users/${selectedUser.id}/moderation`, "ADMIN", {
                        method: "PATCH",
                        body: { action: "UNBLOCK" },
                      });
                      setSelectedUser((prev) => (prev ? { ...prev, isBlocked: false } : null));
                      refresh();
                    } catch (err) {
                      console.error("Unblock failed:", err);
                    } finally { setActionLoading(null); }
                  }}
                >
                  فك الحظر عن الحساب
                </AdminButton>
              ) : (
                <AdminButton
                  variant="danger"
                  size="md"
                  fullWidth
                  leadingIcon={Ban}
                  isLoading={actionLoading === "block"}
                  onClick={async () => {
                    setActionLoading("block");
                    try {
                      await apiFetch(`/api/admin/users/${selectedUser.id}/moderation`, "ADMIN", {
                        method: "PATCH",
                        body: { action: "BLOCK" },
                      });
                      setSelectedUser((prev) => (prev ? { ...prev, isBlocked: true } : null));
                      refresh();
                    } catch (err) {
                      console.error("Block failed:", err);
                    } finally { setActionLoading(null); }
                  }}
                >
                  حظر هذا المستخدم
                </AdminButton>
              )}
              {!selectedUser.isVerified && selectedUser.role !== "CLIENT" && (
                <AdminButton
                  variant="primary"
                  size="md"
                  fullWidth
                  leadingIcon={ShieldCheck}
                  isLoading={actionLoading === "verify"}
                  onClick={async () => {
                    setActionLoading("verify");
                    try {
                      await apiFetch(`/api/admin/users/${selectedUser.id}/moderation`, "ADMIN", {
                        method: "PATCH",
                        body: { action: "VERIFY" },
                      });
                      setSelectedUser((prev) => (prev ? { ...prev, isVerified: true } : null));
                      refresh();
                    } catch (err) {
                      console.error("Verify failed:", err);
                    } finally { setActionLoading(null); }
                  }}
                >
                  توثيق الحساب يدوياً
                </AdminButton>
              )}
              {selectedUser.role !== "ADMIN" && (
                <>
                  {!selectedUser.suspendedUntil ||
                  new Date(selectedUser.suspendedUntil) <= new Date() ? (
                    <AdminButton
                      variant="outline"
                      size="md"
                      fullWidth
                      leadingIcon={Ban}
                      className="!text-amber-700 !border-amber-200 hover:!bg-amber-50"
                      onClick={() => {
                        setSuspendDays("7");
                        setSuspendReason("إيقاف مؤقت من الإدارة");
                        setSuspendError("");
                        setSuspendDialogOpen(true);
                      }}
                    >
                      إيقاف مؤقت
                    </AdminButton>
                  ) : (
                    <AdminButton
                      variant="success"
                      size="md"
                      fullWidth
                      leadingIcon={CheckCircle2}
                      onClick={() => setReinstateDialogOpen(true)}
                    >
                      رفع الإيقاف
                    </AdminButton>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DetailsDrawer>

      {/* Suspend Confirm Dialog */}
      <ConfirmDialog
        open={suspendDialogOpen}
        onClose={() => setSuspendDialogOpen(false)}
        onConfirm={async () => {
          const days = Number(suspendDays);
          if (!Number.isFinite(days) || days < 1 || days > 365) {
            setSuspendError("عدد الأيام لازم يكون بين 1 و 365");
            return;
          }
          if (!suspendReason || suspendReason.trim().length < 3) {
            setSuspendError("اكتب سبب لا يقل عن 3 حروف");
            return;
          }
          setSuspendError("");
          try {
            await apiFetch(`/api/admin/users/${selectedUser!.id}/suspend`, "ADMIN", {
              method: "PATCH",
              body: { durationDays: days, reason: suspendReason },
            });
            setSelectedUser((prev) =>
              prev
                ? {
                    ...prev,
                    isActive: false,
                    suspendedUntil: new Date(Date.now() + days * 86400000).toISOString(),
                    suspensionReason: suspendReason,
                  }
                : null,
            );
            refresh();
            setSuspendDialogOpen(false);
          } catch (err) {
            setSuspendError(err instanceof Error ? err.message : "فشل الإيقاف");
          }
        }}
        title="إيقاف الحساب مؤقتاً"
        description={
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-bold">
              إيقاف حساب <span className="text-slate-950 font-black">{selectedUser?.fullName}</span>
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">المدة (بالأيام)</label>
                <input
                  type="number"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value)}
                  min={1}
                  max={365}
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">سبب الإيقاف</label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="اكتب سبب الإيقاف..."
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 focus:border-rose-400 focus:outline-none"
                />
              </div>
              {suspendError && (
                <p className="text-xs text-rose-600 font-bold">{suspendError}</p>
              )}
            </div>
          </div>
        }
        confirmText="تأكيد الإيقاف"
        cancelText="تراجع"
        variant="danger"
        requiredText={selectedUser?.fullName ?? ""}
      />

      {/* Reinstate Confirm Dialog */}
      <ConfirmDialog
        open={reinstateDialogOpen}
        onClose={() => setReinstateDialogOpen(false)}
        onConfirm={async () => {
          try {
            await apiFetch(`/api/admin/users/${selectedUser!.id}/reinstate`, "ADMIN", {
              method: "PATCH",
            });
            setSelectedUser((prev) =>
              prev ? { ...prev, isActive: true, suspendedUntil: null, suspensionReason: null } : null,
            );
            refresh();
            setReinstateDialogOpen(false);
          } catch (err) {
            console.error("Reinstate failed:", err);
          }
        }}
        title="رفع الإيقاف عن الحساب"
        description={`هل أنت متأكد من رفع الإيقاف عن حساب ${selectedUser?.fullName}؟`}
        confirmText="تأكيد رفع الإيقاف"
        cancelText="تراجع"
        variant="primary"
      />
    </div>
  );
}
