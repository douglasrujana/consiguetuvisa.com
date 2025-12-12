// src/pages/api/ai/test.ts
// Endpoint de prueba para el Core AI - Solo LLM

import type { APIRoute } from 'astro';
import { GeminiLLMAdapter } from '@core/ai';
import { config } from 'dotenv';

// Cargar .env.local explícitamente
config({ path: '.env.local' });

export const GET: APIRoute = async () => {
  const logs: string[] = [];

  try {
    logs.push('1. Verificando GEMINI_API_KEY...');
    const apiKey = process.env.GEMINI_API_KEY;
    logs.push(`   Key presente: ${!!apiKey}`);
    logs.push(`   Key length: ${apiKey?.length ?? 0}`);
    logs.push(`   Key prefix: ${apiKey?.substring(0, 10)}...`);

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GEMINI_API_KEY no está configurada',
          logs,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logs.push('2. Creando GeminiLLMAdapter directamente...');
    const llm = new GeminiLLMAdapter(apiKey, 'gemini-2.5-flash');
    logs.push(`   Modelo: ${llm.modelName}`);

    logs.push('3. Enviando prompt simple...');
    const response = await llm.generate([
      { role: 'user', content: 'Di "hola mundo" en español. Solo esas dos palabras.' },
    ]);
    logs.push(`   Respuesta: ${response.content}`);
    logs.push(`   Finish reason: ${response.finishReason}`);

    return new Response(
      JSON.stringify({
        success: true,
        model: llm.modelName,
        response: response.content,
        usage: response.usage,
        logs,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Test Error]', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        logs,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
