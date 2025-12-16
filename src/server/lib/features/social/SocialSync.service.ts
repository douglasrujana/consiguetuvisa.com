// src/server/lib/features/social/SocialSync.service.ts

/**
 * SERVICIO DE SINCRONIZACIÓN SOCIAL
 * Orquesta la extracción de menciones desde todas las plataformas configuradas.
 */

import type { PrismaClient } from '@prisma/client';
import { TwitterAdapter } from './adapters/TwitterAdapter';
import { FacebookAdapter } from './adapters/FacebookAdapter';
import { SocialMentionRepository } from './SocialMention.repository';
import { SentimentClassifier } from './SentimentClassifier';
import { SentimentType } from './SocialMention.entity';
import type { RawSocialMention } from './SocialListener.service';
import type { AIService } from '@core/ai';

export interface SocialSyncConfig {
  twitter?: {
    enabled: boolean;
    bearerToken: string;
    searchQuery: string;
  };
  facebook?: {
    enabled: boolean;
    accessToken: string;
    pageId: string;
    instagramAccountId?: string;
  };
}

export interface SyncResult {
  platform: string;
  fetched: number;
  new: number;
  errors: string[];
}

export class SocialSyncService {
  private prisma: PrismaClient;
  private aiService?: AIService;

  constructor(prisma: PrismaClient, aiService?: AIService) {
    this.prisma = prisma;
    this.aiService = aiService;
  }

  /**
   * Obtiene la configuración de redes sociales desde SystemConfig
   */
  async getConfig(): Promise<SocialSyncConfig> {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'social.',
        },
      },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    return {
      twitter: {
        enabled: configMap['social.twitter.enabled'] === 'true',
        bearerToken: configMap['social.twitter.bearerToken'] || '',
        searchQuery: configMap['social.twitter.searchQuery'] || '@ConsigueTuVisa',
      },
      facebook: {
        enabled: configMap['social.facebook.enabled'] === 'true',
        accessToken: configMap['social.facebook.accessToken'] || '',
        pageId: configMap['social.facebook.pageId'] || '',
        instagramAccountId: configMap['social.facebook.instagramAccountId'],
      },
    };
  }

  /**
   * Guarda la configuración de redes sociales
   */
  async saveConfig(config: Partial<SocialSyncConfig>): Promise<void> {
    const updates: { key: string; value: string }[] = [];

    if (config.twitter) {
      updates.push(
        { key: 'social.twitter.enabled', value: String(config.twitter.enabled) },
        { key: 'social.twitter.bearerToken', value: config.twitter.bearerToken },
        { key: 'social.twitter.searchQuery', value: config.twitter.searchQuery },
      );
    }

    if (config.facebook) {
      updates.push(
        { key: 'social.facebook.enabled', value: String(config.facebook.enabled) },
        { key: 'social.facebook.accessToken', value: config.facebook.accessToken },
        { key: 'social.facebook.pageId', value: config.facebook.pageId },
      );
      if (config.facebook.instagramAccountId) {
        updates.push({
          key: 'social.facebook.instagramAccountId',
          value: config.facebook.instagramAccountId,
        });
      }
    }

    for (const { key, value } of updates) {
      await this.prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value, type: 'STRING' },
      });
    }
  }

  /**
   * Ejecuta sincronización de todas las plataformas habilitadas
   */
  async syncAll(): Promise<SyncResult[]> {
    const config = await this.getConfig();
    const results: SyncResult[] = [];

    // Sincronizar Twitter
    if (config.twitter?.enabled && config.twitter.bearerToken) {
      const result = await this.syncTwitter(config.twitter);
      results.push(result);
    }

    // Sincronizar Facebook/Instagram
    if (config.facebook?.enabled && config.facebook.accessToken) {
      const result = await this.syncFacebook(config.facebook);
      results.push(result);
    }

    return results;
  }

  /**
   * Sincroniza menciones de Twitter
   */
  async syncTwitter(config: NonNullable<SocialSyncConfig['twitter']>): Promise<SyncResult> {
    const result: SyncResult = { platform: 'twitter', fetched: 0, new: 0, errors: [] };

    try {
      const adapter = new TwitterAdapter({
        bearerToken: config.bearerToken,
        searchQuery: config.searchQuery,
      });

      // Obtener último ID sincronizado
      const lastMention = await this.prisma.socialMention.findFirst({
        where: { platform: 'twitter' },
        orderBy: { publishedAt: 'desc' },
        select: { externalId: true },
      });

      const mentions = await adapter.fetchMentions(lastMention?.externalId);
      result.fetched = mentions.length;

      // Procesar menciones
      const processed = await this.processMentions('twitter', mentions);
      result.new = processed;
    } catch (error) {
      result.errors.push(String(error));
    }

    return result;
  }

  /**
   * Sincroniza menciones de Facebook/Instagram
   */
  async syncFacebook(config: NonNullable<SocialSyncConfig['facebook']>): Promise<SyncResult> {
    const result: SyncResult = { platform: 'facebook', fetched: 0, new: 0, errors: [] };

    try {
      const adapter = new FacebookAdapter({
        accessToken: config.accessToken,
        pageId: config.pageId,
        instagramAccountId: config.instagramAccountId,
      });

      // Obtener menciones de las últimas 24 horas
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const mentions = await adapter.fetchAllMentions(since);
      result.fetched = mentions.length;

      // Procesar menciones
      const processed = await this.processMentions('facebook', mentions);
      result.new = processed;
    } catch (error) {
      result.errors.push(String(error));
    }

    return result;
  }

  /**
   * Procesa menciones: clasifica sentimiento y guarda en BD
   */
  private async processMentions(sourceId: string, mentions: RawSocialMention[]): Promise<number> {
    const repository = new SocialMentionRepository(this.prisma);
    
    // Crear SentimentClassifier si hay AIService
    let classifier: SentimentClassifier | null = null;
    if (this.aiService) {
      classifier = new SentimentClassifier(this.aiService);
    }

    let newCount = 0;

    for (const mention of mentions) {
      // Verificar si ya existe
      const existing = await repository.findByExternalId(mention.platform, mention.externalId);
      if (existing) continue;

      // Clasificar sentimiento
      let sentiment = SentimentType.NEUTRAL;
      if (classifier) {
        try {
          const classification = await classifier.classify(mention.content);
          sentiment = classification.sentiment;
        } catch (e) {
          console.error('[SocialSync] Classification error:', e);
        }
      }

      // Guardar mención
      await repository.create({
        sourceId,
        platform: mention.platform,
        externalId: mention.externalId,
        author: mention.author,
        content: mention.content,
        sentiment,
        publishedAt: mention.publishedAt,
      });

      newCount++;
    }

    return newCount;
  }

  /**
   * Prueba conexión con Twitter
   */
  async testTwitterConnection(): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig();
    if (!config.twitter?.bearerToken) {
      return { success: false, error: 'No bearer token configured' };
    }

    const adapter = new TwitterAdapter({
      bearerToken: config.twitter.bearerToken,
      searchQuery: config.twitter.searchQuery,
    });

    return adapter.testConnection();
  }

  /**
   * Prueba conexión con Facebook
   */
  async testFacebookConnection(): Promise<{ success: boolean; error?: string; pageName?: string }> {
    const config = await this.getConfig();
    if (!config.facebook?.accessToken) {
      return { success: false, error: 'No access token configured' };
    }

    const adapter = new FacebookAdapter({
      accessToken: config.facebook.accessToken,
      pageId: config.facebook.pageId,
      instagramAccountId: config.facebook.instagramAccountId,
    });

    return adapter.testConnection();
  }
}
