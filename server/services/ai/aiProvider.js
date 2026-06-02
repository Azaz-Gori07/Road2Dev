/**
 * AI Provider interface (adapter abstraction).
 *
 * Providers must implement:
 *   async generate({ prompt, systemPrompt, model, timeoutMs, jsonResponse })
 * returning:
 *   { text: string, meta: { provider: string, endpoint?: string, model: string } }
 */

export class AIProvider {
  constructor(providerName) {
    this.providerName = providerName;
  }

  // eslint-disable-next-line no-unused-vars
  async generate({ prompt, systemPrompt, model, timeoutMs, jsonResponse }) {
    throw new Error('generate() not implemented');
  }
}

