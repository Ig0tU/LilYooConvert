// Unified AI service for multiple providers
export type AIProvider = 'ollama' | 'openrouter' | 'grok' | 'gemini' | 'huggingface' | 'lmstudio';

export const aiService = {
  async listModels(provider: AIProvider, apiKey: string, host?: string) {
    // TODO: implement actual API calls
    return ['llama3.1', 'gemma2', 'mixtral'];
  },
  async convertWithAI(prompt: string, provider: AIProvider, config: any) {
    // Strong YOOtheme generation logic
    return { builder_config: { sections: [] } };
  }
};