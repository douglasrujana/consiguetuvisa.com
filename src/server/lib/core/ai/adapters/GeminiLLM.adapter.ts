// src/server/lib/core/ai/adapters/GeminiLLM.adapter.ts

/**
 * ADAPTADOR GEMINI LLM
 * Implementa ILLMProvider usando Google Gemini API.
 * Incluye manejo robusto de errores y retry automático.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ILLMProvider,
  ChatMessage,
  GenerateOptions,
  GenerateResponse,
  StreamChunk,
} from '../LLM.port';
import { parseGeminiError, withRetry } from '../AI.error';

export class GeminiLLMAdapter implements ILLMProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;

  private client: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(apiKey?: string, model: string = 'gemini-2.5-flash-lite') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.modelName = model;
    this.client = new GoogleGenerativeAI(key);
    this.model = this.client.getGenerativeModel({ model: this.modelName });
  }

  async generate(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<GenerateResponse> {
    try {
      const { systemPrompt, history, lastMessage } = this.formatMessages(messages);

      // Para Gemini 2.5, incluir system prompt en el primer mensaje del usuario
      let finalMessage = lastMessage;
      if (systemPrompt) {
        finalMessage = `[INSTRUCCIONES DEL SISTEMA]\n${systemPrompt}\n[FIN INSTRUCCIONES]\n\n${lastMessage}`;
      }

      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
          topP: options?.topP ?? 0.9,
          stopSequences: options?.stopSequences,
        },
      });

      const result = await chat.sendMessage(finalMessage);
      const response = result.response;
      const text = response.text();

      return {
        content: text,
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount ?? 0,
              completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: response.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
      };
    } catch (error) {
      console.error('[GeminiLLM] Error generating:', error);
      throw parseGeminiError(error as Error);
    }
  }

  /**
   * Genera respuesta con retry automático para errores transitorios
   */
  async generateWithRetry(
    messages: ChatMessage[],
    options?: GenerateOptions & { maxRetries?: number }
  ): Promise<GenerateResponse> {
    return withRetry(() => this.generate(messages, options), {
      maxRetries: options?.maxRetries ?? 3,
      onRetry: (error, attempt) => {
        console.log(`[GeminiLLM] Retry ${attempt}: ${error.message}`);
      },
    });
  }

  async *generateStream(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const { systemPrompt, history, lastMessage } = this.formatMessages(messages);

      // Para Gemini 2.5, incluir system prompt en el primer mensaje del usuario
      let finalMessage = lastMessage;
      if (systemPrompt) {
        finalMessage = `[INSTRUCCIONES DEL SISTEMA]\n${systemPrompt}\n[FIN INSTRUCCIONES]\n\n${lastMessage}`;
      }

      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
          topP: options?.topP ?? 0.9,
          stopSequences: options?.stopSequences,
        },
      });

      const result = await chat.sendMessageStream(finalMessage);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield {
            content: text,
            isComplete: false,
          };
        }
      }

      yield {
        content: '',
        isComplete: true,
      };
    } catch (error) {
      console.error('[GeminiLLM] Error streaming:', error);
      throw parseGeminiError(error as Error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('ping');
      return !!result.response;
    } catch {
      return false;
    }
  }

  /**
   * Convierte ChatMessage[] al formato de Gemini
   */
  private formatMessages(messages: ChatMessage[]): {
    systemPrompt: string | undefined;
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    lastMessage: string;
  } {
    let systemPrompt: string | undefined;
    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Extraer system prompt
    const systemMsg = messages.find((m) => m.role === 'system');
    if (systemMsg) {
      systemPrompt = systemMsg.content;
    }

    // Convertir mensajes (excepto system y el último)
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');
    const historyMessages = nonSystemMessages.slice(0, -1);

    for (const msg of historyMessages) {
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Último mensaje del usuario
    const lastMsg = nonSystemMessages[nonSystemMessages.length - 1];
    const lastMessage = lastMsg?.content ?? '';

    return { systemPrompt, history, lastMessage };
  }

  private mapFinishReason(
    reason?: string
  ): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
