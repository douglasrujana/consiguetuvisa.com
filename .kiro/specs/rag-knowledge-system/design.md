# Design Document: RAG Knowledge System

## Overview

Sistema de gestión de conocimiento para el chatbot RAG de ConsigueTuVisa.com. Permite indexar información de múltiples fuentes (archivos, CMS, web, redes sociales), almacenar embeddings de forma persistente, y proporcionar respuestas contextuales con monitoreo de marca en tiempo real.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA GENERAL                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Vercel    │  │   Sanity    │  │  Embajadas  │  │   Social    │         │
│  │    Blob     │  │    CMS      │  │    Web      │  │   Media     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    INGESTION LAYER                              │        │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │        │
│  │  │  Loaders  │  │  Chunker  │  │ Embedding │  │  Indexer  │     │        │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘     │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    STORAGE LAYER                                │        │
│  │  ┌───────────────────┐  ┌───────────────────┐                   │        │
│  │  │   Turso (Prisma)  │  │   Hot Cache       │                   │        │
│  │  │   - Sources       │  │   (Redis/Memory)  │                   │        │
│  │  │   - Documents     │  │   - Recent posts  │                   │        │
│  │  │   - Chunks        │  │   - Alerts        │                   │        │
│  │  │   - Embeddings    │  │                   │                   │        │
│  │  │   - Conversations │  │                   │                   │        │
│  │  └───────────────────┘  └───────────────────┘                   │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    SERVICE LAYER                                │        │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │        │
│  │  │  Chatbot  │  │    RAG    │  │  Social   │  │   Alert   │     │        │
│  │  │  Service  │  │  Engine   │  │ Listener  │  │  Service  │     │        │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘     │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    API LAYER                                    │        │
│  │  ┌───────────────────────────────────────────────────────┐      │        │
│  │  │              GraphQL Gateway                          │      │        │
│  │  │  - Queries: searchKnowledge, conversation, alerts     │      │        │
│  │  │  - Mutations: sendMessage, ingestDocument             │      │        │
│  │  │  - Subscriptions: newAlert, streamResponse            │      │        │
│  │  └───────────────────────────────────────────────────────┘      │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Source Management

```typescript
// src/server/lib/features/knowledge/Source.entity.ts

enum SourceType {
  BLOB = 'BLOB',
  SANITY = 'SANITY',
  WEB = 'WEB',
  SOCIAL = 'SOCIAL',
  RSS = 'RSS',
  MANUAL = 'MANUAL',
}

interface Source {
  id: string;
  type: SourceType;
  name: string;
  config: SourceConfig;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type SourceConfig =
  | { type: 'BLOB'; bucket: string; prefix?: string }
  | { type: 'SANITY'; dataset: string; query: string }
  | { type: 'WEB'; urls: string[]; selector?: string; schedule: string }
  | { type: 'SOCIAL'; platform: 'twitter' | 'facebook' | 'instagram'; accounts: string[]; schedule: string }
  | { type: 'RSS'; feedUrls: string[]; schedule: string }
  | { type: 'MANUAL' };
```

### 2. Document & Chunk Model

```typescript
// src/server/lib/features/knowledge/Document.entity.ts

enum DocumentStatus {
  PENDING = 'PENDING',
  INDEXED = 'INDEXED',
  FAILED = 'FAILED',
  OUTDATED = 'OUTDATED',
}

interface Document {
  id: string;
  sourceId: string;
  externalId: string;      // URL, Sanity _id, tweet ID, etc.
  title: string;
  contentHash: string;     // SHA-256 para detectar cambios
  status: DocumentStatus;
  metadata: DocumentMetadata;
  indexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentMetadata {
  author?: string;
  publishedAt?: Date;
  url?: string;
  language?: string;
  tags?: string[];
  country?: string;        // Para filtrar por país de visa
  visaType?: string;       // B1/B2, Schengen, etc.
}

interface Chunk {
  id: string;
  documentId: string;
  content: string;
  position: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface Embedding {
  id: string;
  chunkId: string;
  vector: Float32Array;    // Serializado como Bytes en DB
  model: string;           // "text-embedding-004"
  dimensions: number;      // 768
  createdAt: Date;
}
```

