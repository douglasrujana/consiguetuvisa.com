# API Reference

## Endpoints

| Endpoint | Tipo | Descripción |
|----------|------|-------------|
| `/api/graphql` | GraphQL | API principal |
| `/api/chat` | REST | Chat con streaming |
| `/api/knowledge/ingest` | REST | Ingesta de documentos |

## Documentación

- [GraphQL API](./graphql.md) - Queries y Mutations
- [REST API](./rest.md) - Endpoints REST

## Autenticación

Las operaciones protegidas requieren token de Clerk:

```bash
curl -H "Authorization: Bearer <token>" ...
```

## Rate Limits

| Tipo | Límite |
|------|--------|
| Queries | 100/min |
| Mutations | 20/min |
| Chat | 30/min |
