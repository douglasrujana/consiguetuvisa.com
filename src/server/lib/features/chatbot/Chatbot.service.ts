// src/server/lib/features/chatbot/Chatbot.service.ts

/**
 * SERVICIO CHATBOT - Lógica de negocio
 * Orquesta RAG, persistencia y generación de respuestas.
 */

import type { IChatbotRepository, ChatResponse, ChatStreamChunk } from './Chatbot.port';
import type { Conversation, Message, ChatbotConfig } from './Chatbot.entity';
import { DEFAULT_CHATBOT_CONFIG } from './Chatbot.entity';
import type { IRAGEngine } from '@core/rag';
import type { ChatMessage } from '@core/ai';

export interface ChatbotServiceConfig {
  repository: IChatbotRepository;
  ragEngine: IRAGEngine;
  config?: Partial<ChatbotConfig>;
}

export class ChatbotService {
  private repository: IChatbotRepository;
  private ragEngine: IRAGEngine;
  private config: ChatbotConfig;

  constructor(serviceConfig: ChatbotServiceConfig) {
    this.repository = serviceConfig.repository;
    this.ragEngine = serviceConfig.ragEngine;
    this.config = { ...DEFAULT_CHATBOT_CONFIG, ...serviceConfig.config };
  }

  /**
   * Envía un mensaje y obtiene respuesta (sin streaming)
   */
  async sendMessage(
    message: string,
    conversationId?: string,
    userId?: string
  ): Promise<ChatResponse> {
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
    const chatHistory = this.formatHistory(history.slice(0, -1)); // Excluir el mensaje actual

    // 4. Query RAG con historial
    const ragResponse = await this.ragEngine.query(message, {
      topK: this.config.topK,
      minScore: this.config.minScore,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      systemPrompt: this.config.systemPrompt,
      includeHistory: chatHistory,
    });

    // 5. Guardar respuesta del asistente
    const assistantMessage = await this.repository.addMessage(conversation.id, {
      conversationId: conversation.id,
      role: 'assistant',
      content: ragResponse.answer,
      sources: ragResponse.sources,
    });

    // 6. Auto-generar título si es primera respuesta
    if (history.length <= 2 && !conversation.title) {
      const title = this.generateTitle(message);
      await this.repository.updateTitle(conversation.id, title);
    }

    return {
      message: assistantMessage,
      sources: ragResponse.sources,
    };
  }

  /**
   * Crea una nueva conversación
   */
  async createConversation(userId?: string, title?: string): Promise<Conversation> {
    return this.repository.createConversation(userId, title);
  }

  /**
   * Obtiene una conversación con sus mensajes
   */
  async getConversation(id: string): Promise<Conversation | null> {
    return this.repository.getConversation(id);
  }

  /**
   * Obtiene conversaciones de un usuario
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.repository.getUserConversations(userId);
  }

  /**
   * Obtiene historial de mensajes
   */
  async getHistory(conversationId: string, limit?: number): Promise<Message[]> {
    return this.repository.getMessages(conversationId, limit);
  }

  /**
   * Elimina una conversación
   */
  async deleteConversation(id: string): Promise<void> {
    return this.repository.deleteConversation(id);
  }

  /**
   * Convierte historial a formato ChatMessage
   */
  private formatHistory(messages: Message[]): ChatMessage[] {
    return messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  /**
   * Genera título automático basado en el primer mensaje
   */
  private generateTitle(firstMessage: string): string {
    // Tomar primeras palabras
    const words = firstMessage.split(' ').slice(0, 6).join(' ');
    return words.length < firstMessage.length ? `${words}...` : words;
  }
}
