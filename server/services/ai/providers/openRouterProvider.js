import axios from 'axios';
import { AIProvider } from '../aiProvider.js';

export class OpenRouterProvider extends AIProvider {
  constructor() {
    super('openrouter');
  }

  async generate({ apiKey, prompt, systemPrompt, model, timeoutMs, jsonResponse, maxTokens }) {
    const endpoint =
      process.env.OPENROUTER_API_URL?.trim() || 'https://openrouter.ai/api/v1/chat/completions';

    const response = await axios.post(
      endpoint,
      {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are an AI assistant. Always return strict JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.35,
        max_tokens: maxTokens || Number(process.env.AI_MAX_TOKENS || 4000),
        response_format: { type: 'json_object' },
      },
      {
        timeout: timeoutMs,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;

    return {
      text,
      meta: {
        provider: 'openrouter',
        endpoint,
        model,
      },
    };
  }
}
