import { Ollama } from 'ollama/browser';

export class OllamaService {
  private ollama: Ollama;

  constructor() {
    this.ollama = this.getOllamaInstance();
  }

  private getOllamaInstance(): Ollama {
    const host = localStorage.getItem('ollama_host') || 'http://localhost:11434';
    const apiKey = localStorage.getItem('ollama_api_key');

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return new Ollama({
      host,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          headers: {
            ...init?.headers,
            ...headers,
          },
        });
      },
    });
  }

  public async getModels(): Promise<string[]> {
    try {
      this.ollama = this.getOllamaInstance(); // Refresh instance in case settings changed
      const response = await this.ollama.list();
      return response.models.map(model => model.name);
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  public async generateCompletion(prompt: string, model: string): Promise<string> {
    try {
      this.ollama = this.getOllamaInstance();
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
      });
      return response.response;
    } catch (error) {
      console.error('Failed to generate Ollama completion:', error);
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();
