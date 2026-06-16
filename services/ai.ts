import { MigrationResponse } from '../types';

// Set EXPO_PUBLIC_AI_URL in .env when your local DeepSeek API is running
// e.g. EXPO_PUBLIC_AI_URL=http://192.168.1.100:11434/v1
const AI_BASE = process.env.EXPO_PUBLIC_AI_URL;
const AI_MODEL = process.env.EXPO_PUBLIC_AI_MODEL ?? 'deepseek-r1:latest';

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
  "literalExtreme": "word-for-word translation preserving ${targetLang} word order — sounds wrong in ${sourceLang} but exposes the grammar structure"
}

Rules:
- wordMap must cover every content word/phrase in the user's text
- wasNative=true if the user wrote it in ${sourceLang} (their fallback), false if already in ${targetLang}
- literalExtreme must NOT reorder words — keep exact ${targetLang} word order but use ${sourceLang} words`;
}

export async function migrateText(
  sourceLang: string,
  targetLang: string,
  text: string,
): Promise<MigrationResponse> {
  if (!AI_BASE) {
    return getMockResponse(sourceLang, targetLang, text);
  }

  const res = await fetch(`${AI_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: buildPrompt(sourceLang, targetLang, text) }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) throw new Error(`AI API ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown fences if model wraps in ```json
  const jsonStr = content.replace(/^```(?:json)?\n?/m, '').replace(/```$/m, '').trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  return JSON.parse(jsonMatch[0]) as MigrationResponse;
}

function getMockResponse(sourceLang: string, targetLang: string, text: string): MigrationResponse {
  // Realistic demo showing pt→es migration
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
      'A negação "no" vai imediatamente antes do verbo. ' +
      '"Todavía" (ainda) segue o verbo que modifica. ' +
      'A estrutura da frase é quase idêntica ao português neste caso.',
    literalExtreme: 'Não posso entender isto todavia, mas quero aprender espanhol.',
  };
}
