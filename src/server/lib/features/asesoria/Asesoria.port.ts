// src/server/lib/features/asesoria/Asesoria.port.ts

// Aquí solo importamos los contratos puros (DTOs)
import { AgendarCitaInputDTO, CitaOutputDTO } from './Asesoria.dto';

/**
 * 💡 PUERTO DE ASESORIA: Define el contrato que DEBE cumplir cualquier base de datos.
 * Esta interfaz es la ÚNICA que el Servicio/Caso de Uso (Lógica de Negocio) conoce.
 * NO debe importar NADA de Prisma o Supabase.
 */

import { AgendarCitaInputDTO } from './Asesoria.dto';
import { Appointment } from './Appointment.entity'; // <-- Importamos la Entidad Pura

/**
 * PUERTO DE ASESORIA: Contrato que DEBE cumplir cualquier base de datos.
 * Utiliza la Entidad Pura para la salida.
 */
export interface IAsesoriaRepository {
  // El repositorio recibe un DTO y devuelve una Entidad Pura
  createAppointment(data: AgendarCitaInputDTO): Promise<Appointment>; 
  findUserAppointments(userId: string): Promise<Appointment[]>;
}