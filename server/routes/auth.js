import { Router } from "express";
import { db } from "../db.js";
import { assertRequired } from "../lib/validate.js";

const router = Router();

// Simple mock authentication for a hackathon prototype — NOT for production.
// No JWT/sessions needed: the client stores the returned profile and sends
// the user id via header on subsequent requests.
router.post("/login", (req, res) => {
  // Same systemic bug as BUG_LIST.md #2 (undefined bind param -> 500) —
  // this one is the single most demo-critical path (an empty login form
  // field must not crash the server).
  if (!assertRequired(req, res, ["username", "password"])) return;
  const { username, password } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE username = ? AND password = ?`).get(username, password);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  let profile = null;
  if (user.role === "farmer") profile = db.prepare(`SELECT * FROM farmers WHERE user_id = ?`).get(user.id);
  if (user.role === "fpo") profile = db.prepare(`SELECT * FROM fpos WHERE user_id = ?`).get(user.id);
  if (user.role === "buyer") profile = db.prepare(`SELECT * FROM buyers WHERE user_id = ?`).get(user.id);

  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser, profile });
});

router.get("/demo-accounts", (req, res) => {
  res.json({
    note: "Demo credentials for judges/testers. Password is 'demo123' for all accounts.",
    accounts: [
      { role: "farmer", username: "farmer1", name: "Ganesh Pawar" },
      { role: "farmer", username: "farmer2", name: "Suresh Chavan" },
      { role: "fpo", username: "fpo1", name: "Nashik Onion Producer Co. Ltd" },
      { role: "buyer", username: "buyer1", name: "Maharashtra Agro Foods Pvt Ltd" },
      { role: "buyer", username: "buyer2", name: "FreshChain Retail" },
      { role: "admin", username: "admin1", name: "MSIS Market Authority Desk" },
    ],
  });
});

export default router;
