import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale, LOCALES, Locale } from "../i18n/LocaleContext";
import { api } from "../lib/api";
import {
  LayoutDashboard, TrendingUp, GitCompareArrows, Store, PackagePlus, Users,
  Truck, Warehouse, Receipt, AlertTriangle, ShieldCheck, LogOut, Sprout, MessageCircleQuestion, Globe,
  Bell, WifiOff, LineChart,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface NavItem {
  to: string;
  labelKey: string;
  icon: ReactNode;
  roles: string[];
}

interface AppNotification {
  id: string;
  user_id: string;
  message: string;
  read: number;
  created_at: string;
}

const ROLE_KEY: Record<string, string> = {
  farmer: "common.roles.farmer",
  fpo: "common.roles.fpo",
  buyer: "common.roles.buyer",
  admin: "common.roles.admin",
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={18} />, roles: ["farmer", "fpo", "buyer", "admin"] },
  { to: "/market-intelligence", labelKey: "nav.marketIntelligence", icon: <TrendingUp size={18} />, roles: ["farmer", "fpo"] },
  { to: "/compare", labelKey: "nav.marketComparison", icon: <GitCompareArrows size={18} />, roles: ["farmer", "fpo"] },
  { to: "/lots", labelKey: "nav.myLots", icon: <PackagePlus size={18} />, roles: ["farmer", "fpo"] },
  { to: "/marketplace", labelKey: "nav.buyerMarketplace", icon: <Store size={18} />, roles: ["farmer", "fpo", "buyer"] },
  { to: "/fpo-aggregation", labelKey: "nav.fpoAggregation", icon: <Users size={18} />, roles: ["fpo"] },
  { to: "/storage", labelKey: "nav.storage", icon: <Warehouse size={18} />, roles: ["farmer", "fpo"] },
  { to: "/forecast", labelKey: "nav.forecast", icon: <LineChart size={18} />, roles: ["farmer", "fpo"] },
  { to: "/transactions", labelKey: "nav.transactions", icon: <Truck size={18} />, roles: ["farmer", "fpo", "buyer"] },
  { to: "/grievances", labelKey: "nav.grievances", icon: <AlertTriangle size={18} />, roles: ["farmer", "fpo", "buyer", "admin"] },
  { to: "/assistant", labelKey: "nav.assistant", icon: <MessageCircleQuestion size={18} />, roles: ["farmer", "fpo"] },
  { to: "/admin", labelKey: "nav.adminDashboard", icon: <ShieldCheck size={18} />, roles: ["admin"] },
];

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 rounded-md px-2 py-1.5 ${compact ? "" : "w-full justify-center"}`}
        aria-label={t("layout.language")}
      >
        <Globe size={14} />
        {LOCALES.find((l) => l.code === locale)?.nativeLabel}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 bottom-full mb-1 right-0 bg-white border border-stone-200 rounded-md shadow-md py-1 min-w-[120px]">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code as Locale); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 ${locale === l.code ? "text-brand-700 font-medium" : "text-stone-600"}`}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Polls GET /api/notifications?userId= for the signed-in user and offers a
