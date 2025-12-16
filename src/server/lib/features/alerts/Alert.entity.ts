// src/server/lib/features/alerts/Alert.entity.ts

/**
 * ENTIDADES DE ALERTAS
 * Modelos de dominio para el sistema de alertas y notificaciones.
 * 
 * @requirements 12.1 - Sistema de alertas para eventos importantes
 */

/**
 * Tipos de alerta soportados
 */
export enum AlertType {
  COMPLAINT = 'COMPLAINT',
  POLICY_CHANGE = 'POLICY_CHANGE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  MENTION = 'MENTION',
}

/**
 * Prioridades de alerta
 */
export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Dominio de alerta (catálogo normalizado)
 */
export interface AlertDomain {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  allowedRoles: string[];
  isActive: boolean;
}

/**
 * Entidad Alert - Alerta del sistema
 */
export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  domain?: AlertDomain;
  title: string;
  content: string;
  context?: Record<string, unknown>;
  sourceId?: string;
  mentionId?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

/**
 * Input para crear una nueva alerta
 */
export interface CreateAlertInput {
  type: AlertType;
  priority: AlertPriority;
  domainName?: string; // 'operations' | 'business' | 'social'
  title: string;
  content: string;
  context?: Record<string, unknown>;
  sourceId?: string;
  mentionId?: string;
}

/**
 * Input para actualizar una alerta
 */
export interface UpdateAlertInput {
  priority?: AlertPriority;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

/**
 * Filtros para búsqueda de alertas
 */
export interface AlertFilters {
  type?: AlertType;
  priority?: AlertPriority;
  domainName?: string;
  acknowledged?: boolean;
  sourceId?: string;
  mentionId?: string;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Resultado de notificación
 */
export interface NotificationResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
}
