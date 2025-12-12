// src/pages/api/ai/rag-test.ts
// Endpoint de prueba para RAG Engine - CON TRAZABILIDAD COMPLETA

import type { APIRoute } from 'astro';
import { config } from 'dotenv';
import { GeminiLLMAdapter, GeminiEmbeddingAdapter, withRetry, AIError } from '@core/ai';
import { MemoryVectorStoreAdapter } from '@core/rag';
import type { VectorDocument, SearchResult } from '@core/rag';

config({ path: '.env.local' });

// Documentos de ejemplo sobre visas
const SAMPLE_DOCS = [
  {
    id: 'visa-usa-1',
    content: `Para solicitar una visa de turista B1/B2 a Estados Unidos necesitas: 
    1. Pasaporte vigente con al menos 6 meses de validez
    2. Formulario DS-160 completado online
    3. Foto reciente tamaño pasaporte
    4. Comprobante de pago de la tarifa de visa ($185 USD)
    5. Carta de invitación (opcional pero recomendada)`,
    source: 'guia-visa-usa.md',
  },
  {
    id: 'visa-usa-2',
    content: `La entrevista consular para visa americana se realiza en la Embajada de Estados Unidos. 
    Debes llegar 15 minutos antes de tu cita. No se permiten dispositivos electrónicos.
    Las preguntas típicas son: motivo del viaje, duración, financiamiento, lazos con tu país.`,
    source: 'guia-visa-usa.md',
  },
  {
    id: 'visa-canada-1',
    content: `Para la visa de turista a Canadá (Visitor Visa) necesitas:
    1. Pasaporte vigente
    2. Formulario IMM 5257 completado
    3. Dos fotos tamaño pasaporte
    4. Prueba de fondos suficientes
    5. Carta de empleo o estados de cuenta bancarios
    6. Itinerario de viaje`,
    source: 'guia-visa-canada.md',
  },
  {
    id: 'servicios-1',
    content: `ConsigueTuVisa.com ofrece asesoría completa para trámites de visa.
    Nuestros servicios incluyen: revisión de documentos, preparación para entrevista,
    llenado de formularios, y seguimiento del proceso. Contáctanos al +593 99 123 4567.`,
    source: 'servicios.md',
  },
];

