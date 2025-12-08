// src/server/lib/features/asesoria/Asesoria.dto.ts

/**
 * Contratos de Datos DTOs
 * Data Transfer Objects (DTOs) para la funcionalidad de Asesoría.
 * Aquí definimos los tipos de datos que se utilizan para transferir
 * información entre las diferentes capas de la aplicación, asegurando
 * una separación clara entre la lógica de negocio y la capa de datos.
 */

import { z } from 'zod';

// =========================================================================
// 1. DTO DE ENTRADA (INPUT DTO)
// =========================================================================
// Este esquema valida los datos que ENTRAN a la capa de Lógica de Negocio
// (por ejemplo, los datos que vienen de una Mutation de GraphQL).

/**
 * Esquema de Zod para la entrada de agendar una nueva cita.
 */
export const AgendarCitaInputSchema = z.object({
  // Identificador del usuario que agenda (viene del contexto de Auth, no del body)
  userId: z.string().uuid({ message: 'El ID de usuario debe ser un UUID válido.' }), 
  
  // Tipo de servicio/visa a consultar
  serviceType: z.enum(['Visa_Turista', 'Visa_Estudiante', 'Visa_Trabajo', 'Otro']),

  // Fecha y hora agendada (se valida el formato ISO 8601)
  scheduledDate: z.string().datetime({ message: 'La fecha agendada debe ser un formato ISO 8601 válido.' }),
  
  // Notas opcionales del usuario
  notes: z.string().max(500, 'Las notas no deben exceder los 500 caracteres.').optional(),
});

/**
 * Tipo inferido de Zod para la entrada de agendar una cita.
 * Este es el CONTRATO que el Servicio usará para recibir datos.
 */
export type AgendarCitaInputDTO = z.infer<typeof AgendarCitaInputSchema>;


// =========================================================================
// 2. DTO DE SALIDA (OUTPUT DTO)
// =========================================================================
// Este esquema define la estructura de datos que SALE de la capa de Dominio
// (por ejemplo, lo que devuelve el Repositorio al Servicio, y el Servicio al Resolver).

/**
 * Esquema de Zod para la salida de la información de una cita.
 */
export const CitaOutputSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  serviceType: z.enum(['Visa_Turista', 'Visa_Estudiante', 'Visa_Trabajo', 'Otro']),
  scheduledDate: z.date(), // Lo convertimos a objeto Date para la lógica interna
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  createdAt: z.date(), // Fecha de creación
});

/**
 * Tipo inferido de Zod para la salida de una cita.
 * Este es el CONTRATO que el Repositorio debe cumplir.
 */
export type CitaOutputDTO = z.infer<typeof CitaOutputSchema>;