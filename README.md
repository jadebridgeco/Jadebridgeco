# Jade Bridge AI Website

This version connects the existing Jade Bridge chatbox to a real AI backend.

## What it does
- Keeps the OpenAI API key on the server; it is never placed in the website JavaScript.
- Sends visitor messages to the OpenAI Responses API.
- Maintains a short conversation history per browser session.
- Gives the assistant Jade Bridge-specific instructions.
- Lets the visitor continue to the existing Request a Quote / WhatsApp flow.

OpenAI's current guidance is to use the Responses API for new integrations; the older Assistants API was sunset on August 26, 2026.

## Run locally

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Add your OpenAI API key to `.env`.
4. Run:
   npm install
   npm start
5. Open http://localhost:3000

## Before publishing
- Put your real WhatsApp number in the website's existing quote/WhatsApp code.
- Add your real email and social links.
- Replace the placeholder client testimonials with verified testimonials and photos.
- Review the assistant instructions in `server.js` and add any exact business policies you want it to follow.
- Deploy the folder to a Node-capable host such as Render, Railway, Fly.io, Vercel (with an adapted serverless route), or another provider that supports the required runtime.

Never put OPENAI_API_KEY in the public HTML or client-side JavaScript.
