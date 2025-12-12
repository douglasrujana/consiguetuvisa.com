// src/server/lib/features/social/SentimentClassifier.ts

/**
 * CLASIFICADOR DE SENTIMIENTO
 * Usa LLM para clasificar el sentimiento de menciones sociales.
 * 
 * @requirements 11.2 - Clasificación de sentimiento (POSITIVE, NEUTRAL, NEGATIVE, COMPLAINT)
 */

import type { AIService } from '@core/ai';
import { SentimentType, type SentimentClassificationResult } from './SocialMention.entity';

/**
 * Prompt del sistema para clasificación de sentimiento
 */
const SENTIMENT_SYSTEM_PROMPT = `Eres un clasificador de sentimiento especializado en analizar menciones de marca en redes sociales para ConsigueTuVisa.com, una empresa de asesoría de visas.

Tu tarea es clasificar el sentimiento de cada mensaje en una de estas categorías:

- POSITIVE: El mensaje expresa satisfacción, agradecimiento, recomendación o experiencia positiva con el servicio.
- NEUTRAL: El mensaje es informativo, hace una pregunta general, o no expresa un sentimiento claro.
- NEGATIVE: El mensaje expresa insatisfacción, frustración o una experiencia negativa, pero sin ser una queja formal.
- COMPLAINT: El mensaje es una queja formal, denuncia un problema grave, amenaza con acciones legales, o requiere atención inmediata del servicio al cliente.

IMPORTANTE: Distingue entre NEGATIVE y COMPLAINT:
- NEGATIVE: "No me gustó el servicio" o "Tardaron mucho en responder"
- COMPLAINT: "Me estafaron", "Quiero mi dinero de vuelta", "Voy a denunciarlos", "Llevan semanas sin responder y perdí mi cita"

Responde SOLO con un JSON válido en este formato:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "COMPLAINT",
  "confidence": 0.0-1.0,
  "reasoning": "Breve explicación de la clasificación"
}`;

/**
 * Clasificador de sentimiento usando LLM
 */
export class SentimentClassifier {
  constructor(private aiService: AIService) {}

  /**
   * Clasifica el sentimiento de un texto
   */
  async classify(content: string): Promise<SentimentClassificationResult> {
    try {
      const response = await this.aiService.prompt(
        `Clasifica el sentimiento del siguiente mensaje:\n\n"${content}"`,
        SENTIMENT_SYSTEM_PROMPT,
        { temperature: 0.1, maxTokens: 200 }
      );

      return this.parseResponse(response);
    } catch (error) {
      // En caso de error, retornar NEUTRAL con baja confianza
      console.error('Error classifying sentiment:', error);
      return {
        sentiment: SentimentType.NEUTRAL,
        confidence: 0.5,
        reasoning: 'Error en clasificación, asignado como NEUTRAL por defecto',
      };
    }
  }


  /**
   * Clasifica múltiples textos en batch
   */
  async classifyBatch(contents: string[]): Promise<SentimentClassificationResult[]> {
    // Procesar en paralelo con límite de concurrencia
    const results: SentimentClassificationResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((content) => this.classify(content))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Determina si un contenido es una queja que requiere atención inmediata
   */
  async isComplaint(content: string): Promise<boolean> {
    const result = await this.classify(content);
    return result.sentiment === SentimentType.COMPLAINT;
  }

  /**
   * Parsea la respuesta del LLM
   */
  private parseResponse(response: string): SentimentClassificationResult {
    try {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.fallbackParse(response);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validar que el sentimiento sea válido
      const validSentiments = Object.values(SentimentType);
      if (!validSentiments.includes(parsed.sentiment)) {
        return this.fallbackParse(response);
      }

      return {
        sentiment: parsed.sentiment as SentimentType,
        confidence: typeof parsed.confidence === 'number' 
          ? Math.min(1, Math.max(0, parsed.confidence)) 
          : 0.8,
        reasoning: parsed.reasoning || undefined,
      };
    } catch {
      return this.fallbackParse(response);
    }
  }

  /**
   * Parseo de respaldo cuando el JSON falla
   */
  private fallbackParse(response: string): SentimentClassificationResult {
    const upperResponse = response.toUpperCase();
    
    if (upperResponse.includes('COMPLAINT')) {
      return { sentiment: SentimentType.COMPLAINT, confidence: 0.7 };
    }
    if (upperResponse.includes('NEGATIVE')) {
      return { sentiment: SentimentType.NEGATIVE, confidence: 0.7 };
    }
    if (upperResponse.includes('POSITIVE')) {
      return { sentiment: SentimentType.POSITIVE, confidence: 0.7 };
    }
    
    return { sentiment: SentimentType.NEUTRAL, confidence: 0.5 };
  }
}
