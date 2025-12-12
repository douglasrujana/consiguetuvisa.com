// src/server/lib/features/chatbot/Chatbot.port.ts

/**
 * PUERTOS DEL CHATBOT
 * Interfaces para repositorio y servicio.
 */

import type { Conversation, Message } from './Chatbot.entity';

/**
 * Contrato para persistencia de conversaciones
 */
export interface IChatbotRepository {
  /**
   * Crea una nueva conversación
   */
  createConversation(userId?: string, title?: string): Promise<Conversation>;

  /**
   * Obtiene una conversación por ID
   */
  getConversation(id: string): Promise<Conversation | null>;

  /**
   * Obtiene conversaciones de un usuario
   */
  getUserConversations(userId: string, limit?: number): Promise<Conversation[]>;

  /**
   * Agrega un mensaje a una conversación
   */
  addMessage(conversationId: string, message: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;

  /**
   * Obtiene mensajes de una conversación
   */
  getMessages(conversationId: string, limit?: number): Promise<Message[]>;

  /**
   * Actualiza el título de una conversación
   */
  updateTitle(conversationId: string, title: string): Promise<void>;

  /**
   * Elimina una conversación
   */
  deleteConversation(id: string): Promise<void>;
}

/**
 * Respuesta del chatbot (no streaming)
 */
export interface ChatResponse {
  message: Message;
  sources: Array<{
    content: string;
    source: string;
    score: number;
  }>;
}

/**
 * Chunk de streaming
 */
export interface ChatStreamChunk {
  type: 'content' | 'sources' | 'done' | 'error';
  content?: string;
  sources?: Array<{
    content: string;
    source: string;
    score: number;
  }>;
  error?: string;
}
