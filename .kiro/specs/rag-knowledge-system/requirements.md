# Requirements Document

## Introduction

Sistema de gestión de conocimiento para el chatbot RAG de ConsigueTuVisa.com. Este sistema permite indexar, almacenar y recuperar información de múltiples fuentes (archivos, CMS, web scraping, redes sociales) para proporcionar respuestas precisas y actualizadas sobre trámites de visa.

## Glossary

- **RAG**: Retrieval-Augmented Generation - técnica que combina búsqueda semántica con generación de texto por LLM
- **Source**: Origen de datos configurado (Blob, Sanity, Web, Social, RSS)
- **Document**: Contenido indexado proveniente de una fuente
- **Chunk**: Fragmento de texto de un documento, optimizado para búsqueda semántica
- **Embedding**: Vector numérico que representa semánticamente un chunk
- **Vector Store**: Base de datos que almacena embeddings y permite búsqueda por similitud
- **Ingestion Pipeline**: Proceso de cargar, fragmentar y vectorizar documentos
- **ConversationStore**: Interface para almacenamiento de conversaciones (Memory, Prisma, Redis)
- **StoreSelector**: Componente que selecciona el ConversationStore según modo y userId
- **ChatStorageMode**: Modo de operación del selector ('memory-only', 'persist-all', 'smart')
- **ChatbotRepository**: Repositorio que delega operaciones al ConversationStore seleccionado
- **ChatbotService**: Servicio que orquesta RAG, LLM y persistencia de conversaciones
- **Social Listening**: Monitoreo de menciones de marca en redes sociales
- **Hot Cache**: Almacenamiento temporal de contenido reciente para acceso rápido
- **Sentiment Classification**: Clasificación automática de sentimiento (POSITIVE, NEUTRAL, NEGATIVE, COMPLAINT)
- **Alert**: Notificación de evento importante que requiere atención inmediata

## Requirements

### Requirement 1: Gestión de Fuentes de Datos

**User Story:** As an administrator, I want to configure multiple data sources, so that the chatbot can access diverse and up-to-date information.

#### Acceptance Criteria

1. WHEN an administrator creates a new source THEN the System SHALL validate the source configuration and store it in the database
2. WHEN a source is of type BLOB THEN the System SHALL require bucket and optional prefix configuration
3. WHEN a source is of type SANITY THEN the System SHALL require dataset and GROQ query configuration
4. WHEN a source is of type WEB THEN the System SHALL require URLs array, optional CSS selector, and scraping schedule
5. WHEN a source is of type SOCIAL THEN the System SHALL require platform identifier and accounts array
6. WHEN a source is of type RSS THEN the System SHALL require feed URLs array
7. WHEN an administrator deactivates a source THEN the System SHALL stop ingesting new documents from that source while preserving existing indexed content

### Requirement 2: Pipeline de Ingesta de Documentos

**User Story:** As a system, I want to automatically ingest and index documents from configured sources, so that the knowledge base stays current.

#### Acceptance Criteria

1. WHEN a document is submitted for ingestion THEN the System SHALL calculate a content hash to detect duplicates
2. WHEN a document content hash matches an existing document THEN the System SHALL skip re-indexing
3. WHEN a document is new or modified THEN the System SHALL fragment it into chunks with configurable size and overlap
4. WHEN chunks are created THEN the System SHALL generate embeddings using the configured embedding provider
5. WHEN embeddings are generated THEN the System SHALL store them in the vector store with reference to the source chunk
6. WHEN ingestion fails THEN the System SHALL mark the document status as FAILED and log the error
7. WHEN ingestion succeeds THEN the System SHALL mark the document status as INDEXED with timestamp

### Requirement 3: Almacenamiento de Vectores Persistente

**User Story:** As a system, I want to persist embeddings in a database, so that the knowledge base survives server restarts.

#### Acceptance Criteria

