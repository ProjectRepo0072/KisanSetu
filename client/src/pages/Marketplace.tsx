import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { api } from "../lib/api";
import { SectionHeading, StatusBadge, EmptyState, DemoTag } from "../components/ui";
import { ShieldCheck, Plus } from "lucide-react";

export default function Marketplace() {
  const { user, profile } = useAuth();
  const { t } = useLocale();
  const [crops, setCrops] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [openLots, setOpenLots] = useState<any[]>([]);
  const [showDemandForm, setShowDemandForm] = useState(false);
  const [showOfferFor, setShowOfferFor] = useState<string | null>(null);
  const [demandForm, setDemandForm] = useState<any>({ cropId: "", quantityQuintals: 50, gradeRequired: "A", requiredBy: "", offerPrice: "", location: profile?.location || "Pune" });
  const [offerForm, setOfferForm] = useState<any>({ offerPrice: "", quantityQuintals: "", deliveryDate: "", paymentTerms: "Within 48 hours of delivery" });

  useEffect(() => {
    api.get("/crops").then((data) => { setCrops(data); setDemandForm((f: any) => ({ ...f, cropId: data[0]?.id })); });
    api.get("/buyers/demands/all?status=Open").then(setDemands);
    api.get("/buyers").then(setBuyers);
    // "open lots" for buyers to browse — reuse lots endpoint without owner filter (all open)
    api.get("/lots?status=Open for offers").then(setOpenLots);
  }, []);

  async function postDemand(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/buyers/demands", { ...demandForm, buyerId: profile?.id });
    setShowDemandForm(false);
    api.get("/buyers/demands/all?status=Open").then(setDemands);
  }

  async function submitOffer(lotId: string, e: React.FormEvent) {
    e.preventDefault();
    await api.post("/offers", { lotId, buyerId: profile?.id, ...offerForm });
    setShowOfferFor(null);
    api.get("/lots?status=Open for offers").then(setOpenLots);
  }

  return (
    <div>
      <SectionHeading title={t("marketplace.title")} subtitle={t("marketplace.subtitle")} />

      {user?.role === "buyer" && (
        <div className="mb-4">
          <button className="btn-primary" onClick={() => setShowDemandForm((s) => !s)}>
            <Plus size={16} /> {showDemandForm ? t("common.cancel") : t("marketplace.postDemand")}
          </button>
          {showDemandForm && (
            <form onSubmit={postDemand} className="card p-4 mt-3 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="field-label">{t("common.fields.crop")}</label>
                <select className="input" value={demandForm.cropId} onChange={(e) => setDemandForm({ ...demandForm, cropId: e.target.value })}>
                  {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="field-label">{t("marketplace.quantityQ")}</label>
                <input className="input" type="number" value={demandForm.quantityQuintals} onChange={(e) => setDemandForm({ ...demandForm, quantityQuintals: Number(e.target.value) })} /></div>
              <div><label className="field-label">{t("marketplace.gradeRequired")}</label>
                <select className="input" value={demandForm.gradeRequired} onChange={(e) => setDemandForm({ ...demandForm, gradeRequired: e.target.value })}><option>A</option><option>B</option><option>C</option></select></div>
              <div><label className="field-label">{t("marketplace.requiredBy")}</label>
                <input className="input" type="date" value={demandForm.requiredBy} onChange={(e) => setDemandForm({ ...demandForm, requiredBy: e.target.value })} /></div>
              <div><label className="field-label">{t("marketplace.offerPricePerQ")}</label>
                <input className="input" type="number" value={demandForm.offerPrice} onChange={(e) => setDemandForm({ ...demandForm, offerPrice: Number(e.target.value) })} /></div>
              <div><label className="field-label">{t("marketplace.deliveryLocation")}</label>
                <input className="input" value={demandForm.location} onChange={(e) => setDemandForm({ ...demandForm, location: e.target.value })} /></div>
              <div className="md:col-span-3"><button className="btn-primary">{t("marketplace.postDemandBtn")}</button></div>
            </form>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-stone-800">{t("marketplace.openDemandTitle")}</h3>
            <DemoTag />
          </div>
          {demands.length === 0 ? <EmptyState message={t("marketplace.noOpenDemand")} /> : (
            <div className="space-y-2">
              {demands.map((d) => (
                <div key={d.id} className="border border-stone-200 rounded-md p-3 text-sm">
                  <div className="flex justify-between">
                    <div className="font-medium">{d.crop_name} — {d.quantity_quintals} q, {t("marketplace.gradeWord")} {d.grade_required}</div>
                    <span className="font-semibold">₹{d.offer_price}/q</span>
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                    {d.buyer_name} ({t(`common.buyerTypes.${d.buyer_type}`)}) {d.verified ? <span className="flex items-center gap-0.5 text-brand-600"><ShieldCheck size={12}/> {t("marketplace.verifiedBusiness")}</span> : t("marketplace.unverified")} · {t("marketplace.requiredByLine", { date: d.required_by, location: d.location })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-stone-800">{user?.role === "buyer" ? t("marketplace.availableLotsToOffer") : t("marketplace.openLotsOnPlatform")}</h3>
            <DemoTag />
          </div>
          {openLots.length === 0 ? <EmptyState message={t("marketplace.noOpenLots")} /> : (
            <div className="space-y-2">
              {openLots.map((l) => (
                <div key={l.id} className="border border-stone-200 rounded-md p-3 text-sm">
                  <div className="flex justify-between">
                    <div className="font-medium">{l.crop_name} — {l.quantity_quintals} q, {t("marketplace.gradeWord")} {l.grade || t("lots.ungraded")}</div>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">{l.location}, {l.district} · {t("marketplace.expectedWord")} ₹{l.expected_price}/q</div>
                  {user?.role === "buyer" && (
                    <>
                      <button className="text-xs text-brand-600 font-medium mt-1" onClick={() => { setShowOfferFor(showOfferFor === l.id ? null : l.id); setOfferForm({ ...offerForm, quantityQuintals: l.quantity_quintals }); }}>
                        {showOfferFor === l.id ? t("common.cancel") : t("marketplace.makeOffer")}
                      </button>
                      {showOfferFor === l.id && (
                        <form onSubmit={(e) => submitOffer(l.id, e)} className="grid grid-cols-2 gap-2 mt-2">
                          <input className="input" type="number" placeholder={t("marketplace.offerPricePlaceholder")} value={offerForm.offerPrice} onChange={(e) => setOfferForm({ ...offerForm, offerPrice: Number(e.target.value) })} required />
                          <input className="input" type="number" placeholder={t("marketplace.qtyPlaceholder")} value={offerForm.quantityQuintals} onChange={(e) => setOfferForm({ ...offerForm, quantityQuintals: Number(e.target.value) })} required />
                          <input className="input" type="date" value={offerForm.deliveryDate} onChange={(e) => setOfferForm({ ...offerForm, deliveryDate: e.target.value })} required />
                          <input className="input" placeholder={t("marketplace.paymentTermsPlaceholder")} value={offerForm.paymentTerms} onChange={(e) => setOfferForm({ ...offerForm, paymentTerms: e.target.value })} />
                          <button className="btn-primary col-span-2 text-xs">{t("marketplace.submitOffer")}</button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(user?.role === "farmer" || user?.role === "fpo") && (
        <div className="card p-4 mt-4">
          <h3 className="text-sm font-semibold text-stone-800 mb-2">{t("marketplace.verifiedBuyersTitle")}</h3>
          <table className="data-table">
            <thead><tr><th>{t("marketplace.tableBuyer")}</th><th>{t("marketplace.tableType")}</th><th>{t("marketplace.tableLocation")}</th><th>{t("marketplace.tableVerification")}</th><th>{t("marketplace.tableTransactions")}</th><th>{t("marketplace.tablePaymentReliability")}</th></tr></thead>
            <tbody>
              {buyers.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{t(`common.buyerTypes.${b.buyer_type}`)}</td>
                  <td>{b.location}</td>
                  <td>{b.verified ? <span className="text-brand-600 flex items-center gap-1"><ShieldCheck size={13}/>{t("marketplace.verified")}</span> : t("marketplace.unverified")}{b.documents_verified ? "" : ` · ${t("marketplace.docsPending")}`}</td>
                  <td>{b.transactions_completed}</td>
                  <td>{b.payment_reliability_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
