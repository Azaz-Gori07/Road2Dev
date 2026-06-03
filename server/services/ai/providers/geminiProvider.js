import axios from 'axios';
import { AIProvider } from '../aiProvider.js';

export class GeminiProvider extends AIProvider {
  constructor() {
    super('gemini');
  }

  async generate({ apiKey, prompt, systemPrompt, model, timeoutMs }) {
    const apiVersion = process.env.AI_API_VERSION || 'v1beta';
    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

    const payload = {
      contents: [
        {
          parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000),
        responseMimeType: 'application/json',
      },
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
      payload.contents[0].parts[0].text = prompt;
    }

    const response = await axios.post(endpoint, payload, {
      params: { key: apiKey },
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      text,
      meta: {
        provider: 'gemini',
        endpoint,
        model,
      },
    };
  }
}