// dropdown to view/mark them read. Notifications are written server-side at
// a couple of existing trigger points (new offer on a lot, grievance status
// change) — see server/routes/offers.js and grievances.js.
function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  async function refresh() {
    if (!user) return;
    try {
      const rows = await api.get(`/notifications?userId=${user.id}`);
      setNotifications(rows);
    } catch {
      // Offline or API unreachable — leave the last-known list showing
      // rather than clearing it out.
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function markRead(n: AppNotification) {
    if (n.read) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: 1 } : x)));
    try {
      await api.patch(`/notifications/${n.id}/read`);
    } catch {
      refresh();
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center text-stone-500 hover:text-stone-900 border border-stone-200 rounded-md h-9 w-9"
        aria-label={t("layout.notifications")}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 right-0 bg-white border border-stone-200 rounded-md shadow-md py-1 w-72 max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-3 py-4 text-xs text-stone-500 text-center">{t("layout.noNotifications")}</div>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-full text-left px-3 py-2 text-xs border-b border-stone-100 last:border-0 hover:bg-brand-50 flex items-start gap-2 ${!n.read ? "bg-brand-50/40" : ""}`}
              >
                {!n.read && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />}
                <span className={`flex-1 ${!n.read ? "text-stone-900 font-medium" : "text-stone-500"}`}>{n.message}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Offline UX (M6): a persistent banner while the browser reports offline,
// plus a short-lived toast when the service worker had to fall back to
// cached data (sw.js tags those responses; api.ts turns the tag into a
// "ks:stale-data" event) or when a write was blocked for being offline
// ("ks:offline-write-blocked", also dispatched from api.ts). Keeping this
// in Layout means every page gets the behavior without each page needing
// its own wiring.
function OfflineStatus() {
  const { t } = useLocale();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [staleToast, setStaleToast] = useState(false);
  const [writeBlockedToast, setWriteBlockedToast] = useState(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    let staleTimer: ReturnType<typeof setTimeout>;
    let blockedTimer: ReturnType<typeof setTimeout>;
    const onStale = () => {
      setStaleToast(true);
      clearTimeout(staleTimer);
      staleTimer = setTimeout(() => setStaleToast(false), 6000);
    };
    const onWriteBlocked = () => {
      setWriteBlockedToast(true);
      clearTimeout(blockedTimer);
      blockedTimer = setTimeout(() => setWriteBlockedToast(false), 5000);
    };
    window.addEventListener("ks:stale-data", onStale);
    window.addEventListener("ks:offline-write-blocked", onWriteBlocked);
    return () => {
      window.removeEventListener("ks:stale-data", onStale);
      window.removeEventListener("ks:offline-write-blocked", onWriteBlocked);
      clearTimeout(staleTimer);
      clearTimeout(blockedTimer);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-3 py-2 text-xs mb-4">
        <WifiOff size={14} className="shrink-0" />
        <span>{t("layout.offlineBanner")}</span>
      </div>
    );
  }

  if (staleToast) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-3 py-2 text-xs mb-4">
        <WifiOff size={14} className="shrink-0" />
        <span>{t("layout.staleDataBanner")}</span>
      </div>
    );
  }

  if (writeBlockedToast) {
    return (
      <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2 text-xs mb-4">
        <WifiOff size={14} className="shrink-0" />
        <span>{t("layout.offlineWriteBlocked")}</span>
      </div>
    );
  }

  return null;
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  if (!user) return null;

  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-stone-200 bg-white">
        <div className="flex items-center gap-2 px-4 h-16 border-b border-stone-200">
          <Sprout className="text-brand-600" size={22} />
          <div>
            <div className="font-semibold text-stone-900 leading-tight">KisanSetu</div>
            <div className="text-[11px] text-stone-500 leading-tight">{t("layout.prototypeTag")}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-100"
                }`
              }
            >
              {item.icon}
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stone-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-stone-800 truncate">{user.display_name}</div>
              <div className="text-xs text-stone-500 capitalize">{t(ROLE_KEY[user.role] || "common.roles.farmer")}</div>
            </div>
            <NotificationBell />
          </div>
          <LanguageSwitcher />
          <button onClick={handleLogout} className="btn-secondary w-full text-xs">
            <LogOut size={14} /> {t("layout.logout")}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-stone-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sprout className="text-brand-600" size={20} />
          <span className="font-semibold text-sm">KisanSetu</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell compact />
          <LanguageSwitcher compact />
          <button onClick={handleLogout} className="text-stone-500">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <OfflineStatus />
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 flex overflow-x-auto z-10">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 flex-1 min-w-[76px] text-[10px] font-medium ${
                isActive ? "text-brand-700" : "text-stone-500"
              }`
            }
          >
            {item.icon}
            <span className="truncate max-w-[70px]">{t(item.labelKey).split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