1. WHEN the system starts THEN the Vector Store SHALL load existing embeddings from Turso database
2. WHEN a similarity search is performed THEN the Vector Store SHALL return the top-k most similar chunks with scores
3. WHEN an embedding is stored THEN the Vector Store SHALL record the model version and vector dimensions
4. WHEN a document is deleted THEN the Vector Store SHALL cascade delete all associated chunks and embeddings
5. WHEN searching THEN the Vector Store SHALL support filtering by source type and metadata

### Requirement 4: Persistencia de Conversaciones

**User Story:** As a user, I want my conversation context to be maintained appropriately based on my authentication status, so that I get a personalized experience.

#### Acceptance Criteria

1. WHEN the StoreSelector mode is 'memory-only' THEN the StoreSelector SHALL return MemoryConversationStore for all requests
2. WHEN the StoreSelector mode is 'persist-all' THEN the StoreSelector SHALL return PrismaConversationStore for all requests
3. WHEN the StoreSelector mode is 'smart' and userId is absent THEN the StoreSelector SHALL return MemoryConversationStore
4. WHEN the StoreSelector mode is 'smart' and userId is present THEN the StoreSelector SHALL return PrismaConversationStore
5. WHEN the ChatbotRepository creates a conversation THEN the ChatbotRepository SHALL delegate to the store returned by StoreSelector
6. WHEN a conversation is created THEN the ConversationStore SHALL assign a unique conversation identifier
7. WHEN a message is sent THEN the ConversationStore SHALL append it to the conversation history
8. WHEN an anonymous conversation in MemoryConversationStore is inactive for 30 minutes THEN the MemoryConversationStore SHALL expire and delete it
9. WHEN an authenticated user returns THEN the PrismaConversationStore SHALL retrieve their conversation history from the database

### Requirement 5: Procesamiento de Mensajes (ChatbotService)

**User Story:** As a user, I want to ask questions and receive accurate answers based on the knowledge base, so that I can get help with visa processes.

#### Acceptance Criteria

1. WHEN a user sends a message THEN the ChatbotService SHALL retrieve or create the conversation via ChatbotRepository
2. WHEN processing a message THEN the ChatbotService SHALL delegate semantic search to the RAGEngine
3. WHEN context is retrieved THEN the ChatbotService SHALL pass relevant chunks to the RAGEngine for prompt augmentation
4. WHEN generating a response THEN the ChatbotService SHALL include conversation history from ChatbotRepository
5. WHEN a response is generated THEN the ChatbotService SHALL return source citations with the answer
6. WHEN the LLM call fails THEN the ChatbotService SHALL return a graceful error message without exposing internal details
7. WHEN userId is provided THEN the ChatbotService SHALL pass it to ChatbotRepository for persistent storage

### Requirement 6: Scraping de Fuentes Web

**User Story:** As a system, I want to periodically scrape embassy websites, so that the knowledge base contains official and current information.

#### Acceptance Criteria

1. WHEN a WEB source is active THEN the System SHALL execute scraping according to the configured schedule
2. WHEN scraping a URL THEN the System SHALL respect robots.txt directives
3. WHEN scraping a URL THEN the System SHALL apply rate limiting to avoid overloading target servers
4. WHEN content is extracted THEN the System SHALL clean HTML and extract meaningful text
5. WHEN scraping fails THEN the System SHALL retry with exponential backoff up to 3 attempts
6. WHEN content changes are detected THEN the System SHALL trigger re-indexing of the document

### Requirement 7: Integración con Redes Sociales

**User Story:** As a system, I want to monitor official embassy social media accounts, so that users receive timely updates about visa processes.

#### Acceptance Criteria

1. WHEN a SOCIAL source is configured THEN the System SHALL poll the specified accounts according to schedule
2. WHEN new posts are detected THEN the System SHALL ingest them as documents with appropriate metadata
3. WHEN ingesting social content THEN the System SHALL preserve the original post date and author
4. WHEN social content is older than 90 days THEN the System SHALL mark it as potentially outdated
5. WHEN API rate limits are reached THEN the System SHALL pause polling and resume after the cooldown period

