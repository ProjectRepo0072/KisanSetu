import express from "express";
import cors from "cors";
import morgan from "morgan";
import { initSchema } from "./db.js";

import authRoutes from "./routes/auth.js";
import cropsRoutes from "./routes/crops.js";
import marketRoutes from "./routes/markets.js";
import lotsRoutes from "./routes/lots.js";
import buyersRoutes from "./routes/buyers.js";
import offersRoutes from "./routes/offers.js";
import transactionsRoutes from "./routes/transactions.js";
import fpoRoutes from "./routes/fpo.js";
import storageRoutes from "./routes/storage.js";
import grievancesRoutes from "./routes/grievances.js";
import adminRoutes from "./routes/admin.js";
import assistantRoutes from "./routes/assistant.js";
import notificationsRoutes from "./routes/notifications.js";
import forecastRoutes from "./routes/forecast.js";

initSchema();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "krishisetu-market-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropsRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/lots", lotsRoutes);
app.use("/api/buyers", buyersRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/fpo", fpoRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/grievances", grievancesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/forecast", forecastRoutes);

// Bug #4 (BUG_LIST.md): catch-all JSON 404 for unmatched API routes, so a
// typo'd/stale URL never falls through to Express's default HTML 404 page.
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error", detail: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`KrishiSetu Market API running on http://localhost:${PORT}`));
