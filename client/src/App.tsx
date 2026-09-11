import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MarketIntelligence from "./pages/MarketIntelligence";
import MarketComparison from "./pages/MarketComparison";
import Lots from "./pages/Lots";
import LotDetail from "./pages/LotDetail";
import Marketplace from "./pages/Marketplace";
import FpoAggregation from "./pages/FpoAggregation";
import Storage from "./pages/Storage";
import Transactions from "./pages/Transactions";
import Grievances from "./pages/Grievances";
import AdminDashboard from "./pages/AdminDashboard";
import Assistant from "./pages/Assistant";
import Forecast from "./pages/Forecast";

function Protected({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/market-intelligence" element={<Protected roles={["farmer", "fpo"]}><MarketIntelligence /></Protected>} />
      <Route path="/compare" element={<Protected roles={["farmer", "fpo"]}><MarketComparison /></Protected>} />
      <Route path="/lots" element={<Protected roles={["farmer", "fpo"]}><Lots /></Protected>} />
      <Route path="/lots/:id" element={<Protected roles={["farmer", "fpo"]}><LotDetail /></Protected>} />
      <Route path="/marketplace" element={<Protected roles={["farmer", "fpo", "buyer"]}><Marketplace /></Protected>} />
      <Route path="/fpo-aggregation" element={<Protected roles={["fpo"]}><FpoAggregation /></Protected>} />
      <Route path="/storage" element={<Protected roles={["farmer", "fpo"]}><Storage /></Protected>} />
      <Route path="/transactions" element={<Protected roles={["farmer", "fpo", "buyer"]}><Transactions /></Protected>} />
      <Route path="/grievances" element={<Protected roles={["farmer", "fpo", "buyer", "admin"]}><Grievances /></Protected>} />
      <Route path="/assistant" element={<Protected roles={["farmer", "fpo"]}><Assistant /></Protected>} />
      <Route path="/forecast" element={<Protected roles={["farmer", "fpo"]}><Forecast /></Protected>} />
      <Route path="/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
