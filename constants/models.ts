// Free models on OpenRouter — rotated in order when one hits rate limit.
// Verify/update IDs at openrouter.ai/models?q=free if any return 404.
export const FREE_MODELS = [
  { id: 'microsoft/gpt-oss-120b:free',              name: 'GPT-OSS 120B' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',   name: 'Llama 3.3 70B' },
  { id: 'google/gemma-3-27b-it:free',               name: 'Gemma 4 26B' },
  { id: 'google/gemma-3-27b-it:free',               name: 'Gemma 4 31B' },
  { id: 'microsoft/gpt-oss-20b:free',               name: 'GPT-OSS 20B' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',    name: 'Llama 3.2 3B' },
] as const;
