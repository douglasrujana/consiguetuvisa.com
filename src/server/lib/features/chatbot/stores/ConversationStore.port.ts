// src/server/lib/features/chatbot/stores/ConversationStore.port.ts

/**
 * CONVERSATION STORE PORT
 * Contrato común para todos los stores de conversaciones.
 * Implementado por MemoryConversationStore y PrismaConversationStore.
 * 
 * Requirements: 4.5
 */

import type { Conversation, Message } from '../Chatbot.entity';

/**
 * Interface para almacenamiento de conversaciones
 */
export interface IConversationStore {
  /**
   * Crea una nueva conversación
   */
  create(userId?: string, title?: string): Promise<Conversation>;

  /**
   * Busca una conversación por ID
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Busca conversaciones de un usuario
   */
  findByUserId(userId: string, limit?: number): Promise<Conversation[]>;

  /**
   * Agrega un mensaje a una conversación
   */
  addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<Message>;

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
  delete(id: string): Promise<void>;
}

/**
 * Modo de almacenamiento de chat
 * - memory-only: Solo memoria (anónimos y autenticados)
 * - persist-all: Persistir todo en DB (anónimos y autenticados)
 * - smart: Memoria para anónimos, DB para autenticados
 */
export type ChatStorageMode = 'memory-only' | 'persist-all' | 'smart';
