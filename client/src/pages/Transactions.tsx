import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { api } from "../lib/api";
import { SectionHeading, EmptyState, StatusBadge } from "../components/ui";
import { CheckCircle2, Circle } from "lucide-react";

const STAGES = [
  { value: "Deal Accepted", key: "status.dealAccepted" },
  { value: "Invoice Generated", key: "status.invoiceGenerated" },
  { value: "Goods Dispatched", key: "status.goodsDispatched" },
  { value: "Goods Delivered", key: "status.goodsDelivered" },
  { value: "Payment Initiated", key: "status.paymentInitiated" },
  { value: "Payment Received", key: "status.paymentReceived" },
];
const STAGE_VALUES = STAGES.map((s) => s.value);

export default function Transactions() {
  const { user, profile } = useAuth();
  const { t } = useLocale();
  const [txns, setTxns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  async function load() {
    const qs = user?.role === "buyer" ? `buyerId=${profile?.id}` : `farmerOrFpoId=${profile?.id}`;
    const data = await api.get(`/transactions?${qs}`);
    setTxns(data);
  }

  useEffect(() => { if (profile) load(); /* eslint-disable-next-line */ }, [profile]);

  async function openDetail(id: string) {
    const d = await api.get(`/transactions/${id}`);
    setSelected(d);
  }

  async function createLogistics() {
    await api.post(`/transactions/${selected.id}/logistics`, { pickupDate: new Date().toISOString().slice(0, 10) });
    openDetail(selected.id);
  }

  async function advanceLogistics(status: string) {
    await api.patch(`/transactions/${selected.id}/logistics/status`, { status, vehicleNo: status === "Assigned" ? "MH-DEMO-0001" : undefined });
    openDetail(selected.id);
    load();
  }

  async function advancePayment() {
    await api.post(`/transactions/${selected.id}/payments/advance-stage`);
    openDetail(selected.id);
    load();
  }

  return (
    <div>
      <SectionHeading title={t("transactions.title")} subtitle={t("transactions.subtitle")} />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-stone-800 mb-2">{t("transactions.yourTransactions")}</h3>
          {txns.length === 0 ? <EmptyState message={t("transactions.noTransactions")} /> : (
            <table className="data-table">
              <thead><tr><th>{t("transactions.tableId")}</th><th>{t("transactions.tableCrop")}</th><th>{t("transactions.tableQty")}</th><th>{t("transactions.tableStage")}</th></tr></thead>
              <tbody>
                {txns.map((t2) => (
                  <tr key={t2.id} className="cursor-pointer" onClick={() => openDetail(t2.id)}>
                    <td className="font-mono text-xs">{t2.id}</td>
                    <td>{t2.crop_name}</td>
                    <td>{t2.quantity_quintals} q</td>
                    <td><StatusBadge status={t2.stage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-4">
          {!selected ? (
            <EmptyState message={t("transactions.selectToView")} />
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-stone-800 mb-1">{selected.id}</h3>
              <p className="text-xs text-stone-500 mb-3">{t("transactions.summaryLine", { crop: selected.crop_name, qty: selected.quantity_quintals, price: selected.agreed_price, buyer: selected.buyer_name })}</p>

              <div className="space-y-1 mb-4">
                {STAGES.map((s) => {
                  const idx = STAGE_VALUES.indexOf(selected.stage);
                  const stageIdx = STAGE_VALUES.indexOf(s.value);
                  const done = stageIdx <= idx;
                  return (
                    <div key={s.value} className={`flex items-center gap-2 text-sm ${done ? "text-brand-700" : "text-stone-400"}`}>
                      {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      {t(s.key)}
                    </div>
                  );
                })}
              </div>

              {!selected.logistics ? (
                <button className="btn-secondary text-xs" onClick={createLogistics}>{t("transactions.createLogisticsRequest")}</button>
              ) : (
                <div className="border border-stone-200 rounded-md p-3 mb-3 text-xs space-y-1">
                  <div className="font-medium text-sm mb-1">{t("transactions.logistics")} — <StatusBadge status={selected.logistics.status} /></div>
                  <div>{t("transactions.route", { pickup: selected.logistics.pickup_location, destination: selected.logistics.destination, distance: selected.logistics.distance_km })}</div>
                  <div>{t("transactions.vehicle", { requirement: selected.logistics.vehicle_requirement })} {selected.logistics.vehicle_no ? `(${selected.logistics.vehicle_no})` : ""}</div>
                  <div>{t("transactions.estTransportCost", { cost: Math.round(selected.logistics.transport_cost) })}</div>
                  <div className="flex gap-2 mt-2">
                    {selected.logistics.status === "Requested" && <button className="btn-secondary text-xs" onClick={() => advanceLogistics("Assigned")}>{t("transactions.assignVehicle")}</button>}
                    {selected.logistics.status === "Assigned" && <button className="btn-secondary text-xs" onClick={() => advanceLogistics("In Transit")}>{t("transactions.markInTransit")}</button>}
                    {selected.logistics.status === "In Transit" && <button className="btn-secondary text-xs" onClick={() => advanceLogistics("Delivered")}>{t("transactions.markDelivered")}</button>}
                  </div>
                </div>
              )}

              {selected.stage === "Goods Delivered" && (
                <button className="btn-primary text-xs" onClick={advancePayment}>{t("transactions.initiatePayment")}</button>
              )}
              {selected.stage === "Payment Initiated" && (
                <button className="btn-primary text-xs" onClick={advancePayment}>{t("transactions.confirmPaymentReceived")}</button>
              )}

              {selected.payments?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-stone-600 mb-1">{t("transactions.paymentRecords")}</h4>
                  {selected.payments.map((p: any) => (
                    <div key={p.id} className="text-xs flex justify-between border-b border-stone-100 py-1">
                      <span>{p.method} — ₹{p.amount}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
