// Free models on OpenRouter — rotated in order when one hits rate limit or returns invalid model.
export const FREE_MODELS = [
  { id: 'openai/gpt-oss-120b:free',                name: 'GPT-OSS 120B' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',  name: 'Llama 3.3 70B' },
  { id: 'google/gemma-4-26b-a4b:free',             name: 'Gemma 4 26B A4B' },
  { id: 'google/gemma-4-31b:free',                 name: 'Gemma 4 31B' },
  { id: 'openai/gpt-oss-20b:free',                 name: 'GPT-OSS 20B' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',   name: 'Llama 3.2 3B' },
] as const;
