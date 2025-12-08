// src/server/lib/features/asesoria/Asesoria.port.ts

// Aquí solo importamos los contratos puros (DTOs)
import { AgendarCitaInputDTO, CitaOutputDTO } from './Asesoria.dto';

/**
 * 💡 PUERTO DE ASESORIA: Define el contrato que DEBE cumplir cualquier base de datos.
 * Esta interfaz es la ÚNICA que el Servicio/Caso de Uso (Lógica de Negocio) conoce.
 * NO debe importar NADA de Prisma o Supabase.
 */
export interface IAsesoriaRepository {
  createAppointment(data: AgendarCitaInputDTO): Promise<CitaOutputDTO>;
  findUserAppointments(userId: string): Promise<CitaOutputDTO[]>;
  // ... cualquier otra operación CRUD
}