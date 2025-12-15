// src/server/lib/core/di/ContextFactory.ts

/**
 * FÁBRICA DE CONTEXTO - Contenedor de Servicios
 * Aquí se inyectan todas las dependencias para cada petición.
 * Para cambiar de proveedor, solo cambia el adaptador aquí.
 */

import { AuthService } from '@features/auth/Auth.service';
import type { IAuthProvider } from '@features/auth/Auth.port';
import { ClerkAuthAdapter } from '@adapters/auth/ClerkAuth.adapter';

import { UserService, UserRepository } from '@features/user';
import type { IUserRepository } from '@features/user';

import { LeadService } from '@features/leads/Lead.service';

import { SolicitudService } from '@features/solicitud/Solicitud.service';
import { SolicitudRepository } from '@features/solicitud/Solicitud.repository';
import type { ISolicitudRepository } from '@features/solicitud/Solicitud.port';

import { PageService } from '@features/page/Page.service';
import { PageRepository } from '@features/page/Page.repository';
import type { IPageRepository } from '@features/page/Page.port';

import { BlogService } from '@features/blog/Blog.service';
import { BlogRepository } from '@features/blog/Blog.repository';
import type { IBlogRepository } from '@features/blog/Blog.port';

import { getEmailProvider } from '@adapters/email';
import { getCRMProvider } from '@adapters/crm';

// Core AI
import { AIService } from '@core/ai';

// Knowledge Base
import { SourceRepository, SourceService, DocumentRepository } from '@features/knowledge';
import type { ISourceRepository } from '@features/knowledge/Source.port';
import type { IDocumentRepository } from '@features/knowledge/Document.port';

// Alerts
import { AlertRepository } from '@features/alerts';
import type { IAlertRepository } from '@features/alerts/Alert.port';

// RAG & Ingestion
import { RAGService, MemoryVectorStoreAdapter } from '@core/rag';
import type { IRAGEngine } from '@core/rag/RAG.port';
import { PrismaIngestionService } from '@core/ingestion/PrismaIngestion.service';
import { GeminiLLMAdapter, GeminiEmbeddingAdapter } from '@core/ai';

// Prisma
import { prisma } from '@server/db/prisma-singleton';
import type { PrismaClient } from '@prisma/client';

/**
 * Define la estructura del Contexto.
 */
export interface AppContext {
  authHeader?: string;
  request: Request;

  // Servicios inyectados
  authService: AuthService;
  userService: UserService;
  leadService: LeadService;
  solicitudService: SolicitudService;
  pageService: PageService;
  blogService: BlogService;
  aiService: AIService | null;

  // Knowledge Base
  sourceRepository: ISourceRepository;
  sourceService: SourceService;
  documentRepository: IDocumentRepository;
  
  // Alerts
  alertRepository: IAlertRepository;
  
  // RAG & Ingestion (optional - require GEMINI_API_KEY)
  ragService: IRAGEngine | null;
  ingestionService: PrismaIngestionService | null;
  
  // Prisma (for field resolvers)
  prisma: PrismaClient;
}

// Alias para compatibilidad con GraphQL
export type GraphQLContext = AppContext;

// Singleton for RAG services (expensive to create)
let cachedRagService: IRAGEngine | null = null;
let cachedIngestionService: PrismaIngestionService | null = null;

function getRagServices(): { ragService: IRAGEngine | null; ingestionService: PrismaIngestionService | null } {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Si no hay API key, retornar null (servicios no disponibles)
  if (!apiKey) {
    console.warn('[ContextFactory] GEMINI_API_KEY not set - RAG services disabled');
    return { ragService: null, ingestionService: null };
  }
  
  if (!cachedRagService || !cachedIngestionService) {
    const vectorStore = new MemoryVectorStoreAdapter();
    const llm = new GeminiLLMAdapter(apiKey);
    const embedding = new GeminiEmbeddingAdapter(apiKey);
    
    cachedRagService = new RAGService({ vectorStore, llm, embedding });
    
    const documentRepository = new DocumentRepository(prisma);
    cachedIngestionService = new PrismaIngestionService({
      prisma,
      ragEngine: cachedRagService,
      documentRepository,
    });
  }
  
  return { ragService: cachedRagService, ingestionService: cachedIngestionService };
}

/**
 * Fábrica para crear e inyectar todas las dependencias.
 */
