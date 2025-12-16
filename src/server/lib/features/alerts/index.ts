// src/server/lib/features/alerts/index.ts

/**
 * FEATURE ALERTS - Exports
 * Sistema de alertas y notificaciones.
 */

// Entities
export {
  AlertType,
  AlertPriority,
  type Alert,
  type AlertDomain,
  type CreateAlertInput,
  type UpdateAlertInput,
  type AlertFilters,
  type NotificationResult,
} from './Alert.entity';

// Ports
export { type IAlertRepository } from './Alert.port';
export {
  type INotificationChannel,
  type INotificationService,
  type NotificationChannelConfig,
  type NotificationOptions,
} from './NotificationChannel.port';

// Repository
export { AlertRepository } from './Alert.repository';

// Service
export { AlertService } from './Alert.service';

// Adapters
export { EmailNotificationAdapter } from './adapters/EmailNotification.adapter';

// GraphQL
export { alertTypeDefs, alertResolvers } from './Alert.graphql';
