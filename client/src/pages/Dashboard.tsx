import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { api } from "../lib/api";
import { SectionHeading, StatCard, StatusBadge, EmptyState, DemoTag } from "../components/ui";
import { Package, HandCoins, Truck, AlertTriangle, TrendingUp } from "lucide-react";

const ROLE_KEY: Record<string, string> = {
  farmer: "common.roles.farmer",
  fpo: "common.roles.fpo",
  buyer: "common.roles.buyer",
  admin: "common.roles.admin",
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t } = useLocale();
  const [lots, setLots] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (user?.role === "farmer" || user?.role === "fpo") {
          const ownerId = user.role === "farmer" ? profile?.id : profile?.id;
          const lotsData = await api.get(`/lots?ownerId=${ownerId}&ownerType=${user.role}`);
          setLots(lotsData);
          const txnsData = await api.get(`/transactions?farmerOrFpoId=${ownerId}`);
          setTxns(txnsData);
          const offersAll = await Promise.all(lotsData.slice(0, 5).map((l: any) => api.get(`/offers?lotId=${l.id}`)));
          setOffers(offersAll.flat());
        }
        if (user?.role === "buyer") {
          const demandData = await api.get(`/buyers/${profile?.id}`);
          setDemands(demandData.demands || []);
          const txnsData = await api.get(`/transactions?buyerId=${profile?.id}`);
          setTxns(txnsData);
        }
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user, profile]);

  if (!user) return null;

  return (
    <div>
      <SectionHeading
        title={t("dashboard.welcome", { name: user.display_name })}
        subtitle={t("dashboard.subtitle", { role: t(ROLE_KEY[user.role] || "common.roles.farmer"), location: user.location || "" })}
      />

      {(user.role === "farmer" || user.role === "fpo") && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label={t("dashboard.activeLots")} value={lots.filter((l) => ["Open for offers", "Under negotiation"].includes(l.status)).length} icon={<Package size={20} />} />
            <StatCard label={t("dashboard.pendingOffers")} value={offers.filter((o) => o.status === "Pending").length} icon={<HandCoins size={20} />} />
            <StatCard label={t("dashboard.transactionsInProgress")} value={txns.filter((t) => t.stage !== "Payment Received").length} icon={<Truck size={20} />} />
            <StatCard label={t("dashboard.totalQuantityListed")} value={lots.reduce((s, l) => s + l.quantity_quintals, 0)} icon={<TrendingUp size={20} />} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-stone-800">{t("dashboard.yourLots")}</h3>
                <Link to="/lots" className="text-xs text-brand-600 font-medium">{t("dashboard.manageLots")}</Link>
              </div>
              {loading ? (
                <p className="text-sm text-stone-400">{t("common.loading")}</p>
              ) : lots.length === 0 ? (
                <EmptyState message={t("dashboard.noLotsYet")} />
              ) : (
                <table className="data-table">
                  <thead><tr><th>{t("dashboard.lot")}</th><th>{t("dashboard.crop")}</th><th>{t("dashboard.qty")}</th><th>{t("dashboard.status")}</th></tr></thead>
                  <tbody>
                    {lots.slice(0, 5).map((l) => (
                      <tr key={l.id}>
                        <td className="font-mono text-xs">{l.id}</td>
                        <td>{l.crop_name}</td>
                        <td>{l.quantity_quintals}</td>
                        <td><StatusBadge status={l.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-stone-800">{t("dashboard.recentOffers")}</h3>
                <Link to="/marketplace" className="text-xs text-brand-600 font-medium">{t("dashboard.viewMarketplace")}</Link>
              </div>
              {offers.length === 0 ? (
                <EmptyState message={t("dashboard.noOffersYet")} />
              ) : (
                <table className="data-table">
                  <thead><tr><th>{t("dashboard.lot")}</th><th>{t("dashboard.offerPerQ")}</th><th>{t("dashboard.status")}</th></tr></thead>
                  <tbody>
                    {offers.slice(0, 5).map((o) => (
                      <tr key={o.id}>
                        <td className="font-mono text-xs">{o.lot_id}</td>
                        <td>₹{o.offer_price}</td>
                        <td><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-4 card p-4 bg-brand-50/50 border-brand-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm text-stone-800">{t("dashboard.whereToSellTitle")}</h3>
                <p className="text-xs text-stone-600 mt-0.5">{t("dashboard.whereToSellSubtitle")}</p>
              </div>
              <Link to="/market-intelligence" className="btn-primary text-xs">{t("dashboard.checkMarketIntelligence")}</Link>
            </div>
          </div>
        </>
      )}

      {user.role === "buyer" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label={t("dashboard.openDemandPosts")} value={demands.filter((d: any) => d.status === "Open").length} icon={<Package size={20} />} />
            <StatCard label={t("dashboard.transactionsInProgress")} value={txns.filter((t) => t.stage !== "Payment Received").length} icon={<Truck size={20} />} />
            <StatCard label={t("dashboard.completedTransactions")} value={txns.filter((t) => t.stage === "Payment Received").length} icon={<HandCoins size={20} />} />
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-stone-800">{t("dashboard.yourDemandPosts")}</h3>
              <Link to="/marketplace" className="text-xs text-brand-600 font-medium">{t("dashboard.postDemandBrowse")}</Link>
            </div>
            {demands.length === 0 ? (
              <EmptyState message={t("dashboard.noDemandYet")} />
            ) : (
              <table className="data-table">
                <thead><tr><th>{t("dashboard.demand")}</th><th>{t("dashboard.crop")}</th><th>{t("dashboard.qty")}</th><th>{t("dashboard.offerPerQ")}</th><th>{t("dashboard.status")}</th></tr></thead>
                <tbody>
                  {demands.map((d: any) => (
                    <tr key={d.id}>
                      <td className="font-mono text-xs">{d.id}</td>
                      <td>{d.crop_name}</td>
                      <td>{d.quantity_quintals}</td>
                      <td>₹{d.offer_price}</td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {user.role === "admin" && (
        <div className="card p-4">
          <p className="text-sm text-stone-600">{t("dashboard.adminGoToPrefix")} <Link to="/admin" className="text-brand-600 font-medium">{t("nav.adminDashboard")}</Link> {t("dashboard.adminGoToSuffix")} <DemoTag /></p>
        </div>
      )}
    </div>
  );
}
