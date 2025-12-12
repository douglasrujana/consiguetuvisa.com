// src/server/lib/features/social/SocialListener.service.ts

/**
 * SERVICIO SOCIAL LISTENER
 * Monitorea menciones de marca en redes sociales, clasifica sentimiento
 * y genera respuestas sugeridas usando RAG.
 * 
 * @requirements 11.1 - Captura de menciones
 * @requirements 11.5 - Generación de respuestas sugeridas
 * @requirements 11.6 - Marcado para revisión humana
 */

import type { ISocialMentionRepository } from './SocialMention.port';
import type { SentimentClassifier } from './SentimentClassifier';
import type { IRAGEngine } from '@core/rag';
import type { AIService } from '@core/ai';
import {
  SentimentType,
  type SocialMention,
  type CreateSocialMentionInput,
  type SocialPlatform,
  type SuggestedResponseResult,
} from './SocialMention.entity';

/**
 * Datos crudos de una mención obtenida de la API social
 */
export interface RawSocialMention {
  platform: SocialPlatform;
  externalId: string;
  author: string;
  content: string;
  publishedAt: Date;
}

/**
 * Resultado del procesamiento de una mención
 */
export interface ProcessedMention {
  mention: SocialMention;
  isNew: boolean;
  requiresAlert: boolean;
}

/**
 * Configuración del servicio
 */
export interface SocialListenerConfig {
  repository: ISocialMentionRepository;
  sentimentClassifier: SentimentClassifier;
  ragEngine?: IRAGEngine;
  aiService?: AIService;
}

/**
 * Prompt para generar respuestas sugeridas
 */
const RESPONSE_SYSTEM_PROMPT = `Eres un community manager profesional de ConsigueTuVisa.com.
Tu tarea es generar una respuesta sugerida para una mención en redes sociales.

Reglas:
1. Sé profesional, empático y servicial
2. Si es una queja, ofrece disculpas y una solución
3. Si es una pregunta, proporciona información útil basada en el contexto
4. Si es positivo, agradece y refuerza la relación
5. Mantén la respuesta breve (máximo 280 caracteres para Twitter)
6. NO incluyas información que no esté en el contexto
7. Siempre invita a contactar por canales oficiales para temas sensibles

Responde SOLO con el texto de la respuesta sugerida, sin explicaciones adicionales.`;


/**
 * Servicio de Social Listening
 */
export class SocialListenerService {
  private repository: ISocialMentionRepository;
  private sentimentClassifier: SentimentClassifier;
  private ragEngine?: IRAGEngine;
  private aiService?: AIService;

  constructor(config: SocialListenerConfig) {
    this.repository = config.repository;
    this.sentimentClassifier = config.sentimentClassifier;
    this.ragEngine = config.ragEngine;
    this.aiService = config.aiService;
  }

  /**
   * Procesa una mención cruda: clasifica sentimiento y genera respuesta si aplica
   */
  async processMention(
    sourceId: string,
    raw: RawSocialMention
  ): Promise<ProcessedMention> {
    // 1. Verificar si ya existe
    const existing = await this.repository.findByExternalId(raw.platform, raw.externalId);
    if (existing) {
      return {
        mention: existing,
        isNew: false,
        requiresAlert: false,
      };
    }

    // 2. Clasificar sentimiento
    const classification = await this.sentimentClassifier.classify(raw.content);

    // 3. Generar respuesta sugerida si contiene pregunta o es negativo/queja
    let suggestedResponse: string | undefined;
    if (this.shouldGenerateResponse(raw.content, classification.sentiment)) {
      const responseResult = await this.generateSuggestedResponse(raw.content, raw.platform);
      suggestedResponse = responseResult.response;
    }

    // 4. Crear la mención
    const input: CreateSocialMentionInput = {
      sourceId,
      platform: raw.platform,
      externalId: raw.externalId,
      author: raw.author,
      content: raw.content,
      sentiment: classification.sentiment,
      suggestedResponse,
      publishedAt: raw.publishedAt,
    };

    const mention = await this.repository.create(input);

    // 5. Determinar si requiere alerta
    const requiresAlert = this.requiresAlert(classification.sentiment);

    return {
      mention,
      isNew: true,
      requiresAlert,
    };
  }

