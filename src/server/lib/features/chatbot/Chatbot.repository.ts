// src/server/lib/features/chatbot/Chatbot.repository.ts

/**
 * REPOSITORIO CHATBOT - Delegación a ConversationStore
 * Usa StoreSelector para elegir el store apropiado según modo y userId.
 * 
 * Requirements: 4.5
 */

import type { IChatbotRepository } from './Chatbot.port';
import type { Conversation, Message } from './Chatbot.entity';
import type { StoreSelector } from './stores/StoreSelector';

export class ChatbotRepository implements IChatbotRepository {
  constructor(private storeSelector: StoreSelector) {}

  async createConversation(userId?: string, title?: string): Promise<Conversation> {
    const store = this.storeSelector.select(userId);
    return store.create(userId, title);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    // Para getConversation, necesitamos buscar en ambos stores si no sabemos el userId
    // Primero intentamos con el store de memoria, luego con Prisma
    const memoryStore = this.storeSelector.select(undefined);
    const conversation = await memoryStore.findById(id);
    
    if (conversation) {
      return conversation;
    }

    // Si no está en memoria, buscar en Prisma (si el modo lo permite)
    const mode = this.storeSelector.getMode();
    if (mode !== 'memory-only') {
      const prismaStore = this.storeSelector.select('_lookup_');
      return prismaStore.findById(id);
    }

    return null;
  }

  async getUserConversations(userId: string, limit = 20): Promise<Conversation[]> {
    const store = this.storeSelector.select(userId);
    return store.findByUserId(userId, limit);
  }

  async addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<Message> {
    // Necesitamos encontrar la conversación primero para saber qué store usar
    const conversation = await this.getConversation(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const store = this.storeSelector.select(conversation.userId);
    return store.addMessage(conversationId, message);
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    // Necesitamos encontrar la conversación primero para saber qué store usar
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      return [];
    }

    const store = this.storeSelector.select(conversation.userId);
    return store.getMessages(conversationId, limit);
  }

  async updateTitle(conversationId: string, title: string): Promise<void> {
    // Necesitamos encontrar la conversación primero para saber qué store usar
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      return;
    }

    const store = this.storeSelector.select(conversation.userId);
    return store.updateTitle(conversationId, title);
  }

  async deleteConversation(id: string): Promise<void> {
    // Necesitamos encontrar la conversación primero para saber qué store usar
    const conversation = await this.getConversation(id);
    
    if (!conversation) {
      return;
    }

    const store = this.storeSelector.select(conversation.userId);
    return store.delete(id);
  }
}

/**
 * Factory para crear ChatbotRepository con StoreSelector
 */
export function createChatbotRepository(storeSelector: StoreSelector): IChatbotRepository {
  return new ChatbotRepository(storeSelector);
}
