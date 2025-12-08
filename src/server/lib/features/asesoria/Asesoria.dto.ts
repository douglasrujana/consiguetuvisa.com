// src/server/lib/features/asesoria/Asesoria.dto.ts

/**
 * Contratos de Datos DTOs
 * Data Transfer Objects (DTOs) para la funcionalidad de Asesoría.
 * Aquí definimos los tipos de datos que se utilizan para transferir
 * información entre las diferentes capas de la aplicación, asegurando
 * una separación clara entre la lógica de negocio y la capa de datos.
 */

// src/server/lib/features/asesoria/Asesoria.dto.ts

// src/server/lib/features/asesoria/Asesoria.dto.ts

import { z } from 'zod';
import { Appointment } from './Appointment.entity'; // <-- Entidad Pura

// =========================================================================
// 1. DTO DE ENTRADA (INPUT DTO) - Usa Zod para la validación
// =========================================================================

/**
 * Esquema de Zod: Valida la data que viene del cliente (la capa externa).
 * Esta es la ÚNICA validación de formato/tipo que Zod debe realizar.
 */
export const AgendarCitaInputSchema = z.object({
  userId: z.string().uuid({ message: 'El ID de usuario debe ser un UUID válido.' }), 
  serviceType: z.enum(['Visa_Turista', 'Visa_Estudiante', 'Visa_Trabajo', 'Otro']),
  scheduledDate: z.string().datetime({ message: 'La fecha debe ser un formato ISO 8601 válido.' }),
  notes: z.string().max(500).optional().nullable(), // Nullable añadido para DB
});

/**
 * Tipo inferido de la entrada.
 */
export type AgendarCitaInputDTO = z.infer<typeof AgendarCitaInputSchema>;

// =========================================================================
// 2. DTO DE SALIDA (OUTPUT DTO) - Alias de la Entidad Pura
// =========================================================================

/**
 * Contrato de Salida: Es simplemente un alias de la Entidad de Dominio Pura.
 * Esto mantiene la intención DTO para el flujo de datos.
 */
export type CitaOutputDTO = Appointment;