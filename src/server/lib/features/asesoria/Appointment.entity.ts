// src/server/lib/features/asesoria/Appointment.entity.ts

/**
 * ENTIDAD DE DOMINIO PURA
 * La Entidad canónica de la Cita de Asesoría.
 * Representa el objeto central de nuestro negocio.
 * NO debe importar NADA de Prisma, Zod, o GraphQL.
 */
export interface Appointment {
  id: string;
  userId: string;
  serviceType: 'Visa_Turista' | 'Visa_Estudiante' | 'Visa_Trabajo' | 'Otro';
  scheduledDate: Date; // Tipo nativo de JavaScript
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string | null;
  createdAt: Date;
}

// Opcional: una clase para manejar lógica de la entidad (ej: appointment.isValid())
// export class AppointmentImpl implements Appointment { ... }