  /**
   * Procesa múltiples menciones en batch
   */
  async processMentions(
    sourceId: string,
    rawMentions: RawSocialMention[]
  ): Promise<ProcessedMention[]> {
    const results: ProcessedMention[] = [];

    for (const raw of rawMentions) {
      try {
        const result = await this.processMention(sourceId, raw);
        results.push(result);
      } catch (error) {
        console.error(`Error processing mention ${raw.externalId}:`, error);
      }
    }

    return results;
  }

  /**
   * Genera una respuesta sugerida usando RAG o AI directamente
   */
  async generateSuggestedResponse(
    content: string,
    platform: SocialPlatform
  ): Promise<SuggestedResponseResult> {
    const maxLength = platform === 'twitter' ? 280 : 500;

    try {
      // Intentar usar RAG primero para respuestas basadas en conocimiento
      if (this.ragEngine) {
        const ragResponse = await this.ragEngine.query(
          `Genera una respuesta para esta mención en redes sociales: "${content}"`,
          {
            systemPrompt: RESPONSE_SYSTEM_PROMPT,
            maxTokens: 150,
            temperature: 0.7,
          }
        );

        const response = this.truncateResponse(ragResponse.answer, maxLength);
        return {
          response,
          requiresReview: true,
          context: ragResponse.sources.map(s => s.content).join('\n'),
        };
      }

      // Fallback a AI directo si no hay RAG
      if (this.aiService) {
        const response = await this.aiService.prompt(
          `Genera una respuesta para esta mención en redes sociales: "${content}"`,
          RESPONSE_SYSTEM_PROMPT,
          { temperature: 0.7, maxTokens: 150 }
        );

        return {
          response: this.truncateResponse(response, maxLength),
          requiresReview: true,
        };
      }

      // Sin AI disponible
      return {
        response: 'Gracias por tu mensaje. Un miembro de nuestro equipo te contactará pronto.',
        requiresReview: true,
      };
    } catch (error) {
      console.error('Error generating suggested response:', error);
      return {
        response: 'Gracias por contactarnos. Te responderemos a la brevedad.',
        requiresReview: true,
      };
    }
  }

  /**
   * Obtiene menciones pendientes de revisión
   */
  async getPendingReview(limit?: number): Promise<SocialMention[]> {
    return this.repository.findPendingReview(limit);
  }

  /**
   * Obtiene menciones que son quejas
   */
  async getComplaints(limit?: number): Promise<SocialMention[]> {
    return this.repository.findBySentiment(SentimentType.COMPLAINT, limit);
  }

  /**
   * Marca una mención como revisada
   */
  async markAsReviewed(mentionId: string, reviewedBy: string): Promise<SocialMention> {
    return this.repository.markAsReviewed(mentionId, reviewedBy);
  }

  /**
   * Actualiza la respuesta sugerida de una mención
   */
  async updateSuggestedResponse(mentionId: string, response: string): Promise<SocialMention> {
    return this.repository.update(mentionId, { suggestedResponse: response });
  }

  /**
   * Obtiene estadísticas de sentimiento
   */
  async getSentimentStats(fromDate?: Date, toDate?: Date): Promise<Record<string, number>> {
    return this.repository.countBySentiment(fromDate, toDate);
  }

  /**
   * Determina si se debe generar una respuesta sugerida
   */
  private shouldGenerateResponse(content: string, sentiment: SentimentType): boolean {
    // Generar respuesta para quejas, negativos, o si contiene pregunta
    if (sentiment === SentimentType.COMPLAINT || sentiment === SentimentType.NEGATIVE) {
      return true;
    }

    // Detectar preguntas simples
    const hasQuestion = content.includes('?') || 
      /\b(cómo|cuánto|cuándo|dónde|qué|cuál|por qué|pueden|puedo)\b/i.test(content);

    return hasQuestion;
  }

  /**
   * Determina si una mención requiere crear una alerta
   */
  private requiresAlert(sentiment: SentimentType): boolean {
    return sentiment === SentimentType.COMPLAINT;
  }

  /**
   * Trunca una respuesta al límite de caracteres
   */
  private truncateResponse(response: string, maxLength: number): string {
    if (response.length <= maxLength) {
      return response;
    }

    // Truncar en el último espacio antes del límite
    const truncated = response.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }
}
