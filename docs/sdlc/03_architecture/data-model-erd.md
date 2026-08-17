# Modelo de Datos

## Diagrama ER

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE BASE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Source                        Document                                     │
│  ┌─────────────────────┐       ┌─────────────────────┐                     │
│  │ id                  │       │ id                  │                     │
│  │ type: enum          │◄──────│ sourceId            │                     │
│  │   - BLOB            │       │ externalId          │                     │
│  │   - SANITY          │       │ title               │                     │
│  │   - WEB             │       │ contentHash         │                     │
│  │   - SOCIAL          │       │ status: enum        │                     │
│  │   - RSS             │       │   - PENDING         │                     │
│  │   - MANUAL          │       │   - INDEXED         │                     │
│  │ config: Json        │       │   - FAILED          │                     │
│  │ name                │       │ metadata: Json      │                     │
│  │ isActive            │       │ indexedAt           │                     │
│  │ lastSyncAt          │       └─────────┬───────────┘                     │
│  └─────────────────────┘                 │                                 │
│                                          │ 1:N                             │
│                                          ▼                                 │
│                                ┌─────────────────────┐                     │
│                                │ Chunk               │                     │
│                                │ id                  │                     │
│                                │ documentId          │                     │
│                                │ content             │                     │
│                                │ position            │                     │
│                                │ metadata: Json      │                     │
│                                └─────────┬───────────┘                     │
│                                          │                                 │
│                                          │ 1:1                             │
│                                          ▼                                 │
│                                ┌─────────────────────┐                     │
│                                │ Embedding           │                     │
│                                │ id                  │                     │
│                                │ chunkId (unique)    │                     │
│                                │ vector: Bytes       │                     │
│                                │ model               │                     │
│                                │ dimensions          │                     │
│                                └─────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONVERSATIONS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Conversation                  Message                                      │
│  ┌─────────────────────┐       ┌─────────────────────┐                     │
│  │ id                  │       │ id                  │                     │
│  │ userId (nullable)   │◄──────│ conversationId      │                     │
│  │ title               │       │ role: user|assistant│                     │
│  │ createdAt           │       │ content             │                     │
│  │ updatedAt           │       │ sources: Json       │                     │
│  └─────────────────────┘       │ createdAt           │                     │
│                                └─────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOCIAL & ALERTS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SocialMention                 Alert                                        │
│  ┌─────────────────────┐       ┌─────────────────────┐                     │
│  │ id                  │       │ id                  │                     │
│  │ sourceId            │       │ type: enum          │                     │
│  │ platform            │◄──────│ mentionId           │                     │
│  │ externalId          │       │ priority: enum      │                     │
│  │ author              │       │ title               │                     │
│  │ content             │       │ content             │                     │
│  │ sentiment: enum     │       │ context: Json       │                     │
│  │   - POSITIVE        │       │ acknowledgedAt      │                     │
│  │   - NEUTRAL         │       │ acknowledgedBy      │                     │
│  │   - NEGATIVE        │       └─────────────────────┘                     │
│  │   - COMPLAINT       │                                                   │
│  │ suggestedResponse   │                                                   │
│  │ publishedAt         │                                                   │
│  └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Enums

```typescript
enum SourceType {
  BLOB      // Archivos en Vercel Blob
  SANITY    // CMS Sanity
  WEB       // Web scraping
  SOCIAL    // Redes sociales
  RSS       // Feeds RSS
  MANUAL    // Ingesta manual
}

enum DocumentStatus {
  PENDING   // En cola para indexar
  INDEXED   // Indexado exitosamente
  FAILED    // Error en indexación
  OUTDATED  // Contenido desactualizado
}

enum SentimentType {
  POSITIVE
  NEUTRAL
  NEGATIVE
  COMPLAINT  // Requiere alerta
}

enum AlertType {
  COMPLAINT      // Queja de cliente
  POLICY_CHANGE  // Cambio en políticas
  SYSTEM_ERROR   // Error del sistema
  MENTION        // Mención de marca
}

enum AlertPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

## Configuración por Tipo de Source

```typescript
type SourceConfig =
  | { type: 'BLOB'; bucket: string; prefix?: string }
  | { type: 'SANITY'; dataset: string; query: string }
  | { type: 'WEB'; urls: string[]; selector?: string; schedule: string }
  | { type: 'SOCIAL'; platform: 'twitter' | 'facebook'; accounts: string[] }
  | { type: 'RSS'; feedUrls: string[] }
  | { type: 'MANUAL' };
```

## Índices

```sql
-- Búsqueda por status
CREATE INDEX idx_document_status ON Document(status);

-- Búsqueda por source
CREATE INDEX idx_document_source ON Document(sourceId);

-- Unicidad de documento por source
CREATE UNIQUE INDEX idx_document_unique ON Document(sourceId, externalId);

-- Alertas pendientes
CREATE INDEX idx_alert_pending ON Alert(acknowledgedAt) WHERE acknowledgedAt IS NULL;
```
