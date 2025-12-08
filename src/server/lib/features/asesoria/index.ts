// src/server/lib/features/asesoria/index.ts
// Barrel export - API pública de la feature Asesoria

export { AsesoriaService } from './Asesoria.service';
export { AsesoriaRepository } from './Asesoria.repository';
export { asesoriaTypeDefs, asesoriaResolvers } from './Asesoria.graphql';
export type { IAsesoriaRepository } from './Asesoria.port';
export type { AgendarCitaInputDTO, CitaOutputDTO } from './Asesoria.dto';
export type { Appointment } from './Appointment.entity';
