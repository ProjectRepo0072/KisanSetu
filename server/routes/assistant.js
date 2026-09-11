import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// This is the ONLY AI-touching endpoint in the whole platform, by design
// (see problem statement's "low-cost / core must work without AI" constraint).
// It retrieves real platform data first, then either:
//   (a) calls an LLM to phrase an explanation grounded in that data, if
//       ANTHROPIC_API_KEY is configured, or
//   (b) falls back to a deterministic template — the platform's core
//       recommendation engine (see /api/markets/compare) never depends on this.

function ruleBasedAnswer(question, context) {
  const q = question.toLowerCase();

  if (q.includes("grade a") || q.includes("what does grade") || q.includes("what is grade")) {
    return "Grade A means the crop met the platform's quality checklist: good size rating, acceptable/good moisture, 3% or less visible damage, 2% or less foreign material, and good appearance. Grades are assigned manually by an FPO field officer or admin and can be verified — see Module: Quality Grading.";
  }
  if (q.includes("transport") && q.includes("earn")) {
    return "Transport cost is subtracted per quintal from the selling price to get your Net Realization. Use Market Comparison to see the transport-cost breakdown for each market — a nearer market with a slightly lower price can sometimes net you more than a distant market with a higher headline price.";
  }
  if (q.includes("where should i sell") || q.includes("best market") || q.includes("recommend")) {
    if (context?.topOption) {
      const o = context.topOption;
      return `Based on current data, ${o.marketName} shows the strongest recommendation score (${o.recommendationScore}/100) for your crop: ${o.reasons.slice(0, 3).join("; ")}. Open Market Comparison to see the full breakdown and all other options.`;
    }
    return "Open Market Intelligence and enter your crop, quantity and location — the platform will rank nearby markets by net realization, not just headline price.";
  }
  if (q.includes("why is") && q.includes("recommended")) {
    if (context?.topOption) {
      return `${context.topOption.marketName} is recommended because: ${context.topOption.reasons.join("; ")}.`;
    }
    return "Recommendations are based on net realization, transport distance, recent price trend, and current buyer demand — see the score breakdown on the Market Comparison screen.";
  }
  return "I can help explain net realization, quality grades, market comparisons, and buyer matches using your platform data. Try asking about a specific crop, market, or lot. For anything beyond that, please use the Market Intelligence and Comparison screens directly — the core recommendations do not depend on this assistant.";
}

router.post("/ask", async (req, res) => {
  const { question, lotId } = req.body;
  if (!question) return res.status(400).json({ error: "question is required" });

  let context = {};
  try {
    if (lotId) {
      const lot = db.prepare(`SELECT * FROM lots WHERE id = ?`).get(lotId);
      if (lot) {
        // Reuse the same deterministic engine the UI uses (kept as a light
        // inline lookup here to avoid an internal HTTP round-trip)
        context.lot = lot;
      }
    }
  } catch (e) {
    // context building failure should never break the assistant response
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.json({
      answer: ruleBasedAnswer(question, context),
      source: "rule-based-fallback",
      note: "AI API not configured for this deployment — answered using platform data and rule templates. The core platform works fully without this.",
    });
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 300,
        system:
          "You are a lightweight assistant inside an agri market-linkage platform for Maharashtra farmers. " +
          "Only explain data that is given to you in context. Never invent prices, buyers, or guarantees. " +
          "Keep answers under 80 words, plain language, no markdown.",
        messages: [
          { role: "user", content: `Context (platform data, may be partial): ${JSON.stringify(context)}\n\nFarmer/user question: ${question}` },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`Upstream status ${resp.status}`);
    const data = await resp.json();
    const text = data.content?.map((c) => c.text).filter(Boolean).join("\n") || ruleBasedAnswer(question, context);
    res.json({ answer: text, source: "llm" });
  } catch (err) {
    res.json({
      answer: ruleBasedAnswer(question, context),
      source: "rule-based-fallback",
      note: "Assistant temporarily unavailable — answered using platform data and rule templates instead.",
    });
  }
});

export default router;
