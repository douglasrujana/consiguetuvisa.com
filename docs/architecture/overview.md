# Arquitectura del Sistema

## Visión General

ConsigueTuVisa sigue una arquitectura **JAMstack + Clean Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Astro 5 (SSR) + Svelte 5 (Islands) + Tailwind 4               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                  │
│  GraphQL Gateway (/api/graphql) + REST endpoints               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Chatbot │  │   RAG   │  │ Social  │  │ Alerts  │            │
│  │ Service │  │ Engine  │  │Listener │  │ Service │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
│  Prisma ORM → Turso (SQLite) + Vector Store (Embeddings)       │
└─────────────────────────────────────────────────────────────────┘
```

## Estructura de Carpetas

```
src/server/lib/
├── core/                    # Servicios compartidos
│   ├── ai/                  # LLM + Embeddings (Gemini)
│   ├── rag/                 # RAG Engine + Vector Store
│   ├── ingestion/           # Pipeline de ingesta
│   └── storage/             # Abstracción de storage
│
└── features/                # Módulos de negocio
    ├── chatbot/             # Chat conversacional
    │   └── stores/          # Memory/Prisma stores
    ├── knowledge/           # Knowledge Base (Sources, Documents)
    ├── social/              # Social Listening
    └── alerts/              # Sistema de alertas
```

## Patrones Clave

### 1. Ports & Adapters (Hexagonal)
```typescript
// Port (interface)
interface IVectorStore {
  store(docs: Document[]): Promise<void>;
  search(query: string, k: number): Promise<SearchResult[]>;
}

// Adapter (implementación)
class TursoVectorStore implements IVectorStore { ... }
class MemoryVectorStore implements IVectorStore { ... }
```

### 2. Strategy Pattern (StoreSelector)
```typescript
class StoreSelector {
  select(userId?: string): IConversationStore {
    if (this.mode === 'memory-only') return this.memoryStore;
    if (this.mode === 'persist-all') return this.prismaStore;
    return userId ? this.prismaStore : this.memoryStore;
  }
}
```

### 3. Feature Modules
Cada feature es autocontenido:
```
feature/
├── Entity.ts        # Tipos y entidades
├── DTO.ts           # Validación (Zod)
├── Port.ts          # Interfaces
├── Repository.ts    # Acceso a datos
├── Service.ts       # Lógica de negocio
├── GraphQL.ts       # Resolvers
└── index.ts         # Exports públicos
```

## Flujo de Datos

### Chat Message Flow
```
Usuario → ChatWidget → /api/chat → ChatbotService
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              StoreSelector        RAGEngine           LLMService
                    │                   │                   │
                    ▼                   ▼                   ▼
            Memory/Prisma        VectorStore            Gemini
```

### Ingestion Flow
```
Source → Loader → Chunker → Embedder → VectorStore
  │                                         │
  └─────────────────────────────────────────┘
              Document + Chunks + Embeddings
```
