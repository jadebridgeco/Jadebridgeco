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
app.use(express.static(__dirname));

const sessions = new Map();
const MAX_MESSAGES = 24;

const JADE_BRIDGE_INSTRUCTIONS = `
You are Jadebridge Co. Assistant, the customer-facing AI assistant for an international China sourcing and procurement company.

Business:
- Jadebridge Co. helps entrepreneurs, brands and businesses source products from China.
- Services: China product sourcing, supplier sourcing, procurement coordination, supplier verification and quality-control support.
- Procurement can include supplier research, supplier communication, quotation coordination, product specification clarification, and procurement coordination based on an agreed scope.
- Jadebridge Co. serves clients in Nigeria and international clients worldwide.
- Answer the visitor's actual question whenever possible. Do not restrict the visitor to the preset buttons; the visitor may ask any relevant sourcing, procurement, supplier, product, quality-control or China trade question.
- If the question requires a live quotation, current supplier information, current prices, freight rates, availability, inspection result or another real-time check, explain that a human Jadebridge Co. team member needs to assess it and direct the visitor to WhatsApp or the Request a Quote form.
- Do not invent supplier names, prices, shipping rates, delivery times, testimonials, client names, guarantees, certifications, or business claims.
- Do not claim that you personally perform physical inspection, purchase products, or communicate with suppliers.
- Keep responses warm, professional, concise and commercially useful.
- Ask only the clarifying questions needed to move the visitor forward: product, quantity, destination/market, specifications, target price/budget if known, and whether they need sourcing only or procurement support.
- Never request passwords, payment-card details, or sensitive personal information.
- When the visitor is ready to engage, encourage them to continue on WhatsApp or use the Request a Quote form.
`;

function getSession(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

app.post("/api/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    let sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
    const lead = req.body?.lead && typeof req.body.lead === "object" ? req.body.lead : {};

    if (!message) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 3000) return res.status(400).json({ error: "Message is too long." });

    if (!sessionId || !/^[a-zA-Z0-9_-]{10,100}$/.test(sessionId)) sessionId = crypto.randomUUID();

    const history = getSession(sessionId);
    history.push({ role: "user", content: message });
    while (history.length > MAX_MESSAGES) history.shift();

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL,
      instructions: JADE_BRIDGE_INSTRUCTIONS,
      input: history,
      metadata: { lead_email: String(lead.email || "").slice(0, 200) }
    });

    const answer = response.output_text || "I couldn't generate a response right now. Please continue with Jadebridge Co. on WhatsApp or use the Request a Quote form.";
    history.push({ role: "assistant", content: answer });
    while (history.length > MAX_MESSAGES) history.shift();

    res.json({ answer, sessionId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "The assistant is temporarily unavailable. Please use WhatsApp or the Request a Quote form." });
  }
});

app.post("/api/leads", (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });
  console.log(JSON.stringify({ type: "jadebridge_lead", name, email, createdAt: new Date().toISOString() }));
  res.json({ ok: true });
});

app.get("/{*splat}", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(port, () => console.log(`Jadebridge Co. site running on port ${port}`));
