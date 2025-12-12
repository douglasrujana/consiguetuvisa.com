# Implementation Plan

- [x] 1. Actualizar Schema Prisma con modelos de Knowledge Base

  - [x] 1.1 Agregar enums SourceType, DocumentStatus, SentimentType, AlertType, AlertPriority
    - Definir todos los enums en prisma/schema.prisma
    - _Requirements: 1.1, 11.2_

  - [x] 1.2 Crear modelo Source con configuración JSON
    - Campos: id, type, name, config, isActive, lastSyncAt, timestamps
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.3 Crear modelo Document con relación a Source
    - Campos: id, sourceId, externalId, title, contentHash, status, metadata, indexedAt
    - Índices: status, sourceId, unique(sourceId, externalId)
    - _Requirements: 2.1, 2.7_

  - [x] 1.4 Crear modelo Chunk con relación a Document
    - Campos: id, documentId, content, position, metadata
    - Cascade delete desde Document
    - _Requirements: 2.3_

  - [x] 1.5 Crear modelo Embedding con relación a Chunk
    - Campos: id, chunkId (unique), vector (Bytes), model, dimensions
    - Cascade delete desde Chunk
    - _Requirements: 2.4, 3.3_

  - [x] 1.6 Crear modelos Conversation y Message
    - Actualizar modelos existentes para persistencia
    - _Requirements: 4.6, 4.7_

  - [x] 1.7 Crear modelo SocialMention
    - Campos: id, sourceId, platform, externalId, author, content, sentiment, suggestedResponse
    - _Requirements: 11.1, 11.2_

  - [x] 1.8 Crear modelo Alert
    - Campos: id, type, priority, title, content, context, mentionId, acknowledgedAt
    - _Requirements: 12.1, 12.4_

  - [x] 1.9 Ejecutar migración de Prisma
    - `pnpm prisma migrate dev --name add_knowledge_base`
    - _Requirements: 1.1_

- [x] 2. Implementar Feature Knowledge (Source & Document)

  - [x] 2.1 Crear Source.entity.ts con tipos e interfaces
    - Definir SourceType enum, SourceConfig union type
    - _Requirements: 1.1_

  - [x] 2.2 Crear Source.dto.ts con validación Zod
    - Validar configuración según tipo de source
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.3 Write property test for source configuration validation
    - **Property 1: Source Configuration Validation**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

  - [x] 2.4 Crear Source.repository.ts con Prisma
    - CRUD operations para sources
    - _Requirements: 1.1, 1.7_

  - [x] 2.5 Crear Source.service.ts
    - Lógica de negocio para gestión de sources
    - _Requirements: 1.1, 1.7_

  - [x] 2.6 Crear Document.entity.ts
    - Definir DocumentStatus, Document, DocumentMetadata
    - _Requirements: 2.1_

  - [x] 2.7 Crear Document.repository.ts
    - CRUD con soporte para contentHash
    - _Requirements: 2.1, 2.2_

  - [x] 2.8 Write property test for content hash determinism
    - **Property 2: Content Hash Determinism**
    - **Validates: Requirements 2.1**

- [x] 3. Implementar TursoVectorStore

  - [x] 3.1 Crear TursoVectorStore.adapter.ts
    - Implementar IVectorStore interface
    - Serializar/deserializar vectores como Bytes
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Implementar método store() para guardar embeddings
    - Guardar en tabla Embedding con referencia a Chunk
    - _Requirements: 3.3_

  - [x] 3.3 Implementar método search() con similitud coseno
    - Calcular similitud en memoria (SQLite no tiene vector ops nativas)
    - Retornar top-k con scores
    - _Requirements: 3.2_

  - [x] 3.4 Implementar método delete() con cascade
    - Eliminar embeddings cuando se elimina documento
    - _Requirements: 3.4_

  - [x] 3.5 Write property test for vector store persistence
    - **Property 5: Vector Store Persistence**
    - **Validates: Requirements 3.1**

  - [x] 3.6 Write property test for similarity search self-match
    - **Property 6: Similarity Search Self-Match**
    - **Validates: Requirements 3.2**

  - [x] 3.7 Write property test for cascade delete integrity
    - **Property 7: Cascade Delete Integrity**
    - **Validates: Requirements 3.4**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar Ingestion Service mejorado

  - [x] 5.1 Actualizar Ingestion.service.ts para usar Prisma
    - Guardar documentos y chunks en DB
    - Calcular contentHash para detectar duplicados
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 Implementar detección de duplicados por hash
    - Skip re-indexing si hash coincide
    - _Requirements: 2.2_

  - [x] 5.3 Write property test for ingestion idempotence
    - **Property 3: Ingestion Idempotence**
    - **Validates: Requirements 2.2**

  - [x] 5.4 Write property test for ingestion round-trip
    - **Property 4: Ingestion Round-Trip**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.7**

  - [x] 5.5 Crear endpoint /api/knowledge/ingest para ingesta manual
    - POST con content y sourceId
    - _Requirements: 8.4_

