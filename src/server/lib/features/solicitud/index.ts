// src/server/lib/features/solicitud/index.ts
// Barrel export - API pública de la feature Solicitud

export { SolicitudService } from './Solicitud.service';
export { SolicitudRepository } from './Solicitud.repository';

export type { 
  ISolicitudRepository, 
  IDocumentRepository, 
  INoteRepository,
  ICRMProvider 
} from './Solicitud.port';

export type { 
  CreateSolicitudDTO, 
  UpdateSolicitudDTO, 
  SolicitudFiltersDTO,
  CreateNoteDTO 
} from './Solicitud.dto';

export type { 
  Solicitud, 
  SolicitudSummary, 
  SolicitudDocument,
  SolicitudNote,
  StatusHistory,
  DashboardStats,
  VisaType,
  SolicitudStatus,
  Priority 
} from './Solicitud.entity';
