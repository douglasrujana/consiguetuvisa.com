// src/pages/api/chat/index.ts
// API endpoint para el chatbot - POST para enviar mensajes
// Supports both JSON responses and Server-Sent Events (SSE) streaming
// Requirements: 9.1, 9.2

import type { APIRoute } from 'astro';
import { config } from 'dotenv';
import { GeminiLLMAdapter, GeminiEmbeddingAdapter } from '@core/ai';
import { RAGService, MemoryVectorStoreAdapter } from '@core/rag';
import { TursoVectorStoreAdapter } from '@core/rag/adapters/TursoVectorStore.adapter';
import { 
  ChatbotService, 
  ChatbotRepository, 
  validateSendMessage,
  StreamingChatService,
  type ChatStreamChunk
} from '@features/chatbot';
import { StoreSelector } from '@features/chatbot/stores/StoreSelector';
import { MemoryConversationStore } from '@features/chatbot/stores/MemoryConversationStore';
import { PrismaConversationStore } from '@features/chatbot/stores/PrismaConversationStore';
import { prisma } from '@server/db/prisma-singleton';
import type { ChatStorageMode } from '@features/chatbot/stores/StoreSelector';
import type { IVectorStore } from '@core/rag/VectorStore.port';

config({ path: '.env.local' });

const isProduction = process.env.NODE_ENV === 'production';

// Singleton para mantener estado entre requests (desarrollo)
let chatbotService: ChatbotService | null = null;
let streamingChatService: StreamingChatService | null = null;
let isInitialized = false;
let initializationPromise: Promise<InitializedServices> | null = null;

// Documentos de ejemplo (en producción vendrían de Sanity/DB)
const KNOWLEDGE_BASE = [
  {
    id: 'visa-usa-requisitos',
    content: `Requisitos para visa de turista B1/B2 a Estados Unidos:
    1. Pasaporte vigente con mínimo 6 meses de validez
    2. Formulario DS-160 completado online
    3. Foto digital reciente (5x5 cm, fondo blanco)
    4. Comprobante de pago de tarifa consular ($185 USD)
    5. Carta de invitación (opcional pero recomendada)
    6. Prueba de solvencia económica (estados de cuenta)
    7. Prueba de vínculos con tu país (trabajo, propiedades, familia)`,
    source: 'guia-visa-usa.md',
  },
  {
    id: 'visa-usa-entrevista',
    content: `Preparación para la entrevista consular de visa americana:
    - Llegar 15 minutos antes de la cita
    - No se permiten dispositivos electrónicos
    - Llevar documentos originales y copias
    - Vestir formal pero cómodo
    - Responder con honestidad y brevedad
    - Preguntas típicas: motivo del viaje, duración, financiamiento, lazos con tu país
    - Mantener contacto visual y actitud positiva`,
    source: 'guia-visa-usa.md',
  },
  {
    id: 'visa-canada-requisitos',
    content: `Requisitos para visa de turista a Canadá (Visitor Visa):
    1. Pasaporte vigente
    2. Formulario IMM 5257 completado
    3. Dos fotos tamaño pasaporte
    4. Prueba de fondos suficientes (mínimo $1000 CAD por semana)
    5. Carta de empleo o estados de cuenta bancarios
    6. Itinerario de viaje detallado
    7. Carta de invitación si visitas familia/amigos`,
    source: 'guia-visa-canada.md',
  },
  {
    id: 'servicios-asesoria',
    content: `Servicios de ConsigueTuVisa.com:
    - Asesoría personalizada para trámites de visa
    - Revisión completa de documentos
    - Preparación para entrevista consular
    - Llenado de formularios (DS-160, IMM 5257, etc.)
    - Seguimiento del proceso
    - Atención en español
    Contacto: +593 99 123 4567 | info@consiguetuvisa.com
    Horario: Lunes a Viernes 9am-6pm`,
    source: 'servicios.md',
  },
  {
    id: 'visa-schengen',
    content: `Requisitos para visa Schengen (Europa):
    1. Pasaporte con validez mínima de 3 meses después del viaje
    2. Formulario de solicitud completado
    3. Fotos tamaño pasaporte
    4. Seguro de viaje con cobertura mínima de 30,000 EUR
    5. Reserva de vuelos y hoteles
    6. Prueba de medios económicos
    7. Carta de empleo o constancia de estudios
    La visa Schengen permite visitar 27 países europeos.`,
    source: 'guia-visa-schengen.md',
  },
];

interface InitializedServices {
  chatbotService: ChatbotService;
  streamingChatService: StreamingChatService;
}

/**
 * Inicializa el chatbot de forma lazy y thread-safe.
 * Usa un promise singleton para evitar inicializaciones duplicadas.
 */
async function initializeChatbot(): Promise<InitializedServices> {
  // Si ya está inicializado, retornar inmediatamente
  if (chatbotService && streamingChatService && isInitialized) {
    return { chatbotService, streamingChatService };
  }

  // Si hay una inicialización en progreso, esperar a que termine
  if (initializationPromise) {
    return initializationPromise;
  }

  // Iniciar nueva inicialización
  initializationPromise = doInitialize();
  
  try {
    const result = await initializationPromise;
    return result;
  } catch (error) {
    // Si falla, limpiar el promise para permitir reintentos
    initializationPromise = null;
    throw error;
  }
}

