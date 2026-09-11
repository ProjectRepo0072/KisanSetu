import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { api } from "../lib/api";
import { SectionHeading, EmptyState, DemoTag } from "../components/ui";
import { Warehouse } from "lucide-react";

export default function Storage() {
  const { t } = useLocale();
  const [facilities, setFacilities] = useState<any[]>([]);

  useEffect(() => { api.get("/storage").then(setFacilities); }, []);

  return (
    <div>
      <SectionHeading title={t("storage.title")} subtitle={t("storage.subtitle")} />
      {facilities.length === 0 ? <EmptyState message={t("storage.noFacilities")} /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {facilities.map((f) => (
            <div key={f.id} className="card p-4">
              <div className="flex items-start gap-3">
                <Warehouse className="text-brand-600 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{f.name}</div>
                  <div className="text-xs text-stone-500 mb-2">{f.location}, {f.district}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-stone-500">{t("storage.capacity")}</span> {f.capacity_quintals} q</div>
                    <div><span className="text-stone-500">{t("storage.available")}</span> {f.available_capacity_quintals} q</div>
                    <div><span className="text-stone-500">{t("storage.cost")}</span> ₹{f.cost_per_day_per_quintal}/day/q</div>
                    <div><span className="text-stone-500">{t("storage.verified")}</span> {f.verified ? t("common.yes") : t("common.no")}</div>
                  </div>
                  <div className="text-xs text-stone-500 mt-2">{t("storage.suitableFor")} {(f.crop_suitability || "").split(",").join(", ")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-stone-400 mt-3">{t("storage.footerNote")} <DemoTag /></p>
    </div>
  );
}
