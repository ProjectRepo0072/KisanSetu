import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { translateReasons } from "../i18n/serverTextTranslator";
import { api } from "../lib/api";
import { SectionHeading, DemoTag, ScoreBar } from "../components/ui";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Crop, MarketOption } from "../lib/types";

export default function MarketIntelligence() {
  const { profile } = useAuth();
  const { t } = useLocale();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropId, setCropId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [district, setDistrict] = useState(profile?.district || "Nashik");
  const [grade, setGrade] = useState("A");
  const [options, setOptions] = useState<MarketOption[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [priceSeries, setPriceSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/crops").then((data) => {
      setCrops(data);
      if (data.length) setCropId(data[0].id);
    });
  }, []);

  async function runComparison() {
    if (!cropId) return;
    setLoading(true);
    try {
      const data = await api.get(`/markets/compare?cropId=${cropId}&district=${district}&quantity=${quantity}&grade=${grade}`);
      setOptions(data.options || []);
      if (data.options?.length) {
        setSelectedMarket(data.options[0].marketId);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cropId) runComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropId]);

  useEffect(() => {
    if (cropId && selectedMarket) {
      api.get(`/markets/prices?cropId=${cropId}&marketId=${selectedMarket}`).then((rows) =>
        setPriceSeries(rows.map((r: any) => ({ date: r.date.slice(5), price: r.modal_price })))
      );
    }
  }, [cropId, selectedMarket]);

  const top = options[0];

  return (
    <div>
      <SectionHeading title={t("marketIntel.title")} subtitle={t("marketIntel.subtitle")} />

      <div className="card p-4 mb-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="field-label">{t("common.fields.crop")}</label>
            <select className="input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("common.fields.quantity")}</label>
            <input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label">{t("common.fields.yourDistrict")}</label>
            <select className="input" value={district} onChange={(e) => setDistrict(e.target.value)}>
              {["Nashik","Pune","Ahilyanagar","Solapur","Sangli","Kolhapur","Nagpur","Aurangabad"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("common.fields.grade")}</label>
            <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option>A</option><option>B</option><option>C</option>
            </select>
          </div>
          <button className="btn-primary" onClick={runComparison} disabled={loading}>{loading ? t("marketIntel.checking") : t("marketIntel.checkPrices")}</button>
        </div>
      </div>

      {top && (
        <div className="card p-4 mb-4 border-brand-200 bg-brand-50/40">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-stone-800">{t("marketIntel.recommended", { market: top.marketName })}</h3>
            <span className="text-xs text-stone-500">{t("marketIntel.recommendationScore", { score: top.recommendationScore })}</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
            <div><div className="text-xs text-stone-500">{t("marketIntel.currentPrice")}</div><div className="font-semibold">₹{top.currentPrice}/q</div></div>
            <div><div className="text-xs text-stone-500">{t("marketIntel.transportEst")}</div><div className="font-semibold">₹{top.transportCostPerQuintal}/q</div></div>
            <div><div className="text-xs text-stone-500">{t("marketIntel.netRealization")}</div><div className="font-semibold text-brand-700">₹{top.netRealizationPerQuintal}/q</div></div>
          </div>
          <div className="mb-3">
            <p className="text-xs font-medium text-stone-600 mb-1">{t("marketIntel.recommendedBecause")}</p>
            <ul className="text-xs text-stone-700 space-y-0.5 list-disc list-inside">
              {translateReasons(t, top.reasons).map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            <ScoreBar label={t("marketIntel.scorePrice")} value={top.scoreComponents.priceScore} max={35} />
            <ScoreBar label={t("marketIntel.scoreLogistics")} value={top.scoreComponents.logisticsScore} max={20} />
            <ScoreBar label={t("marketIntel.scoreDemand")} value={top.scoreComponents.demandScore} max={20} />
            <ScoreBar label={t("marketIntel.scoreQuality")} value={top.scoreComponents.qualityScore} max={15} />
          </div>
          <div className="mt-3">
            <Link to="/compare" className="text-xs text-brand-700 font-medium">{t("marketIntel.seeFullComparison")}</Link>
          </div>
        </div>
      )}

      {priceSeries.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-stone-800">{t("marketIntel.trendTitle", { market: options.find(o => o.marketId === selectedMarket)?.marketName || "" })}</h3>
            <DemoTag />
          </div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={priceSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v: any) => [`₹${v}`, t("marketIntel.modalPrice")]} />
                <Line type="monotone" dataKey="price" stroke="#3d6f2e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {t("marketIntel.trendDisclaimer")}
          </p>
        </div>
      )}

      <p className="text-xs text-stone-400">{t("marketIntel.footerDisclaimer")}</p>
    </div>
  );
}