### 3. Conversation Store (Strategy Pattern)

```typescript
// src/server/lib/features/chatbot/stores/ConversationStore.port.ts

interface IConversationStore {
  create(userId?: string, title?: string): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findByUserId(userId: string, limit?: number): Promise<Conversation[]>;
  addMessage(conversationId: string, message: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  getMessages(conversationId: string, limit?: number): Promise<Message[]>;
  updateTitle(conversationId: string, title: string): Promise<void>;
  delete(id: string): Promise<void>;
}

// src/server/lib/features/chatbot/stores/StoreSelector.ts

type ChatStorageMode = 'memory-only' | 'persist-all' | 'smart';

class StoreSelector {
  constructor(
    private memoryStore: IConversationStore,
    private prismaStore: IConversationStore,
    private mode: ChatStorageMode = 'smart'
  ) {}

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
}
```

### 4. Social Listening Service

```typescript
// src/server/lib/features/social/SocialListener.service.ts

enum SentimentType {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  COMPLAINT = 'COMPLAINT',
}

enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

interface SocialMention {
  id: string;
  platform: string;
  externalId: string;
  author: string;
  content: string;
  sentiment: SentimentType;
  suggestedResponse?: string;
  alertPriority?: AlertPriority;
  reviewedAt?: Date;
  reviewedBy?: string;
  publishedAt: Date;
  createdAt: Date;
}

interface ISocialListenerService {
  pollMentions(sourceId: string): Promise<SocialMention[]>;
  classifySentiment(content: string): Promise<SentimentType>;
  generateSuggestedResponse(mention: SocialMention): Promise<string>;
  createAlert(mention: SocialMention): Promise<Alert>;
}
```

### 5. Alert Service

```typescript
// src/server/lib/features/alerts/Alert.entity.ts

enum AlertType {
  COMPLAINT = 'COMPLAINT',
  POLICY_CHANGE = 'POLICY_CHANGE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  MENTION = 'MENTION',
}

interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  content: string;
  context: Record<string, unknown>;
  sourceId?: string;
  mentionId?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

interface IAlertService {
  create(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert>;
  notify(alert: Alert): Promise<void>;
  acknowledge(alertId: string, userId: string): Promise<Alert>;
  getPending(): Promise<Alert[]>;
}
```

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma

// ==========================================
// KNOWLEDGE BASE
// ==========================================

enum SourceType {
  BLOB
  SANITY
  WEB
  SOCIAL
  RSS
  MANUAL
}

enum DocumentStatus {
  PENDING
  INDEXED
  FAILED
  OUTDATED
}

