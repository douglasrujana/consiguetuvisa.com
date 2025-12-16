# Proyecto: ConsigueTuVisa.com

## Stack Técnico
- **Frontend:** Astro 5 + Svelte 5 + Tailwind 4
- **CMS:** Sanity
- **DB:** Prisma + SQLite/Turso
- **Auth:** Clerk
- **Deploy:** Vercel

---

# 🤖 Sistema Chatbot RAG Multi-Agente

## Estado: ✅ Fase 1-6 Completadas | 🔄 Fase 7 Pendiente

---

## Arquitectura Implementada

```
src/server/lib/
├── core/                          # 🔧 COMPARTIDO
│   ├── ai/                        # ✅ COMPLETADO
│   │   ├── LLM.port.ts            # Interface ILLMProvider
│   │   ├── Embedding.port.ts      # Interface IEmbeddingProvider
│   │   ├── LLM.factory.ts         # Factory multi-provider
│   │   ├── AI.service.ts          # Servicio orquestador
│   │   ├── AI.error.ts            # Manejo robusto de errores + retry
│   │   └── adapters/
│   │       ├── GeminiLLM.adapter.ts
│   │       └── GeminiEmbedding.adapter.ts
│   │
│   ├── rag/                       # ✅ COMPLETADO
│   │   ├── RAG.port.ts            # Interface IRAGEngine
│   │   ├── VectorStore.port.ts    # Interface IVectorStore
│   │   ├── RAG.service.ts         # Pipeline retrieve→augment→generate
│   │   └── adapters/
│   │       ├── MemoryVectorStore.adapter.ts
│   │       └── TursoVectorStore.adapter.ts  # ✅ NUEVO
│   │
│   ├── ingestion/                 # ✅ COMPLETADO
│   │   ├── Ingestion.port.ts
│   │   ├── Ingestion.service.ts
│   │   ├── PrismaIngestion.service.ts  # ✅ NUEVO - Persistencia
│   │   ├── loaders/
│   │   │   ├── MarkdownLoader.ts
│   │   │   └── TextLoader.ts
│   │   └── chunkers/
│   │       └── TextChunker.ts
│   │
│   └── storage/                   # ✅ COMPLETADO
│       ├── Storage.port.ts        # Interface IStorageProvider
│       ├── Storage.factory.ts     # Factory + presets
│       └── adapters/
│           ├── LocalStorage.adapter.ts   # Filesystem (dev)
│           └── R2Storage.adapter.ts      # Cloudflare R2
│
└── features/
    ├── chatbot/                   # ✅ COMPLETADO
    │   ├── Chatbot.entity.ts
    │   ├── Chatbot.dto.ts
    │   ├── Chatbot.port.ts
    │   ├── Chatbot.repository.ts
    │   ├── Chatbot.service.ts
    │   ├── StreamingChat.service.ts  # ✅ NUEVO - Streaming
    │   ├── stores/                   # ✅ NUEVO - StoreSelector
    │   │   ├── ConversationStore.port.ts
    │   │   ├── MemoryConversationStore.ts
    │   │   ├── PrismaConversationStore.ts
    │   │   └── StoreSelector.ts
    │   └── index.ts
    │
    ├── knowledge/                 # ✅ NUEVO - Knowledge Base
    │   ├── Source.entity.ts
    │   ├── Source.dto.ts
    │   ├── Source.repository.ts
    │   ├── Source.service.ts
    │   ├── Document.entity.ts
    │   ├── Document.repository.ts
    │   ├── Knowledge.graphql.ts
    │   └── index.ts
    │
    ├── social/                    # ✅ COMPLETADO - Social Listening
    │   ├── SocialMention.entity.ts
    │   ├── SocialMention.port.ts
    │   ├── SocialMention.repository.ts
    │   ├── SocialListener.service.ts
    │   ├── SocialSync.service.ts     # ✅ NUEVO - Sincronización
    │   ├── SentimentClassifier.ts
    │   ├── Social.graphql.ts         # ✅ NUEVO - GraphQL
    │   ├── adapters/
    │   │   ├── TwitterAdapter.ts     # ✅ NUEVO
    │   │   └── FacebookAdapter.ts    # ✅ NUEVO
    │   └── index.ts
    │
    └── alerts/                    # ✅ NUEVO - Sistema de Alertas
        ├── Alert.entity.ts
        ├── Alert.repository.ts
        ├── Alert.service.ts
        ├── Alert.graphql.ts
        ├── NotificationChannel.port.ts
        ├── adapters/
        │   └── EmailNotification.adapter.ts
        └── index.ts
```

---

## Checklist de Implementación

### Fase 1: Core AI ✅
- [x] `LLM.port.ts` - Interface ILLMProvider
- [x] `Embedding.port.ts` - Interface IEmbeddingProvider
- [x] `LLM.factory.ts` - Factory multi-provider
- [x] `AI.service.ts` - Servicio orquestador
- [x] `AI.error.ts` - Errores + retry automático
- [x] `GeminiLLM.adapter.ts` - Modelo: gemini-2.5-flash-lite
- [x] `GeminiEmbedding.adapter.ts` - Modelo: text-embedding-004
- [x] Integrado en `ContextFactory.ts`

### Fase 2: RAG Engine ✅
- [x] `RAG.port.ts` - Interface IRAGEngine
- [x] `VectorStore.port.ts` - Interface IVectorStore
- [x] `RAG.service.ts` - Pipeline completo
- [x] `MemoryVectorStore.adapter.ts` - Storage en memoria (dev)
- [x] `TursoVectorStore.adapter.ts` - Producción con Prisma ✅

### Fase 3: Ingestion Pipeline ✅
- [x] `Ingestion.port.ts` - Interfaces
- [x] `Ingestion.service.ts` - Orquestador
- [x] `PrismaIngestion.service.ts` - Persistencia con Prisma ✅
- [x] `MarkdownLoader.ts` - Carga archivos .md
- [x] `TextLoader.ts` - Carga archivos .txt
- [x] `TextChunker.ts` - Divide con overlap
- [x] `PDFLoader.ts` - Carga archivos PDF (usa `pdf-parse`) ✅
- [ ] `WebLoader.ts` - Futuro (scraping de páginas)

### Fase 4: Feature Chatbot ✅
- [x] `Chatbot.entity.ts` - Message, Conversation
- [x] `Chatbot.dto.ts` - Validación Zod
- [x] `Chatbot.port.ts` - Interfaces
- [x] `Chatbot.repository.ts` - Storage con StoreSelector
- [x] `Chatbot.service.ts` - Lógica + RAG
- [x] `StreamingChat.service.ts` - Streaming con Vercel AI SDK ✅
- [x] API endpoint `/api/chat` - Con soporte streaming ✅
- [x] UI `ChatWidget.svelte` - Con streaming ✅
- [x] Página demo `/chat-demo`
- [x] Persistencia con Prisma ✅
- [x] StoreSelector (memory/prisma/smart) ✅

### Fase 5: Storage Service ✅
- [x] `Storage.port.ts` - Interface IStorageProvider
- [x] `Storage.factory.ts` - Factory + presets
- [x] `LocalStorage.adapter.ts` - Filesystem local
- [x] `R2Storage.adapter.ts` - Cloudflare R2
- [x] `GoogleDriveStorage.adapter.ts` - Google Drive
- [x] `VercelBlobStorage.adapter.ts` - Vercel Blob (1GB gratis) ⭐
- [ ] `FirebaseStorage.adapter.ts` - Firebase (alternativa)

### Fase 6: Knowledge Base & Social Listening ✅
- [x] Schema Prisma con modelos Knowledge Base
- [x] Feature Knowledge (Source, Document, Chunk, Embedding)
- [x] TursoVectorStore con persistencia
- [x] PrismaIngestion.service con detección de duplicados
- [x] StoreSelector para conversaciones (memory/prisma/smart)
- [x] Feature Social Listening (SocialMention, SentimentClassifier)
- [x] Feature Alerts (Alert, NotificationChannel, EmailNotification)
- [x] Streaming con Vercel AI SDK
- [x] GraphQL Schema actualizado (Knowledge, Alerts)
- [x] Endpoint `/api/knowledge/ingest`

### Fase 7: Integraciones (Pendiente)
- [x] Adapter Resend (emails) - Via AlertService ✅
- [ ] Adapter HubSpot (CRM)
- [ ] Webhooks externos

### Fase 8: Multi-Agente (Futuro)
- [ ] Agente de Monitoreo
- [ ] Agente de Automatización
- [ ] Agente de Recomendación

---

## URLs de Prueba

| Endpoint | Descripción |
|----------|-------------|
| `/chat-demo` | Demo del chatbot RAG con streaming |
| `/api/ai/test` | Test del LLM |
| `/api/ai/rag-test` | Test del pipeline RAG completo |
| `/api/chat` | API del chatbot (POST) - Soporta streaming |
| `/api/storage/test` | Test del sistema de Storage |
| `/api/knowledge/ingest` | Ingesta manual de documentos (POST) |
| `/api/graphql` | GraphQL API unificada |
| `/api/admin/social` | Social Listening - Lista menciones + stats |
| `/api/admin/social/config` | Configuración de APIs sociales |
| `/api/admin/social/sync` | Sincronizar menciones desde APIs |

---

## GraphQL Operations (via `/api/graphql`)

### Knowledge Base

| Operación | Tipo | Descripción |
|-----------|------|-------------|
| `sources` | Query | Lista todas las fuentes de datos |
| `source(id)` | Query | Obtiene una fuente por ID |
| `activeSources` | Query | Lista fuentes activas |
| `documentsBySource(sourceId)` | Query | Documentos de una fuente |
| `document(id)` | Query | Obtiene un documento por ID |
| `searchKnowledge(input)` | Query | Búsqueda semántica en KB |
| `knowledgeStats` | Query | Estadísticas de la KB |
| `createSource(input)` | Mutation | Crea nueva fuente |
| `updateSource(id, input)` | Mutation | Actualiza fuente |
| `deactivateSource(id)` | Mutation | Desactiva fuente |
| `deleteSource(id)` | Mutation | Elimina fuente |
| `ingestDocument(input)` | Mutation | Ingesta documento |
| `deleteDocument(id)` | Mutation | Elimina documento |

