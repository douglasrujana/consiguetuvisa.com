# Ingesta de Conocimiento

## Fuentes Soportadas

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `MANUAL` | Texto directo | FAQs, guías |
| `BLOB` | Archivos | PDFs, Markdown |
| `SANITY` | CMS | Contenido editorial |
| `WEB` | Web scraping | Sitios de embajadas |
| `SOCIAL` | Redes sociales | Twitter, Facebook |
| `RSS` | Feeds | Noticias |

## Ingesta Manual

### Via API REST

```bash
curl -X POST http://localhost:4321/api/knowledge/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Para la visa B1/B2 necesitas...",
    "sourceId": "source_manual_123",
    "title": "Requisitos Visa USA",
    "metadata": {
      "country": "USA",
      "visaType": "B1/B2"
    }
  }'
```

### Via GraphQL

```graphql
mutation {
  ingestDocument(input: {
    sourceId: "source_manual_123"
    content: "Para la visa B1/B2 necesitas..."
    title: "Requisitos Visa USA"
    metadata: { country: "USA", visaType: "B1/B2" }
  }) {
    id
    status
    chunksCount
  }
}
```

## Crear una Fuente

Antes de ingestar, necesitas crear una fuente:

```graphql
mutation {
  createSource(input: {
    type: MANUAL
    name: "FAQs Manuales"
    config: {}
  }) {
    id
  }
}
```

## Pipeline de Ingesta

```
Contenido → Chunking → Embedding → Storage
    │           │           │          │
    │           │           │          └── Prisma (Turso)
    │           │           └── Gemini text-embedding-004
    │           └── 500 chars, 50 overlap
    └── Texto plano
```

## Configuración

```env
# Chunking
CHUNK_SIZE=500
CHUNK_OVERLAP=50

# Embedding
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSIONS=768
```

## Detección de Duplicados

El sistema calcula un hash SHA-256 del contenido:
- Si el hash ya existe, se omite la re-indexación
- Si el contenido cambió, se actualiza el documento

```typescript
// Internamente
const hash = crypto.createHash('sha256')
  .update(content)
  .digest('hex');
```

## Verificar Ingesta

```graphql
query {
  documentsBySource(sourceId: "source_123") {
    id
    title
    status
    chunksCount
    indexedAt
  }
}
```

## Troubleshooting

### Documento en estado FAILED

```graphql
query {
  document(id: "doc_123") {
    status
    metadata  # Puede contener error
  }
}
```

### Re-indexar documento

```graphql
mutation {
  deleteDocument(id: "doc_123")
}

# Luego ingestar de nuevo
```

### Verificar embeddings

```bash
# Test del RAG
curl http://localhost:4321/api/ai/rag-test
```
