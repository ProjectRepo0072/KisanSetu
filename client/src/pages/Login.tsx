import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n/LocaleContext";
import { Sprout } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Farmer", roleKey: "common.roles.farmer", username: "farmer1", name: "Ganesh Pawar" },
  { role: "Farmer", roleKey: "common.roles.farmer", username: "farmer2", name: "Suresh Chavan" },
  { role: "FPO", roleKey: "common.roles.fpo", username: "fpo1", name: "Nashik Onion Producer Co. Ltd" },
  { role: "Buyer", roleKey: "common.roles.buyer", username: "buyer1", name: "Maharashtra Agro Foods Pvt Ltd" },
  { role: "Buyer", roleKey: "common.roles.buyer", username: "buyer2", name: "FreshChain Retail" },
  { role: "Admin", roleKey: "common.roles.admin", username: "admin1", name: "MSIS Market Authority Desk" },
];

export default function Login() {
  const { login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || t("login.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sprout className="text-brand-600" size={28} />
            <span className="text-xl font-semibold text-stone-900">KisanSetu</span>
          </div>
          <p className="text-stone-600 text-sm mb-1 italic">{t("login.tagline")}</p>
          <p className="text-stone-500 text-xs mb-6">
            {t("login.prototypeNote")}
          </p>

          <form onSubmit={handleSubmit} className="card p-5 space-y-3 max-w-sm">
            <div>
              <label className="field-label">{t("login.username")}</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("login.usernamePlaceholder")} required />
            </div>
            <div>
              <label className="field-label">{t("login.password")}</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-stone-800 mb-1">{t("login.demoAccountsTitle")}</h2>
          <p className="text-xs text-stone-500 mb-3">{t("login.demoPasswordNote")} <code className="bg-stone-100 px-1 rounded">demo123</code></p>
          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.username}
                onClick={() => { setUsername(a.username); setPassword("demo123"); }}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-md border border-stone-200 hover:bg-brand-50 hover:border-brand-200 text-sm"
              >
                <span>
                  <span className="font-medium text-stone-800">{a.name}</span>
                  <span className="block text-xs text-stone-500">{t(a.roleKey)} · {a.username}</span>
                </span>
                <span className="text-xs text-brand-600">{t("login.use")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
