# Arquitectura

## Documentos

- [Overview](./overview.md) - Visión general de la arquitectura
- [RAG System](./rag-system.md) - Sistema de Retrieval-Augmented Generation
- [Data Model](./data-model.md) - Modelo de datos y esquema Prisma

## Diagramas

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│           FRONTEND                      │
│  Astro 5 + Svelte 5 + Tailwind 4       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           API LAYER                     │
│  GraphQL + REST (Vercel Functions)     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         SERVICE LAYER                   │
│  Chatbot │ RAG │ Social │ Alerts       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          DATA LAYER                     │
│  Prisma + Turso + Vector Store         │
└─────────────────────────────────────────┘
```

### Flujo de Chat

```
Usuario → Widget → API → Service → RAG → LLM → Response
```

### Flujo de Ingesta

```
Source → Loader → Chunker → Embedder → VectorStore
```