### Alerts

| Operación | Tipo | Descripción |
|-----------|------|-------------|
| `alerts(filters, limit)` | Query | Lista alertas con filtros |
| `alert(id)` | Query | Obtiene alerta por ID |
| `pendingAlerts(limit)` | Query | Alertas no reconocidas |
| `alertsByType(type, limit)` | Query | Alertas por tipo |
| `alertsByPriority(priority, limit)` | Query | Alertas por prioridad |
| `alertStats(fromDate, toDate)` | Query | Estadísticas de alertas |
| `createAlert(input)` | Mutation | Crea nueva alerta |
| `acknowledgeAlert(id, acknowledgedBy)` | Mutation | Reconoce alerta |
| `deleteAlert(id)` | Mutation | Elimina alerta |

### Ejemplos de Uso

```graphql
# Búsqueda semántica
query {
  searchKnowledge(input: { query: "visa B1/B2", topK: 5 }) {
    results { content source score }
    totalResults
  }
}

# Alertas pendientes
query {
  pendingAlerts(limit: 10) {
    id type priority title createdAt
  }
}

# Reconocer alerta
mutation {
  acknowledgeAlert(id: "alert_123", acknowledgedBy: "admin@example.com") {
    id acknowledgedAt
  }
}
```

---

## Variables de Entorno Requeridas

```env
# AI - Gemini
GEMINI_API_KEY=

# Storage (elegir uno)
STORAGE_PROVIDER=local  # o 'r2', 'gdrive', 'vercel'

# Vercel Blob (si STORAGE_PROVIDER=vercel) ⭐ RECOMENDADO
BLOB_READ_WRITE_TOKEN=

# Cloudflare R2 (si STORAGE_PROVIDER=r2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Google Drive (si STORAGE_PROVIDER=gdrive)
GDRIVE_CREDENTIALS_JSON=
GDRIVE_FOLDER_ID=

# Vector Store - Turso (producción)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Chat Storage Mode
CHAT_STORAGE_MODE=smart  # 'memory-only' | 'persist-all' | 'smart'

# Notifications (Alertas)
ALERT_EMAIL_TO=admin@consiguetuvisa.com
RESEND_API_KEY=

# Social APIs (opcional)
TWITTER_BEARER_TOKEN=
FACEBOOK_ACCESS_TOKEN=
```

---

## Decisiones Técnicas

### ¿Por qué Gemini?
- Free tier generoso (2.5-flash-lite: 10 RPM)
- Embeddings incluidos (text-embedding-004)
- API compatible con el proyecto

### ¿Por qué Storage abstracto?
- Anti vendor-locking
- Mismo código para dev (local) y prod (R2/GDrive)
- Fácil cambiar de proveedor

### ¿Por qué StoreSelector?
- Flexibilidad: memoria para anónimos, Prisma para autenticados
- Modo 'smart' optimiza recursos automáticamente
- Fácil cambiar comportamiento via env var

### ¿Por qué TursoVectorStore?
- Persistencia de embeddings entre reinicios
- Integración nativa con Prisma
- Similitud coseno calculada en memoria (SQLite no tiene ops vectoriales)

---

## Próximos Pasos

### Completados ✅
1. ~~**Google Drive Adapter** - 15GB gratis sin TDC~~ ✅
2. ~~**Vercel Blob Adapter** - 1GB gratis, integración nativa~~ ✅
3. ~~**Persistencia Prisma** - Guardar conversaciones~~ ✅
4. ~~**Vercel AI SDK** - Streaming en UI~~ ✅
5. ~~**Turso VectorStore** - Embeddings persistentes~~ ✅
6. ~~**Knowledge Base** - Sources, Documents, Chunks~~ ✅
7. ~~**Social Listening** - Monitoreo de menciones~~ ✅
8. ~~**Sistema de Alertas** - Notificaciones~~ ✅
9. ~~**PDFLoader** - Ingesta de documentos PDF~~ ✅
10. ~~**Health API Real** - Verificaciones reales a servicios~~ ✅
11. ~~**ChatManager Mejorado** - Gráficos y métricas avanzadas~~ ✅

### Completados Recientemente ✅
12. ~~**Tab AI/LLM Expandido** - Parámetros de generación + cuotas + horarios~~ ✅
13. ~~**Tab Banners** - Sistema de banners configurables~~ ✅
14. ~~**Validación Chat API** - Aplicar cuotas y horarios~~ ✅

### Futuro 🔵
15. **HubSpot CRM** - Integración leads
16. **Webhooks externos** - Automatizaciones
17. **WebLoader** - Scraping de páginas web
18. **Ficha Técnica del Modelo** - Consultar API de Gemini para mostrar specs del modelo activo

---

## 📋 Feature: Ficha Técnica del Modelo (Futuro)

**Objetivo:** Mostrar información técnica del modelo LLM activo en el Tab AI/LLM

**Endpoint:** `GET /v1beta/models/{model}?key={API_KEY}`

**Datos disponibles vía API:**
- `displayName` - Nombre del modelo
- `inputTokenLimit` - Límite de entrada (ej: 1,048,576 tokens)
- `outputTokenLimit` - Límite de salida (ej: 8,192 tokens)
- `supportedGenerationMethods` - Métodos soportados
- Rangos de `temperature`, `topP`, `topK`

**Datos NO disponibles vía API (propietarios):**
- ❌ Número de parámetros
- ❌ Arquitectura (capas, attention heads)
- ❌ Datos de entrenamiento
- ❌ Fecha de corte de conocimiento
- ❌ Benchmark scores

**UI propuesta:**
- Card "Modelo Activo" en Tab AI/LLM
- Mostrar límites de tokens con barras visuales
- Indicador de métodos soportados
- Link a documentación oficial de Google

---

## 🛡️ Feature: Agente Anti-Abuso (Futuro)

**Objetivo:** Detectar y bloquear automáticamente IPs que abusen del sistema

### Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE (Edge)                        │
│  1. Extraer IP del request                                  │
│  2. Consultar blacklist (Redis/KV/BD)                       │
│  3. Si bloqueada → 403 inmediato                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 RATE LIMITER (por IP)                       │
│  - Sliding window: 60 req/min general                       │
│  - Chat API: 10 req/min                                     │
│  - Si excede → incrementar strike counter                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              ABUSE DETECTOR (Async Job)                     │
│  Analiza patrones sospechosos:                              │
│  - Burst requests (>100 en 10s)                             │
│  - Prompt injection attempts                                │
│  - Scraping patterns (user-agent, paths)                    │
│  - Errores 4xx repetidos                                    │
│  - Payloads maliciosos                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              BLACKLIST MANAGER                              │
│  - strikes >= 3 → blacklist temporal (1h)                   │
│  - strikes >= 5 → blacklist 24h                             │
│  - strikes >= 10 → blacklist permanente                     │
│  - Crear alerta para admin                                  │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

| Componente | Tecnología | Función |
|------------|------------|---------|
| IP Blacklist | Redis/Vercel KV/Turso | Lista negra con TTL |
| Rate Limiter | `@upstash/ratelimit` | Límites por ventana deslizante |
| Strike Counter | Redis/BD | Acumula infracciones por IP |
| Abuse Detector | Cron job o queue | Analiza logs de forma async |
| Alert System | Ya implementado | Notifica al admin |

### Modelo Prisma

```prisma
model IPBlacklist {
  ip        String    @id
  reason    String    // 'rate_limit' | 'prompt_injection' | 'scraping' | 'manual'
  strikes   Int       @default(1)
  expiresAt DateTime? // null = permanente
  metadata  String?   // JSON con detalles
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model AbuseLog {
  id        String   @id @default(uuid())
  ip        String
  type      String   // 'rate_limit' | 'injection' | 'scraping' | 'error_burst'
  endpoint  String
  payload   String?  // Request body (sanitizado)
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([ip])
  @@index([createdAt])
}
```

### Detección de Patrones

| Patrón | Señal | Acción |
|--------|-------|--------|
| Burst | >100 req en 10s | +2 strikes |
| Rate limit | Excede límite 3 veces | +1 strike |
| Prompt injection | Keywords sospechosos | +3 strikes + log |
| Scraping | Paths secuenciales, no-JS | +1 strike |
| Error burst | >20 errores 4xx en 1min | +1 strike |
| Bot signature | User-agent conocido | Bloqueo directo |

### UI Admin (Tab Seguridad)

- Lista de IPs bloqueadas con razón y expiración
- Gráfico de intentos de abuso últimos 7 días
- Botón para desbloquear IP manualmente
- Configuración de umbrales (strikes, tiempos)
- Log de eventos de seguridad en tiempo real

### Orden de Implementación

1. Modelo Prisma `IPBlacklist` + `AbuseLog`
2. Middleware de verificación de blacklist
3. Rate limiter con Upstash o memoria
4. Strike counter y lógica de bloqueo
5. Detector de prompt injection
6. UI Admin para gestión
7. Alertas automáticas

---

## 📊 Feature: Monitor de Cuotas y Consumo (Futuro)

**Objetivo:** Monitorear consumo de recursos para evitar sobrepasar free tiers

### Arquitectura

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Middleware    │────▶│   UsageTracker   │────▶│     Alertas      │
│  (cuenta bytes)  │     │   (agrega/día)   │     │  (80%, 90%, 100%)│
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │    Cron Job      │
                         │ (sync APIs ext)  │
                         └──────────────────┘
