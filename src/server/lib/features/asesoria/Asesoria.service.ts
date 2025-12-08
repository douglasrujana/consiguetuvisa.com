/**
 * El Caso de Uso/Servicio de Negocio de Asesoría
 * Lógica de Negocio de Asesoría
 * Aquí definimos el servicio de Asesoría que contiene la lógica
 * de negocio relacionada con la gestión de citas de asesoría.
 */

// Usamos el error base de Dominio para manejar errores específicos de negocio
import { BusinessRuleError } from '../../core/error/Domain.error';

// src/server/lib/features/asesoria/Asesoria.service.ts
import { IAsesoriaRepository } from './Asesoria.port'; // <-- El servicio SOLO ve el Puerto/Contrato

export class AsesoriaService {
  // Ya no tiene que ver el archivo Asesoria.repository.ts
  // <-- Inyectamos el Puerto/
    private repository: IAsesoriaRepository; Contrato
    
    private checkBusinessHours(date: Date): void {
        // ...
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            // Si la lógica falla, lanzamos nuestro error de Dominio.
            throw new BusinessRuleError('No se pueden agendar citas los fines de semana.');
        }
    }
}