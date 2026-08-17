# API GraphQL

## Endpoint

```
POST /api/graphql
```

## Playground

En desarrollo, accede a GraphQL Playground en:
```
http://localhost:4321/api/graphql
```

## Operaciones

### Knowledge Base

#### Queries

```graphql
# Listar fuentes
query {
  sources {
    id
    type
    name
    isActive
    lastSyncAt
  }
}

# Búsqueda semántica
query {
  searchKnowledge(input: { query: "visa B1/B2", topK: 5 }) {
    results {
      content
      source
      score
    }
    totalResults
  }
}

# Estadísticas
query {
  knowledgeStats {
    totalSources
    totalDocuments
    totalChunks
  }
}
```

#### Mutations

```graphql
# Crear fuente
mutation {
  createSource(input: {
    type: MANUAL
    name: "FAQs Manuales"
    config: {}
  }) {
    id
    type
    name
  }
}

# Ingestar documento
mutation {
  ingestDocument(input: {
    sourceId: "source_123"
    content: "Contenido del documento..."
    title: "Guía de Visa USA"
    metadata: { country: "USA", visaType: "B1/B2" }
  }) {
    id
    status
    chunksCount
  }
}
```

### Alertas

#### Queries

```graphql
# Alertas pendientes
query {
  pendingAlerts(limit: 10) {
    id
    type
    priority
    title
    createdAt
  }
}

# Estadísticas de alertas
query {
  alertStats(fromDate: "2024-01-01") {
    total
    byType {
      type
      count
    }
    byPriority {
      priority
      count
    }
  }
}
```

#### Mutations

```graphql
# Reconocer alerta
mutation {
  acknowledgeAlert(id: "alert_123", acknowledgedBy: "admin@example.com") {
    id
    acknowledgedAt
  }
}
```

### Chat

```graphql
# Enviar mensaje
mutation {
  sendMessage(input: {
    conversationId: "conv_123"
    content: "¿Qué necesito para visa USA?"
  }) {
    id
    content
    sources {
      title
      url
    }
  }
}
```

## Autenticación

Las operaciones protegidas requieren header de Clerk:

```bash
curl -X POST http://localhost:4321/api/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-session-token>" \
  -d '{"query": "..."}'
```

## Errores

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

## Rate Limits

| Operación | Límite |
|-----------|--------|
| Queries | 100/min |
| Mutations | 20/min |
| searchKnowledge | 30/min |
