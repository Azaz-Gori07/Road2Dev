import axios from 'axios';
import { AIProvider } from '../aiProvider.js';

export class GroqProvider extends AIProvider {
  constructor() {
    super('groq');
  }

  async generate({ apiKey, prompt, systemPrompt, model, timeoutMs }) {
    const endpoint =
      process.env.GROQ_API_URL?.trim() || 'https://api.groq.com/openai/v1/chat/completions';

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
        max_tokens: Number(process.env.AI_MAX_TOKENS || 4000),
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
        provider: 'groq',
        endpoint,
        model,
      },
    };
  }
}

