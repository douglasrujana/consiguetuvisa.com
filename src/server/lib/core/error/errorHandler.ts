// src/server/lib/core/error/errorHandler.ts

import { AppError, EnvValidationError } from './AppError';
import { validateEnv, renderEnvDiagnosticHtml } from '../config/env.validator';

/**
 * MANEJADOR CENTRALIZADO DE ERRORES PARA API ROUTES
 * Recibe cualquier tipo de error (AppError o Error común) y devuelve una Response HTTP estandarizada.
 */
export function handleApiError(error: unknown): Response {
  console.error('[CentralErrorHandler] Error procesando API:', error);

  if (error instanceof AppError) {
    return new Response(JSON.stringify(error.toJSON()), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Si es un error desconocido de JavaScript
  const errMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado en el servidor.';
  
  // Detectar errores conocidos de librerías como Clerk o Prisma
  if (errMessage.includes('Publishable key not valid') || errMessage.includes('secretKey')) {
    const envErr = new EnvValidationError('Error de autenticación Clerk: Llave no válida o no configurada.');
    return new Response(JSON.stringify(envErr.toJSON()), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fallbackError = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno en el servidor.',
      details: process.env.NODE_ENV === 'development' ? errMessage : undefined,
      timestamp: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(fallbackError), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * MANEJADOR CENTRALIZADO PARA MIDDLEWARE Y RUTAS WEB
 * Renderiza la pantalla de diagnóstico HTML si hay un problema crítico de entorno o un error fatal.
 */
export function handleMiddlewareError(error: unknown, requestUrl: string): Response {
  console.error(`[CentralErrorHandler] Error en Middleware para (${requestUrl}):`, error);

  const isApiRequest = requestUrl.includes('/api/');

  // Si es petición API, retornar JSON
  if (isApiRequest) {
    return handleApiError(error);
  }

  // Si es una petición Web/UI, mostrar la pantalla diagnóstica HTML
  const envCheck = validateEnv();
  const htmlContent = renderEnvDiagnosticHtml(envCheck);

  return new Response(htmlContent, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
