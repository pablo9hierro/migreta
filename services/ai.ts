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
  "corrected": "frase correta no idioma alvo",
  "wordMap": [
    {
      "original": "palavra/expressão exatamente como o usuário escreveu",
      "target": "equivalente correto em ${targetLang}",
      "wasNative": true
    }
  ],
  "explanation": "explicação no estilo definido — analogia + 4 exemplos em moods diferentes",
  "literalExtreme": "ordem exata de palavras de ${targetLang} mas com palavras de ${sourceLang}"
}`;
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
      'Em espanhol "poder" é a chave que abre possibilidade — diferente de "conseguir".\n\n' +
      '→ [afirmativa] Yo puedo correr rápido. (Eu posso correr rápido.)\n' +
      '→ [negativa] No puedo dormir. (Não consigo dormir.)\n' +
      '→ [exclamativa] ¡Puedo hacerlo! (Eu consigo fazer isso!)\n' +
      '→ [condicional] Si pudiera, iría. (Se eu pudesse, iria.)',
    literalExtreme: 'Não posso entender isto todavia, mas quero aprender espanhol.',
  };
}
