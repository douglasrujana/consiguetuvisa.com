// src/server/lib/core/error/Domain.error.ts

/**
 * Clase base para todos los errores de Dominio (Lógica de Negocio).
 * Permite identificar y categorizar errores al atravesar las capas.
 */
export class DomainError extends Error {
  // Código estándar de GraphQL para errores de Dominio
  public readonly code: string = 'BAD_USER_INPUT'; 
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DomainError';
    if (code) this.code = code;
  }
}

/**
 * Errores de Reglas de Negocio (El más común en el Servicio).
 * Ejemplo: "El email ya está registrado", "No se puede agendar el fin de semana".
 */
export class BusinessRuleError extends DomainError {
    constructor(message: string) {
        super(message, 'BUSINESS_RULE_VIOLATION');
        this.name = 'BusinessRuleError';
    }
}

/**
 * Errores de Permisos/Autenticación.
 */
export class AuthenticationError extends DomainError {
    constructor(message: string = 'No autorizado.') {
        super(message, 'UNAUTHENTICATED');
        this.name = 'AuthenticationError';
    }
}

/**
 * Errores de recursos no encontrados.
 */
export class NotFoundError extends DomainError {
    constructor(message: string = 'Recurso no encontrado.') {
        super(message, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}