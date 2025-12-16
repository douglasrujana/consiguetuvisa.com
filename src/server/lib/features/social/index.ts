// src/server/lib/features/social/index.ts

/**
 * FEATURE: SOCIAL LISTENING
 * Monitoreo de menciones de marca en redes sociales.
 */

// Entities
export {
  SentimentType,
  type SocialPlatform,
  type SocialMention,
  type CreateSocialMentionInput,
  type UpdateSocialMentionInput,
  type SocialMentionFilters,
  type SentimentClassificationResult,
  type SuggestedResponseResult,
} from './SocialMention.entity';

// Ports
export type { ISocialMentionRepository } from './SocialMention.port';

// Repository
export { SocialMentionRepository } from './SocialMention.repository';

// Services
export { SentimentClassifier } from './SentimentClassifier';
export {
  SocialListenerService,
  type RawSocialMention,
  type ProcessedMention,
  type SocialListenerConfig,
} from './SocialListener.service';
export { SocialSyncService, type SocialSyncConfig, type SyncResult } from './SocialSync.service';

// Adapters
export { TwitterAdapter, type TwitterConfig } from './adapters/TwitterAdapter';
export { FacebookAdapter, type FacebookConfig } from './adapters/FacebookAdapter';

// GraphQL
export { socialTypeDefs, socialResolvers } from './Social.graphql';