export function buildContext(request: Request): AppContext {
  const headers = request.headers;

  // --- 1. ADAPTADORES (Infraestructura) ---
  const authProvider: IAuthProvider = new ClerkAuthAdapter();
  const userRepository: IUserRepository = new UserRepository();
  const solicitudRepository: ISolicitudRepository = new SolicitudRepository();
  const pageRepository: IPageRepository = new PageRepository();
  const blogRepository: IBlogRepository = new BlogRepository();
  const emailProvider = getEmailProvider();
  const crmProvider = getCRMProvider();

  // --- 2. SERVICIOS (Lógica de Negocio) ---
  const authService = new AuthService(authProvider);
  const userService = new UserService(userRepository);
  const leadService = new LeadService(emailProvider, crmProvider);
  const solicitudService = new SolicitudService(solicitudRepository);
  const pageService = new PageService(pageRepository);
  const blogService = new BlogService(blogRepository);
  
  // AIService es opcional (requiere GEMINI_API_KEY)
  let aiService: AIService | null = null;
  if (process.env.GEMINI_API_KEY) {
    aiService = new AIService();
  }

  // --- 3. KNOWLEDGE BASE ---
  const sourceRepository = new SourceRepository(prisma);
  const sourceService = new SourceService(sourceRepository);
  const documentRepository = new DocumentRepository(prisma);
  
  // --- 4. ALERTS ---
  const alertRepository = new AlertRepository(prisma);
  
  // --- 5. RAG & INGESTION (singleton) ---
  const { ragService, ingestionService } = getRagServices();

  // --- 6. CONTEXTO FINAL ---
  return {
    authHeader: headers.get('Authorization') ?? undefined,
    request,
    authService,
    userService,
    leadService,
    solicitudService,
    pageService,
    blogService,
    aiService,
    sourceRepository,
    sourceService,
    documentRepository,
    alertRepository,
    ragService,
    ingestionService,
    prisma,
  };
}


/**
 * Servicios básicos sin AI (para dashboard, auth, etc.)
 */
let cachedBasicServices: {
  authService: AuthService;
  userService: UserService;
  solicitudService: SolicitudService;
  prisma: PrismaClient;
} | null = null;

export function getBasicServices() {
  if (!cachedBasicServices) {
    const authProvider: IAuthProvider = new ClerkAuthAdapter();
    const userRepository: IUserRepository = new UserRepository();
    const solicitudRepository: ISolicitudRepository = new SolicitudRepository();

    cachedBasicServices = {
      authService: new AuthService(authProvider),
      userService: new UserService(userRepository),
      solicitudService: new SolicitudService(solicitudRepository),
      prisma,
    };
  }
  return cachedBasicServices;
}

/**
 * Singleton para contextos que no dependen del request.
 * Útil para middleware y tareas en background.
 * NOTA: Requiere GEMINI_API_KEY para AI/RAG services.
 */
let cachedServices: Omit<AppContext, 'authHeader' | 'request'> | null = null;

export function getServices() {
  if (!cachedServices) {
    const authProvider: IAuthProvider = new ClerkAuthAdapter();
    const userRepository: IUserRepository = new UserRepository();
    const solicitudRepository: ISolicitudRepository = new SolicitudRepository();
    const pageRepository: IPageRepository = new PageRepository();
    const emailProvider = getEmailProvider();
    const crmProvider = getCRMProvider();
    const blogRepository: IBlogRepository = new BlogRepository();

    // Knowledge Base
    const sourceRepository = new SourceRepository(prisma);
    const sourceService = new SourceService(sourceRepository);
    const documentRepository = new DocumentRepository(prisma);
    
    // Alerts
    const alertRepository = new AlertRepository(prisma);
    
    // RAG & Ingestion
    const { ragService, ingestionService } = getRagServices();

    cachedServices = {
      authService: new AuthService(authProvider),
      userService: new UserService(userRepository),
      leadService: new LeadService(emailProvider, crmProvider),
      solicitudService: new SolicitudService(solicitudRepository),
      pageService: new PageService(pageRepository),
      blogService: new BlogService(blogRepository),
      aiService: process.env.GEMINI_API_KEY ? new AIService() : null,
      sourceRepository,
      sourceService,
      documentRepository,
      alertRepository,
      ragService,
      ingestionService,
      prisma,
    };
  }
  return cachedServices;
}
