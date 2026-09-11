import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { api } from "../lib/api";
import { SectionHeading, StatCard, EmptyState, DemoTag } from "../components/ui";
import { LineChart } from "lucide-react";
import { Crop } from "../lib/types";

interface Market {
  id: string;
  name: string;
  district: string;
}

interface ForecastResult {
  predictedPrice: number;
  mae: number;
  rmse: number;
  r2: number;
  trainedOnRows: number;
  method: string;
  note: string;
}

interface InsufficientData {
  error: string;
  trainedOnRows: number;
}

export default function Forecast() {
  const { profile } = useAuth();
  const { t } = useLocale();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [cropId, setCropId] = useState("");
  const [marketId, setMarketId] = useState("");
  const [horizonDays, setHorizonDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [insufficient, setInsufficient] = useState<InsufficientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    api.get("/crops").then((data) => {
      setCrops(data);
      if (data.length) setCropId(data[0].id);
    });
    api.get("/markets").then((data) => {
      setMarkets(data);
      if (data.length) setMarketId(data[0].id);
    });
  }, []);

  async function runForecast() {
    if (!cropId || !marketId) return;
    if (!Number.isInteger(horizonDays) || horizonDays <= 0) {
      setError(t("forecast.invalidHorizon"));
      setResult(null);
      setInsufficient(null);
      setHasRun(true);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setInsufficient(null);
    try {
      const data = await api.get(`/forecast?cropId=${cropId}&marketId=${marketId}&horizonDays=${horizonDays}`);
      if (data.error) {
        setInsufficient(data);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message || t("forecast.requestFailed"));
    } finally {
      setLoading(false);
      setHasRun(true);
    }
  }

  return (
    <div>
      <SectionHeading title={t("forecast.title")} subtitle={t("forecast.subtitle")} />

      <div className="card p-4 mb-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="field-label">{t("common.fields.crop")}</label>
            <select className="input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("forecast.market")}</label>
            <select className="input" value={marketId} onChange={(e) => setMarketId(e.target.value)}>
              {markets.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.district})</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("forecast.horizonDays")}</label>
            <input
              className="input"
              type="number"
              min={1}
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
            />
          </div>
          <div>
            <button className="btn btn-primary w-full" onClick={runForecast} disabled={loading || !cropId || !marketId}>
              {loading ? t("forecast.running") : t("forecast.runForecast")}
            </button>
          </div>
        </div>
      </div>

      {!hasRun && !loading && (
        <EmptyState message={t("forecast.emptyState")} />
      )}

      {error && (
        <div className="card p-4 border-red-200 bg-red-50 text-sm text-red-700 mb-4">{error}</div>
      )}

      {insufficient && (
        <EmptyState message={t("forecast.insufficientData", { rows: insufficient.trainedOnRows })} />
      )}

      {result && (
        <div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard
              label={t("forecast.predictedPrice")}
              value={`₹${result.predictedPrice}`}
              icon={<LineChart size={20} />}
            />
            <StatCard label={t("forecast.mae")} value={result.mae} />
            <StatCard label={t("forecast.rmse")} value={result.rmse} />
            <StatCard label={t("forecast.r2")} value={result.r2} />
          </div>
          <div className="card p-4 text-xs text-stone-600 space-y-1">
            <div>{t("forecast.trainedOnRows", { rows: result.trainedOnRows })}</div>
            <div>{t("forecast.method")}: {result.method}</div>
            <div className="text-stone-500 mt-2">{result.note}</div>
          </div>
        </div>
      )}

      <p className="text-xs text-stone-400 mt-3">{t("forecast.footerNote")} <DemoTag /></p>
    </div>
  );
}
