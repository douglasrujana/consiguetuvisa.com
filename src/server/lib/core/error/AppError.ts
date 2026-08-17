// src/server/lib/core/error/AppError.ts

/**
 * CLASE BASE DE ERRORES CENTRALIZADA
 * Proporciona códigos de error estandarizados, códigos HTTP y formateo para respuestas JSON y vistas UI.
 */

export type ErrorCode =
  | 'ENV_VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'VALIDATION_ERROR'
  | 'BUSINESS_RULE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    statusCode: number = 500,
    details?: any,
    userMessage?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.userMessage = userMessage || message;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      error: {
        code: this.code,
        message: this.userMessage,
        details: this.details || null,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/** Errores de Configuración y Entorno */
export class EnvValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      'ENV_VALIDATION_ERROR',
      503,
      details,
      'Error de configuración del sistema. Faltan variables de entorno requeridas.'
    );
  }
}

/** Errores de Autenticación (401) */
export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado o sesión expirada.') {
    super(message, 'AUTHENTICATION_ERROR', 401, null, message);
  }
}

/** Errores de Autorización y Permisos (403) */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Acceso denegado. No tienes permisos para realizar esta acción.') {
    super(message, 'AUTHORIZATION_ERROR', 403, null, message);
  }
}

/** Errores de Recurso No Encontrado (404) */
export class NotFoundError extends AppError {
  constructor(message: string = 'El recurso solicitado no fue encontrado.') {
    super(message, 'NOT_FOUND_ERROR', 404, null, message);
  }
}

/** Errores de Validación de Entrada (400) */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details, message);
  }
}

/** Errores de Reglas de Negocio (422) */
export class BusinessRuleError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'BUSINESS_RULE_ERROR', 422, details, message);
  }
}

/** Errores de Servicios Externos (502) */
export class ExternalServiceError extends AppError {
  constructor(serviceName: string, originalError?: any) {
    const msg = `Error al comunicarse con el servicio externo (${serviceName}).`;
    super(msg, 'EXTERNAL_SERVICE_ERROR', 502, originalError, msg);
  }
}
