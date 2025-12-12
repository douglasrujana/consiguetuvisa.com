// src/server/lib/features/chatbot/stores/StoreSelector.ts

/**
 * STORE SELECTOR
 * Selecciona el ConversationStore apropiado según el modo y userId.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import type { IConversationStore, ChatStorageMode } from './ConversationStore.port';

/**
 * Obtiene el modo de almacenamiento desde variables de entorno
 */
function getChatStorageMode(): ChatStorageMode {
  const mode = process.env.CHAT_STORAGE_MODE ?? 'smart';
  
  if (mode === 'memory-only' || mode === 'persist-all' || mode === 'smart') {
    return mode;
  }
  
  console.warn(`[StoreSelector] Invalid CHAT_STORAGE_MODE: ${mode}, defaulting to 'smart'`);
  return 'smart';
}

export class StoreSelector {
  private mode: ChatStorageMode;

  constructor(
    private memoryStore: IConversationStore,
    private prismaStore: IConversationStore,
    mode?: ChatStorageMode
  ) {
    this.mode = mode ?? getChatStorageMode();
  }

  /**
   * Selecciona el store apropiado según el modo y userId
   * 
   * - memory-only: Siempre retorna MemoryConversationStore
   * - persist-all: Siempre retorna PrismaConversationStore
   * - smart: Memory para anónimos, Prisma para autenticados
   */
  select(userId?: string): IConversationStore {
    switch (this.mode) {
      case 'memory-only':
        return this.memoryStore;
      
      case 'persist-all':
        return this.prismaStore;
      
      case 'smart':
      default:
        return userId ? this.prismaStore : this.memoryStore;
    }
  }

  /**
   * Obtiene el modo actual
   */
  getMode(): ChatStorageMode {
    return this.mode;
  }

  /**
   * Cambia el modo (útil para tests)
   */
  setMode(mode: ChatStorageMode): void {
    this.mode = mode;
  }
}