export const GET: APIRoute = async ({ url }) => {
  const question = url.searchParams.get('q') ?? '¿Qué necesito para la visa americana?';

  // Objeto para tracking de todas las fases
  const pipeline = {
    fase1_indexacion: {
      descripcion: 'Convertir documentos a embeddings y guardar en vector store',
      documentos: [] as Array<{
        id: string;
        contenido_preview: string;
        embedding_dimensions: number;
        embedding_sample: number[];
      }>,
      tiempo_ms: 0,
    },
    fase2_query_embedding: {
      descripcion: 'Convertir la pregunta del usuario a embedding',
      pregunta: question,
      embedding_dimensions: 0,
      embedding_sample: [] as number[],
      tiempo_ms: 0,
    },
    fase3_busqueda_similitud: {
      descripcion: 'Buscar documentos similares usando similitud coseno',
      resultados: [] as Array<{
        id: string;
        score: number;
        contenido_preview: string;
      }>,
      tiempo_ms: 0,
    },
    fase4_augment: {
      descripcion: 'Construir prompt con contexto recuperado',
      contexto_enviado: '',
      prompt_final: '',
    },
    fase5_generate: {
      descripcion: 'Generar respuesta con LLM',
      modelo: '',
      respuesta: '',
      tokens: {} as { prompt?: number; completion?: number; total?: number },
      tiempo_ms: 0,
    },
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), { status: 500 });
    }

    // Crear componentes
    const vectorStore = new MemoryVectorStoreAdapter();
    const llm = new GeminiLLMAdapter(apiKey, 'gemini-2.5-flash-lite');
    const embedding = new GeminiEmbeddingAdapter(apiKey);

    // ═══════════════════════════════════════════════════════════════
    // FASE 1: INDEXACIÓN - Documentos → Embeddings → Vector Store
    // ═══════════════════════════════════════════════════════════════
    const fase1Start = Date.now();
    console.log('\n🔵 FASE 1: INDEXACIÓN');

    for (const doc of SAMPLE_DOCS) {
      console.log(`   Procesando: ${doc.id}`);

      // Generar embedding del documento
      const embResult = await embedding.embed(doc.content);

      // Guardar en vector store
      const vectorDoc: VectorDocument = {
        id: doc.id,
        content: doc.content,
        embedding: embResult.vector,
        metadata: { source: doc.source },
      };
      await vectorStore.upsert(vectorDoc);

      // Tracking
      pipeline.fase1_indexacion.documentos.push({
        id: doc.id,
        contenido_preview: doc.content.substring(0, 80) + '...',
        embedding_dimensions: embResult.dimensions,
        embedding_sample: embResult.vector.slice(0, 5), // Primeros 5 valores
      });
    }

    pipeline.fase1_indexacion.tiempo_ms = Date.now() - fase1Start;
    console.log(`   ✅ ${SAMPLE_DOCS.length} documentos indexados en ${pipeline.fase1_indexacion.tiempo_ms}ms`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: QUERY EMBEDDING - Pregunta → Embedding
    // ═══════════════════════════════════════════════════════════════
    const fase2Start = Date.now();
    console.log('\n🟡 FASE 2: QUERY EMBEDDING');
    console.log(`   Pregunta: "${question}"`);

    const queryEmbedding = await embedding.embed(question);

    pipeline.fase2_query_embedding.embedding_dimensions = queryEmbedding.dimensions;
    pipeline.fase2_query_embedding.embedding_sample = queryEmbedding.vector.slice(0, 5);
    pipeline.fase2_query_embedding.tiempo_ms = Date.now() - fase2Start;

    console.log(`   ✅ Embedding generado: ${queryEmbedding.dimensions} dimensiones en ${pipeline.fase2_query_embedding.tiempo_ms}ms`);
    console.log(`   Muestra: [${queryEmbedding.vector.slice(0, 3).map((n) => n.toFixed(4)).join(', ')}, ...]`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: BÚSQUEDA POR SIMILITUD - Encontrar docs relevantes
    // ═══════════════════════════════════════════════════════════════
    const fase3Start = Date.now();
    console.log('\n🟠 FASE 3: BÚSQUEDA POR SIMILITUD');

    const searchResults: SearchResult[] = await vectorStore.search(queryEmbedding.vector, {
      topK: 3,
      minScore: 0.5,
    });

    pipeline.fase3_busqueda_similitud.resultados = searchResults.map((r) => ({
      id: r.id,
      score: Math.round(r.score * 1000) / 1000,
      contenido_preview: r.content.substring(0, 100) + '...',
    }));
    pipeline.fase3_busqueda_similitud.tiempo_ms = Date.now() - fase3Start;

    console.log(`   ✅ ${searchResults.length} documentos encontrados en ${pipeline.fase3_busqueda_similitud.tiempo_ms}ms`);
    for (const r of searchResults) {
      console.log(`      - ${r.id}: score=${r.score.toFixed(3)}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: AUGMENT - Construir prompt con contexto
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🟣 FASE 4: AUGMENT (Construir prompt)');

    const contextText = searchResults.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');

    const systemPrompt = `Eres un asistente experto de ConsigueTuVisa.com.
Responde SOLO basándote en el contexto proporcionado.
Si no encuentras la información, di "No tengo información sobre eso".
Sé conciso y profesional. Responde en español.`;

    const fullPrompt = `[INSTRUCCIONES]\n${systemPrompt}\n\n[CONTEXTO RECUPERADO]\n${contextText}\n\n[PREGUNTA DEL USUARIO]\n${question}`;

    pipeline.fase4_augment.contexto_enviado = contextText.substring(0, 500) + '...';
    pipeline.fase4_augment.prompt_final = fullPrompt.substring(0, 800) + '...';

    console.log(`   ✅ Prompt construido con ${searchResults.length} chunks de contexto`);
    console.log(`   Tokens estimados: ~${Math.ceil(fullPrompt.length / 4)}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: GENERATE - LLM genera respuesta
    // ═══════════════════════════════════════════════════════════════
    const fase5Start = Date.now();
    console.log('\n🔴 FASE 5: GENERATE (LLM)');

    // Usar generateWithRetry para manejar errores 503 automáticamente
    const response = await llm.generateWithRetry(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Basándote en este contexto:\n\n${contextText}\n\nResponde: ${question}`,
        },
      ],
      { temperature: 0.3, maxTokens: 1024, maxRetries: 3 }
    );

    pipeline.fase5_generate.modelo = llm.modelName;
    pipeline.fase5_generate.respuesta = response.content;
    pipeline.fase5_generate.tokens = {
      prompt: response.usage?.promptTokens,
      completion: response.usage?.completionTokens,
      total: response.usage?.totalTokens,
    };
    pipeline.fase5_generate.tiempo_ms = Date.now() - fase5Start;

    console.log(`   ✅ Respuesta generada en ${pipeline.fase5_generate.tiempo_ms}ms`);
    console.log(`   Modelo: ${llm.modelName}`);
    console.log(`   Tokens: ${response.usage?.totalTokens ?? 'N/A'}`);

    // ═══════════════════════════════════════════════════════════════
    // RESPUESTA FINAL
    // ═══════════════════════════════════════════════════════════════
    const tiempoTotal =
      pipeline.fase1_indexacion.tiempo_ms +
      pipeline.fase2_query_embedding.tiempo_ms +
      pipeline.fase3_busqueda_similitud.tiempo_ms +
      pipeline.fase5_generate.tiempo_ms;

    console.log(`\n✅ PIPELINE COMPLETO en ${tiempoTotal}ms\n`);

    return new Response(
      JSON.stringify(
        {
          success: true,
          pregunta: question,
          respuesta: response.content,
          tiempo_total_ms: tiempoTotal,
          pipeline,
        },
        null,
        2
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RAG Test Error]', error);
    return new Response(JSON.stringify({ success: false, error: message, pipeline }), {
      status: 500,
    });
  }
};
