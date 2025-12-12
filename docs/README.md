# ConsigueTuVisa.com - Documentación

> Sistema de asesoría de visas con chatbot RAG inteligente

## Quick Links

| Documento | Descripción |
|-----------|-------------|
| [Getting Started](./getting-started.md) | Configuración inicial del proyecto |
| [Architecture](./architecture/overview.md) | Arquitectura del sistema |
| [API Reference](./api/graphql.md) | Referencia de la API GraphQL |
| [Guides](./guides/) | Guías de desarrollo |

## Stack Tecnológico

```
Frontend:  Astro 5 + Svelte 5 + Tailwind 4
Backend:   GraphQL + Prisma + Turso
Auth:      Clerk
AI/RAG:    Gemini + Vector Store
Deploy:    Vercel
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes UI (Astro + Svelte)
├── pages/              # Rutas y API endpoints
│   └── api/            # API Routes (GraphQL, REST)
└── server/
    └── lib/
        ├── core/       # Servicios compartidos (AI, RAG, Storage)
        └── features/   # Módulos de negocio (chatbot, knowledge, alerts)
```

## URLs de Desarrollo

| Endpoint | Descripción |
|----------|-------------|
| `http://localhost:4321` | Frontend |
| `http://localhost:4321/api/graphql` | GraphQL Playground |
| `http://localhost:4321/chat-demo` | Demo del Chatbot |