```

### Métricas por Proveedor

| Proveedor | Free Tier | Métrica | Fuente |
|-----------|-----------|---------|--------|
| **Vercel** | 100GB bandwidth | Egress | API `api.vercel.com/v1/usage` |
| **Gemini** | 1M tokens/min | Tokens | Response `usageMetadata` |
| **Turso** | 9GB storage, 1B rows | Rows R/W | Dashboard API |
| **Clerk** | 10K MAUs | Users | API `/v1/users` count |
| **Resend** | 3K emails/mes | Emails | API usage endpoint |
| **Vercel Blob** | 1GB storage | Bytes | Estimación interna |

### Modelo Prisma

```prisma
model UsageMetric {
  id        String   @id @default(uuid())
  provider  String   // 'vercel' | 'gemini' | 'turso' | 'clerk' | 'resend'
  metric    String   // 'bandwidth' | 'tokens' | 'rows' | 'users' | 'emails'
  value     Float    // Valor actual
  limit     Float    // Límite del free tier
  period    String   // 'daily' | 'monthly'
  date      DateTime // Fecha del registro
  createdAt DateTime @default(now())
  
  @@unique([provider, metric, date])
  @@index([provider])
  @@index([date])
}
```

### Tracking Interno (Middleware)

```typescript
// En cada response
const responseSize = Buffer.byteLength(JSON.stringify(body));
await usageTracker.increment('internal', 'egress_bytes', responseSize);

// En cada llamada a Gemini
const { usageMetadata } = response;
await usageTracker.increment('gemini', 'tokens', usageMetadata.totalTokenCount);
```

### Sync con APIs Externas (Cron)

```typescript
// Ejecutar cada hora o diario
async function syncExternalUsage() {
  // Vercel
  const vercelUsage = await fetch('https://api.vercel.com/v1/usage', {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
  });
  
  // Clerk
  const clerkUsers = await fetch('https://api.clerk.com/v1/users?limit=1', {
    headers: { Authorization: `Bearer ${CLERK_SECRET}` }
  });
  // total_count en headers
}
```

### Umbrales de Alerta

| Nivel | % Consumo | Acción |
|-------|-----------|--------|
| Info | 50% | Log interno |
| Warning | 80% | Alerta email |
| Critical | 90% | Alerta + notificación admin |
| Emergency | 95% | Degradar servicio / rate limit agresivo |

### UI Admin (Tab Consumo)

- Dashboard con gauges por proveedor
- Gráfico de consumo últimos 30 días
- Proyección de fin de mes
- Configuración de umbrales
- Historial de alertas de cuota

### Limitaciones

- ❌ Vercel API de usage requiere Pro plan para datos detallados
- ❌ Algunos proveedores no exponen APIs de consumo
- ⚠️ Tracking interno es estimación, no valor exacto
- ✅ Gemini devuelve tokens exactos en cada response

---

## 💰 Feature: Billing Dashboard (Futuro)

**Objetivo:** Control centralizado de costos y consumo de todas las APIs externas

**Ruta:** `/admin/billing`

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BILLING SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    UsageTracker (Middleware)                 │   │
│  │  - Intercepta llamadas a APIs externas                       │   │
│  │  - Registra tokens/bytes/requests                            │   │
│  │  - Calcula costo según pricing del proveedor                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    UsageLog (Prisma)                         │   │
│  │  - provider: gemini | vercel | clerk | turso | resend        │   │
│  │  - metric: tokens | bandwidth | users | rows | emails        │   │
│  │  - quantity: número consumido                                │   │
│  │  - costUSD: costo calculado                                  │   │
│  │  - timestamp: fecha/hora                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    BillingService                            │   │
│  │  - Agrega por día/semana/mes                                 │   │
│  │  - Calcula proyecciones                                      │   │
│  │  - Verifica límites y dispara alertas                        │   │
│  │  - Sync con APIs externas (Vercel, Clerk usage endpoints)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Modelo Prisma

```prisma
model UsageLog {
  id        String   @id @default(uuid())
  provider  String   // gemini | vercel | clerk | turso | resend
  metric    String   // tokens_in | tokens_out | bandwidth | users | emails
  quantity  Float
  costUSD   Float
  metadata  String?  // JSON con detalles (modelo, endpoint, etc.)
  createdAt DateTime @default(now())
  
  @@index([provider])
  @@index([createdAt])
}

model BillingConfig {
  id            String  @id @default(uuid())
  provider      String  @unique
  monthlyBudget Float?  // Presupuesto mensual USD
  alertAt       Float   @default(0.8) // Alertar al 80%
  pricing       String  // JSON con precios por unidad
  isActive      Boolean @default(true)
}
```

### Pricing por Proveedor

| Proveedor | Métrica | Free Tier | Precio por unidad |
|-----------|---------|-----------|-------------------|
| **Gemini 2.0 Flash** | Tokens | 1M/min | $0.10 input / $0.40 output per 1M |
| **Gemini 1.5 Pro** | Tokens | 50 req/día | $1.25 input / $5.00 output per 1M |
| **Vercel** | Bandwidth | 100GB | $0.15/GB |
| **Clerk** | MAUs | 10,000 | $0.02/MAU adicional |
| **Turso** | Rows R/W | 1B rows | $0.001/1M rows |
| **Resend** | Emails | 3,000/mes | $0.001/email |

### UI del Dashboard

```
/admin/billing
├── Resumen General        → Gasto total mes, proyección, alertas
├── Por Proveedor          → Cards con consumo y costo de cada API
├── Historial              → Gráfico de consumo últimos 30 días
└── Configuración          → Límites, alertas, presupuesto mensual
```

### Tracking en Código

```typescript
// En GeminiLLM.adapter.ts después de cada llamada
const { usageMetadata } = response;
await billingService.logUsage({
  provider: 'gemini',
  metric: 'tokens_in',
  quantity: usageMetadata.promptTokenCount,
  costUSD: (usageMetadata.promptTokenCount * 0.10) / 1_000_000
});
await billingService.logUsage({
  provider: 'gemini',
  metric: 'tokens_out',
  quantity: usageMetadata.candidatesTokenCount,
  costUSD: (usageMetadata.candidatesTokenCount * 0.40) / 1_000_000
});
```

### Orden de Implementación

1. Modelos Prisma `UsageLog` + `BillingConfig`
2. `BillingService` con métodos de logging y agregación
3. Integrar tracking en `GeminiLLM.adapter.ts`
4. API `/api/admin/billing` para consultas
5. UI `BillingDashboard.svelte`
6. Alertas automáticas por umbral
7. Sync con APIs externas (opcional)

---

## 🔗 Feature: Certificado de Visa NFT (Futuro - Blockchain)

**Objetivo:** Emitir certificados digitales verificables como NFT cuando un cliente obtiene su visa aprobada.

**Wow Factor:** Marketing viral - clientes pueden mostrar su "Visa Badge" en redes sociales y LinkedIn.

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VISA CERTIFICATE NFT SYSTEM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │   Solicitud     │────▶│   NFT Minter    │────▶│   Polygon    │  │
│  │   APROBADA      │     │   Service       │     │   Blockchain │  │
│  └─────────────────┘     └─────────────────┘     └──────────────┘  │
│                                │                        │           │
│                                ▼                        ▼           │
│                    ┌─────────────────┐     ┌─────────────────────┐ │
│                    │      IPFS       │     │   OpenSea/Rarible   │ │
│                    │   (Metadata)    │     │   (Marketplace)     │ │
│                    └─────────────────┘     └─────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo Completo

1. **Solicitud APROBADA** → Trigger automático
2. **Generar Metadata** → Nombre, fecha, tipo de visa, país destino
3. **Subir a IPFS** → Imagen del certificado + JSON metadata
4. **Mint NFT** → Contrato ERC-721 en Polygon (gas ~$0.01)
5. **Notificar Cliente** → Email con link para reclamar
6. **Cliente Conecta Wallet** → MetaMask, WalletConnect
7. **Transferir NFT** → A la wallet del cliente
8. **Verificación Pública** → Cualquiera puede verificar autenticidad

### Smart Contract (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VisaCertificate is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping de solicitudId a tokenId
    mapping(string => uint256) public solicitudToToken;
    
    // Eventos
    event CertificateMinted(
        uint256 indexed tokenId, 
        address indexed recipient, 
        string solicitudId,
        string visaType
    );
    
    constructor() ERC721("ConsigueTuVisa Certificate", "VISA") Ownable(msg.sender) {}
    
    function mintCertificate(
        address recipient,
        string memory solicitudId,
        string memory visaType,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(solicitudToToken[solicitudId] == 0, "Certificate already minted");
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        solicitudToToken[solicitudId] = newTokenId;
        
        emit CertificateMinted(newTokenId, recipient, solicitudId, visaType);
        
        return newTokenId;
    }
    
    function verifyCertificate(string memory solicitudId) public view returns (bool, uint256) {
        uint256 tokenId = solicitudToToken[solicitudId];
        return (tokenId > 0, tokenId);
    }
    
    // Overrides requeridos
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

### NFT Metadata (IPFS)

```json
{
  "name": "Visa USA B1/B2 - Juan Pérez",
  "description": "Certificado oficial de visa aprobada emitido por ConsigueTuVisa.com",
  "image": "ipfs://Qm.../certificate-image.png",
  "external_url": "https://consiguetuvisa.com/verify/SOL-2024-001",
  "attributes": [
    { "trait_type": "Visa Type", "value": "USA B1/B2" },
    { "trait_type": "Destination", "value": "Estados Unidos" },
    { "trait_type": "Approval Date", "value": "2024-12-14" },
    { "trait_type": "Valid Until", "value": "2034-12-14" },
    { "trait_type": "Issuer", "value": "ConsigueTuVisa.com" }
  ]
}
```

### Tech Stack

| Componente | Tecnología | Razón |
|------------|------------|-------|
| Blockchain | Polygon PoS | Gas ultra bajo (~$0.01), compatible EVM |
| Smart Contract | Solidity + OpenZeppelin | Estándar ERC-721, seguro |
| SDK | thirdweb / Alchemy | Simplifica interacción con blockchain |
| Storage | IPFS (Pinata/NFT.Storage) | Descentralizado, permanente |
| Wallet Connect | WalletConnect v2 | Soporte multi-wallet |
| Frontend | ethers.js / wagmi | Interacción con contratos |

### Modelo Prisma

```prisma
model VisaCertificateNFT {
  id            String    @id @default(uuid())
  solicitudId   String    @unique
  customerId    String
  
  // Blockchain data
  tokenId       Int?
  contractAddress String?
  transactionHash String?
  walletAddress String?   // Wallet del cliente
  
  // Metadata
  metadataURI   String?   // ipfs://...
  imageURI      String?   // ipfs://...
  
  // Status
  status        String    @default("PENDING") // PENDING | MINTED | CLAIMED | FAILED
  mintedAt      DateTime?
  claimedAt     DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([customerId])
  @@index([status])
}
```

### API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/nft/mint` | POST | Mintear certificado (interno) |
| `/api/nft/claim/:id` | POST | Cliente reclama su NFT |
| `/api/nft/verify/:solicitudId` | GET | Verificar autenticidad |
| `/api/nft/metadata/:tokenId` | GET | Obtener metadata |

