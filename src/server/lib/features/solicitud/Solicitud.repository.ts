// src/server/lib/features/solicitud/Solicitud.repository.ts

/**
 * ADAPTADOR DE PRISMA PARA SOLICITUDES
 * Implementación del puerto ISolicitudRepository usando Prisma.
 */

import { prisma } from '../../../db/prisma-singleton';
import type { ISolicitudRepository } from './Solicitud.port';
import type { 
  Solicitud, 
  SolicitudSummary, 
  StatusHistory,
  DashboardStats 
} from './Solicitud.entity';
import type { 
  CreateSolicitudDTO, 
  UpdateSolicitudDTO, 
  SolicitudFiltersDTO 
} from './Solicitud.dto';

/**
 * Mapea un registro de Prisma a la entidad de dominio.
 */
function mapToEntity(record: any): Solicitud {
  return {
    id: record.id,
    userId: record.userId,
    visaType: record.visaType,
    destinationCountry: record.destinationCountry,
    status: record.status,
    currentStep: record.currentStep,
    totalSteps: record.totalSteps,
    fullName: record.fullName,
    birthDate: record.birthDate,
    nationality: record.nationality,
    passportNumber: record.passportNumber,
    passportExpiry: record.passportExpiry,
    phone: record.phone,
    email: record.email,
    city: record.city,
    travelPurpose: record.travelPurpose,
    travelDate: record.travelDate,
    returnDate: record.returnDate,
    hasVisaHistory: record.hasVisaHistory,
    visaHistoryNotes: record.visaHistoryNotes,
    hasDenials: record.hasDenials,
    denialNotes: record.denialNotes,
    bitrixLeadId: record.bitrixLeadId,
    bitrixDealId: record.bitrixDealId,
    appointmentDate: record.appointmentDate,
    interviewDate: record.interviewDate,
    source: record.source,
    assignedAgentId: record.assignedAgentId,
    priority: record.priority,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapToSummary(record: any): SolicitudSummary {
  return {
    id: record.id,
    fullName: record.fullName,
    visaType: record.visaType,
    destinationCountry: record.destinationCountry,
    status: record.status,
    currentStep: record.currentStep,
    totalSteps: record.totalSteps,
    priority: record.priority,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class SolicitudRepository implements ISolicitudRepository {
  
  async create(data: CreateSolicitudDTO, userId: string): Promise<Solicitud> {
    const record = await prisma.solicitud.create({
      data: {
        userId,
        visaType: data.visaType,
        destinationCountry: data.destinationCountry,
        fullName: data.fullName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        nationality: data.nationality,
        passportNumber: data.passportNumber,
        passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : null,
        phone: data.phone,
        email: data.email,
        city: data.city,
        travelPurpose: data.travelPurpose,
        travelDate: data.travelDate ? new Date(data.travelDate) : null,
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        hasVisaHistory: data.hasVisaHistory,
        visaHistoryNotes: data.visaHistoryNotes,
        hasDenials: data.hasDenials,
        denialNotes: data.denialNotes,
        source: data.source,
      },
    });
    return mapToEntity(record);
  }

  async findById(id: string): Promise<Solicitud | null> {
    const record = await prisma.solicitud.findUnique({ where: { id } });
    return record ? mapToEntity(record) : null;
  }

  async findByUserId(userId: string): Promise<Solicitud[]> {
    const records = await prisma.solicitud.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(mapToEntity);
  }

  async update(id: string, data: UpdateSolicitudDTO): Promise<Solicitud> {
    const record = await prisma.solicitud.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.currentStep && { currentStep: data.currentStep }),
        ...(data.priority && { priority: data.priority }),
        ...(data.assignedAgentId !== undefined && { assignedAgentId: data.assignedAgentId }),
        ...(data.appointmentDate !== undefined && { 
          appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : null 
        }),
        ...(data.interviewDate !== undefined && { 
          interviewDate: data.interviewDate ? new Date(data.interviewDate) : null 
        }),
        ...(data.bitrixLeadId !== undefined && { bitrixLeadId: data.bitrixLeadId }),
        ...(data.bitrixDealId !== undefined && { bitrixDealId: data.bitrixDealId }),
      },
    });
    return mapToEntity(record);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.solicitud.delete({ where: { id } });
    return true;
  }

  async findAll(filters: SolicitudFiltersDTO): Promise<{ data: SolicitudSummary[]; total: number }> {
    const where: any = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.visaType) where.visaType = filters.visaType;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;
    
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [records, total] = await Promise.all([
      prisma.solicitud.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.solicitud.count({ where }),
    ]);

    return {
      data: records.map(mapToSummary),
      total,
    };
  }

  async getStats(): Promise<DashboardStats> {
    const [total, nuevas, enProceso, aprobadas, rechazadas, citasPendientes] = await Promise.all([
      prisma.solicitud.count(),
      prisma.solicitud.count({ where: { status: 'NUEVA' } }),
      prisma.solicitud.count({ where: { status: { in: ['EN_REVISION', 'DOCUMENTOS', 'FORMULARIO', 'CITA_AGENDADA', 'ENTREVISTA'] } } }),
      prisma.solicitud.count({ where: { status: 'APROBADA' } }),
      prisma.solicitud.count({ where: { status: 'RECHAZADA' } }),
      prisma.solicitud.count({ where: { status: 'CITA_AGENDADA', appointmentDate: { not: null } } }),
    ]);

    return { totalSolicitudes: total, nuevas, enProceso, aprobadas, rechazadas, citasPendientes };
  }

  async getStatsByUser(userId: string): Promise<DashboardStats> {
    const where = { userId };
    const [total, nuevas, enProceso, aprobadas, rechazadas, citasPendientes] = await Promise.all([
      prisma.solicitud.count({ where }),
      prisma.solicitud.count({ where: { ...where, status: 'NUEVA' } }),
      prisma.solicitud.count({ where: { ...where, status: { in: ['EN_REVISION', 'DOCUMENTOS', 'FORMULARIO', 'CITA_AGENDADA', 'ENTREVISTA'] } } }),
      prisma.solicitud.count({ where: { ...where, status: 'APROBADA' } }),
      prisma.solicitud.count({ where: { ...where, status: 'RECHAZADA' } }),
      prisma.solicitud.count({ where: { ...where, status: 'CITA_AGENDADA', appointmentDate: { not: null } } }),
    ]);

    return { totalSolicitudes: total, nuevas, enProceso, aprobadas, rechazadas, citasPendientes };
  }

  async addStatusHistory(
    solicitudId: string, 
    fromStatus: string | null, 
    toStatus: string, 
    changedBy?: string, 
    reason?: string
  ): Promise<StatusHistory> {
    const record = await prisma.statusHistory.create({
      data: { solicitudId, fromStatus, toStatus, changedBy, reason },
    });
    return {
      id: record.id,
      solicitudId: record.solicitudId,
      fromStatus: record.fromStatus,
      toStatus: record.toStatus,
      changedBy: record.changedBy,
      reason: record.reason,
      createdAt: record.createdAt,
    };
  }

  async getStatusHistory(solicitudId: string): Promise<StatusHistory[]> {
    const records = await prisma.statusHistory.findMany({
      where: { solicitudId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => ({
      id: r.id,
      solicitudId: r.solicitudId,
      fromStatus: r.fromStatus,
      toStatus: r.toStatus,
      changedBy: r.changedBy,
      reason: r.reason,
      createdAt: r.createdAt,
    }));
  }
}
