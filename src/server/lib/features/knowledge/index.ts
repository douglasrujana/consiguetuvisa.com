// src/server/lib/features/knowledge/index.ts

/**
 * FEATURE: Knowledge Base
 * Gestión de fuentes de datos y documentos para el sistema RAG.
 */

// Entities
export * from './Source.entity';
export * from './Document.entity';

// DTOs
export * from './Source.dto';

// Ports
export * from './Source.port';
export * from './Document.port';

// Repositories
export { SourceRepository } from './Source.repository';
export { DocumentRepository, createDocumentWithHash } from './Document.repository';

// Services
export { SourceService } from './Source.service';

// GraphQL
export { knowledgeTypeDefs, knowledgeResolvers } from './Knowledge.graphql';
