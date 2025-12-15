// src/server/lib/features/chatbot/stores/PrismaConversationStore.ts

/**
 * PRISMA CONVERSATION STORE
 * Almacenamiento persistente con Prisma/Turso.
 * Ideal para usuarios autenticados.
 * 
 * Requirements: 4.2, 4.9
 */

import type { IConversationStore } from './ConversationStore.port';
import type { Conversation, Message, MessageSource } from '../Chatbot.entity';
import type { PrismaClient } from '@prisma/client';

export class PrismaConversationStore implements IConversationStore {
  constructor(private prisma: PrismaClient) {}

  async create(userId?: string, title?: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.create({
      data: {
        customerId: userId, // userId es el customerId en el nuevo schema
        title,
      },
      include: {
        messages: true,
      },
    });

    return this.mapConversation(conversation);
  }

  async findById(id: string): Promise<Conversation | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) return null;

    return this.mapConversation(conversation);
  }

  async findByUserId(userId: string, limit = 20): Promise<Conversation[]> {
    // userId es el customerId en el nuevo schema
    const conversations = await this.prisma.conversation.findMany({
      where: { customerId: userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return conversations.map((c) => this.mapConversation(c));
  }


  async addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<Message> {
    // Serializar sources a JSON si existen
    const sourcesJson = message.sources ? JSON.stringify(message.sources) : null;

    const chatMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: message.role,
        content: message.content,
        sources: sourcesJson,
      },
    });

    // Actualizar timestamp de la conversación
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return this.mapMessage(chatMessage);
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map((m) => this.mapMessage(m));
  }

  async updateTitle(conversationId: string, title: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  async delete(id: string): Promise<void> {
    // Los mensajes se eliminan en cascada por la relación en Prisma
    await this.prisma.conversation.delete({
      where: { id },
    });
  }

  /**
   * Mapea una conversación de Prisma a la entidad de dominio
   */
  private mapConversation(
    prismaConversation: {
      id: string;
      customerId: string | null;
      title: string | null;
      createdAt: Date;
      updatedAt: Date;
      messages: Array<{
        id: string;
        conversationId: string;
        role: string;
        content: string;
        sources: string | null;
        createdAt: Date;
      }>;
    }
  ): Conversation {
    return {
      id: prismaConversation.id,
      userId: prismaConversation.customerId ?? undefined, // Mantener compatibilidad con entidad
      title: prismaConversation.title ?? undefined,
      messages: prismaConversation.messages.map((m) => this.mapMessage(m)),
      createdAt: prismaConversation.createdAt,
      updatedAt: prismaConversation.updatedAt,
    };
  }

  /**
   * Mapea un mensaje de Prisma a la entidad de dominio
   */
  private mapMessage(
    prismaMessage: {
      id: string;
      conversationId: string;
      role: string;
      content: string;
      sources: string | null;
      createdAt: Date;
    }
  ): Message {
    let sources: MessageSource[] | undefined;
    
    if (prismaMessage.sources) {
      try {
        sources = JSON.parse(prismaMessage.sources) as MessageSource[];
      } catch {
        sources = undefined;
      }
    }

    return {
      id: prismaMessage.id,
      conversationId: prismaMessage.conversationId,
      role: prismaMessage.role as 'user' | 'assistant' | 'system',
      content: prismaMessage.content,
      sources,
      createdAt: prismaMessage.createdAt,
    };
  }
}
