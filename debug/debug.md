# Debug Log - ChatbotRepository Error

## Issue (RESOLVED ✅)

**Error:** `Cannot read properties of undefined (reading 'select')`

**Stack trace:**
```
14:21:46 [ERROR] Cannot read properties of undefined (reading 'select')
  at ChatbotRepository.createConversation (src/server/lib/features/chatbot/Chatbot.repository.ts:18:38)
```

## Root Cause

`ChatbotRepository` was instantiated without the required `StoreSelector` parameter in `src/pages/api/chat/index.ts`.

## Fix Applied

1. **StoreSelector initialization** - Added proper initialization with both stores:
   ```typescript
   const memoryStore = new MemoryConversationStore();
   const prismaStore = new PrismaConversationStore(prisma);
   const storeSelector = new StoreSelector(memoryStore, prismaStore, storageMode);
   const repository = new ChatbotRepository(storeSelector);
   ```

2. **Thread-safe initialization** - Added `initializationPromise` singleton to prevent duplicate initializations

3. **Pre-warming endpoint** - Added `GET /api/chat` for pre-warming the chatbot on page load

4. **ChatWidget warmup** - Added `warmupChatbot()` function that calls GET endpoint on mount

## Verification

```
14:37:17 [200] /api/chat 4723ms (warmup - indexing 5 docs)
14:37:33 [200] POST /api/chat 1745ms (message processed)
```

No errors. Chatbot responds correctly with RAG context.