async function doInitialize(): Promise<InitializedServices> {
  const startTime = Date.now();
  console.log('[Chatbot] Iniciando inicialización...');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Seleccionar vector store según entorno
  // Producción: TursoVectorStore (persistente)
  // Desarrollo: MemoryVectorStore (rápido para dev)
  let vectorStore: IVectorStore;
  
  if (isProduction) {
    console.log('[Chatbot] Usando TursoVectorStore (producción)');
    vectorStore = new TursoVectorStoreAdapter({ prisma });
  } else {
    console.log('[Chatbot] Usando MemoryVectorStore (desarrollo)');
    vectorStore = new MemoryVectorStoreAdapter();
  }

  const llm = new GeminiLLMAdapter(apiKey, 'gemini-2.5-flash-lite');
  const embedding = new GeminiEmbeddingAdapter(apiKey);
  const ragEngine = new RAGService({ vectorStore, llm, embedding });
  
  // Crear StoreSelector con ambos stores
  const memoryStore = new MemoryConversationStore();
  const prismaStore = new PrismaConversationStore(prisma);
  const storageMode = (process.env.CHAT_STORAGE_MODE || 'smart') as ChatStorageMode;
  const storeSelector = new StoreSelector(memoryStore, prismaStore, storageMode);
  const repository = new ChatbotRepository(storeSelector);

  // En desarrollo: indexar knowledge base en memoria
  // En producción: los embeddings ya están en Turso
  if (!isProduction) {
    console.log('[Chatbot] Indexando knowledge base en memoria...');
    await ragEngine.indexDocuments(KNOWLEDGE_BASE);
    console.log(`[Chatbot] ${KNOWLEDGE_BASE.length} documentos indexados`);
  } else {
    // Verificar que hay embeddings en Turso
    const count = await vectorStore.count();
    console.log(`[Chatbot] ${count} embeddings encontrados en Turso`);
    
    // Si no hay embeddings, indexar los documentos base
    if (count === 0) {
      console.log('[Chatbot] No hay embeddings, indexando knowledge base...');
      await ragEngine.indexDocuments(KNOWLEDGE_BASE);
      console.log(`[Chatbot] ${KNOWLEDGE_BASE.length} documentos indexados en Turso`);
    }
  }
  
  const elapsed = Date.now() - startTime;
  console.log(`[Chatbot] Inicialización completada en ${elapsed}ms`);

  // Initialize both services
  chatbotService = new ChatbotService({ repository, ragEngine });
  streamingChatService = new StreamingChatService({ repository, ragEngine });
  isInitialized = true;

  return { chatbotService, streamingChatService };
}

/**
 * Checks if the client requests streaming via Accept header
 * Requirements: 9.1, 9.2
 */
function isStreamingRequest(request: Request): boolean {
  const acceptHeader = request.headers.get('Accept') || '';
  return acceptHeader.includes('text/event-stream');
}

/**
 * Formats a chunk as a Server-Sent Event
 */
function formatSSE(chunk: ChatStreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

/**
 * Creates a streaming response using Server-Sent Events
 * Requirements: 9.1, 9.2
 */
async function createStreamingResponse(
  service: StreamingChatService,
  message: string,
  conversationId?: string,
  userId?: string
): Promise<Response> {
  const { conversationId: convId, stream } = await service.sendMessageStream(
    message,
    conversationId,
    userId
  );

  // Create a ReadableStream that yields SSE formatted chunks
  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial event with conversation ID
      controller.enqueue(
        encoder.encode(formatSSE({ type: 'content', content: '' }))
      );
      
      // Add conversationId as a custom event
      controller.enqueue(
        encoder.encode(`event: conversationId\ndata: ${JSON.stringify({ conversationId: convId })}\n\n`)
      );

      try {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(formatSSE(chunk)));
          
          // If done or error, close the stream
          if (chunk.type === 'done' || chunk.type === 'error') {
            break;
          }
        }
      } catch (error) {
        console.error('[Chat API Streaming Error]', error);
        const errorChunk: ChatStreamChunk = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Streaming error',
        };
        controller.enqueue(encoder.encode(formatSSE(errorChunk)));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * GET /api/chat - Health check y pre-warming
 * Llama esto al cargar la página para pre-inicializar el chatbot
 */
export const GET: APIRoute = async () => {
  try {
    const startTime = Date.now();
    await initializeChatbot();
    const elapsed = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        status: 'ready', 
        initialized: isInitialized,
        warmupTime: elapsed 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Initialization failed';
    return new Response(
      JSON.stringify({ status: 'error', error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const input = validateSendMessage(body);

    const { chatbotService: service, streamingChatService: streamService } = await initializeChatbot();

    // Check if client requests streaming (Accept: text/event-stream)
    // Requirements: 9.1, 9.2
    if (isStreamingRequest(request)) {
      return createStreamingResponse(
        streamService,
        input.message,
        input.conversationId,
        input.userId
      );
    }

    // Non-streaming response (default)
    const response = await service.sendMessage(
      input.message,
      input.conversationId,
      input.userId
    );

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: response.message.conversationId,
        message: {
          id: response.message.id,
          role: response.message.role,
          content: response.message.content,
          createdAt: response.message.createdAt,
        },
        sources: response.sources,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Chat API Error]', error);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
