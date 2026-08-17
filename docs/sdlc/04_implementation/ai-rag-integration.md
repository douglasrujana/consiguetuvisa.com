# Sistema RAG (Retrieval-Augmented Generation)

## Cómo Funciona

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INDEXACIÓN (una vez por documento)                          │
│     ┌──────────┐    ┌───────────┐    ┌──────────────┐          │
│     │ Documento│───▶│ Embedding │───▶│ Vector Store │          │
│     │ (texto)  │    │ (Gemini)  │    │ (Turso)      │          │
│     └──────────┘    └───────────┘    └──────────────┘          │
│                                                                 │
│  2. QUERY (cada pregunta)                                       │
│     ┌──────────┐    ┌───────────┐    ┌──────────────┐          │
│     │ Pregunta │───▶│ Embedding │───▶│   BÚSQUEDA   │          │
│     └──────────┘    └───────────┘    │  similitud   │          │
│                                       └──────┬───────┘          │
│                                              │                  │
│                                              ▼                  │
│     ┌──────────┐    ┌───────────┐    ┌──────────────┐          │
│     │ Respuesta│◀───│   LLM     │◀───│  Contexto    │          │
│     │  final   │    │ (Gemini)  │    │ recuperado   │          │
│     └──────────┘    └───────────┘    └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Fuentes de Datos

| Tipo | Descripción | Frecuencia |
|------|-------------|------------|
| `BLOB` | Archivos subidos (PDF, MD) | On-demand |
| `SANITY` | CMS editorial | On-change |
| `MANUAL` | Texto directo | On-demand |
| `WEB` | Web scraping (embajadas) | Diario |
| `SOCIAL` | Redes sociales | Cada hora |
| `RSS` | Feeds de noticias | Cada 15 min |

## Modelo de Datos

```
Source (fuente)
  │
  └──▶ Document (contenido indexado)
         │
         └──▶ Chunk (fragmento de texto)
                │
                └──▶ Embedding (vector 768-dim)
```

## Componentes

### RAGService
Orquesta el pipeline completo:
```typescript
class RAGService {
  async query(question: string): Promise<RAGResponse> {
    // 1. Buscar contexto relevante
    const context = await this.vectorStore.search(question, 5);
    
    // 2. Generar respuesta con LLM
    const response = await this.llm.generate({
      prompt: this.buildPrompt(question, context),
      systemPrompt: VISA_ASSISTANT_PROMPT
    });
    
    // 3. Retornar con fuentes
    return { answer: response, sources: context };
  }
}
```

### TursoVectorStore
Almacena embeddings en SQLite:
```typescript
class TursoVectorStore implements IVectorStore {
  async search(query: string, k: number): Promise<SearchResult[]> {
    const queryEmbedding = await this.embedder.embed(query);
    const allEmbeddings = await this.loadAll();
    
    // Similitud coseno en memoria
    return this.cosineSimilarity(queryEmbedding, allEmbeddings)
      .slice(0, k);
  }
}
```

### PrismaIngestionService
Ingesta documentos con detección de duplicados:
```typescript
class PrismaIngestionService {
  async ingest(content: string, sourceId: string): Promise<Document> {
    const hash = this.calculateHash(content);
    
    // Skip si ya existe
    const existing = await this.findByHash(hash);
    if (existing) return existing;
    
    // Crear documento, chunks y embeddings
    const doc = await this.createDocument(content, sourceId, hash);
    const chunks = await this.createChunks(doc, content);
    await this.indexChunks(chunks);
    
    return doc;
  }
}
```

## Configuración

```env
# Embedding model
GEMINI_API_KEY=your-key

# Vector dimensions
EMBEDDING_DIMENSIONS=768

# Search settings
RAG_TOP_K=5
RAG_MIN_SCORE=0.7
```

## Testing

```bash
# Test del pipeline RAG
curl http://localhost:4321/api/ai/rag-test

# Ingestar documento
curl -X POST http://localhost:4321/api/knowledge/ingest \
  -H "Content-Type: application/json" \
  -d '{"content": "...", "sourceId": "..."}'
```
