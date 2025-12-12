// src/server/lib/core/index.ts
// Barrel export - Core utilities

export { buildContext } from './di/ContextFactory';
export type { GraphQLContext } from './di/ContextFactory';
export {
  DomainError,
  BusinessRuleError,
  AuthenticationError,
  NotFoundError,
} from './error/Domain.error';

// Core AI
export * from './ai';

// Core RAG
export * from './rag';

// Core Ingestion
export * from './ingestion';

// Core Storage
export * from './storage';