### UI Components

```
src/components/nft/
├── ClaimCertificate.svelte    # Modal para conectar wallet y reclamar
├── VerifyCertificate.svelte   # Página pública de verificación
├── CertificateCard.svelte     # Preview del certificado
└── WalletConnect.svelte       # Botón de conexión de wallet
```

### Orden de Implementación

1. **Fase 1: Smart Contract**
   - Escribir y testear contrato en Hardhat
   - Deploy en Polygon Mumbai (testnet)
   - Verificar en Polygonscan

2. **Fase 2: Backend**
   - Modelo Prisma `VisaCertificateNFT`
   - Servicio `NFTMinter.service.ts`
   - Integración con IPFS (Pinata)
   - APIs de mint/claim/verify

3. **Fase 3: Frontend**
   - Componente `WalletConnect.svelte`
   - Página `/verify/:id` pública
   - Modal de claim en dashboard cliente
   - Integración con wagmi/ethers

4. **Fase 4: Automatización**
   - Trigger automático al aprobar solicitud
   - Notificación por email
   - Retry en caso de fallo

5. **Fase 5: Producción**
   - Deploy en Polygon Mainnet
   - Configurar OpenSea collection
   - Marketing y comunicación

### Costos Estimados

| Concepto | Costo |
|----------|-------|
| Deploy contrato | ~$0.50 |
| Mint por NFT | ~$0.01 |
| IPFS storage | Gratis (NFT.Storage) |
| Dominio ENS (opcional) | ~$5/año |

### Beneficios

- ✅ **Marketing viral** - Clientes comparten en redes
- ✅ **Diferenciación** - Único en el mercado de visas
- ✅ **Confianza** - Certificado verificable públicamente
- ✅ **Referidos** - Badge como prueba social
- ✅ **Innovación** - Posicionamiento como empresa tech-forward

---

## 📄 Feature: Document Integrity Hash (Futuro - Blockchain)

**Objetivo:** Registrar hash de documentos en blockchain para garantizar que no fueron alterados.

**Caso de uso:** Embajadas/consulados pueden verificar que los documentos son los originales subidos por el cliente.

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT INTEGRITY SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │  Cliente sube   │────▶│  Hash Service   │────▶│   Polygon    │  │
│  │   documento     │     │   (SHA-256)     │     │   Blockchain │  │
│  └─────────────────┘     └─────────────────┘     └──────────────┘  │
│           │                      │                      │           │
│           ▼                      ▼                      ▼           │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │  Storage (R2)   │     │   Prisma DB     │     │  Verificador │  │
│  │  (archivo)      │     │   (metadata)    │     │   Público    │  │
│  └─────────────────┘     └─────────────────┘     └──────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo

1. Cliente sube pasaporte/documento
2. Backend calcula `SHA-256` del archivo
3. Hash se registra en smart contract con timestamp
4. Cliente recibe "sello de integridad" con txHash
5. Cualquiera puede verificar: subir archivo → comparar hash → validar en blockchain

### Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentRegistry {
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address registeredBy;
        string documentType; // "PASSPORT", "BANK_STATEMENT", etc.
    }
    
    mapping(bytes32 => Document) public documents;
    
    event DocumentRegistered(
        bytes32 indexed hash,
        string documentType,
        uint256 timestamp,
        address registeredBy
    );
    
    function registerDocument(
        bytes32 _hash,
        string memory _documentType
    ) public {
        require(documents[_hash].timestamp == 0, "Document already registered");
        
        documents[_hash] = Document({
            hash: _hash,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            documentType: _documentType
        });
        
        emit DocumentRegistered(_hash, _documentType, block.timestamp, msg.sender);
    }
    
    function verifyDocument(bytes32 _hash) public view returns (
        bool exists,
        uint256 timestamp,
        string memory documentType
    ) {
        Document memory doc = documents[_hash];
        return (doc.timestamp > 0, doc.timestamp, doc.documentType);
    }
}
```

### Modelo Prisma

```prisma
model DocumentHash {
  id              String   @id @default(uuid())
  documentId      String   // Relación con Document
  fileHash        String   @unique // SHA-256
  transactionHash String?  // Tx en blockchain
  blockNumber     Int?
  registeredAt    DateTime?
  status          String   @default("PENDING") // PENDING | REGISTERED | FAILED
  
  createdAt       DateTime @default(now())
  
  @@index([fileHash])
}
```

### Verificación Pública

```
/verify/document
├── Subir archivo (drag & drop)
├── Calcular hash en frontend (crypto-js)
├── Consultar blockchain
└── Mostrar: ✅ Verificado | ❌ No encontrado | ⚠️ Hash diferente
```

---

## 🎁 Feature: Loyalty Rewards Token (Futuro - Blockchain)

**Objetivo:** Sistema de recompensas con tokens ERC-20 canjeables por descuentos.

**Gamificación:** Clientes ganan tokens por acciones y los canjean por beneficios.

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LOYALTY REWARDS SYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    ACCIONES QUE PREMIAN                      │   │
│  │  • Referir amigo        → +100 VISA tokens                   │   │
│  │  • Completar proceso    → +50 VISA tokens                    │   │
│  │  • Dejar review         → +25 VISA tokens                    │   │
│  │  • Compartir en redes   → +10 VISA tokens                    │   │
│  │  • Cumpleaños           → +50 VISA tokens                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    VISA TOKEN (ERC-20)                       │   │
│  │  • Minteable por admin                                       │   │
│  │  • Transferible entre usuarios                               │   │
│  │  • Quemable al canjear                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    CANJE DE REWARDS                          │   │
│  │  • 500 tokens  → 10% descuento                               │   │
│  │  • 1000 tokens → 20% descuento                               │   │
│  │  • 2000 tokens → Asesoría gratis                             │   │
│  │  • 5000 tokens → Proceso completo gratis                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VisaRewardToken is ERC20, Ownable {
    
    // Eventos de rewards
    event RewardMinted(address indexed to, uint256 amount, string reason);
    event RewardRedeemed(address indexed from, uint256 amount, string reward);
    
    constructor() ERC20("ConsigueTuVisa Rewards", "VISA") Ownable(msg.sender) {}
    
    // Solo el owner (backend) puede mintear rewards
    function mintReward(
        address to,
        uint256 amount,
        string memory reason
    ) public onlyOwner {
        _mint(to, amount * 10**decimals());
        emit RewardMinted(to, amount, reason);
    }
    
    // Cliente canjea tokens por reward
    function redeemReward(
        uint256 amount,
        string memory reward
    ) public {
        require(balanceOf(msg.sender) >= amount * 10**decimals(), "Insufficient balance");
        _burn(msg.sender, amount * 10**decimals());
        emit RewardRedeemed(msg.sender, amount, reward);
    }
    
    // Consultar balance en formato legible
    function getBalance(address account) public view returns (uint256) {
        return balanceOf(account) / 10**decimals();
    }
}
```

### Modelo Prisma

```prisma
model RewardTransaction {
  id            String   @id @default(uuid())
  customerId    String
  type          String   // 'EARN' | 'REDEEM'
  amount        Int
  reason        String   // 'REFERRAL' | 'COMPLETED' | 'REVIEW' | 'DISCOUNT_10'
  txHash        String?  // Transacción blockchain
  status        String   @default("PENDING")
  
  createdAt     DateTime @default(now())
  
  @@index([customerId])
  @@index([type])
}

model RewardBalance {
  id            String   @id @default(uuid())
  customerId    String   @unique
  balance       Int      @default(0)
  totalEarned   Int      @default(0)
  totalRedeemed Int      @default(0)
  walletAddress String?
  
  updatedAt     DateTime @updatedAt
}
```

### UI del Cliente

```
/mi-cuenta/rewards
├── Balance actual (con animación)
├── Historial de transacciones
├── Catálogo de rewards canjeables
├── Conectar wallet (opcional)
└── Referir amigo (genera link único)
```

### Triggers Automáticos

```typescript
// En Solicitud.service.ts
async function onSolicitudApproved(solicitud: Solicitud) {
  await rewardService.mintReward({
    customerId: solicitud.customerId,
    amount: 50,
    reason: 'VISA_APPROVED'
  });
}

// En Referral.service.ts
async function onReferralConverted(referral: Referral) {
  await rewardService.mintReward({
    customerId: referral.referrerId,
    amount: 100,
    reason: 'REFERRAL_CONVERTED'
  });
}
```

