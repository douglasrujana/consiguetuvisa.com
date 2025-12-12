# Proyecto: ConsigueTuVisa.com

## Stack Técnico
- **Frontend:** Astro 5 + Svelte 5 + Tailwind 4
- **CMS:** Sanity
- **DB:** Prisma + SQLite/Turso
- **Auth:** Clerk
- **Deploy:** Vercel

---

# 🤖 Sistema Chatbot RAG Multi-Agente

## Estado: ✅ Fase 1-6 Completadas | 🔄 Fase 7 Pendiente

---

## Arquitectura Implementada

```
src/server/lib/
├── core/                          # 🔧 COMPARTIDO
│   ├── ai/                        # ✅ COMPLETADO
│   │   ├── LLM.port.ts            # Interface ILLMProvider
│   │   ├── Embedding.port.ts      # Interface IEmbeddingProvider
│   │   ├── LLM.factory.ts         # Factory multi-provider
│   │   ├── AI.service.ts          # Servicio orquestador
│   │   ├── AI.error.ts            # Manejo robusto de errores + retry
│   │   └── adapters/
│   │       ├── GeminiLLM.adapter.ts
│   │       └── GeminiEmbedding.adapter.ts
│   │
│   ├── rag/                       # ✅ COMPLETADO
│   │   ├── RAG.port.ts            # Interface IRAGEngine
│   │   ├── VectorStore.port.ts    # Interface IVectorStore
│   │   ├── RAG.service.ts         # Pipeline retrieve→augment→generate
│   │   └── adapters/
│   │       ├── MemoryVectorStore.adapter.ts
│   │       └── TursoVectorStore.adapter.ts  # ✅ NUEVO
│   │
│   ├── ingestion/                 # ✅ COMPLETADO
│   │   ├── Ingestion.port.ts
│   │   ├── Ingestion.service.ts
│   │   ├── PrismaIngestion.service.ts  # ✅ NUEVO - Persistencia
│   │   ├── loaders/
│   │   │   ├── MarkdownLoader.ts
│   │   │   └── TextLoader.ts
│   │   └── chunkers/
│   │       └── TextChunker.ts
│   │
│   └── storage/                   # ✅ COMPLETADO
│       ├── Storage.port.ts        # Interface IStorageProvider
│       ├── Storage.factory.ts     # Factory + presets
│       └── adapters/
│           ├── LocalStorage.adapter.ts   # Filesystem (dev)
│           └── R2Storage.adapter.ts      # Cloudflare R2
│
└── features/
    ├── chatbot/                   # ✅ COMPLETADO
    │   ├── Chatbot.entity.ts
    │   ├── Chatbot.dto.ts
    │   ├── Chatbot.port.ts
    │   ├── Chatbot.repository.ts
    │   ├── Chatbot.service.ts
    │   ├── StreamingChat.service.ts  # ✅ NUEVO - Streaming
    │   ├── stores/                   # ✅ NUEVO - StoreSelector
    │   │   ├── ConversationStore.port.ts
    │   │   ├── MemoryConversationStore.ts
    │   │   ├── PrismaConversationStore.ts
    │   │   └── StoreSelector.ts
    │   └── index.ts
    │
    ├── knowledge/                 # ✅ NUEVO - Knowledge Base
    │   ├── Source.entity.ts
    │   ├── Source.dto.ts
    │   ├── Source.repository.ts
    │   ├── Source.service.ts
    │   ├── Document.entity.ts
    │   ├── Document.repository.ts
    │   ├── Knowledge.graphql.ts
    │   └── index.ts
    │
    ├── social/                    # ✅ NUEVO - Social Listening
    │   ├── SocialMention.entity.ts
    │   ├── SocialMention.repository.ts
    │   ├── SocialListener.service.ts
    │   ├── SentimentClassifier.ts
    │   └── index.ts
    │
    └── alerts/                    # ✅ NUEVO - Sistema de Alertas
        ├── Alert.entity.ts
        ├── Alert.repository.ts
        ├── Alert.service.ts
        ├── Alert.graphql.ts
        ├── NotificationChannel.port.ts
        ├── adapters/
        │   └── EmailNotification.adapter.ts
        └── index.ts
```

---

## Checklist de Implementación

### Fase 1: Core AI ✅
- [x] `LLM.port.ts` - Interface ILLMProvider
- [x] `Embedding.port.ts` - Interface IEmbeddingProvider
- [x] `LLM.factory.ts` - Factory multi-provider
- [x] `AI.service.ts` - Servicio orquestador
- [x] `AI.error.ts` - Errores + retry automático
- [x] `GeminiLLM.adapter.ts` - Modelo: gemini-2.5-flash-lite
- [x] `GeminiEmbedding.adapter.ts` - Modelo: text-embedding-004
- [x] Integrado en `ContextFactory.ts`

