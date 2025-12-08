// src/server/lib/features/solicitud/Solicitud.entity.ts

/**
 * ENTIDADES DE DOMINIO PURAS - SOLICITUD
 * NO importan NADA de Prisma o proveedores externos.
 */

export type VisaType = 
  | 'USA_TURISMO' 
  | 'CANADA_VISITANTE' 
  | 'SCHENGEN' 
  | 'UK' 
  | 'MEXICO' 
  | 'OTRO';

export type SolicitudStatus = 
  | 'NUEVA'
  | 'EN_REVISION'
  | 'DOCUMENTOS'
  | 'FORMULARIO'
  | 'CITA_AGENDADA'
  | 'ENTREVISTA'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'CANCELADA';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type DocumentStatus = 'PENDIENTE' | 'RECIBIDO' | 'APROBADO' | 'RECHAZADO';

export type DocumentType = 
  | 'PASAPORTE'
  | 'FOTO'
  | 'COMPROBANTE_INGRESOS'
  | 'CARTA_TRABAJO'
  | 'DS160'
  | 'OTRO';

/**
 * Solicitud de visa - Entidad principal del negocio.
 */
export interface Solicitud {
  id: string;
  userId: string;
  
  // Tipo de visa
  visaType: VisaType;
  destinationCountry: string;
  
  // Estado
  status: SolicitudStatus;
  currentStep: number;
  totalSteps: number;
  
  // Datos del solicitante
  fullName: string;
  birthDate?: Date | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: Date | null;
  
  // Contacto
  phone: string;
  email: string;
  city?: string | null;
  
  // Viaje
  travelPurpose?: string | null;
  travelDate?: Date | null;
  returnDate?: Date | null;
  
  // Historial
  hasVisaHistory: boolean;
  visaHistoryNotes?: string | null;
  hasDenials: boolean;
  denialNotes?: string | null;
  
  // Integración
  bitrixLeadId?: string | null;
  bitrixDealId?: string | null;
  
  // Fechas
  appointmentDate?: Date | null;
  interviewDate?: Date | null;
  
  // Metadata
  source?: string | null;
  assignedAgentId?: string | null;
  priority: Priority;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Documento adjunto a una solicitud.
 */
export interface SolicitudDocument {
  id: string;
  solicitudId?: string | null;
  userId: string;
  name: string;
  type: DocumentType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  status: DocumentStatus;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Historial de cambios de estado.
 */
export interface StatusHistory {
  id: string;
  solicitudId: string;
  fromStatus?: string | null;
  toStatus: string;
  changedBy?: string | null;
  reason?: string | null;
  createdAt: Date;
}

/**
 * Nota/comentario en una solicitud.
 */
export interface SolicitudNote {
  id: string;
  solicitudId?: string | null;
  userId?: string | null;
  content: string;
  type: 'GENERAL' | 'INTERNO' | 'CLIENTE' | 'SISTEMA';
  isInternal: boolean;
  createdById: string;
  createdAt: Date;
}

/**
 * Resumen de solicitud para listados.
 */
export interface SolicitudSummary {
  id: string;
  fullName: string;
  visaType: VisaType;
  destinationCountry: string;
  status: SolicitudStatus;
  currentStep: number;
  totalSteps: number;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Estadísticas del dashboard.
 */
export interface DashboardStats {
  totalSolicitudes: number;
  nuevas: number;
  enProceso: number;
  aprobadas: number;
  rechazadas: number;
  citasPendientes: number;
}