### Beneficios

- ✅ **Fidelización** - Clientes regresan por más servicios
- ✅ **Referidos** - Incentivo económico para recomendar
- ✅ **Engagement** - Gamificación del proceso
- ✅ **Diferenciación** - Único en el mercado
- ✅ **Data** - Tracking de comportamiento del cliente

---

## 🔴 Deuda Técnica / Pendientes

### ~~Separación de Usuarios: Customer vs StaffMember~~ ✅ COMPLETADO

**Problema Resuelto:** Se separaron los usuarios en dos modelos distintos.

**Implementación realizada:**
- ✅ Modelos `Customer` y `StaffMember` creados en Prisma
- ✅ Middleware actualizado para buscar en ambas tablas
- ✅ Vinculación automática de `clerkId` por email
- ✅ Cache de usuarios (5 min TTL) para optimizar rendimiento
- ✅ Compatibilidad con `locals.localUser` mantenida
- ✅ Páginas admin actualizadas para usar nueva estructura
- ✅ Modelo `User` deprecado (campo `migratedTo` agregado)

**Migraciones aplicadas:**
- `20251214080707_separate_customer_staff`
- `20251214081505_staff_clerkid_optional`

**Scripts de utilidad:**
- `scripts/link-admin.ts` - Vincula clerkId de User legacy a StaffMember
- `scripts/set-admin.ts` - Crea StaffMember con rol ADMIN

**Arquitectura implementada:**

#### Arquitectura Correcta

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA DE USUARIOS                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │         Customer            │  │         StaffMember         │  │
│  │      (Usuario Externo)      │  │      (Usuario Interno)      │  │
│  ├─────────────────────────────┤  ├─────────────────────────────┤  │
│  │ • id                        │  │ • id                        │  │
│  │ • clerkId (auth)            │  │ • clerkId (auth)            │  │
│  │ • email                     │  │ • email                     │  │
│  │ • firstName, lastName       │  │ • firstName, lastName       │  │
│  │ • phone                     │  │ • role (ADMIN/SALES/...)    │  │
│  │ • source (web/referral)     │  │ • department                │  │
│  │ • status (lead/active)      │  │ • permissions[]             │  │
│  │                             │  │ • invitedBy                 │  │
│  ├─────────────────────────────┤  ├─────────────────────────────┤  │
│  │ Relaciones:                 │  │ Relaciones:                 │  │
│  │ • solicitudes[]             │  │ • assignedSolicitudes[]     │  │
│  │ • conversations[]           │  │ • createdAlerts[]           │  │
│  │ • appointments[]            │  │ • auditLogs[]               │  │
│  │ • documents[]               │  │                             │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      AUTH MIDDLEWARE                        │   │
│  │  1. Clerk valida token                                      │   │
│  │  2. Buscar en StaffMember por clerkId                       │   │
│  │  3. Si no existe → buscar en Customer                       │   │
│  │  4. Adjuntar { user, userType } al request                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Diferencias Clave

| Aspecto | Customer | StaffMember |
|---------|----------|-------------|
| Ciclo de vida | Se registra solo | Invitado por Admin |
| Datos | Personales + visa | Laborales + permisos |
| Acceso | `/`, `/chat`, `/mi-cuenta` | `/admin/*`, `/social/*` |
| Volumen | Miles | Decenas |
| GDPR/Privacidad | Alto (datos sensibles) | Bajo |
| Eliminación | Derecho al olvido | Auditoría requerida |

#### Modelos Prisma

```prisma
// Clientes externos (solicitantes de visa)
model Customer {
  id            String   @id @default(uuid())
  clerkId       String?  @unique
  email         String   @unique
  firstName     String?
  lastName      String?
  phone         String?
  source        String?  // 'web' | 'referral' | 'social' | 'ads'
  status        String   @default("LEAD") // LEAD | ACTIVE | INACTIVE
  
  solicitudes   Solicitud[]
  conversations Conversation[]
  appointments  Appointment[]
  documents     Document[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Equipo interno (admin, ventas, community)
model StaffMember {
  id            String   @id @default(uuid())
  clerkId       String   @unique
  email         String   @unique
  firstName     String
  lastName      String
  role          String   // ADMIN | SALES | COMMUNITY | DEV | SUPPORT
  department    String?
  permissions   String?  // JSON array de permisos específicos
  isActive      Boolean  @default(true)
  invitedBy     String?  // ID del admin que lo invitó
  
  assignedSolicitudes Solicitud[] @relation("AssignedAgent")
  createdAlerts       Alert[]     @relation("AlertCreator")
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Plan de Migración (Completado)

1. [x] Crear modelos `Customer` y `StaffMember` en Prisma ✅
2. [x] Migrar datos existentes de `User` a los nuevos modelos ✅
3. [x] Actualizar middleware de auth para buscar en ambos ✅
4. [x] Actualizar `locals.localUser` → `locals.customer` o `locals.staff` ✅
5. [x] Refactorizar componentes admin para usar `StaffMember` ✅
6. [ ] Refactorizar componentes públicos para usar `Customer` (pendiente)
7. [x] Deprecar modelo `User` (mantener por compatibilidad temporal) ✅
8. [ ] Eliminar modelo `User` después de verificar (futuro)

#### Middleware Optimizado

```typescript
// Flujo de autenticación optimizado:
// 1. Buscar en cache (5 min TTL)
// 2. Si no está en cache, buscar por clerkId en StaffMember
// 3. Si no encuentra, buscar por clerkId en Customer
// 4. Si no encuentra y hay email, buscar por email y vincular clerkId
// 5. Solo llama a Clerk API si no tiene email en sessionClaims

