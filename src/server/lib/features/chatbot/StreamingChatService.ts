// src/server/lib/features/chatbot/StreamingChatService.ts

/**
 * STREAMING CHAT SERVICE
 * Wrapper sobre ChatbotService que proporciona streaming de respuestas
 * usando Vercel AI SDK con Google Gemini.
 * 
 * Requirements: 9.1, 9.3
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import type { IChatbotRepository, ChatStreamChunk } from './Chatbot.port';
import type { Conversation, Message, ChatbotConfig } from './Chatbot.entity';
import { DEFAULT_CHATBOT_CONFIG } from './Chatbot.entity';
import type { IRAGEngine, RetrievedContext } from '@core/rag';

export interface StreamingChatServiceConfig {
  repository: IChatbotRepository;
  ragEngine: IRAGEngine;
  config?: Partial<ChatbotConfig>;
  model?: string;
}

export interface StreamingResponse {
  conversationId: string;
  stream: AsyncGenerator<ChatStreamChunk, void, unknown>;
}

export class StreamingChatService {
  private repository: IChatbotRepository;
  private ragEngine: IRAGEngine;
  private config: ChatbotConfig;
  private model: string;
  private googleProvider: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(serviceConfig: StreamingChatServiceConfig) {
    this.repository = serviceConfig.repository;
    this.ragEngine = serviceConfig.ragEngine;
    this.config = { ...DEFAULT_CHATBOT_CONFIG, ...serviceConfig.config };
    this.model = serviceConfig.model ?? 'gemini-2.5-flash-lite';
    
    // Crear provider con la API key del proyecto
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    this.googleProvider = createGoogleGenerativeAI({ apiKey });
  }

  /**
   * Envía un mensaje y obtiene respuesta con streaming
   * Requirements: 9.1, 9.3
   */
  async sendMessageStream(
    message: string,
    conversationId?: string,
    userId?: string
  ): Promise<StreamingResponse> {
    // 1. Obtener o crear conversación
    let conversation: Conversation;
    if (conversationId) {
      const existing = await this.repository.getConversation(conversationId);
      if (!existing) {
        conversation = await this.repository.createConversation(userId);
      } else {
        conversation = existing;
      }
    } else {
      conversation = await this.repository.createConversation(userId);
    }

    // 2. Guardar mensaje del usuario
    await this.repository.addMessage(conversation.id, {
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });

    // 3. Obtener historial para contexto
    const history = await this.repository.getMessages(conversation.id, 10);
    const chatHistory = this.formatHistory(history.slice(0, -1));

    // 4. Retrieve context from RAG
    const context = await this.ragEngine.retrieve(message, {
      topK: this.config.topK,
      minScore: this.config.minScore,
    });

    // 5. Create streaming generator
    const stream = this.createStreamingGenerator(
      conversation.id,
      message,
      context,
      chatHistory,
      history.length <= 2 && !conversation.title
    );

    return {
      conversationId: conversation.id,
      stream,
    };
  }

  /**
   * Creates an async generator that yields streaming chunks
   */
  private async *createStreamingGenerator(
    conversationId: string,
    userMessage: string,
    context: RetrievedContext,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    shouldGenerateTitle: boolean
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    // Build sources from context
    const sources = context.chunks.map((c) => ({
      content: c.content.substring(0, 200) + '...',
      source: (c.metadata?.source as string) ?? 'unknown',
      score: c.score,
    }));

    // If no context found, yield error and return
    if (context.chunks.length === 0) {
      const noContextMessage = 'No encontré información relevante para responder tu pregunta.';
      
      // Save the response
      await this.repository.addMessage(conversationId, {
        conversationId,
        role: 'assistant',
        content: noContextMessage,
        sources: [],
      });

      yield {
        type: 'content',
        content: noContextMessage,
      };
      yield {
        type: 'sources',
        sources: [],
      };
      yield { type: 'done' };
      return;
    }

    // Build context text
    const contextText = context.chunks
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    // Build system prompt with context
    const systemPrompt = `${this.config.systemPrompt}\n\n--- CONTEXTO ---\n${contextText}\n--- FIN CONTEXTO ---`;

    // Build messages array for Vercel AI SDK
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    // Add chat history
    for (const msg of chatHistory) {
      messages.push(msg);
    }
    
    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    try {
      // Stream using Vercel AI SDK with Google provider
      const result = streamText({
        model: this.googleProvider(this.model),
        system: systemPrompt,
        messages,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      let fullContent = '';

      // Yield content chunks as they arrive
      for await (const chunk of (await result).textStream) {
        if (chunk) {
          fullContent += chunk;
          yield {
            type: 'content',
            content: chunk,
          };
        }
      }

      // Save the complete response
      await this.repository.addMessage(conversationId, {
        conversationId,
        role: 'assistant',
        content: fullContent,
        sources,
      });

      // Auto-generate title if needed
      if (shouldGenerateTitle) {
        const title = this.generateTitle(userMessage);
        await this.repository.updateTitle(conversationId, title);
      }

      // Yield sources after content is complete
      yield {
        type: 'sources',
        sources,
      };

      // Signal completion
      yield { type: 'done' };

    } catch (error) {
      console.error('[StreamingChatService] Error streaming:', error);
      
      // Yield error chunk
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Error generating response',
      };
    }
  }

  /**
   * Converts history to chat message format
   */
  private formatHistory(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  /**
   * Generates automatic title based on first message
   */
  private generateTitle(firstMessage: string): string {
    const words = firstMessage.split(' ').slice(0, 6).join(' ');
    return words.length < firstMessage.length ? `${words}...` : words;
  }

  /**
   * Creates a new conversation
   */
  async createConversation(userId?: string, title?: string): Promise<Conversation> {
    return this.repository.createConversation(userId, title);
  }

  /**
   * Gets a conversation with its messages
   */
  async getConversation(id: string): Promise<Conversation | null> {
    return this.repository.getConversation(id);
  }

  /**
   * Gets conversations for a user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.repository.getUserConversations(userId);
  }

  /**
   * Gets message history
   */
  async getHistory(conversationId: string, limit?: number): Promise<Message[]> {
    return this.repository.getMessages(conversationId, limit);
  }

  /**
   * Deletes a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    return this.repository.deleteConversation(id);
  }
}
