const dotenv = require('dotenv');
dotenv.config();

const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT; // e.g., https://YOUR_RESOURCE.openai.azure.com
const AZURE_OPENAI_MODEL = process.env.AZURE_OPENAI_MODEL || 'gpt-4o-mini';

async function azureChat(prompt) {
  if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) return null;
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_MODEL}/chat/completions?api-version=2024-02-15-preview`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes natural, spoken-style narration for video.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  return text || null;
}

function fallbackNarration({ text, context }) {
  const base = (text || '').trim();
  const ctx = (context || '').trim();
  const preface = ctx ? `Let me walk you through this, keeping in mind ${ctx}.` : 'Let me walk you through this in a clear, friendly way.';
  const sentences = base
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const joined = sentences
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
  return `${preface} ${joined}`;
}

async function generateNarration({ text, context }) {
  const prompt = `Rewrite the following content as a natural, spoken-style narration suitable for a voiceover. Keep it concise, conversational, and engaging.\n\nContext: ${context || 'N/A'}\nContent: ${text || ''}`;
  const azure = await azureChat(prompt);
  if (azure) return azure;
  return fallbackNarration({ text, context });
}

module.exports = { generateNarration };
