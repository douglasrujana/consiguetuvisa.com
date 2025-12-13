# Ejemplos de API - cURL y PowerShell

## Chat API

### GET /api/chat - Health Check / Warmup
Pre-calienta el chatbot (indexa documentos si es necesario).

```bash
# cURL
curl -s http://localhost:3000/api/chat

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method GET
```

**Response:**
```json
{
  "status": "ready",
  "initialized": true,
  "warmupTime": 1098
}
```

### POST /api/chat - Enviar Mensaje
Envía un mensaje al chatbot y recibe respuesta con contexto RAG.

```bash
# cURL
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cuánto cuesta la visa para USA?"}'

# PowerShell
$body = '{"message": "¿Cuánto cuesta la visa para USA?"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Body $body -ContentType "application/json"
```

**Response:**
```json
{
  "success": true,
  "conversationId": "abc123",
  "message": {
    "id": "msg_xyz",
    "role": "assistant",
    "content": "La tarifa consular para la visa americana B1/B2 es de $185 USD...",
    "createdAt": "2025-12-13T03:29:42.613Z"
  },
  "sources": [
    {
      "content": "Costos y precios de la visa americana B1/B2...",
      "source": "guia-visa-usa.md",
      "score": 0.83
    }
  ]
}
```

### POST /api/chat - Streaming (SSE)
Recibe la respuesta en tiempo real token por token.

```bash
# cURL
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "requisitos visa canada"}'

# PowerShell (básico, no soporta SSE nativo)
$headers = @{ "Content-Type" = "application/json"; "Accept" = "text/event-stream" }
Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -Headers $headers -Body '{"message": "requisitos visa canada"}'
```

**Response (SSE):**
```
data: {"type":"content","content":""}
event: conversationId
data: {"conversationId":"abc123"}
data: {"type":"content","content":"Para"}
data: {"type":"content","content":" la visa de turista"}
data: {"type":"content","content":" a Canadá necesitas..."}
data: {"type":"sources","sources":[...]}
data: {"type":"done"}
```

### POST /api/chat - Continuar Conversación
Usa `conversationId` para mantener contexto.

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Y cuánto cuesta?",
    "conversationId": "abc123"
  }'
```

---

## Knowledge Base API

### POST /api/knowledge/ingest - Ingestar Documento
Agrega un nuevo documento a la Knowledge Base.

```bash
curl -X POST http://localhost:3000/api/knowledge/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Visa de Trabajo H1B",
    "content": "La visa H1B es para trabajadores especializados...",
    "sourceId": "kb-visas-main",
    "metadata": {
      "country": "USA",
      "type": "trabajo"
    }
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

---

## GraphQL API

### POST /api/graphql - Búsqueda Semántica

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { searchKnowledge(input: { query: \"visa B1/B2\", topK: 5 }) { results { content source score } totalResults } }"
  }'
```

### POST /api/graphql - Estadísticas KB

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { knowledgeStats { totalSources totalDocuments totalChunks } }"
  }'
```

### POST /api/graphql - Listar Fuentes

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { sources { id name type isActive } }"
  }'
```

### POST /api/graphql - Crear Alerta

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createAlert(input: { type: COMPLAINT, priority: HIGH, title: \"Cliente insatisfecho\", content: \"Detalles...\" }) { id createdAt } }"
  }'
```

---

## Testing Endpoints

### GET /api/ai/test - Test LLM
```bash
curl http://localhost:3000/api/ai/test
```

### GET /api/ai/rag-test - Test RAG Pipeline
```bash
curl http://localhost:3000/api/ai/rag-test
```

### GET /api/storage/test - Test Storage
```bash
curl http://localhost:3000/api/storage/test
```

---

## Producción

Reemplaza `localhost:3000` por `consiguetuvisa-com.vercel.app`:

```bash
# Warmup
curl https://consiguetuvisa-com.vercel.app/api/chat

# Chat
curl -X POST https://consiguetuvisa-com.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "requisitos visa usa"}'
```
