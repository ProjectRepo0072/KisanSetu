import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { translateReasons } from "../i18n/serverTextTranslator";
import { api } from "../lib/api";
import { SectionHeading, DemoTag } from "../components/ui";
import { Crop, MarketOption } from "../lib/types";

const SORTS = [
  { key: "net", labelKey: "compare.sortNet" },
  { key: "price", labelKey: "compare.sortPrice" },
  { key: "distance", labelKey: "compare.sortDistance" },
  { key: "demand", labelKey: "compare.sortDemand" },
];

export default function MarketComparison() {
  const { profile } = useAuth();
  const { t } = useLocale();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropId, setCropId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [district, setDistrict] = useState(profile?.district || "Nashik");
  const [sortBy, setSortBy] = useState("net");
  const [options, setOptions] = useState<MarketOption[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get("/crops").then((data) => { setCrops(data); if (data.length) setCropId(data[0].id); });
  }, []);

  async function load() {
    if (!cropId) return;
    const data = await api.get(`/markets/compare?cropId=${cropId}&district=${district}&quantity=${quantity}&sortBy=${sortBy}`);
    setOptions(data.options || []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cropId, sortBy]);

  return (
    <div>
      <SectionHeading title={t("compare.title")} subtitle={t("compare.subtitle")} />

      <div className="card p-4 mb-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="field-label">{t("common.fields.crop")}</label>
            <select className="input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("common.fields.quantity")}</label>
            <input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} onBlur={load} />
          </div>
          <div>
            <label className="field-label">{t("common.fields.yourDistrict")}</label>
            <select className="input" value={district} onChange={(e) => setDistrict(e.target.value)}>
              {["Nashik","Pune","Ahilyanagar","Solapur","Sangli","Kolhapur","Nagpur","Aurangabad"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("compare.sortByLabel")}</label>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORTS.map((s) => <option key={s.key} value={s.key}>{t(s.labelKey)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table min-w-[900px]">
          <thead>
            <tr>
              <th>{t("compare.tableMarket")}</th><th>{t("compare.tableDistance")}</th><th>{t("compare.tablePrice")}</th><th>{t("compare.tableTrend")}</th><th>{t("compare.tableArrivals")}</th>
              <th>{t("compare.tableTransport")}</th><th>{t("compare.tableNet")}</th><th>{t("compare.tableDemand")}</th><th>{t("compare.tableScore")}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {options.map((o, idx) => (
              <>
                <tr key={o.marketId} className={idx === 0 ? "bg-brand-50/40" : ""}>
                  <td className="font-medium">{o.marketName}<div className="text-xs text-stone-400">{o.district}</div></td>
                  <td>{o.distanceKm} km</td>
                  <td>₹{o.currentPrice}</td>
                  <td className={o.trend7DayChangePct! >= 0 ? "text-brand-600" : "text-red-600"}>
                    {o.trend7DayChangePct! >= 0 ? "+" : ""}{o.trend7DayChangePct}%
                  </td>
                  <td>{o.arrivalQtyQuintals ?? "—"}</td>
                  <td>₹{o.transportCostPerQuintal}</td>
                  <td className="font-semibold">₹{o.netRealizationPerQuintal}</td>
                  <td>{t(`common.demandLevels.${o.demandLevel}`)}</td>
                  <td>{o.recommendationScore}</td>
                  <td>
                    <button className="text-xs text-brand-600 font-medium" onClick={() => setExpanded(expanded === o.marketId ? null : o.marketId)}>
                      {expanded === o.marketId ? t("compare.hide") : t("compare.why")}
                    </button>
                  </td>
                </tr>
                {expanded === o.marketId && (
                  <tr>
                    <td colSpan={10} className="bg-stone-50">
                      <ul className="text-xs text-stone-700 list-disc list-inside py-1">
                        {translateReasons(t, o.reasons).map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <p className="text-xs text-stone-400">{t("compare.footerNote")}</p>
        <DemoTag />
      </div>
    </div>
  );
}
