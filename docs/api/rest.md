# API REST

## Endpoints

### Chat

#### POST /api/chat
Envía un mensaje al chatbot.

**Request:**
```bash
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué necesito para visa USA?",
    "conversationId": "optional-id"
  }'
```

**Response:**
```json
{
  "conversationId": "conv_abc123",
  "message": {
    "role": "assistant",
    "content": "Para la visa B1/B2 de USA necesitas...",
    "sources": [
      { "title": "Guía Visa USA", "url": "..." }
    ]
  }
}
```

**Streaming:**
```bash
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "..."}'
```

### Knowledge

#### POST /api/knowledge/ingest
Ingesta un documento manualmente.

**Request:**
```bash
curl -X POST http://localhost:4321/api/knowledge/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Contenido del documento...",
    "sourceId": "source_123",
    "title": "Mi Documento",
    "metadata": { "country": "USA" }
  }'
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_xyz",
    "status": "INDEXED",
    "chunksCount": 5
  }
}
```

### AI Testing

#### GET /api/ai/test
Prueba la conexión con el LLM.

```bash
curl http://localhost:4321/api/ai/test
```

#### GET /api/ai/rag-test
Prueba el pipeline RAG completo.

```bash
curl http://localhost:4321/api/ai/rag-test
```

### Health

#### GET /api/hello
Health check básico.

```bash
curl http://localhost:4321/api/hello
```

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Headers Comunes

```
Content-Type: application/json
Authorization: Bearer <clerk-token>  # Para endpoints protegidos
Accept: text/event-stream           # Para streaming
```
