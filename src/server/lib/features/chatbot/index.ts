// src/server/lib/features/chatbot/index.ts

/**
 * FEATURE CHATBOT - Exportaciones públicas
 */

// Entities
export type { Message, Conversation, MessageSource, ChatbotConfig } from './Chatbot.entity';
export { DEFAULT_CHATBOT_CONFIG } from './Chatbot.entity';

// DTOs
export {
  SendMessageInputSchema,
  CreateConversationInputSchema,
  GetHistoryInputSchema,
  validateSendMessage,
  validateCreateConversation,
  type SendMessageInput,
  type CreateConversationInput,
  type GetHistoryInput,
} from './Chatbot.dto';

// Ports
export type { IChatbotRepository, ChatResponse, ChatStreamChunk } from './Chatbot.port';

// Repository
export { ChatbotRepository, createChatbotRepository } from './Chatbot.repository';

// Service
export { ChatbotService, type ChatbotServiceConfig } from './Chatbot.service';
export { StreamingChatService, type StreamingChatServiceConfig, type StreamingResponse } from './StreamingChatService';

// Stores
export type { IConversationStore, ChatStorageMode } from './stores/ConversationStore.port';
export { MemoryConversationStore } from './stores/MemoryConversationStore';
export { PrismaConversationStore } from './stores/PrismaConversationStore';
export { StoreSelector } from './stores/StoreSelector';