### Fase 2: RAG Engine ✅
- [x] `RAG.port.ts` - Interface IRAGEngine
- [x] `VectorStore.port.ts` - Interface IVectorStore
- [x] `RAG.service.ts` - Pipeline completo
- [x] `MemoryVectorStore.adapter.ts` - Storage en memoria (dev)
- [x] `TursoVectorStore.adapter.ts` - Producción con Prisma ✅

### Fase 3: Ingestion Pipeline ✅
- [x] `Ingestion.port.ts` - Interfaces
- [x] `Ingestion.service.ts` - Orquestador
- [x] `PrismaIngestion.service.ts` - Persistencia con Prisma ✅
- [x] `MarkdownLoader.ts` - Carga archivos .md
- [x] `TextLoader.ts` - Carga archivos .txt
- [x] `TextChunker.ts` - Divide con overlap
- [ ] `PDFLoader.ts` - Futuro
- [ ] `WebLoader.ts` - Futuro

### Fase 4: Feature Chatbot ✅
- [x] `Chatbot.entity.ts` - Message, Conversation
- [x] `Chatbot.dto.ts` - Validación Zod
- [x] `Chatbot.port.ts` - Interfaces
- [x] `Chatbot.repository.ts` - Storage con StoreSelector
- [x] `Chatbot.service.ts` - Lógica + RAG
- [x] `StreamingChat.service.ts` - Streaming con Vercel AI SDK ✅
- [x] API endpoint `/api/chat` - Con soporte streaming ✅
- [x] UI `ChatWidget.svelte` - Con streaming ✅
- [x] Página demo `/chat-demo`
- [x] Persistencia con Prisma ✅
- [x] StoreSelector (memory/prisma/smart) ✅

### Fase 5: Storage Service ✅
- [x] `Storage.port.ts` - Interface IStorageProvider
- [x] `Storage.factory.ts` - Factory + presets
- [x] `LocalStorage.adapter.ts` - Filesystem local
- [x] `R2Storage.adapter.ts` - Cloudflare R2
- [x] `GoogleDriveStorage.adapter.ts` - Google Drive
- [x] `VercelBlobStorage.adapter.ts` - Vercel Blob (1GB gratis) ⭐
- [ ] `FirebaseStorage.adapter.ts` - Firebase (alternativa)

### Fase 6: Knowledge Base & Social Listening ✅
- [x] Schema Prisma con modelos Knowledge Base
- [x] Feature Knowledge (Source, Document, Chunk, Embedding)
- [x] TursoVectorStore con persistencia
- [x] PrismaIngestion.service con detección de duplicados
- [x] StoreSelector para conversaciones (memory/prisma/smart)
- [x] Feature Social Listening (SocialMention, SentimentClassifier)
- [x] Feature Alerts (Alert, NotificationChannel, EmailNotification)
- [x] Streaming con Vercel AI SDK
- [x] GraphQL Schema actualizado (Knowledge, Alerts)
- [x] Endpoint `/api/knowledge/ingest`

### Fase 7: Integraciones (Pendiente)
- [x] Adapter Resend (emails) - Via AlertService ✅
- [ ] Adapter HubSpot (CRM)
- [ ] Webhooks externos

### Fase 8: Multi-Agente (Futuro)
- [ ] Agente de Monitoreo
- [ ] Agente de Automatización
- [ ] Agente de Recomendación

---

## URLs de Prueba

| Endpoint | Descripción |
|----------|-------------|
| `/chat-demo` | Demo del chatbot RAG con streaming |
| `/api/ai/test` | Test del LLM |
| `/api/ai/rag-test` | Test del pipeline RAG completo |
| `/api/chat` | API del chatbot (POST) - Soporta streaming |
| `/api/storage/test` | Test del sistema de Storage |
| `/api/knowledge/ingest` | Ingesta manual de documentos (POST) |
| `/api/graphql` | GraphQL API unificada |

---

## GraphQL Operations (via `/api/graphql`)

### Knowledge Base

