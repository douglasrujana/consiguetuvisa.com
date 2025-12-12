# Integración del Chatbot

## Widget de Chat

El chatbot está disponible como componente Svelte:

```svelte
<script>
  import ChatWidget from '@components/chat/ChatWidget.svelte';
</script>

<ChatWidget />
```

## API de Chat

### Endpoint
```
POST /api/chat
```

### Request
```typescript
interface ChatRequest {
  message: string;
  conversationId?: string;  // Opcional, se crea uno nuevo si no existe
}
```

### Response
```typescript
interface ChatResponse {
  conversationId: string;
  message: {
    role: 'assistant';
    content: string;
    sources: Array<{
      title: string;
      url?: string;
      score: number;
    }>;
  };
}
```

## Streaming

Para respuestas en streaming:

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({ message: 'Hola' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk); // Token por token
}
```

## Personalización

### System Prompt

El prompt del sistema se puede personalizar en:
```
src/server/lib/features/chatbot/prompts/system.ts
```

### Contexto RAG

Configurar cantidad de chunks recuperados:
```env
RAG_TOP_K=5          # Número de chunks
RAG_MIN_SCORE=0.7    # Score mínimo de similitud
```

## Autenticación

El chatbot funciona para usuarios anónimos y autenticados:

| Usuario | Storage | Persistencia |
|---------|---------|--------------|
| Anónimo | Memory | 30 min |
| Autenticado | Prisma | Permanente |

Para usuarios autenticados, incluir el token de Clerk:
```typescript
fetch('/api/chat', {
  headers: {
    'Authorization': `Bearer ${clerkToken}`
  }
});
```
