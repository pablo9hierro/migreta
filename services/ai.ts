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
      "target": "equivalente holandês correto",
      "de": "equivalente em alemão",
      "wasNative": true se estava em português, false se já estava em holandês
    }
  ],

  "explanation": [
    {
      "nl": "frase de exemplo em holandês usando vocabulário do input do usuário",
      "pt": "tradução dessa frase para português",
      "de": "tradução dessa frase para alemão",
      "note": "explicação curta (1-2 frases) sem jargão técnico, comparando com como funciona em português/espanhol/alemão"
    }
  ],

  "literalExtreme": [
    { "pt": "palavra literal em português", "nl": "palavra holandesa", "de": "palavra em alemão" }
  ],

  "literalExamples": [
    "frase 1 em holandês (mesmo tema, mesma entonação e comprimento do input, afirmativa)",
    "frase 2 (negativa)",
    "frase 3 (interrogativa)",
    "frase 4 (exclamativa)",
    "frase 5 (condicional ou outro mood)",
    "frase 6 (imperativa ou outro mood)"
  ]
}

Regras:
- explanation: 5 a 6 itens, cada um demonstrando um item gramatical diferente relevante ao input
- literalExtreme: uma entrada por token da frase corrigida, na ordem exata do holandês
- literalExamples: 6 frases APENAS em holandês, sem tradução, mesmo assunto do input do usuário`;
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
    corrected: 'Ik wil dat Cabo Verde de WK wint.',
    wordMap: [
      { original: 'ik', target: 'ik', de: 'ich', wasNative: false },
      { original: 'wil', target: 'wil', de: 'will', wasNative: false },
      { original: 'dat', target: 'dat', de: 'dass', wasNative: false },
      { original: 'in copa do mundo', target: 'de WK', de: 'die WM', wasNative: true },
      { original: 'ganhe', target: 'wint', de: 'gewinnt', wasNative: true },
      { original: 'cabo verde', target: 'Cabo Verde', de: 'Kap Verde', wasNative: true },
    ],
    explanation: [
      {
        nl: 'Ik wil dat Cabo Verde de WK wint.',
        pt: 'Eu quero que Cabo Verde ganhe a Copa do Mundo.',
        de: 'Ich will, dass Kap Verde die WM gewinnt.',
        note: '"dat" funciona como "que" em português e "dass" em alemão — introduz a oração subordinada. O verbo vai pro final: "wint" fica por último.',
      },
      {
        nl: 'Ik wil niet dat ze verliezen.',
        pt: 'Eu não quero que eles percam.',
        de: 'Ich will nicht, dass sie verlieren.',
        note: '"niet" nega o verbo modal. Em português o "não" vai antes do verbo principal, em holandês vai depois do modal: "wil niet".',
      },
      {
        nl: 'De WK begint volgende week.',
        pt: 'A Copa do Mundo começa na semana que vem.',
        de: 'Die WM beginnt nächste Woche.',
        note: '"De" é o artigo definido holandês para palavras no gênero comum (de/het). Em alemão seria "die" para feminino.',
      },
      {
        nl: 'Ze spelen goed dit jaar.',
        pt: 'Eles jogam bem este ano.',
        de: 'Sie spielen dieses Jahr gut.',
        note: 'O adjetivo "goed" (bem) fica depois do verbo, como em português. Em alemão "gut" também vai depois, mas a ordem dos outros elementos pode mudar.',
      },
      {
        nl: 'Als ze winnen, is het feest.',
        pt: 'Se eles ganharem, é festa.',
        de: 'Wenn sie gewinnen, ist es ein Fest.',
        note: '"Als" = "se" (condicional). Em alemão é "wenn". Nas duas línguas, o verbo da subordinada vai pro final da cláusula.',
      },
    ],
    literalExtreme: [
      { pt: 'Eu', nl: 'Ik', de: 'Ich' },
      { pt: 'quero', nl: 'wil', de: 'will' },
      { pt: 'que', nl: 'dat', de: 'dass' },
      { pt: 'Cabo Verde', nl: 'Cabo Verde', de: 'Kap Verde' },
      { pt: 'a', nl: 'de', de: 'die' },
      { pt: 'Copa do Mundo', nl: 'WK', de: 'WM' },
      { pt: 'ganha', nl: 'wint', de: 'gewinnt' },
    ],
    literalExamples: [
      'Ik wil dat Nederland ook de WK wint.',
      'Ze willen niet dat het spel wordt afgelast.',
      'Wil jij ook dat Cabo Verde wint?',
      'Wat een geweldig spel was dat!',
      'Als Cabo Verde wint, vieren we feest.',
      'Kijk hoe goed ze spelen vandaag!',
    ],
  };
}
