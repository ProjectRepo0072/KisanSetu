import { ReactNode } from "react";
import { useLocale } from "../i18n/LocaleContext";

// Raw enum values (contract section 3) mapped to their i18n key suffix under "status.*".
// The raw value is never renamed — only its displayed label is translated.
const STATUS_I18N_KEY: Record<string, string> = {
  "Open for offers": "status.openForOffers",
  "Under negotiation": "status.underNegotiation",
  Sold: "status.sold",
  Closed: "status.closed",
  Withdrawn: "status.withdrawn",
  Open: "status.open",
  Fulfilled: "status.fulfilled",
  Pending: "status.pending",
  Accepted: "status.accepted",
  Rejected: "status.rejected",
  Countered: "status.countered",
  Expired: "status.expired",
  Cancelled: "status.cancelled",
  "Deal Accepted": "status.dealAccepted",
  "Invoice Generated": "status.invoiceGenerated",
  "Goods Dispatched": "status.goodsDispatched",
  "Goods Delivered": "status.goodsDelivered",
  "Payment Initiated": "status.paymentInitiated",
  "Payment Received": "status.paymentReceived",
  Requested: "status.requested",
  Assigned: "status.assigned",
  "In Transit": "status.inTransit",
  Delivered: "status.delivered",
  Received: "status.received",
  Initiated: "status.initiated",
  Delayed: "status.delayed",
  Submitted: "status.submitted",
  "Under Review": "status.underReview",
  "Evidence Requested": "status.evidenceRequested",
  Resolved: "status.resolved",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const map: Record<string, string> = {
    "Open for offers": "bg-brand-50 text-brand-700 border-brand-200",
    "Under negotiation": "bg-amber-50 text-amber-700 border-amber-200",
    Sold: "bg-stone-100 text-stone-600 border-stone-200",
    Closed: "bg-stone-100 text-stone-500 border-stone-200",
    Withdrawn: "bg-stone-100 text-stone-500 border-stone-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Accepted: "bg-brand-50 text-brand-700 border-brand-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Countered: "bg-sky-50 text-sky-700 border-sky-200",
    Expired: "bg-stone-100 text-stone-500 border-stone-200",
    Requested: "bg-amber-50 text-amber-700 border-amber-200",
    Assigned: "bg-sky-50 text-sky-700 border-sky-200",
    "In Transit": "bg-indigo-50 text-indigo-700 border-indigo-200",
    Delivered: "bg-brand-50 text-brand-700 border-brand-200",
    Received: "bg-brand-50 text-brand-700 border-brand-200",
    Initiated: "bg-sky-50 text-sky-700 border-sky-200",
    Delayed: "bg-red-50 text-red-700 border-red-200",
    Submitted: "bg-amber-50 text-amber-700 border-amber-200",
    "Under Review": "bg-sky-50 text-sky-700 border-sky-200",
    "Evidence Requested": "bg-indigo-50 text-indigo-700 border-indigo-200",
    Resolved: "bg-brand-50 text-brand-700 border-brand-200",
    Open: "bg-brand-50 text-brand-700 border-brand-200",
    Fulfilled: "bg-stone-100 text-stone-600 border-stone-200",
  };
  const key = STATUS_I18N_KEY[status];
  const label = key ? t(key) : status;
  return <span className={`badge ${map[status] || "bg-stone-100 text-stone-600 border-stone-200"}`}>{label}</span>;
}

export function StatCard({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-semibold text-stone-900 mt-1">{value}</div>
          {sub && <div className="text-xs text-stone-500 mt-1">{sub}</div>}
        </div>
        {icon && <div className="text-brand-600">{icon}</div>}
      </div>
    </div>
  );
}

export function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-32 shrink-0 text-stone-600">{label}</div>
      <div className="flex-1 bg-stone-100 rounded-full h-2">
        <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 text-right font-medium text-stone-700">{value}</div>
    </div>
  );
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-lg font-semibold text-stone-900">{title}</h1>
      {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="card p-6 text-center text-sm text-stone-500">{message}</div>;
}

export function DemoTag() {
  const { t } = useLocale();
  return <span className="badge bg-wheat-50 text-wheat-500 border-wheat-100">{t("common.demoData")}</span>;
}
