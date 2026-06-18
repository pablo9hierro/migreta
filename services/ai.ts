import { MigrationResponse } from '../types';
import { FREE_MODELS } from '../constants/models';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY;

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT_EXHAUSTED');
    this.name = 'RateLimitError';
  }
}

function buildPrompt(sourceLang: string, targetLang: string, text: string): string {
  return `You are a language migration assistant. The user speaks ${sourceLang} and is learning ${targetLang}.

The user wrote this text (possibly mixing both languages when they didn't know a word):
"${text}"

Return ONLY valid JSON — no markdown fences, no explanation outside the JSON:
{
  "corrected": "full corrected text in ${targetLang}",
  "wordMap": [
    {
      "original": "word/phrase as the user wrote it",
      "target": "correct ${targetLang} equivalent",
      "wasNative": true
    }
  ],
  "explanation": "grammatical explanation in ${sourceLang} but following ${targetLang} sentence logic — explain WHY the structure is the way it is",
  "literalExtreme": "word-for-word translation preserving ${targetLang} word order — sounds wrong in ${sourceLang} but reveals the grammar structure"
}

Rules:
- wordMap must cover every content word/phrase in the user's text
- wasNative=true if the user wrote it in ${sourceLang}, false if already in ${targetLang}
- literalExtreme must keep exact ${targetLang} word order but use ${sourceLang} words`;
}

async function callModel(model: string, prompt: string): Promise<MigrationResponse> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://migreta.app',
      'X-Title': 'migreta',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!res.ok) {
    const body = await res.text();
    const bodyLower = body.toLowerCase();
    // Skip to next model on rate limit, credit exhaustion, or invalid model ID
    if (
      res.status === 402 ||
      res.status === 400 && (bodyLower.includes('not a valid model') || bodyLower.includes('invalid model')) ||
      bodyLower.includes('credit') ||
      bodyLower.includes('quota')
    ) {
      throw new Error('RATE_LIMITED');
    }
    throw new Error(`API ${res.status}: ${body}`);
  }

  const data = await res.json();

  // OpenRouter wraps errors in a 200 response sometimes
  if (data.error) {
    const msg = data.error.message?.toLowerCase() ?? '';
    if (msg.includes('rate') || msg.includes('limit') || msg.includes('credit') || msg.includes('quota')) {
      throw new Error('RATE_LIMITED');
    }
    throw new Error(data.error.message ?? 'Unknown error');
  }

  const content: string = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response from model');

  // Strip markdown fences if model wraps response in ```json
  const clean = content.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');

  return JSON.parse(match[0]) as MigrationResponse;
}

export async function migrateText(
  sourceLang: string,
  targetLang: string,
  text: string,
): Promise<MigrationResponse> {
  if (!API_KEY) {
    return getMockResponse();
  }

  const prompt = buildPrompt(sourceLang, targetLang, text);

  for (const model of FREE_MODELS) {
    try {
      return await callModel(model.id, prompt);
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMITED') {
        // This model hit rate limit — try the next one
        continue;
      }
      // Any other error (network, malformed JSON) — bubble up
      throw err;
    }
  }

  // All models exhausted
  throw new RateLimitError();
}

function getMockResponse(): MigrationResponse {
  return {
    corrected: 'No puedo entender esto todavía, pero quiero aprender español.',
    wordMap: [
      { original: 'não consigo', target: 'no puedo', wasNative: true },
      { original: 'entender', target: 'entender', wasNative: false },
      { original: 'isso', target: 'esto', wasNative: true },
      { original: 'ainda', target: 'todavía', wasNative: true },
      { original: 'mas', target: 'pero', wasNative: true },
      { original: 'quero aprender', target: 'quiero aprender', wasNative: true },
      { original: 'espanhol', target: 'español', wasNative: true },
    ],
    explanation:
      'No español, "conseguir" não existe com esse sentido — usamos "poder" para capacidade. ' +
      'A negação "no" vai antes do verbo. ' +
      '"Todavía" (ainda) vem depois do verbo que modifica.',
    literalExtreme: 'Não posso entender isto todavia, mas quero aprender espanhol.',
  };
}
