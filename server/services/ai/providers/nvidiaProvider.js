import axios from 'axios';
import { AIProvider } from '../aiProvider.js';

export class NvidiaProvider extends AIProvider {
  constructor() {
    super('nvidia');
  }

  async generate({ apiKey, prompt, systemPrompt, model, timeoutMs, jsonResponse, maxTokens }) {
    const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';

    const requestData = {
      model: model || process.env.NVIDIA_TEXT_MODEL || 'meta/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are an AI assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.35,
      max_tokens: maxTokens || Number(process.env.AI_MAX_TOKENS || 4000),
    };

    if (jsonResponse) {
      requestData.response_format = { type: 'json_object' };
    }

    const response = await axios.post(
      endpoint,
      requestData,
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
        provider: 'nvidia',
        endpoint,
        model: requestData.model,
      },
    };
  }
}
