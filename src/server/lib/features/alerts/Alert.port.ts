// src/server/lib/features/alerts/Alert.port.ts

/**
 * PUERTO ALERT - Contrato para repositorio de alertas
 * 
 * @requirements 12.1 - CRUD para alertas del sistema
 */

import type {
  Alert,
  AlertDomain,
  CreateAlertInput,
  UpdateAlertInput,
  AlertFilters,
} from './Alert.entity';

/**
 * Interface para el repositorio de alertas
 */
export interface IAlertRepository {
  /**
   * Crea una nueva alerta
   */
  create(input: CreateAlertInput): Promise<Alert>;

  /**
   * Busca una alerta por ID
   */
  findById(id: string): Promise<Alert | null>;

  /**
   * Busca alertas con filtros
   */
  findMany(filters?: AlertFilters, limit?: number): Promise<Alert[]>;

  /**
   * Busca alertas pendientes (no reconocidas)
   */
  findPending(limit?: number): Promise<Alert[]>;

  /**
   * Busca alertas por tipo
   */
  findByType(type: string, limit?: number): Promise<Alert[]>;

  /**
   * Busca alertas por prioridad
   */
  findByPriority(priority: string, limit?: number): Promise<Alert[]>;

  /**
   * Obtiene todos los dominios de alertas
   */
  findAllDomains(): Promise<AlertDomain[]>;

  /**
   * Busca alertas por dominio
   */
  findByDomain(domainName: string, limit?: number): Promise<Alert[]>;

  /**
   * Actualiza una alerta
   */
  update(id: string, input: UpdateAlertInput): Promise<Alert>;

  /**
   * Marca una alerta como reconocida
   */
  acknowledge(id: string, acknowledgedBy: string): Promise<Alert>;

  /**
   * Elimina una alerta
   */
  delete(id: string): Promise<void>;

  /**
   * Cuenta alertas por tipo en un rango de fechas
   */
  countByType(fromDate?: Date, toDate?: Date): Promise<Record<string, number>>;

  /**
   * Cuenta alertas por prioridad en un rango de fechas
   */
  countByPriority(fromDate?: Date, toDate?: Date): Promise<Record<string, number>>;
}
