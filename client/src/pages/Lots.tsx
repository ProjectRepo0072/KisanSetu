import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { api } from "../lib/api";
import { SectionHeading, StatusBadge, EmptyState } from "../components/ui";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Crop } from "../lib/types";

export default function Lots() {
  const { user, profile } = useAuth();
  const { t } = useLocale();
  const [lots, setLots] = useState<any[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    cropId: "", variety: "", quantityQuintals: 10, grade: "A", location: profile?.village || "Niphad",
    district: profile?.district || "Nashik", harvestDate: "", availableFrom: "", expectedPrice: "", minAcceptablePrice: "", storageAvailable: false,
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    const ownerId = profile?.id;
    const data = await api.get(`/lots?ownerId=${ownerId}&ownerType=${user?.role}`);
    setLots(data);
  }

  useEffect(() => {
    api.get("/crops").then((data) => { setCrops(data); setForm((f: any) => ({ ...f, cropId: data[0]?.id })); });
    if (profile) load();
    // eslint-disable-next-line
  }, [profile]);

  async function createLot(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/lots", { ...form, ownerId: profile?.id, ownerType: user?.role });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SectionHeading title={t("lots.title")} subtitle={t("lots.subtitle")} />

      <div className="flex justify-end mb-3">
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> {showForm ? t("common.cancel") : t("lots.createLot")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createLot} className="card p-4 mb-4 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="field-label">{t("common.fields.crop")}</label>
            <select className="input" value={form.cropId} onChange={(e) => setForm({ ...form, cropId: e.target.value })}>
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("lots.varietyLabel")}</label>
            <input className="input" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} placeholder={t("lots.varietyPlaceholder")} />
          </div>
          <div>
            <label className="field-label">{t("common.fields.quantity")}</label>
            <input className="input" type="number" min={1} value={form.quantityQuintals} onChange={(e) => setForm({ ...form, quantityQuintals: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="field-label">{t("lots.gradeSelfLabel")}</label>
            <select className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
              <option>A</option><option>B</option><option>C</option>
            </select>
          </div>
          <div>
            <label className="field-label">{t("lots.locationLabel")}</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </div>
          <div>
            <label className="field-label">{t("common.fields.district")}</label>
            <select className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
              {["Nashik","Pune","Ahilyanagar","Solapur","Sangli","Kolhapur","Nagpur","Aurangabad"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("lots.harvestDate")}</label>
            <input className="input" type="date" value={form.harvestDate} onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} />
          </div>
          <div>
            <label className="field-label">{t("lots.availableFrom")}</label>
            <input className="input" type="date" value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} />
          </div>
          <div>
            <label className="field-label">{t("lots.expectedPrice")}</label>
            <input className="input" type="number" value={form.expectedPrice} onChange={(e) => setForm({ ...form, expectedPrice: Number(e.target.value) })} />
          </div>
          <div>
            <label className="field-label">{t("lots.minAcceptablePrice")}</label>
            <input className="input" type="number" value={form.minAcceptablePrice} onChange={(e) => setForm({ ...form, minAcceptablePrice: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 text-sm mt-5">
            <input type="checkbox" checked={form.storageAvailable} onChange={(e) => setForm({ ...form, storageAvailable: e.target.checked })} />
            {t("lots.storageAvailable")}
          </label>
          <div className="md:col-span-3">
            <button className="btn-primary" disabled={saving}>{saving ? t("lots.creating") : t("lots.createLot")}</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        {lots.length === 0 ? (
          <div className="p-4"><EmptyState message={t("lots.noLotsYetCreate")} /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>{t("lots.tableLotId")}</th><th>{t("common.fields.crop")}</th><th>{t("common.fields.quantityShort")}</th><th>{t("lots.tableGrade")}</th><th>{t("lots.tableExpected")}</th><th>{t("dashboard.status")}</th><th></th></tr></thead>
            <tbody>
              {lots.map((l) => (
                <tr key={l.id}>
                  <td className="font-mono text-xs">{l.id}</td>
                  <td>{l.crop_name}</td>
                  <td>{l.quantity_quintals}</td>
                  <td>{l.grade || t("lots.ungraded")}</td>
                  <td>{l.expected_price ? `₹${l.expected_price}` : "—"}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td><Link className="text-brand-600 text-xs font-medium" to={`/lots/${l.id}`}>{t("lots.view")}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