### Requirement 8: API GraphQL Unificada

**User Story:** As a developer, I want a unified GraphQL API, so that I can access all chatbot functionality through a single endpoint.

#### Acceptance Criteria

1. WHEN a client queries searchKnowledge THEN the API SHALL return relevant chunks with sources and scores
2. WHEN a client mutates sendMessage THEN the API SHALL process the message through the orchestrator and return the response
3. WHEN a client queries conversation THEN the API SHALL return the conversation history if authorized
4. WHEN a client mutates ingestDocument THEN the API SHALL trigger the ingestion pipeline for the specified content
5. WHEN an authenticated request is made THEN the API SHALL validate the Clerk session token
6. WHEN an unauthorized request is made to protected resources THEN the API SHALL return a 401 error

### Requirement 9: Streaming de Respuestas

**User Story:** As a user, I want to see the chatbot response appear progressively, so that I have a more responsive experience.

#### Acceptance Criteria

1. WHEN a chat response is being generated THEN the System SHALL stream tokens to the client as they are produced
2. WHEN streaming is active THEN the UI SHALL display tokens incrementally
3. WHEN streaming completes THEN the System SHALL send a completion signal with final metadata
4. WHEN streaming fails mid-response THEN the System SHALL notify the client and provide partial content if available
5. WHEN the client disconnects THEN the System SHALL cancel the ongoing LLM generation


### Requirement 10: Monitoreo de Fuentes Externas en Tiempo Real

**User Story:** As a system, I want to monitor external social media accounts in near real-time, so that the chatbot can provide the latest official information about visa processes.

#### Acceptance Criteria

1. WHEN a real-time source is configured THEN the System SHALL poll the source at high frequency (every 5-15 minutes)
2. WHEN new content is detected from official embassy accounts THEN the System SHALL classify it by urgency (ALERT, UPDATE, INFO)
3. WHEN content is classified as ALERT THEN the System SHALL immediately index it in a hot cache for instant retrieval
4. WHEN content is classified as UPDATE THEN the System SHALL trigger standard ingestion pipeline
5. WHEN a user asks a question THEN the RAGEngine SHALL prioritize recent content (last 24 hours) in search results
6. WHEN displaying sources THEN the System SHALL show the publication timestamp to indicate freshness

### Requirement 11: Social Listening de Marca (ConsigueTuVisa)

**User Story:** As a business owner, I want to monitor mentions of ConsigueTuVisa on social media, so that I can detect customer feedback and respond appropriately.

#### Acceptance Criteria

1. WHEN a mention of ConsigueTuVisa is detected on configured social platforms THEN the System SHALL capture the mention with metadata
2. WHEN a mention is captured THEN the System SHALL classify sentiment (POSITIVE, NEUTRAL, NEGATIVE, COMPLAINT)
3. WHEN a mention is classified as COMPLAINT THEN the System SHALL create an alert for immediate review
4. WHEN a mention is classified as NEGATIVE THEN the System SHALL queue it for customer service follow-up
5. WHEN a mention contains a question THEN the System SHALL attempt to generate a suggested response using RAG
6. WHEN generating a suggested response THEN the System SHALL flag it for human review before posting
7. WHEN a mention is processed THEN the System SHALL store it in the database with classification and suggested actions

### Requirement 12: Sistema de Alertas y Notificaciones

**User Story:** As an administrator, I want to receive alerts about important events, so that I can take timely action on customer issues and policy changes.

#### Acceptance Criteria

1. WHEN a COMPLAINT is detected THEN the System SHALL send a notification to configured channels (email, Slack, dashboard)
2. WHEN an official source publishes an ALERT-level update THEN the System SHALL notify administrators immediately
3. WHEN multiple similar complaints are detected within a time window THEN the System SHALL escalate as a potential issue
4. WHEN an alert is created THEN the System SHALL include context (original content, classification, suggested actions)
5. WHEN an administrator acknowledges an alert THEN the System SHALL mark it as reviewed with timestamp
