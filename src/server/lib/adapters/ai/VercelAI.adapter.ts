// src/server/lib/adapters/ai/VercelAI.adapter.ts

/**
 * ADAPTADOR DE VERCEL AI SDK
 * Preparado para futuros casos de uso de IA.
 * Anti vendor-locking: implementa un puerto genérico.
 */

import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

/**
 * Puerto genérico para proveedores de IA.
 */
export interface IAIProvider {
  generateText(prompt: string, options?: AIOptions): Promise<string>;
  streamText(prompt: string, options?: AIOptions): AsyncIterable<string>;
}

export interface AIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Adaptador de Vercel AI SDK con OpenAI.
 * Cambiar a otro proveedor (Anthropic, Google, etc.) es trivial.
 */
export class VercelAIAdapter implements IAIProvider {
  private defaultModel: string;
  
  constructor(model = 'gpt-4o-mini') {
    this.defaultModel = model;
  }

  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    const { text } = await generateText({
      model: openai(options?.model || this.defaultModel),
      prompt,
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      system: options?.systemPrompt,
    });
    
    return text;
  }

  async *streamText(prompt: string, options?: AIOptions): AsyncIterable<string> {
    const result = streamText({
      model: openai(options?.model || this.defaultModel),
      prompt,
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      system: options?.systemPrompt,
    });

    for await (const chunk of (await result).textStream) {
      yield chunk;
    }
  }
}

/**
 * Casos de uso futuros preparados:
 * 
 * 1. Asistente de visa:
 *    - Responder preguntas frecuentes
 *    - Guiar en el proceso de documentos
 *    - Preparar para la entrevista
 * 
 * 2. Análisis de documentos:
 *    - Verificar completitud de documentos
 *    - Detectar errores en formularios
 * 
 * 3. Generación de contenido:
 *    - Emails personalizados
 *    - Recordatorios de citas
 *    - Resúmenes de estado
 */

// Ejemplo de uso futuro:
// const ai = new VercelAIAdapter();
// const response = await ai.generateText('¿Qué documentos necesito para visa USA?', {
//   systemPrompt: 'Eres un asistente experto en visas de turismo para ecuatorianos.',
// });
