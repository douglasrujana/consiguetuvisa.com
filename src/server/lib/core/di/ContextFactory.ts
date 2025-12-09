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
}

// Alias para compatibilidad con GraphQL
export type GraphQLContext = AppContext;

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

  // --- 3. CONTEXTO FINAL ---
  return {
    authHeader: headers.get('Authorization') ?? undefined,
    request,
    authService,
    userService,
    leadService,
    solicitudService,
    pageService,
    blogService,
  };
}


/**
 * Singleton para contextos que no dependen del request.
 * Útil para middleware y tareas en background.
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

    cachedServices = {
      authService: new AuthService(authProvider),
      userService: new UserService(userRepository),
      leadService: new LeadService(emailProvider, crmProvider),
      solicitudService: new SolicitudService(solicitudRepository),
      pageService: new PageService(pageRepository),
      blogService: new BlogService(blogRepository),
    };
  }
  return cachedServices;
}
