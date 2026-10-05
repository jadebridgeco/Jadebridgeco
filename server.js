import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname)));

const sessions = new Map();
const MAX_MESSAGES = 20;

const JADE_BRIDGE_INSTRUCTIONS = `
You are Jade Bridge Assistant, the customer-facing AI assistant for Jade Bridge Importations & Services.

Business:
- Jade Bridge helps entrepreneurs, brands and businesses source products from China.
- Services: China product sourcing, supplier sourcing, procurement coordination, and importation coaching.
- Procurement can include supplier research, supplier communication, quotation coordination, product specification clarification, and procurement coordination based on an agreed scope.
- Coaching can cover sourcing platforms, supplier communication, payments/refunds, product branding, quality inspection, and air/sea shipping decisions.
- Jade Bridge serves clients in Nigeria and international clients.
- Do not invent supplier names, prices, shipping rates, delivery times, testimonials, client names, guarantees, certifications, or business claims.
- If the visitor asks for a specific quotation, supplier recommendation, current price, freight rate, availability, or anything requiring a live check, explain that a human Jade Bridge team member needs to assess the request and direct them to the quote form/WhatsApp.
- Do not claim that you personally perform physical inspection, purchase products, or communicate with suppliers.
- Keep responses warm, professional, concise and commercially useful.
- Ask a small number of clarifying questions when necessary: product, quantity, destination/market, specifications, target price/budget if known, and whether they need sourcing only or full procurement.
- Never request passwords, payment-card details, or sensitive personal information.
- When a visitor is ready to engage, encourage them to use the Request a Quote form or WhatsApp.
`;

function getSession(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

app.post("/api/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    let sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";

    if (!message) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 2000) return res.status(400).json({ error: "Message is too long." });

    if (!sessionId || !/^[a-zA-Z0-9_-]{10,100}$/.test(sessionId)) {
      sessionId = crypto.randomUUID();
    }

    const history = getSession(sessionId);
    history.push({ role: "user", content: message });
    while (history.length > MAX_MESSAGES) history.shift();

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions: JADE_BRIDGE_INSTRUCTIONS,
      input: history,
    });

    const answer = response.output_text || "I’m sorry, I couldn’t generate a response right now. Please use the quote form or WhatsApp to reach Jade Bridge.";
    history.push({ role: "assistant", content: answer });
    while (history.length > MAX_MESSAGES) history.shift();

    res.json({ answer, sessionId });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "The assistant is temporarily unavailable. Please use the Request a Quote form or WhatsApp."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "jade_bridge_website.html"));
});

app.listen(port, () => console.log(`Jade Bridge AI site running on port ${port}`));