// Locals disponibles:
// - locals.authUser: Usuario actual (staff o customer)
// - locals.userType: 'staff' | 'customer'
// - locals.staff: StaffMember (si es staff)
// - locals.customer: Customer (si es customer)
// - locals.localUser: Compatibilidad legacy (deprecated)
```

---

### ~~Knowledge Base Hardcodeada~~ ✅ RESUELTO
**Solución implementada:**
- Documentos migrados a tablas Prisma: `Source` → `KBDocument` → `Chunk`
- Chat API carga documentos desde BD via `loadKnowledgeBaseFromDB()`
- Scripts de seed: `prisma/seed-knowledge.ts` (local) y `prisma/seed-knowledge-prod.ts` (Turso)
- Ya no requiere deploy para cambiar contenido de KB

**Documentos en BD:**
- `visa-usa-requisitos`, `visa-usa-costos`, `visa-usa-entrevista`
- `visa-canada-requisitos`, `visa-canada-costos`
- `servicios-asesoria`, `visa-schengen`

### Pendientes Restantes
- [x] PDFLoader para documentos PDF ✅
- [ ] WebLoader para scraping de páginas
- [x] Panel admin para Knowledge Base (CRUD visual) ✅
- [ ] Sync automático Sanity → embeddings
- [x] Panel admin para Chatbot (conversaciones, métricas avanzadas) ✅
- [x] Panel admin para Configuración (Tabs + Health real) ✅
- [x] Tab AI/LLM expandido (parámetros generación, cuotas, horarios) ✅
- [x] Tab Banners (sistema de banners configurables) ✅
- [x] Persistencia de configuración en BD (SystemConfig) ✅
- [ ] Mostrar banners activos en el frontend público

---

# 🖥️ Admin Dashboard - Módulos IA

## Estado: 🔄 En Progreso

## Estructura de Navegación por Rol

### Admin/Dev (`/admin/*`)
```
/admin
├── /                    → ✅ Clientes (CustomersCrud)
├── /equipo              → ✅ StaffCrud (Admin, Sales, Community, Dev, Support)
├── /solicitudes         → ✅ AdminDashboard solicitudes
├── /knowledge           → ✅ Knowledge Base Manager
├── /social              → ✅ Social Listening (Dashboard + Config APIs) - NUEVO
├── /alertas             → ✅ Alertas de Sistema (errores, cuotas, seguridad)
├── /chat                → ✅ Gestión Chatbot
├── /config              → ✅ Configuración
├── /participaciones     → Sorteos (Ruleta Loca)
├── /seguridad           → 🟢 FUTURO - Anti-abuso, IPs bloqueadas
└── /consumo             → 🟢 FUTURO - Monitor de cuotas
```

### APIs de Social Listening (NUEVO)
```
/api/admin/social        → GET: Lista menciones + stats + tendencia
/api/admin/social/[id]   → GET/PUT/DELETE: Operaciones individuales
/api/admin/social/config → GET/PUT: Configuración de APIs
/api/admin/social/sync   → POST: Sincronizar menciones
```

### APIs de Usuarios
```
/api/admin/users         → CRUD de Customer (clientes externos)
/api/admin/users/[id]    → Operaciones individuales de Customer
/api/admin/staff         → CRUD de StaffMember (equipo interno)
/api/admin/staff/[id]    → Operaciones individuales de StaffMember
```

### Sales (`/admin/*` limitado)
```
/admin
├── /                    → Dashboard (solo métricas de negocio)
├── /solicitudes         → ✅ Gestión de solicitudes
├── /leads               → 🟢 FUTURO - Alertas de negocio
└── /chat                → Solo lectura de conversaciones
```

### Community Manager (`/admin/social`)
```
/admin/social            → ✅ Dashboard de menciones + Configuración APIs
└── /respuestas          → 🟢 FUTURO - Respuesta rápida
```

---

## Módulo 1: Knowledge Base Manager ✅ COMPLETADO

**Ruta:** `/admin/knowledge`
**Estado:** Implementado y funcional
**GraphQL:** `Knowledge.graphql.ts` con campos `documentsCount` y `chunksCount`

### Funcionalidades Implementadas:
- [x] **Lista de Sources** - Ver todas las fuentes de conocimiento
- [x] **Lista de Documents** - Ver documentos por fuente seleccionada
- [x] **Eliminar Documento** - Con confirmación
- [x] **Búsqueda Semántica** - Modal para probar queries (requiere GEMINI_API_KEY)
- [x] **Ingestar Documento** - Modal para agregar contenido Markdown
- [x] **Estadísticas** - Cards con total sources, docs, chunks
- [x] **Skeleton Loading** - Estados de carga elegantes

### Componentes Creados:
```
src/components/admin/knowledge/
└── KnowledgeManager.svelte      # Componente único con todo integrado
```

### Datos de Prueba:
- Script: `prisma/seed-knowledge.ts`
- 1 Source, 7 Documents

---

## Scripts de Seed Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `scripts/seed-customers.ts` | `pnpm exec tsx scripts/seed-customers.ts` | 20 Customers + 14 Solicitudes |
| `scripts/seed-conversations.ts` | `pnpm exec tsx scripts/seed-conversations.ts` | 15 Conversaciones + 49 Mensajes |
| `prisma/seed-knowledge.ts` | `pnpm exec tsx prisma/seed-knowledge.ts` | 7 Documentos de Knowledge Base |
| `scripts/link-admin.ts` | `pnpm exec tsx scripts/link-admin.ts` | Vincula clerkId de User legacy a StaffMember |
| `scripts/set-admin.ts` | `pnpm exec tsx scripts/set-admin.ts` | Crea StaffMember con rol ADMIN |
| `scripts/check-integrity.ts` | `pnpm exec tsx scripts/check-integrity.ts` | Verifica integridad de datos |

---

## Módulo 2: Sistema de Alertas ✅ COMPLETADO (Refactorización Pendiente)

**Estado Actual:** Implementación básica funcional
**Refactorización:** Separar por dominio y audiencia

### ⚠️ Problema Actual
El sistema actual mezcla alertas de diferentes dominios en una sola vista. Un Community Manager no debería ver alertas de operaciones, y un Admin no necesita ver todas las menciones sociales.

### 🎯 Arquitectura Correcta (Por Implementar)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE ALERTAS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   OPERACIONES   │  │    NEGOCIO      │  │     SOCIAL      │     │
│  │   (Admin/Dev)   │  │  (Admin/Sales)  │  │ (Community Mgr) │     │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤     │
│  │ • Errores 500   │  │ • Nueva lead    │  │ • Menciones     │     │
│  │ • DB down       │  │ • Pago recibido │  │ • Sentimiento   │     │
│  │ • Cuota 90%     │  │ • Cita agendada │  │ • Tendencias    │     │
│  │ • Abuso/IP ban  │  │ • Queja cliente │  │ • Competencia   │     │
│  │ • Deploy fail   │  │ • Abandono cart │  │ • Influencers   │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           ▼                    ▼                    ▼               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              ALERT ROUTER (por rol + canal)                 │   │
│  │  • ADMIN → Slack #ops + Email                               │   │
│  │  • SALES → CRM + Email                                      │   │
│  │  • COMMUNITY → Dashboard Social + WhatsApp                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Dominios de Alertas

| Dominio | Audiencia | Ruta | Tipos de Alerta |
|---------|-----------|------|-----------------|
| **Operaciones** | ADMIN, DEV | `/admin/alertas` | Errores, DB, Cuotas, Seguridad |
| **Negocio** | ADMIN, SALES | `/admin/leads` | Leads, Pagos, Citas, Quejas |
| **Social** | COMMUNITY | `/social/dashboard` | Menciones, Sentimiento, Trends |

### Modelo Prisma Actualizado

```prisma
model Alert {
  id            String    @id @default(uuid())
  
  // Clasificación por dominio
  domain        String    // 'operations' | 'business' | 'social'
  type          String    // Tipo específico dentro del dominio
  
  // Contenido
  title         String
  message       String
  priority      String    // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  metadata      String?   // JSON con datos adicionales
  
  // Routing
  targetRoles   String    // JSON array: ['ADMIN'] | ['SALES', 'ADMIN'] | ['COMMUNITY']
  channels      String    // JSON array: ['email', 'slack', 'dashboard', 'whatsapp']
  
  // Estado
  acknowledgedAt DateTime?
  acknowledgedBy String?
  
  createdAt     DateTime  @default(now())
  
  @@index([domain])
  @@index([targetRoles])
  @@index([createdAt])
}
```

### Rutas por Rol

| Rol | Rutas Accesibles | Alertas Visibles |
|-----|------------------|------------------|
| ADMIN | `/admin/*` | Todas |
| SALES | `/admin/leads`, `/admin/solicitudes` | business |
| COMMUNITY | `/social/*` | social |
| DEV | `/admin/alertas`, `/admin/config` | operations |

### Canales de Notificación

| Canal | Uso | Implementación |
|-------|-----|----------------|
| Dashboard | Siempre | Ya implementado |
| Email | CRITICAL, HIGH | Resend (ya implementado) |
| Slack | operations | Webhook (futuro) |
| WhatsApp | social urgente | Twilio (futuro) |
| Push | mobile | Web Push API (futuro) |

### Implementación Actual (Funcional)

**Ruta:** `/admin/alertas`
**GraphQL:** `Alert.graphql.ts`

- [x] Lista de Alertas con filtros
- [x] Stats Cards (Total, Pendientes, Reconocidas)
- [x] Reconocer/Eliminar Alerta
- [x] Panel de Detalle
- [x] Colores por Prioridad
- [x] Skeleton Loading

### Refactorización Pendiente

1. [ ] Agregar campo `domain` al modelo Alert
2. [ ] Agregar campo `targetRoles` al modelo Alert
3. [ ] Crear `/social/dashboard` para Community Manager
4. [ ] Filtrar alertas por rol del usuario en cada vista
5. [ ] Implementar Alert Router para canales
6. [ ] Separar UI por dominio

### Componentes Actuales
```
src/components/admin/alerts/
└── AlertsCenter.svelte          # Vista unificada (a separar)
```

### Datos de Prueba:
- Script: `scripts/seed-alerts.ts`
- 6 alertas de ejemplo

---

## Módulo 3: Gestión de Chatbot ✅ COMPLETADO

**Ruta:** `/admin/chat`
**Estado:** Implementado y funcional
**API:** `/api/admin/chat/conversations`

### Funcionalidades Implementadas:
- [x] **Stats Cards Mejorados** - Total, Hoy, Esta semana, Promedio mensajes
- [x] **Gráfico de Barras** - Conversaciones últimos 7 días por día
- [x] **Breakdown Usuarios** - Registrados vs Anónimos con barras de progreso
- [x] **DataTable** - Lista con Usuario, Título, Msgs, Fecha, Acciones
- [x] **Sistema de Tabs** - Abrir múltiples conversaciones horizontalmente
- [x] **Panel de Info** - Datos del usuario en cada tab
- [x] **Historial de Chat** - Mensajes con formato user/assistant
- [x] **Filtros** - Búsqueda y "Solo usuarios registrados"
- [x] **Paginación** - Navegación entre páginas
- [x] **Eliminar** - Con confirmación
- [x] **Exportar CSV** - Botón para descargar datos

### API Response Mejorada:
```json
{
  "conversations": [...],
  "stats": {
    "total": 150,
    "today": 12,
    "thisWeek": 45,
    "avgMessages": 4.2,
    "registeredUsers": 80,
    "anonymousUsers": 70
  },
  "chartData": [
    { "date": "2024-12-08", "count": 5 },
    { "date": "2024-12-09", "count": 8 },
    ...
  ]
}
```

### Componentes Creados:
```
src/components/admin/chat/
└── ChatManager.svelte           # Componente único con DataTable + Tabs + Gráficos
```

### Datos de Prueba:
- Script: `scripts/seed-conversations.ts`
- 5 conversaciones con usuarios reales

---

## Módulo 4: Configuración ✅ COMPLETADO

**Ruta:** `/admin/config`
**Estado:** Implementado y funcional
**APIs:** `/api/admin/config`, `/api/health`

### Funcionalidades Implementadas:
- [x] **Tabs por Dominio** - AI/LLM, RAG, Storage, Alertas, Integraciones
- [x] **Tab AI/LLM** - Provider, modelo, mensaje bienvenida, system prompt
- [x] **Tab RAG** - Vector store, embedding model, topK (slider), threshold (slider)
- [x] **Tab Storage** - Provider, chat mode, estado
- [x] **Tab Alertas** - Email destino, estado Resend
- [x] **Tab Integraciones** - Grid de servicios con estado
- [x] **Health API** - `/api/health` con estado REAL de todos los servicios
- [x] **Métricas de Sistema** - Uptime, memoria, chats hoy, DB latency
- [x] **Métricas de Red** - Latencia externa, DNS, latencias por servicio
- [x] **Status Bar** - Indicadores visuales de cada servicio
- [x] **Auto-refresh** - Health se actualiza cada 30s
- [x] **Cache inteligente** - 5 minutos para evitar llamadas excesivas

### Health API - Verificaciones REALES:
| Servicio | Verificación |
|----------|-------------|
| Database | `SELECT 1` real + medición latencia |
| AI (Gemini) | Llamada real a API de modelos |
| Storage (Vercel) | Verificación real del token |
| Auth (Clerk) | Llamada real a la API |
| CMS (Sanity) | Query real al proyecto |

### Componentes Creados:
```
src/components/admin/
├── AdminLayout.svelte           # Layout con sidebar (actualizado con nuevas rutas)
├── UsersCrud.svelte             # CRUD de Customers (clientes) - REFACTORIZADO
├── StaffCrud.svelte             # CRUD de StaffMembers (equipo) - NUEVO
├── config/
│   └── ConfigManager.svelte     # Panel con Tabs + Health + Métricas
├── chat/
│   └── ChatManager.svelte       # Gestión de conversaciones
└── knowledge/
    └── KnowledgeManager.svelte  # Gestión de Knowledge Base
```

### Health API Response:
```json
{
  "status": "healthy|degraded|unhealthy",
  "services": { "database", "ai", "storage", "auth", "cms" },
  "metrics": { 
    "uptime", "memoryUsage", "conversationsToday",
    "externalLatency", "dnsLatency", "serviceLatencies"
  }
}
```

---

## 🚀 Mejoras Planificadas - Configuración Avanzada

### Feature Flags (Futuro)

**Objetivo:** Activar/desactivar funcionalidades sin necesidad de deploy

```prisma
model FeatureFlag {
  id          String   @id @default(uuid())
  key         String   @unique  // 'chatbot_enabled', 'maintenance_mode'
  enabled     Boolean  @default(false)
  description String?
  metadata    String?  // JSON con config adicional
  updatedBy   String?
  updatedAt   DateTime @updatedAt
}
```

**Uso en código:**
```typescript
if (await featureFlags.isEnabled('chatbot_v2')) {
  // Nueva versión del chatbot
} else {
  // Versión actual
}
```

**Flags sugeridos:**
- `chatbot_enabled` - Activar/desactivar chatbot público
- `maintenance_mode` - Modo mantenimiento
- `new_dashboard` - A/B testing de nuevo diseño
- `social_listening` - Activar módulo social
- `billing_tracking` - Activar tracking de costos

---

### Audit Log (Futuro)

**Objetivo:** Trazabilidad de cambios para compliance y debugging

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  action     String   // 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'CONFIG_CHANGE'
  entity     String   // 'Customer' | 'Solicitud' | 'StaffMember' | 'Config'
  entityId   String?
  changes    String?  // JSON con { field: { old, new } }
  userId     String?  // StaffMember que hizo el cambio
  userEmail  String?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  
  @@index([entity])
  @@index([userId])
  @@index([createdAt])
}
```

**Eventos a registrar:**
- Cambios en configuración del sistema
- CRUD de usuarios (Customer/Staff)
- Cambios de estado en solicitudes
- Login/logout de admins
- Cambios en Knowledge Base

**UI:** Tab "Auditoría" en `/admin/config` con filtros por fecha, usuario, entidad

---

### Maintenance Mode (Futuro)

**Objetivo:** Activar modo mantenimiento con mensaje personalizado

```typescript
interface MaintenanceConfig {
  enabled: boolean;
  message: string;           // "Estamos mejorando el sistema..."
  estimatedEnd?: Date;       // "Volvemos a las 10:00 AM"
  allowedIPs?: string[];     // IPs que pueden acceder (admins)
  allowedRoles?: string[];   // ['ADMIN', 'DEV']
  showCountdown: boolean;
}
```

**Middleware:**
```typescript
if (await featureFlags.isEnabled('maintenance_mode')) {
  const config = await getMaintenanceConfig();
  
  // Permitir acceso a admins
  if (config.allowedRoles?.includes(user?.role)) {
    return next();
  }
  
  // Mostrar página de mantenimiento
  return renderMaintenancePage(config);
}
```

**UI:** Toggle en `/admin/config` con campos para mensaje y tiempo estimado

---

### Tab AI/LLM Expandido ✅ COMPLETADO

**Objetivo:** Sistema robusto de configuración de IA agnóstico al modelo
**Estado:** Implementado y funcional

#### Parámetros de Generación (Creatividad)
```typescript
interface GenerationParams {
  temperature: number;      // 0-1, default 0.7
  topP: number;            // 0-1, default 0.9
  topK: number;            // 1-100, default 40
  maxTokens: number;       // 100-4096, default 1024
}
```

#### Sistema de Cuotas (Control de Recursos)
```typescript
interface QuotaConfig {
  enabled: boolean;
  dailyLimit: number;           // Requests por día
  perUserLimit: number;         // Requests por usuario/día
  quotaExceededMessage: string; // "Has alcanzado el límite diario..."
  resetTime: string;            // "00:00" hora de reset
}
```

#### Sistema de Disponibilidad (Horarios)
```typescript
interface AvailabilityConfig {
  mode: '24/7' | 'scheduled';
  timezone: string;             // "America/Guayaquil"
  schedule: {
    monday:    { enabled: boolean; start: string; end: string };
    tuesday:   { enabled: boolean; start: string; end: string };
    wednesday: { enabled: boolean; start: string; end: string };
    thursday:  { enabled: boolean; start: string; end: string };
    friday:    { enabled: boolean; start: string; end: string };
    saturday:  { enabled: boolean; start: string; end: string };
    sunday:    { enabled: boolean; start: string; end: string };
  };
  unavailableMessage: string;   // "Disponible de Lun-Vie 9am-6pm"
}
```

#### Seguridad y Comportamiento
```typescript
interface SafetyConfig {
  contentFiltering: 'strict' | 'moderate' | 'minimal';
  blockSensitiveTopics: boolean;
  maxConversationLength: number;  // Mensajes antes de reset
  rateLimitPerMinute: number;     // Anti-spam
}
```

### Tab Banners ✅ COMPLETADO

**Objetivo:** Sistema de banners configurables para comunicación con usuarios
**Estado:** Implementado con modal de edición y preview

#### Tipos de Banners
| Tipo | Color | Icono | Uso |
|------|-------|-------|-----|
| `maintenance` | Naranja | 🔧 | Servidor en mantenimiento |
| `environment` | Azul/Amarillo | 🏗️ | Staging/Development |
| `promotion` | Verde | 🎉 | Ofertas y promociones |
| `warning` | Amarillo | ⚠️ | Advertencias generales |
| `announcement` | Azul | 📢 | Anuncios importantes |
| `scheduled` | Gris | 📅 | Mantenimiento programado |

#### Estructura de Banner
```typescript
interface Banner {
  id: string;
  type: BannerType;
  title: string;
  message: string;
  enabled: boolean;
  dismissible: boolean;
  showOnPages: string[];        // ['/', '/chat', '*']
  startDate?: Date;             // Programación
  endDate?: Date;
  priority: number;             // Orden de aparición
  ctaText?: string;             // "Ver más"
  ctaUrl?: string;
}
```

#### UI del Tab Banners
- Lista de banners activos/inactivos
- Crear/Editar banner con formulario
- Preview en tiempo real
- Drag & drop para reordenar prioridad
- Programación con date pickers

### Validación en Chat API ✅ COMPLETADO

**Objetivo:** Aplicar cuotas y horarios antes de procesar mensajes
**Estado:** Integrado en `/api/chat` usando `checkChatAvailability()`

```typescript
// En /api/chat
async function validateRequest(userId: string): Promise<ValidationResult> {
  // 1. Verificar disponibilidad (horario)
  if (!isWithinSchedule()) {
    return { allowed: false, message: config.unavailableMessage };
  }
  
  // 2. Verificar cuota diaria
  if (await isQuotaExceeded(userId)) {
    return { allowed: false, message: config.quotaExceededMessage };
  }
  
  // 3. Verificar rate limit
  if (await isRateLimited(userId)) {
    return { allowed: false, message: "Demasiadas solicitudes..." };
  }
  
  return { allowed: true };
}
```

### Orden de Implementación

1. ~~**Tab AI/LLM Expandido** - Parámetros de generación (sliders)~~ ✅
2. ~~**Sistema de Cuotas** - Límites diarios + contador~~ ✅
3. ~~**Sistema de Disponibilidad** - Horarios por día~~ ✅
4. ~~**Tab Banners** - CRUD de banners~~ ✅
5. ~~**Validación Chat API** - Integrar cuotas + horarios~~ ✅
6. ~~**Persistencia** - Guardar config en BD (SystemConfig)~~ ✅

---

## Módulo 5: Social Listening ✅ COMPLETADO

**Ruta:** `/admin/social`
**Audiencia:** ADMIN, DEV, COMMUNITY
**Estado:** Implementado con UI y APIs de sincronización

### Separación de Dominios

| Módulo | Propósito | Audiencia |
|--------|-----------|-----------|
| **Alertas Sistema** (`/admin/alertas`) | Errores, cuotas, seguridad | ADMIN, DEV |
| **Social Listening** (`/admin/social`) | Menciones, sentimiento, engagement | ADMIN, COMMUNITY |

### Funcionalidades Implementadas:
- [x] Dashboard de menciones con stats y gráficos
- [x] Análisis de sentimiento (POSITIVE/NEUTRAL/NEGATIVE/COMPLAINT)
- [x] Tendencia de sentimiento (últimos 7 días)
- [x] Distribución por plataforma (Twitter, Facebook, Instagram)
- [x] Filtros (plataforma, sentimiento, revisadas)
- [x] Modal de detalle con respuesta sugerida
- [x] Marcar como revisada
- [x] Configuración de APIs (movido a `/admin/config` → Tab "Social APIs")
- [x] Sincronización manual desde UI
- [x] Clasificación automática con AI (Gemini)

### Funcionalidades Pendientes:
- [ ] Sincronización automática (cron job)
- [ ] Respuesta directa desde dashboard
- [ ] Monitoreo de competencia
- [ ] Detección de influencers
- [ ] Alertas automáticas por quejas

### Arquitectura

```
src/server/lib/features/social/
├── SocialMention.entity.ts      # Entidades
├── SocialMention.port.ts        # Interfaces
├── SocialMention.repository.ts  # CRUD Prisma
├── SentimentClassifier.ts       # Clasificación con AI
├── SocialListener.service.ts    # Procesamiento de menciones
├── SocialSync.service.ts        # ✅ NUEVO - Sincronización
├── Social.graphql.ts            # ✅ NUEVO - GraphQL schema
├── adapters/
│   ├── TwitterAdapter.ts        # ✅ NUEVO - Twitter API v2
│   └── FacebookAdapter.ts       # ✅ NUEVO - Meta Graph API
└── index.ts
```

### APIs REST

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/social` | GET | Lista menciones + stats + tendencia |
| `/api/admin/social/[id]` | GET/PUT/DELETE | Operaciones individuales |
| `/api/admin/social/config` | GET/PUT | Configuración de APIs |
| `/api/admin/social/sync` | POST | Ejecutar sincronización |
| `/api/admin/social/sync?test=twitter` | GET | Probar conexión |

### GraphQL Operations

| Operación | Tipo | Descripción |
|-----------|------|-------------|
| `socialMentions` | Query | Lista con filtros |
| `pendingMentions` | Query | Pendientes de revisión |
| `complaints` | Query | Solo quejas |
| `socialStats` | Query | Estadísticas |
| `sentimentTrend` | Query | Tendencia por día |
| `reviewMention` | Mutation | Marcar revisada |
| `updateMention` | Mutation | Actualizar sentimiento/respuesta |
| `deleteMention` | Mutation | Eliminar |

### Variables de Entorno

```env
# Twitter/X API v2 (Basic: $100/mes, Free: muy limitado)
TWITTER_BEARER_TOKEN=

# Meta Graph API (Gratis con limitaciones)
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
FACEBOOK_INSTAGRAM_ACCOUNT_ID=
```

### Configuración desde UI

1. Ir a `/admin/config` → Tab "Social APIs"
2. Habilitar Twitter y/o Facebook
3. Ingresar tokens de API
4. Probar conexión
5. Guardar configuración
6. Ir a `/admin/social` y click "Sincronizar" para extraer menciones

### Script de Seed

```bash
pnpm exec tsx scripts/seed-social.ts
```

Crea 14 menciones de prueba con diferentes sentimientos y plataformas.

---

## Orden de Implementación

1. ~~**Knowledge Base Manager**~~ ✅ COMPLETADO
2. ~~**Centro de Alertas**~~ ✅ COMPLETADO
3. ~~**Gestión de Chatbot**~~ ✅ COMPLETADO
4. ~~**Configuración**~~ ✅ COMPLETADO
5. ~~**Social Listening**~~ ✅ COMPLETADO

---

# ⚡ Optimización de Rendimiento - Cache SWR

## Estado: ✅ COMPLETADO

### Problema Resuelto
El homepage tardaba **43 segundos** en cargar debido a múltiples llamadas a Sanity CMS (~10 queries secuenciales).

### Solución Implementada: Stale-While-Revalidate (SWR)

**¿Qué es SWR?**
Patrón de cache que sirve datos "stale" (viejos) inmediatamente mientras revalida en background.

**Flujo:**
1. Primera visita → Carga desde Sanity (~5s) y guarda en cache
2. Visitas siguientes → Retorna cache inmediatamente (<100ms)
3. Si cache > 30s → Revalida en background sin bloquear
4. Próxima visita → Ya tiene datos frescos

**Comparación de Soluciones:**
| Solución | Velocidad | Frescura | Complejidad |
|----------|-----------|----------|-------------|
| Sin cache | ❌ 43s | ✅ Inmediata | ✅ Ninguna |
| ISR (5 min) | ✅ <100ms | ❌ 5 min | ⚠️ Media |
| **SWR (implementado)** | ✅ <100ms | ✅ ~30s | ⚠️ Media |
| Redis/KV | ✅ <50ms | ✅ ~30s | ❌ Alta |

**Configuración:**
- `staleTime`: 30 segundos (después revalida en background)
- `maxAge`: 5 minutos (después fuerza recarga)

### Archivos Creados

```
src/lib/sanity/
├── cache.ts              # ✅ Utilidad SWR genérica
└── homepage.service.ts   # ✅ Actualizado con cache

src/pages/api/sanity/
└── revalidate.ts         # ✅ Webhook para invalidar cache
```

### Uso del Cache

```typescript
// Antes (lento):
const hero = await getHero();

// Después (con SWR):
const hero = await withSWR('sanity:hero', getHero);
```

### Webhook de Invalidación

**Endpoint:** `POST /api/sanity/revalidate`

**Configurar en Sanity:**
1. sanity.io/manage → API → Webhooks
2. URL: `https://tudominio.com/api/sanity/revalidate`
3. Trigger: Create, Update, Delete
4. Secret: Agregar `SANITY_WEBHOOK_SECRET` en env

**Endpoint de Debug:** `GET /api/sanity/revalidate`
- Muestra estadísticas del cache
- Útil para verificar estado

### Variables de Entorno

```env
# Opcional - para validar webhooks de Sanity
SANITY_WEBHOOK_SECRET=tu-secret-seguro
```

---

# 🎨 Mejoras UI/UX Pendientes

## Estado: 🔄 En Progreso

### Evaluación Actual: 7.5/10

---

## Roadmap de Mejoras Visuales

### 1. Microinteracciones ✅ COMPLETADO
- [x] Animaciones de entrada en scroll (fade-up, slide-left, slide-right, scale-in)
- [x] Hover effects elaborados (hover-lift, hover-scale, hover-glow)
- [x] Transiciones suaves entre secciones (staggered delays)
- [x] Soporte accesibilidad (prefers-reduced-motion)
- **Archivos:** `design-system/global/animations.css`, `src/scripts/scroll-animations.ts`
- **Impacto:** Alto | **Esfuerzo:** Bajo

### 2. SEO Técnico ✅ COMPLETADO
- [x] Meta tags dinámicos desde Sanity (`Layout.astro` + `seo.service.ts`)
- [x] Schema markup JSON-LD (`SchemaMarkup.astro`)
  - LocalBusiness, Organization, WebSite
  - AggregateRating (reviews)
  - FAQPage (preguntas frecuentes)
- [x] Open Graph + Twitter Cards completos
- [x] Sitemap.xml automático (`@astrojs/sitemap`)
- [x] robots.txt optimizado (`public/robots.txt`)
- [x] Canonical URLs
- [x] Geo tags (Ecuador/Quito)
- [x] Hreflang tags
- **Impacto:** Medio-Alto | **Esfuerzo:** Bajo

### 3. Social Proof Visual ✅ COMPLETADO
- [x] Sección "Logos de confianza" (`TrustLogos.astro`)
- [x] Contadores animados de estadísticas (`AnimatedCounter.svelte`)
- [x] Badges de verificación (en Trust.astro)
- [ ] Reviews de Google/Facebook embebidos (futuro)
- **Archivos:** `src/components/ui/AnimatedCounter.svelte`, `src/components/home/TrustLogos.astro`
- **Impacto:** Medio | **Esfuerzo:** Bajo

### 4. Admin Dashboard ✅ COMPLETADO
- [x] `AdminDashboard.svelte` - Rediseñado estilo Jony Ive
- [x] `AdminLayout.svelte` - Sidebar minimalista
- [x] `UsersCrud.svelte` - CRUD usuarios elegante
- [x] Tipografía ligera (`font-light`, `font-semibold`)
- [x] Espaciado generoso (`rounded-3xl`, `gap-6`)
- [x] Paleta slate neutral
- [x] Iconos sutiles (`strokeWidth={1.5}`)
- [x] Botones pill (`rounded-full`)
- **Archivos:** `src/components/dashboard/AdminDashboard.svelte`, `src/components/admin/AdminLayout.svelte`, `src/components/admin/UsersCrud.svelte`
- **Impacto:** Alto | **Esfuerzo:** Medio

### 5. Identidad Visual (Requiere diseñador)
- [ ] Logo profesional vectorial
- [ ] Paleta de colores refinada
- [ ] Tipografía distintiva
- [ ] Iconografía custom
- [ ] Ilustraciones de marca
- **Impacto:** Alto | **Esfuerzo:** Externo

### 5. Fotografía y Media
- [ ] Fotos reales del equipo
- [ ] Fotos de clientes (con permiso)
- [ ] Video testimoniales
- [ ] Imágenes de oficina/proceso
- **Impacto:** Alto | **Esfuerzo:** Externo

---

## Sanity CMS - Migración Completada ✅

### Secciones del Home migradas:
| Sección | Componente | Servicio | Estado |
|---------|-----------|----------|--------|
| Hero | `Hero.astro` | `hero.service.ts` | ✅ |
| Benefits | `Benefits.astro` | `benefits.service.ts` | ✅ |
| Services | `ServicesGrid.astro` | `services.service.ts` | ✅ |
| Testimonials | `Testimonials.astro` | `testimonials.service.ts` | ✅ |
| Steps | `StepsFlow.astro` | `steps.service.ts` | ✅ |
| Trust | `Trust.astro` | `trust.service.ts` | ✅ |
| FAQ | `FAQ.astro` | `faq.service.ts` | ✅ |
| Contact | `Contact.astro` | `contact.service.ts` | ✅ |
| Footer | `Footer.astro` | `siteSettings.service.ts` | ✅ |
| Header (logo) | `Header.astro` | `siteSettings.service.ts` | ✅ |

### Schemas de Sanity:
```
sanity/schemas/
├── documents/
│   ├── page.ts           # Páginas con secciones
│   ├── siteSettings.ts   # Config global (singleton)
│   ├── post.ts           # Blog
│   ├── author.ts
│   ├── category.ts
│   ├── tag.ts
│   ├── campaign.ts       # Promos
│   ├── prize.ts
│   └── cardBrand.ts
└── blocks/
    ├── hero.ts
    ├── features.ts
    ├── services.ts
    ├── steps.ts
    ├── trust.ts
    ├── testimonials.ts
    ├── faq.ts
    ├── pricing.ts
    ├── cta.ts
    ├── contact.ts
    └── richText.ts
```

### Servicios Sanity:
```
src/lib/sanity/
├── hero.service.ts
├── benefits.service.ts
├── services.service.ts
├── testimonials.service.ts
├── steps.service.ts
├── trust.service.ts
├── faq.service.ts
├── contact.service.ts
└── siteSettings.service.ts
```
