// src/server/lib/features/chatbot/__tests__/StoreSelector.property.test.ts

/**
 * **Feature: rag-knowledge-system, Property 8: StoreSelector Mode Consistency**
 * For any combination of mode and userId, the StoreSelector should
 * deterministically return the same store type.
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */

import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { StoreSelector } from '../stores/StoreSelector';
import { MemoryConversationStore } from '../stores/MemoryConversationStore';
import type { IConversationStore, ChatStorageMode } from '../stores/ConversationStore.port';

// Configure fast-check to run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Mock PrismaConversationStore for testing (we just need to identify it)
class MockPrismaStore implements IConversationStore {
  readonly storeType = 'prisma';
  async create() { return {} as any; }
  async findById() { return null; }
  async findByUserId() { return []; }
  async addMessage() { return {} as any; }
  async getMessages() { return []; }
  async updateTitle() {}
  async delete() {}
}

describe('StoreSelector Mode Consistency - Property Tests', () => {
  let memoryStore: MemoryConversationStore;
  let prismaStore: MockPrismaStore;

  beforeEach(() => {
    memoryStore = new MemoryConversationStore();
    prismaStore = new MockPrismaStore();
  });

  /**
   * Property 8.1: memory-only mode always returns MemoryConversationStore
   * WHEN the StoreSelector mode is 'memory-only' THEN the StoreSelector
   * SHALL return MemoryConversationStore for all requests
   */
  test('memory-only mode always returns MemoryConversationStore', () => {
    const selector = new StoreSelector(memoryStore, prismaStore, 'memory-only');

    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        (userId) => {
          const store = selector.select(userId);
          return store === memoryStore;
        }
      )
    );
  });


  /**
   * Property 8.2: persist-all mode always returns PrismaConversationStore
   * WHEN the StoreSelector mode is 'persist-all' THEN the StoreSelector
   * SHALL return PrismaConversationStore for all requests
   */
  test('persist-all mode always returns PrismaConversationStore', () => {
    const selector = new StoreSelector(memoryStore, prismaStore, 'persist-all');

    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        (userId) => {
          const store = selector.select(userId);
          return store === prismaStore;
        }
      )
    );
  });

  /**
   * Property 8.3: smart mode returns MemoryConversationStore when userId is absent
   * WHEN the StoreSelector mode is 'smart' and userId is absent THEN the
   * StoreSelector SHALL return MemoryConversationStore
   */
  test('smart mode returns MemoryConversationStore when userId is absent', () => {
    const selector = new StoreSelector(memoryStore, prismaStore, 'smart');

    // Test with undefined userId
    const store = selector.select(undefined);
    expect(store).toBe(memoryStore);

    // Test with empty string (should be treated as falsy)
    const storeEmpty = selector.select('');
    expect(storeEmpty).toBe(memoryStore);
  });

  /**
   * Property 8.4: smart mode returns PrismaConversationStore when userId is present
   * WHEN the StoreSelector mode is 'smart' and userId is present THEN the
   * StoreSelector SHALL return PrismaConversationStore
   */
  test('smart mode returns PrismaConversationStore when userId is present', () => {
    const selector = new StoreSelector(memoryStore, prismaStore, 'smart');

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // Non-empty userId
        (userId) => {
          const store = selector.select(userId);
          return store === prismaStore;
        }
      )
    );
  });

  /**
   * Property 8.5: Selection is deterministic - same inputs always produce same outputs
   * For any mode and userId, calling select multiple times should return the same store
   */
  test('selection is deterministic for any mode and userId', () => {
    const modes: ChatStorageMode[] = ['memory-only', 'persist-all', 'smart'];

    fc.assert(
      fc.property(
        fc.constantFrom(...modes),
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        (mode, userId) => {
          const selector = new StoreSelector(memoryStore, prismaStore, mode);
          
          // Call select multiple times
          const store1 = selector.select(userId);
          const store2 = selector.select(userId);
          const store3 = selector.select(userId);
          
          // All should return the same store instance
          return store1 === store2 && store2 === store3;
        }
      )
    );
  });

  /**
   * Property 8.6: Mode getter returns the configured mode
   */
  test('getMode returns the configured mode', () => {
    const modes: ChatStorageMode[] = ['memory-only', 'persist-all', 'smart'];

    fc.assert(
      fc.property(
        fc.constantFrom(...modes),
        (mode) => {
          const selector = new StoreSelector(memoryStore, prismaStore, mode);
          return selector.getMode() === mode;
        }
      )
    );
  });

  /**
   * Property 8.7: setMode changes the selection behavior
   */
  test('setMode changes the selection behavior', () => {
    const selector = new StoreSelector(memoryStore, prismaStore, 'memory-only');
    
    // Initially should return memory store
    expect(selector.select('user123')).toBe(memoryStore);
    
    // Change to persist-all
    selector.setMode('persist-all');
    expect(selector.select('user123')).toBe(prismaStore);
    
    // Change to smart
    selector.setMode('smart');
    expect(selector.select('user123')).toBe(prismaStore);
    expect(selector.select(undefined)).toBe(memoryStore);
  });
});
