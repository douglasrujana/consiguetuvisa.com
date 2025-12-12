// src/server/lib/features/chatbot/Chatbot.entity.ts

/**
 * ENTIDADES DEL CHATBOT
 * Modelos de dominio para conversaciones y mensajes.
 */

/**
 * Mensaje individual en una conversación
 */
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: MessageSource[];
  createdAt: Date;
}

/**
 * Fuente citada en una respuesta RAG
 */
export interface MessageSource {
  content: string;
  source: string;
  score: number;
}

/**
 * Conversación completa
 */
export interface Conversation {
  id: string;
  userId?: string; // null para usuarios anónimos
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuración del chatbot
 */
export interface ChatbotConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topK: number; // Chunks RAG a recuperar
  minScore: number; // Score mínimo para incluir chunk
}

/**
 * Configuración por defecto
 */
export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  systemPrompt: `Eres un asistente virtual de ConsigueTuVisa.com, una agencia de viajes especializada en trámites de visa.

Tu rol es:
- Responder preguntas sobre requisitos de visa para diferentes países
- Explicar procesos y documentación necesaria
- Orientar sobre nuestros servicios de asesoría
- Ser amable, profesional y conciso

Reglas:
- Responde SOLO basándote en el contexto proporcionado
- Si no tienes información, sugiere contactar a un asesor
- Responde siempre en español
- Sé breve pero completo`,
  temperature: 0.3,
  maxTokens: 1024,
  topK: 5,
  minScore: 0.6,
};