model Source {
  id        String     @id @default(cuid())
  type      SourceType
  name      String
  config    Json
  isActive  Boolean    @default(true)
  lastSyncAt DateTime?
  documents Document[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Document {
  id          String         @id @default(cuid())
  sourceId    String
  source      Source         @relation(fields: [sourceId], references: [id])
  externalId  String
  title       String
  contentHash String
  status      DocumentStatus @default(PENDING)
  metadata    Json?
  chunks      Chunk[]
  indexedAt   DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([sourceId, externalId])
  @@index([status])
  @@index([sourceId])
}

model Chunk {
  id         String    @id @default(cuid())
  documentId String
  document   Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content    String
  position   Int
  metadata   Json?
  embedding  Embedding?
  createdAt  DateTime  @default(now())

  @@index([documentId])
}

model Embedding {
  id         String   @id @default(cuid())
  chunkId    String   @unique
  chunk      Chunk    @relation(fields: [chunkId], references: [id], onDelete: Cascade)
  vector     Bytes
  model      String
  dimensions Int
  createdAt  DateTime @default(now())
}

// ==========================================
// CONVERSATIONS
// ==========================================

model Conversation {
  id        String    @id @default(cuid())
  userId    String?
  title     String?
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String       // 'user' | 'assistant'
  content        String
  sources        Json?
  createdAt      DateTime     @default(now())

  @@index([conversationId])
}

// ==========================================
// SOCIAL LISTENING
// ==========================================

enum SentimentType {
  POSITIVE
  NEUTRAL
  NEGATIVE
  COMPLAINT
}

model SocialMention {
  id                String        @id @default(cuid())
  sourceId          String
  platform          String
  externalId        String
  author            String
  content           String
  sentiment         SentimentType
  suggestedResponse String?
  reviewedAt        DateTime?
  reviewedBy        String?
  publishedAt       DateTime
  alerts            Alert[]
  createdAt         DateTime      @default(now())

  @@unique([platform, externalId])
  @@index([sentiment])
  @@index([sourceId])
}

// ==========================================
// ALERTS
// ==========================================

enum AlertType {
  COMPLAINT
  POLICY_CHANGE
  SYSTEM_ERROR
  MENTION
}

enum AlertPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Alert {
  id             String        @id @default(cuid())
  type           AlertType
  priority       AlertPriority
  title          String
  content        String
  context        Json?
  sourceId       String?
  mentionId      String?
  mention        SocialMention? @relation(fields: [mentionId], references: [id])
  acknowledgedAt DateTime?
  acknowledgedBy String?
  createdAt      DateTime      @default(now())

  @@index([type])
  @@index([priority])
  @@index([acknowledgedAt])
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Source Configuration Validation
*For any* source configuration, if the configuration is missing required fields for its type, the system should reject it with a validation error.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: Content Hash Determinism
*For any* document content, calculating the hash twice should produce identical results.
**Validates: Requirements 2.1**

### Property 3: Ingestion Idempotence
*For any* document, ingesting it multiple times should result in exactly one indexed document (no duplicates).
**Validates: Requirements 2.2**

### Property 4: Ingestion Round-Trip
*For any* valid document content, after ingestion, searching for that content should return chunks containing the original text.
**Validates: Requirements 2.3, 2.4, 2.5, 2.7**

### Property 5: Vector Store Persistence
*For any* set of embeddings stored in the vector store, recreating the store instance should load all previously stored embeddings.
**Validates: Requirements 3.1**

### Property 6: Similarity Search Self-Match
*For any* indexed chunk, searching with that chunk's exact content should return that chunk with a similarity score above 0.9.
**Validates: Requirements 3.2**

### Property 7: Cascade Delete Integrity
*For any* document, deleting it should also delete all associated chunks and embeddings (no orphans).
**Validates: Requirements 3.4**

### Property 8: StoreSelector Mode Consistency
*For any* combination of mode and userId, the StoreSelector should deterministically return the same store type.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 9: Conversation Message Round-Trip
*For any* message added to a conversation, retrieving the conversation should include that message with identical content.
**Validates: Requirements 4.6, 4.7**

### Property 10: ChatbotService Response Completeness
*For any* user message processed by ChatbotService, the response should include both an answer and source citations.
**Validates: Requirements 5.5**

### Property 11: Complaint Detection Creates Alert
*For any* social mention classified as COMPLAINT, the system should create an alert with HIGH or CRITICAL priority.
**Validates: Requirements 11.3, 12.1**

## Error Handling

### Error Categories

```typescript
// src/server/lib/core/error/Knowledge.error.ts

class SourceConfigurationError extends DomainError {
  constructor(sourceType: string, missingFields: string[]) {
    super(`Invalid ${sourceType} source: missing ${missingFields.join(', ')}`);
  }
}

class IngestionError extends DomainError {
  constructor(documentId: string, reason: string) {
    super(`Failed to ingest document ${documentId}: ${reason}`);
  }
}

class VectorStoreError extends DomainError {
  constructor(operation: string, reason: string) {
    super(`Vector store ${operation} failed: ${reason}`);
  }
}

class SocialAPIError extends DomainError {
  constructor(platform: string, reason: string) {
    super(`Social API error (${platform}): ${reason}`);
  }
}
```

### Retry Strategy

```typescript
// Retry configuration for external services
const RETRY_CONFIG = {
  social: { maxAttempts: 3, backoffMs: 1000, maxBackoffMs: 30000 },
  web: { maxAttempts: 3, backoffMs: 2000, maxBackoffMs: 60000 },
  llm: { maxAttempts: 2, backoffMs: 500, maxBackoffMs: 5000 },
};
```

## Testing Strategy

### Dual Testing Approach

This system uses both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Library

**Library**: `fast-check` (TypeScript/JavaScript)

**Configuration**:
```typescript
import fc from 'fast-check';

// Run minimum 100 iterations per property
fc.configureGlobal({ numRuns: 100 });
```

### Test Organization

```
src/server/lib/
├── features/
│   ├── knowledge/
│   │   ├── __tests__/
│   │   │   ├── Source.unit.test.ts
│   │   │   ├── Source.property.test.ts
│   │   │   ├── Document.unit.test.ts
│   │   │   ├── Ingestion.property.test.ts
│   │   │   └── VectorStore.property.test.ts
│   │   └── ...
│   ├── chatbot/
│   │   ├── __tests__/
│   │   │   ├── StoreSelector.property.test.ts
│   │   │   ├── Conversation.property.test.ts
│   │   │   └── ChatbotService.unit.test.ts
│   │   └── ...
│   └── social/
│       ├── __tests__/
│       │   ├── SocialListener.unit.test.ts
│       │   └── Sentiment.property.test.ts
│       └── ...
```

### Property Test Annotations

Each property-based test must include a comment referencing the design document:

```typescript
/**
 * **Feature: rag-knowledge-system, Property 3: Ingestion Idempotence**
 * For any document, ingesting it multiple times should result in exactly one indexed document.
 */
test('ingesting same document twice creates no duplicates', async () => {
  await fc.assert(
    fc.asyncProperty(fc.string(), async (content) => {
      // ... test implementation
    })
  );
});
```

## File Structure

```
src/server/lib/
├── core/
│   ├── ai/                    # ✅ Existing
│   ├── rag/                   # ✅ Existing (enhance with TursoVectorStore)
│   ├── ingestion/             # ✅ Existing (enhance with new loaders)
│   ├── storage/               # ✅ Existing
│   └── error/
│       └── Knowledge.error.ts # NEW
│
├── features/
│   ├── chatbot/               # ✅ Existing (enhance with StoreSelector)
│   │   ├── stores/
│   │   │   ├── ConversationStore.port.ts
│   │   │   ├── MemoryConversationStore.ts
│   │   │   ├── PrismaConversationStore.ts
│   │   │   └── StoreSelector.ts
│   │   └── ...
│   │
│   ├── knowledge/             # NEW
│   │   ├── Source.entity.ts
│   │   ├── Source.dto.ts
│   │   ├── Source.port.ts
│   │   ├── Source.repository.ts
│   │   ├── Source.service.ts
│   │   ├── Document.entity.ts
│   │   ├── Document.repository.ts
│   │   ├── Ingestion.service.ts
│   │   └── index.ts
│   │
│   ├── social/                # NEW
│   │   ├── SocialMention.entity.ts
│   │   ├── SocialMention.repository.ts
│   │   ├── SocialListener.service.ts
│   │   ├── SentimentClassifier.ts
│   │   └── index.ts
│   │
│   └── alerts/                # NEW
│       ├── Alert.entity.ts
│       ├── Alert.dto.ts
│       ├── Alert.repository.ts
│       ├── Alert.service.ts
│       ├── NotificationChannel.port.ts
│       ├── adapters/
│       │   ├── EmailNotification.adapter.ts
│       │   └── SlackNotification.adapter.ts
│       └── index.ts
```

## Environment Variables

```env
# Chat Storage Mode
CHAT_STORAGE_MODE=smart  # 'memory-only' | 'persist-all' | 'smart'

# Social APIs (optional)
TWITTER_BEARER_TOKEN=
FACEBOOK_ACCESS_TOKEN=

# Notifications
SLACK_WEBHOOK_URL=
ALERT_EMAIL_TO=admin@consiguetuvisa.com

# Hot Cache (optional, defaults to memory)
REDIS_URL=
```
