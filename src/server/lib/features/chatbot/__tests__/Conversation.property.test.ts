// src/server/lib/features/chatbot/__tests__/Conversation.property.test.ts

/**
 * **Feature: rag-knowledge-system, Property 9: Conversation Message Round-Trip**
 * For any message added to a conversation, retrieving the conversation
 * should include that message with identical content.
 * **Validates: Requirements 4.6, 4.7**
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { MemoryConversationStore } from '../stores/MemoryConversationStore';
import { PrismaConversationStore } from '../stores/PrismaConversationStore';
import type { IConversationStore } from '../stores/ConversationStore.port';
import { prisma } from '../../../../db/prisma-singleton';

// Configure fast-check to run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

describe('Conversation Message Round-Trip - Property Tests', () => {
  describe('MemoryConversationStore', () => {
    let store: MemoryConversationStore;

    beforeEach(() => {
      store = new MemoryConversationStore();
    });

    afterEach(() => {
      store.stopCleanup();
      store.clear();
    });

    /**
     * Property 9.1: Messages added to a conversation can be retrieved with identical content
     * WHEN a message is sent THEN the ConversationStore SHALL append it to the conversation history
     */
    test('messages added can be retrieved with identical content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 1000 }), // message content
          fc.constantFrom('user', 'assistant') as fc.Arbitrary<'user' | 'assistant'>,
          fc.option(fc.string({ minLength: 1 }), { nil: undefined }), // userId
          async (content, role, userId) => {
            // Create conversation
            const conversation = await store.create(userId);
            
            // Add message
            const message = await store.addMessage(conversation.id, {
              conversationId: conversation.id,
              role,
              content,
            });

            // Retrieve conversation
            const retrieved = await store.findById(conversation.id);
            
            // Verify message is in conversation
            expect(retrieved).not.toBeNull();
            expect(retrieved!.messages).toHaveLength(1);
            expect(retrieved!.messages[0].content).toBe(content);
            expect(retrieved!.messages[0].role).toBe(role);
            expect(retrieved!.messages[0].id).toBe(message.id);
            
            return true;
          }
        )
      );
    });


    /**
     * Property 9.2: Multiple messages maintain order and content
     */
    test('multiple messages maintain order and content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              content: fc.string({ minLength: 1, maxLength: 500 }),
              role: fc.constantFrom('user', 'assistant') as fc.Arbitrary<'user' | 'assistant'>,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (messages) => {
            // Create conversation
            const conversation = await store.create();
            
            // Add all messages
            for (const msg of messages) {
              await store.addMessage(conversation.id, {
                conversationId: conversation.id,
                role: msg.role,
                content: msg.content,
              });
            }

            // Retrieve messages
            const retrieved = await store.getMessages(conversation.id);
            
            // Verify all messages are present in order
            expect(retrieved).toHaveLength(messages.length);
            for (let i = 0; i < messages.length; i++) {
              expect(retrieved[i].content).toBe(messages[i].content);
              expect(retrieved[i].role).toBe(messages[i].role);
            }
            
            return true;
          }
        )
      );
    });

    /**
     * Property 9.3: Conversation creation assigns unique identifier
     * WHEN a conversation is created THEN the ConversationStore SHALL assign a unique conversation identifier
     */
    test('conversation creation assigns unique identifier', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 20 }), // number of conversations to create
          async (count) => {
            const ids = new Set<string>();
            
            for (let i = 0; i < count; i++) {
              const conversation = await store.create();
              ids.add(conversation.id);
            }
            
            // All IDs should be unique
            return ids.size === count;
          }
        )
      );
    });
  });

  describe('PrismaConversationStore', () => {
    let store: PrismaConversationStore;
    const createdConversationIds: string[] = [];

    beforeEach(() => {
      store = new PrismaConversationStore(prisma);
    });

    afterEach(async () => {
      // Cleanup created conversations
      for (const id of createdConversationIds) {
        try {
          await prisma.conversation.delete({ where: { id } });
        } catch {
          // Ignore if already deleted
        }
      }
      createdConversationIds.length = 0;
    });

    /**
     * Property 9.4: Messages added to Prisma store can be retrieved with identical content
     */
    test('messages added can be retrieved with identical content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }), // message content
          fc.constantFrom('user', 'assistant') as fc.Arbitrary<'user' | 'assistant'>,
          async (content, role) => {
            // Create conversation
            const conversation = await store.create();
            createdConversationIds.push(conversation.id);
            
            // Add message
            const message = await store.addMessage(conversation.id, {
              conversationId: conversation.id,
              role,
              content,
            });

            // Retrieve conversation
            const retrieved = await store.findById(conversation.id);
            
            // Verify message is in conversation
            expect(retrieved).not.toBeNull();
            expect(retrieved!.messages).toHaveLength(1);
            expect(retrieved!.messages[0].content).toBe(content);
            expect(retrieved!.messages[0].role).toBe(role);
            expect(retrieved!.messages[0].id).toBe(message.id);
            
            return true;
          }
        ),
        { numRuns: 20 } // Reduce iterations for DB tests
      );
    });

    /**
     * Property 9.5: Authenticated user can retrieve their conversation history
     * WHEN an authenticated user returns THEN the PrismaConversationStore SHALL
     * retrieve their conversation history from the database
     */
    test('authenticated user can retrieve their conversation history', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 200 }), // message content
          async (userId, content) => {
            // Create conversation for user
            const conversation = await store.create(userId);
            createdConversationIds.push(conversation.id);
            
            // Add message
            await store.addMessage(conversation.id, {
              conversationId: conversation.id,
              role: 'user',
              content,
            });

            // Retrieve user's conversations
            const userConversations = await store.findByUserId(userId);
            
            // Verify conversation is found
            expect(userConversations.length).toBeGreaterThanOrEqual(1);
            const found = userConversations.find(c => c.id === conversation.id);
            expect(found).toBeDefined();
            expect(found!.messages[0].content).toBe(content);
            
            return true;
          }
        ),
        { numRuns: 10 } // Reduce iterations for DB tests
      );
    });
  });
});
