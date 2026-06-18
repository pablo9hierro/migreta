import { MigrationResponse } from '../types';
import { FREE_MODELS } from '../constants/models';
import { SYSTEM_PROMPT } from './systemPrompt';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY;

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT_EXHAUSTED');
    this.name = 'RateLimitError';
  }
}

function buildUserMessage(sourceLang: string, targetLang: string, text: string): string {
  return `Idioma base do usuário: ${sourceLang}
Idioma alvo (que está aprendendo): ${targetLang}

Texto que o usuário escreveu (possivelmente misturando os dois idiomas):
"${text}"

Retorne APENAS JSON válido, sem markdown, sem texto fora do JSON:
{
  "corrected": "frase correta em holandês",
  "wordMap": [
    {
      "original": "palavra/expressão exatamente como o usuário escreveu",
      "target": "equivalente correto em holandês",
      "wasNative": true
    }
  ],
  "explanation": "5 a 6 frases de exemplo + explicações como definido no system prompt",
  "literalExtreme": [
    { "nl": "palavra holandesa", "pt": "equivalente literal em português", "de": "equivalente em alemão" }
  ]
}

IMPORTANTE para literalExtreme:
- Uma entrada por palavra/token da frase corrigida em holandês, na ordem exata
- "nl": a palavra holandesa da frase corrigida
- "pt": o que essa palavra significa literalmente em português (pode soar estranho — é intencional)
- "de": como seria essa mesma palavra/posição em alemão (mantendo a estrutura/ordem do holandês)`;
}

async function callModel(model: string, messages: object[]): Promise<MigrationResponse> {
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
      messages,
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });

  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!res.ok) {
    const body = await res.text();
    const bodyLower = body.toLowerCase();
    if (
      res.status === 402 ||
      (res.status === 400 && (bodyLower.includes('not a valid model') || bodyLower.includes('invalid model'))) ||
      bodyLower.includes('credit') ||
      bodyLower.includes('quota')
    ) {
      throw new Error('RATE_LIMITED');
    }
    throw new Error(`API ${res.status}: ${body}`);
  }

  const data = await res.json();

  if (data.error) {
    const msg = data.error.message?.toLowerCase() ?? '';
    if (msg.includes('rate') || msg.includes('limit') || msg.includes('credit') || msg.includes('quota')) {
      throw new Error('RATE_LIMITED');
    }
    throw new Error(data.error.message ?? 'Unknown error');
  }

  const content: string = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response from model');

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

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserMessage(sourceLang, targetLang, text) },
  ];

  for (const model of FREE_MODELS) {
    try {
      return await callModel(model.id, messages);
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMITED') {
        continue;
      }
      throw err;
    }
  }

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
      'Ik kan het niet begrijpen.\n↳ "kan" = posso/consigo. Em holandês não existe "conseguir" separado de "poder" — "kunnen" cobre os dois. Em alemão é igual: "können".\n\n' +
      'Ik begrijp het nog steeds niet.\n↳ "nog steeds" = ainda/mesmo assim. Em português precisaria de "ainda" ou "mesmo assim". Em espanhol "todavía".\n\n' +
      'Maar ik wil het leren.\n↳ "wil" = quero. "Willen" em holandês é direto como "querer" em português — sem rodeio.\n\n' +
      'Kan jij het mij uitleggen?\n↳ "uitleggen" é verbo separável: "uit" vai pro fim. Como "aufklären" em alemão. Em português seria como se "explicar" virasse "ex...ar" com "plic" indo pro final.',
    literalExtreme: [
      { nl: 'Ik', pt: 'Eu', de: 'Ich' },
      { nl: 'kan', pt: 'posso', de: 'kann' },
      { nl: 'het', pt: 'isso', de: 'es' },
      { nl: 'niet', pt: 'não', de: 'nicht' },
      { nl: 'begrijpen', pt: 'entender', de: 'verstehen' },
    ],
  };
}
