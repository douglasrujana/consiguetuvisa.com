# API REST

## Endpoints

### Chat

#### GET /api/chat
Health check y pre-warming del chatbot. Carga documentos desde BD e indexa embeddings si es necesario.

**Request:**
```bash
curl http://localhost:3000/api/chat
```

**Response:**
```json
{
  "status": "ready",
  "initialized": true,
  "warmupTime": 1098
}
```

#### POST /api/chat
Envía un mensaje al chatbot. Soporta streaming via SSE.

**Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuánto cuesta la visa USA?",
    "conversationId": "optional-id",
    "userId": "optional-user-id"
  }'
```

**Response:**
```json
{
  "success": true,
  "conversationId": "abc123",
  "message": {
    "id": "msg_xyz",
    "role": "assistant",
    "content": "La tarifa consular para la visa B1/B2 es de $185 USD...",
    "createdAt": "2025-12-13T03:29:42.613Z"
  },
  "sources": [
    { "content": "Costos visa americana...", "source": "guia-visa-usa.md", "score": 0.83 }
  ]
}
```

**Streaming (SSE):**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "requisitos visa canada"}'
```

**Response SSE:**
```
data: {"type":"content","content":"Para"}
data: {"type":"content","content":" la visa de turista..."}
data: {"type":"sources","sources":[...]}
data: {"type":"done"}
```

### Knowledge

#### POST /api/knowledge/ingest
Ingesta un documento a la Knowledge Base. Crea chunks y genera embeddings automáticamente.

**Request:**
```bash
curl -X POST http://localhost:3000/api/knowledge/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Visa de Trabajo H1B",
    "content": "La visa H1B es para trabajadores especializados en USA...",
    "sourceId": "kb-visas-main",
    "metadata": { "country": "USA", "type": "trabajo" }
  }'
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_xyz",
    "status": "INDEXED",
    "chunksCount": 3
  }
}
```

**Nota:** El `sourceId` debe existir previamente. Usa `kb-visas-main` para documentos de visas.

### AI Testing

#### GET /api/ai/test
Prueba la conexión con el LLM (Gemini).

```bash
curl http://localhost:3000/api/ai/test
```

#### GET /api/ai/rag-test
Prueba el pipeline RAG completo (retrieve → augment → generate).

```bash
curl http://localhost:3000/api/ai/rag-test
```

### Storage

#### GET /api/storage/test
Prueba el sistema de almacenamiento configurado.

```bash
curl http://localhost:3000/api/storage/test
```

### Health

#### GET /api/hello
Health check básico.

```bash
curl http://localhost:3000/api/hello
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
