// src/server/lib/features/solicitud/Solicitud.dto.ts

import { z } from 'zod';

/**
 * DTOs para la feature de Solicitudes.
 * Validación con Zod para entrada de datos.
 */

// ============================================
// CREAR SOLICITUD (Formulario público)
// ============================================

export const CreateSolicitudSchema = z.object({
  // Tipo de visa
  visaType: z.enum(['USA_TURISMO', 'CANADA_VISITANTE', 'SCHENGEN', 'UK', 'MEXICO', 'OTRO']),
  destinationCountry: z.string().min(2, 'País de destino requerido'),
  
  // Datos del solicitante
  fullName: z.string().min(3, 'Nombre completo requerido'),
  birthDate: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  
  // Contacto
  phone: z.string().min(7, 'Teléfono requerido'),
  email: z.string().email('Email inválido'),
  city: z.string().optional().nullable(),
  
  // Viaje
  travelPurpose: z.string().optional().nullable(),
  travelDate: z.string().optional().nullable(),
  returnDate: z.string().optional().nullable(),
  
  // Historial
  hasVisaHistory: z.boolean().default(false),
  visaHistoryNotes: z.string().optional().nullable(),
  hasDenials: z.boolean().default(false),
  denialNotes: z.string().optional().nullable(),
  
  // Metadata
  source: z.string().optional().nullable(),
});

export type CreateSolicitudDTO = z.infer<typeof CreateSolicitudSchema>;

// ============================================
// ACTUALIZAR SOLICITUD (Admin)
// ============================================

export const UpdateSolicitudSchema = z.object({
  status: z.enum([
    'NUEVA', 'EN_REVISION', 'DOCUMENTOS', 'FORMULARIO',
    'CITA_AGENDADA', 'ENTREVISTA', 'APROBADA', 'RECHAZADA', 'CANCELADA'
  ]).optional(),
  currentStep: z.number().min(1).max(10).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedAgentId: z.string().optional().nullable(),
  appointmentDate: z.string().optional().nullable(),
  interviewDate: z.string().optional().nullable(),
  bitrixLeadId: z.string().optional().nullable(),
  bitrixDealId: z.string().optional().nullable(),
});

export type UpdateSolicitudDTO = z.infer<typeof UpdateSolicitudSchema>;

// ============================================
// FILTROS DE BÚSQUEDA
// ============================================

export const SolicitudFiltersSchema = z.object({
  status: z.string().optional(),
  visaType: z.string().optional(),
  priority: z.string().optional(),
  assignedAgentId: z.string().optional(),
  search: z.string().optional(), // Busca en nombre, email, teléfono
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

export type SolicitudFiltersDTO = z.infer<typeof SolicitudFiltersSchema>;

// ============================================
// CREAR NOTA
// ============================================

export const CreateNoteSchema = z.object({
  solicitudId: z.string().uuid(),
  content: z.string().min(1, 'Contenido requerido'),
  type: z.enum(['GENERAL', 'INTERNO', 'CLIENTE', 'SISTEMA']).default('GENERAL'),
  isInternal: z.boolean().default(false),
});

export type CreateNoteDTO = z.infer<typeof CreateNoteSchema>;
