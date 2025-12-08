// src/server/lib/features/solicitud/Solicitud.service.ts

/**
 * SERVICIO DE SOLICITUDES
 * Lógica de negocio. NO conoce Prisma ni Bitrix.
 * Solo trabaja con los puertos.
 */

import type { ISolicitudRepository, ICRMProvider, INoteRepository } from './Solicitud.port';
import type { Solicitud, SolicitudSummary, DashboardStats, SolicitudNote } from './Solicitud.entity';
import type { CreateSolicitudDTO, UpdateSolicitudDTO, SolicitudFiltersDTO, CreateNoteDTO } from './Solicitud.dto';
import { BusinessRuleError, NotFoundError } from '../../core/error/Domain.error';

export class SolicitudService {
  constructor(
    private readonly repository: ISolicitudRepository,
    private readonly crmProvider?: ICRMProvider,
    private readonly noteRepository?: INoteRepository,
  ) {}

  /**
   * Crea una nueva solicitud y la sincroniza con el CRM.
   */
  async createSolicitud(data: CreateSolicitudDTO, userId: string): Promise<Solicitud> {
    // Crear en base de datos local
    const solicitud = await this.repository.create(data, userId);
    
    // Registrar en historial
    await this.repository.addStatusHistory(
      solicitud.id,
      null,
      'NUEVA',
      userId,
      'Solicitud creada'
    );
    
    // Sincronizar con CRM (si está configurado)
    if (this.crmProvider) {
      try {
        const { leadId } = await this.crmProvider.createLead(solicitud);
        await this.repository.update(solicitud.id, { bitrixLeadId: leadId } as UpdateSolicitudDTO);
        solicitud.bitrixLeadId = leadId;
      } catch (error) {
        // Log error pero no fallar - el CRM es secundario
        console.error('Error sincronizando con CRM:', error);
      }
    }
    
    return solicitud;
  }

  /**
   * Obtiene una solicitud por ID.
   */
  async getSolicitudById(id: string): Promise<Solicitud> {
    const solicitud = await this.repository.findById(id);
    if (!solicitud) {
      throw new NotFoundError('Solicitud no encontrada');
    }
    return solicitud;
  }

  /**
   * Obtiene las solicitudes de un usuario.
   */
  async getSolicitudesByUser(userId: string): Promise<Solicitud[]> {
    return this.repository.findByUserId(userId);
  }

  /**
   * Lista solicitudes con filtros (para admin).
   */
  async listSolicitudes(filters: SolicitudFiltersDTO): Promise<{ data: SolicitudSummary[]; total: number }> {
    return this.repository.findAll(filters);
  }

  /**
   * Actualiza una solicitud.
   */
  async updateSolicitud(
    id: string, 
    data: UpdateSolicitudDTO, 
    updatedBy?: string
  ): Promise<Solicitud> {
    const current = await this.getSolicitudById(id);
    
    // Si cambia el estado, registrar en historial
    if (data.status && data.status !== current.status) {
      await this.repository.addStatusHistory(
        id,
        current.status,
        data.status,
        updatedBy,
        `Estado cambiado de ${current.status} a ${data.status}`
      );
      
      // Sincronizar con CRM
      if (this.crmProvider && current.bitrixDealId) {
        try {
          await this.crmProvider.updateDealStatus(current.bitrixDealId, data.status);
        } catch (error) {
          console.error('Error actualizando CRM:', error);
        }
      }
    }
    
    return this.repository.update(id, data);
  }

  /**
   * Avanza al siguiente paso del proceso.
   */
  async advanceStep(id: string, updatedBy?: string): Promise<Solicitud> {
    const solicitud = await this.getSolicitudById(id);
    
    if (solicitud.currentStep >= solicitud.totalSteps) {
      throw new BusinessRuleError('La solicitud ya está en el último paso');
    }
    
    const newStep = solicitud.currentStep + 1;
    const newStatus = this.getStatusForStep(newStep);
    
    return this.updateSolicitud(id, { 
      currentStep: newStep,
      status: newStatus 
    }, updatedBy);
  }

  /**
   * Obtiene estadísticas del dashboard.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.repository.getStats();
  }

  /**
   * Obtiene estadísticas de un usuario.
   */
  async getUserStats(userId: string): Promise<DashboardStats> {
    return this.repository.getStatsByUser(userId);
  }

  /**
   * Agrega una nota a una solicitud.
   */
  async addNote(data: CreateNoteDTO, createdById: string): Promise<SolicitudNote> {
    if (!this.noteRepository) {
      throw new BusinessRuleError('Repositorio de notas no configurado');
    }
    return this.noteRepository.create(data, createdById);
  }

  /**
   * Obtiene las notas de una solicitud.
   */
  async getNotes(solicitudId: string, includeInternal = false): Promise<SolicitudNote[]> {
    if (!this.noteRepository) {
      return [];
    }
    return this.noteRepository.findBySolicitudId(solicitudId, includeInternal);
  }

  /**
   * Obtiene el historial de estados.
   */
  async getStatusHistory(solicitudId: string) {
    return this.repository.getStatusHistory(solicitudId);
  }

  /**
   * Mapea el paso actual al estado correspondiente.
   */
  private getStatusForStep(step: number): UpdateSolicitudDTO['status'] {
    const statusMap: Record<number, UpdateSolicitudDTO['status']> = {
      1: 'NUEVA',
      2: 'EN_REVISION',
      3: 'DOCUMENTOS',
      4: 'FORMULARIO',
      5: 'CITA_AGENDADA',
    };
    return statusMap[step] || 'EN_REVISION';
  }
}
