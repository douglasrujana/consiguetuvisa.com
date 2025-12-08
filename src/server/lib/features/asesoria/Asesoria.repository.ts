// src/server/lib/features/asesoria/Asesoria.repository.ts

/**
 * Adaptador de Salida para Asesoría
 * Implementación de Supabase/Prisma como Repositorio de Asesoría
 * Aquí definimos el repositorio de Asesoría que interactúa con 
 * la base de  datos
 * usando Prisma como ORM. Este repositorio implementa el contrato definido
 * en IAsesoriaRepository, asegurando una separación clara entre la lógica
 * de negocio y la capa de datos.
 */
 
import type { Appointment as PrismaAppointment } from '@prisma/client'; 
import { Prisma } from '@prisma/client';  // Needed as value for error checking
import { prisma } from '../../../db/prisma-singleton'; 
import type { AgendarCitaInputDTO } from './Asesoria.dto';
// El contrato PURE que la capa de Negocio conoce
import type { IAsesoriaRepository } from './Asesoria.port'; 
// La Entidad de Dominio Pura
import type { Appointment } from './Appointment.entity'; 

// ----------------------------------------------------------------------
// 1. FUNCIÓN DE MAPEO (CRÍTICO: Desacoplamiento)
// ----------------------------------------------------------------------

/**
 * Mapea el objeto generado por Prisma (PrismaAppointment) a nuestra Entidad Pura de Dominio (Appointment).
 * Esta función es el GUARDIÁN que asegura que la Lógica de Negocio NUNCA ve tipos de Prisma.
 * @param prismaAppointment El objeto devuelto por el ORM.
 * @returns La Entidad de Dominio Pura.
 */
function mapToDomain(prismaAppointment: PrismaAppointment): Appointment {
  return {
    id: prismaAppointment.id,
    userId: prismaAppointment.userId,
    serviceType: prismaAppointment.serviceType as Appointment['serviceType'], // Casting de tipos del enum
    scheduledDate: prismaAppointment.scheduledDate,
    status: prismaAppointment.status as Appointment['status'], // Casting de tipos del enum
    notes: prismaAppointment.notes,
    createdAt: prismaAppointment.createdAt,
  };
}

// ----------------------------------------------------------------------
// 2. IMPLEMENTACIÓN DEL ADAPTADOR (Prisma/Supabase)
// ----------------------------------------------------------------------

export class AsesoriaRepository implements IAsesoriaRepository {

  /**
   * Implementación de la creación de citas.
   * @param data DTO de entrada.
   * @returns Entidad Pura (Appointment).
   */
  async createAppointment(data: AgendarCitaInputDTO): Promise<Appointment> {
    try {
      // 1. Convertir la fecha de string ISO a objeto Date (si viene de GraphQL)
      const scheduledDate = new Date(data.scheduledDate);

      // 2. Insertar en la BD usando Prisma
      const newAppointment = await prisma.appointment.create({
        data: {
          serviceType: data.serviceType,
          scheduledDate: scheduledDate,
          notes: data.notes,
          userId: data.userId,
          // Status por defecto 'PENDING' está en schema.prisma
        },
      });

      // 3. Mapear el tipo de Prisma a nuestra Entidad Pura y devolverlo
      return mapToDomain(newAppointment);

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Manejo específico de errores de la DB (ej: llave foránea no encontrada)
        console.error("Prisma Error:", error.message);
        throw new Error(`Error en la base de datos: ${error.meta?.target || 'Desconocido'}`);
      }
      throw new Error("Error desconocido al agendar la cita.");
    }
  }

  /**
   * Implementación de la búsqueda de citas por usuario.
   * @param userId ID del usuario.
   * @returns Array de Entidades Puras (Appointment[]).
   */
  async findUserAppointments(userId: string): Promise<Appointment[]> {
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      orderBy: { scheduledDate: 'asc' },
    });

    // Mapear cada resultado de Prisma a nuestra Entidad Pura
    return appointments.map(mapToDomain);
  }
}