- [x] 6. Implementar StoreSelector y Conversation Stores

  - [x] 6.1 Crear ConversationStore.port.ts interface
    - Definir contrato común para todos los stores
    - _Requirements: 4.5_

  - [x] 6.2 Crear MemoryConversationStore.ts
    - Refactorizar ChatbotRepository existente
    - Agregar expiración de 30 minutos
    - _Requirements: 4.1, 4.8_

  - [x] 6.3 Crear PrismaConversationStore.ts
    - Implementar persistencia con Prisma
    - _Requirements: 4.2, 4.9_

  - [x] 6.4 Crear StoreSelector.ts
    - Implementar lógica de selección por modo
    - Leer CHAT_STORAGE_MODE de env
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.5 Write property test for StoreSelector mode consistency
    - **Property 8: StoreSelector Mode Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [x] 6.6 Actualizar ChatbotRepository para usar StoreSelector
    - Inyectar StoreSelector en constructor
    - _Requirements: 4.5_

  - [x] 6.7 Write property test for conversation message round-trip
    - **Property 9: Conversation Message Round-Trip**
    - **Validates: Requirements 4.6, 4.7**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar Feature Social Listening

  - [x] 8.1 Crear SocialMention.entity.ts
    - Definir SentimentType, SocialMention interfaces
    - _Requirements: 11.1_

  - [x] 8.2 Crear SocialMention.repository.ts
    - CRUD con Prisma para menciones sociales
    - _Requirements: 11.1_

  - [x] 8.3 Crear SentimentClassifier.ts
    - Usar LLM para clasificar sentimiento
    - Prompt específico para detectar quejas
    - _Requirements: 11.2_

  - [x] 8.4 Write property test for sentiment classification

    - **Property 11: Complaint Detection Creates Alert**
    - **Validates: Requirements 11.3, 12.1**

  - [x] 8.5 Crear SocialListener.service.ts
    - Polling de menciones
    - Clasificación y generación de respuestas sugeridas
    - _Requirements: 11.1, 11.5, 11.6_

- [x] 9. Implementar Feature Alerts






  - [x] 9.1 Crear Alert.entity.ts


    - Definir AlertType, AlertPriority, Alert interfaces
    - _Requirements: 12.1_



  - [x] 9.2 Crear Alert.repository.ts
    - CRUD con Prisma
    - Query para alertas pendientes
    - _Requirements: 12.1_

  - [x] 9.3 Crear NotificationChannel.port.ts interface

    - Definir contrato para canales de notificación
    - _Requirements: 12.1_


  - [x] 9.4 Crear EmailNotification.adapter.ts

    - Usar Resend para enviar emails
    - _Requirements: 12.1_


  - [x] 9.5 Crear Alert.service.ts

    - Crear alertas desde menciones
    - Notificar por canales configurados
    - _Requirements: 12.1, 12.2, 12.4_

- [x] 10. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integrar Vercel AI SDK para Streaming



  - [x] 11.1 Instalar @ai-sdk/google y ai packages
    - `pnpm add ai @ai-sdk/google` (ya instalado: ai@5.0.108)
    - _Requirements: 9.1_

  - [x] 11.2 Crear StreamingChatService.ts

    - Wrapper sobre ChatbotService con streaming
    - _Requirements: 9.1, 9.3_

  - [x] 11.3 Actualizar /api/chat para soportar streaming

    - Detectar header Accept: text/event-stream
    - _Requirements: 9.1, 9.2_

  - [x] 11.4 Actualizar ChatWidget.svelte para streaming


    - Usar fetch con ReadableStream
    - Mostrar tokens incrementalmente
    - _Requirements: 9.2_

- [x] 12. Actualizar GraphQL Schema

  - [x] 12.1 Agregar tipos Source, Document, Alert al schema


    - Crear Knowledge.graphql.ts con typeDefs y resolvers
    - _Requirements: 8.1_

  - [x] 12.2 Agregar query searchKnowledge


    - Resolver que usa RAGService para búsqueda semántica
    - _Requirements: 8.1_

  - [x] 12.3 Agregar mutation ingestDocument

    - Resolver que usa PrismaIngestionService
    - _Requirements: 8.4_

  - [x] 12.4 Agregar query alerts y mutation acknowledgeAlert

    - Resolvers para gestión de alertas
    - _Requirements: 8.1_

  - [x] 12.5 Write unit tests for GraphQL resolvers

    - Test queries and mutations return expected shapes
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Actualizar documentación y steering

  - [x] 14.1 Actualizar .kiro/steering/actual.md con nuevas fases

    - Marcar Fase 5 como completada
    - Agregar Fase 6 (Knowledge Base) como completada
    - _Requirements: N/A_

  - [x] 14.2 Agregar endpoints de prueba a la documentación

    - /api/knowledge/ingest, /api/alerts
    - _Requirements: N/A_

- [x] 15. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