| Operación | Tipo | Descripción |
|-----------|------|-------------|
| `sources` | Query | Lista todas las fuentes de datos |
| `source(id)` | Query | Obtiene una fuente por ID |
| `activeSources` | Query | Lista fuentes activas |
| `documentsBySource(sourceId)` | Query | Documentos de una fuente |
| `document(id)` | Query | Obtiene un documento por ID |
| `searchKnowledge(input)` | Query | Búsqueda semántica en KB |
| `knowledgeStats` | Query | Estadísticas de la KB |
| `createSource(input)` | Mutation | Crea nueva fuente |
| `updateSource(id, input)` | Mutation | Actualiza fuente |
| `deactivateSource(id)` | Mutation | Desactiva fuente |
| `deleteSource(id)` | Mutation | Elimina fuente |
| `ingestDocument(input)` | Mutation | Ingesta documento |
| `deleteDocument(id)` | Mutation | Elimina documento |

### Alerts

| Operación | Tipo | Descripción |
|-----------|------|-------------|
| `alerts(filters, limit)` | Query | Lista alertas con filtros |
| `alert(id)` | Query | Obtiene alerta por ID |
| `pendingAlerts(limit)` | Query | Alertas no reconocidas |
| `alertsByType(type, limit)` | Query | Alertas por tipo |
| `alertsByPriority(priority, limit)` | Query | Alertas por prioridad |
| `alertStats(fromDate, toDate)` | Query | Estadísticas de alertas |
| `createAlert(input)` | Mutation | Crea nueva alerta |
| `acknowledgeAlert(id, acknowledgedBy)` | Mutation | Reconoce alerta |
| `deleteAlert(id)` | Mutation | Elimina alerta |

### Ejemplos de Uso

```graphql
# Búsqueda semántica
query {
  searchKnowledge(input: { query: "visa B1/B2", topK: 5 }) {
    results { content source score }
    totalResults
  }
}

# Alertas pendientes
query {
  pendingAlerts(limit: 10) {
    id type priority title createdAt
  }
}

# Reconocer alerta
mutation {
  acknowledgeAlert(id: "alert_123", acknowledgedBy: "admin@example.com") {
    id acknowledgedAt
  }
}
```

---

## Variables de Entorno Requeridas

```env
# AI - Gemini
GEMINI_API_KEY=

# Storage (elegir uno)
STORAGE_PROVIDER=local  # o 'r2', 'gdrive', 'vercel'

# Vercel Blob (si STORAGE_PROVIDER=vercel) ⭐ RECOMENDADO
BLOB_READ_WRITE_TOKEN=

# Cloudflare R2 (si STORAGE_PROVIDER=r2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Google Drive (si STORAGE_PROVIDER=gdrive)
GDRIVE_CREDENTIALS_JSON=
GDRIVE_FOLDER_ID=

# Vector Store - Turso (producción)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Chat Storage Mode
CHAT_STORAGE_MODE=smart  # 'memory-only' | 'persist-all' | 'smart'

# Notifications (Alertas)
ALERT_EMAIL_TO=admin@consiguetuvisa.com
RESEND_API_KEY=

# Social APIs (opcional)
TWITTER_BEARER_TOKEN=
FACEBOOK_ACCESS_TOKEN=
```

---

## Decisiones Técnicas

### ¿Por qué Gemini?
- Free tier generoso (2.5-flash-lite: 10 RPM)
- Embeddings incluidos (text-embedding-004)
- API compatible con el proyecto

### ¿Por qué Storage abstracto?
- Anti vendor-locking
- Mismo código para dev (local) y prod (R2/GDrive)
- Fácil cambiar de proveedor

### ¿Por qué StoreSelector?
- Flexibilidad: memoria para anónimos, Prisma para autenticados
- Modo 'smart' optimiza recursos automáticamente
- Fácil cambiar comportamiento via env var

### ¿Por qué TursoVectorStore?
- Persistencia de embeddings entre reinicios
- Integración nativa con Prisma
- Similitud coseno calculada en memoria (SQLite no tiene ops vectoriales)

---

## Próximos Pasos

1. ~~**Google Drive Adapter** - 15GB gratis sin TDC~~ ✅
2. ~~**Vercel Blob Adapter** - 1GB gratis, integración nativa~~ ✅
3. ~~**Persistencia Prisma** - Guardar conversaciones~~ ✅
4. ~~**Vercel AI SDK** - Streaming en UI~~ ✅
5. ~~**Turso VectorStore** - Embeddings persistentes~~ ✅
6. ~~**Knowledge Base** - Sources, Documents, Chunks~~ ✅
7. ~~**Social Listening** - Monitoreo de menciones~~ ✅
8. ~~**Sistema de Alertas** - Notificaciones~~ ✅
9. **HubSpot CRM** - Integración leads
10. **Webhooks externos** - Automatizaciones
