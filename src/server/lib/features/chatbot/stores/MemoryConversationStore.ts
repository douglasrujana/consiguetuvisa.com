// src/server/lib/features/chatbot/stores/MemoryConversationStore.ts

/**
 * MEMORY CONVERSATION STORE
 * Almacenamiento en memoria con expiración de 30 minutos.
 * Ideal para usuarios anónimos y desarrollo.
 * 
 * Requirements: 4.1, 4.8
 */

import type { IConversationStore } from './ConversationStore.port';
import type { Conversation, Message } from '../Chatbot.entity';
import { nanoid } from 'nanoid';

/** Tiempo de expiración en milisegundos (30 minutos) */
const EXPIRATION_MS = 30 * 60 * 1000;

/** Intervalo de limpieza en milisegundos (5 minutos) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

interface StoredConversation {
  conversation: Conversation;
  messages: Message[];
  lastAccessedAt: number;
}

export class MemoryConversationStore implements IConversationStore {
  private store: Map<string, StoredConversation> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  async create(userId?: string, title?: string): Promise<Conversation> {
    const id = nanoid();
    const now = new Date();

    const conversation: Conversation = {
      id,
      userId,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(id, {
      conversation,
      messages: [],
      lastAccessedAt: Date.now(),
    });

    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    const stored = this.store.get(id);
    if (!stored) return null;

    // Actualizar tiempo de acceso
    stored.lastAccessedAt = Date.now();

    return {
      ...stored.conversation,
      messages: [...stored.messages],
    };
  }


  async findByUserId(userId: string, limit = 20): Promise<Conversation[]> {
    const userConversations: Conversation[] = [];

    for (const stored of this.store.values()) {
      if (stored.conversation.userId === userId) {
        // Actualizar tiempo de acceso
        stored.lastAccessedAt = Date.now();
        userConversations.push({
          ...stored.conversation,
          messages: [...stored.messages],
        });
      }
    }

    return userConversations
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  async addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<Message> {
    const stored = this.store.get(conversationId);
    if (!stored) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const fullMessage: Message = {
      ...message,
      id: nanoid(),
      createdAt: new Date(),
    };

    stored.messages.push(fullMessage);
    stored.conversation.updatedAt = new Date();
    stored.conversation.messages = stored.messages;
    stored.lastAccessedAt = Date.now();

    return fullMessage;
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const stored = this.store.get(conversationId);
    if (!stored) return [];

    // Actualizar tiempo de acceso
    stored.lastAccessedAt = Date.now();

    return stored.messages.slice(-limit);
  }

  async updateTitle(conversationId: string, title: string): Promise<void> {
    const stored = this.store.get(conversationId);
    if (stored) {
      stored.conversation.title = title;
      stored.lastAccessedAt = Date.now();
    }
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  /**
   * Inicia el timer de limpieza automática
   */
  private startCleanupTimer(): void {
    // Evitar múltiples timers
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, CLEANUP_INTERVAL_MS);

    // No bloquear el proceso de Node.js
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Limpia conversaciones expiradas
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, stored] of this.store.entries()) {
      if (now - stored.lastAccessedAt > EXPIRATION_MS) {
        expiredIds.push(id);
      }
    }

    for (const id of expiredIds) {
      this.store.delete(id);
    }

    if (expiredIds.length > 0) {
      console.log(`[MemoryConversationStore] Cleaned up ${expiredIds.length} expired conversations`);
    }
  }

  /**
   * Detiene el timer de limpieza (útil para tests)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Limpia todo el store (útil para tests)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Obtiene el número de conversaciones almacenadas
   */
  size(): number {
    return this.store.size;
  }
}
