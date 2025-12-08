// src/server/lib/features/solicitud/Solicitud.port.ts

/**
 * PUERTOS DE SOLICITUD
 * Contratos que deben cumplir los adaptadores.
 * Anti vendor-locking: la lógica de negocio no conoce Prisma ni Bitrix.
 */

import type { 
  Solicitud, 
  SolicitudSummary, 
  SolicitudDocument,
  SolicitudNote,
  StatusHistory,
  DashboardStats 
} from './Solicitud.entity';
import type { 
  CreateSolicitudDTO, 
  UpdateSolicitudDTO, 
  SolicitudFiltersDTO,
  CreateNoteDTO 
} from './Solicitud.dto';

/**
 * Puerto del repositorio de solicitudes.
 * Implementado por: PrismaSolicitudRepository (SQLite/PostgreSQL)
 */
export interface ISolicitudRepository {
  // CRUD
  create(data: CreateSolicitudDTO, userId: string): Promise<Solicitud>;
  findById(id: string): Promise<Solicitud | null>;
  findByUserId(userId: string): Promise<Solicitud[]>;
  update(id: string, data: UpdateSolicitudDTO): Promise<Solicitud>;
  delete(id: string): Promise<boolean>;
  
  // Listados
  findAll(filters: SolicitudFiltersDTO): Promise<{ data: SolicitudSummary[]; total: number }>;
  
  // Estadísticas
  getStats(): Promise<DashboardStats>;
  getStatsByUser(userId: string): Promise<DashboardStats>;
  
  // Historial
  addStatusHistory(solicitudId: string, fromStatus: string | null, toStatus: string, changedBy?: string, reason?: string): Promise<StatusHistory>;
  getStatusHistory(solicitudId: string): Promise<StatusHistory[]>;
}

/**
 * Puerto del repositorio de documentos.
 */
export interface IDocumentRepository {
  create(data: Partial<SolicitudDocument>): Promise<SolicitudDocument>;
  findBySolicitudId(solicitudId: string): Promise<SolicitudDocument[]>;
  findByUserId(userId: string): Promise<SolicitudDocument[]>;
  updateStatus(id: string, status: string, reviewNotes?: string, reviewedBy?: string): Promise<SolicitudDocument>;
  delete(id: string): Promise<boolean>;
}

/**
 * Puerto del repositorio de notas.
 */
export interface INoteRepository {
  create(data: CreateNoteDTO, createdById: string): Promise<SolicitudNote>;
  findBySolicitudId(solicitudId: string, includeInternal?: boolean): Promise<SolicitudNote[]>;
  delete(id: string): Promise<boolean>;
}

/**
 * Puerto del CRM externo (Bitrix24, HubSpot, etc.)
 * Anti vendor-locking: si cambias de CRM, solo creas otro adaptador.
 */
export interface ICRMProvider {
  /**
   * Crea un lead en el CRM.
   */
  createLead(solicitud: Solicitud): Promise<{ leadId: string }>;
  
  /**
   * Actualiza un lead existente.
   */
  updateLead(leadId: string, data: Partial<Solicitud>): Promise<boolean>;
  
  /**
   * Convierte un lead a deal/oportunidad.
   */
  convertToDeal(leadId: string): Promise<{ dealId: string }>;
  
  /**
   * Actualiza el estado del deal.
   */
  updateDealStatus(dealId: string, status: string): Promise<boolean>;
  
  /**
   * Sincroniza datos desde el CRM.
   */
  syncFromCRM(leadId: string): Promise<Partial<Solicitud> | null>;
}
