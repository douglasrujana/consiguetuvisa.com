// src/server/lib/features/chatbot/Chatbot.dto.ts

/**
 * DTOs Y VALIDACIÓN - Chatbot
 * Validación con Zod para inputs del chatbot.
 */

import { z } from 'zod';

/**
 * Input para enviar un mensaje
 */
export const SendMessageInputSchema = z.object({
  conversationId: z.string().nullish(), // Acepta string, null, o undefined
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(2000, 'Mensaje muy largo'),
  userId: z.string().nullish(),
});

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

/**
 * Input para crear conversación
 */
export const CreateConversationInputSchema = z.object({
  userId: z.string().optional(),
  title: z.string().optional(),
  initialMessage: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof CreateConversationInputSchema>;

/**
 * Input para obtener historial
 */
export const GetHistoryInputSchema = z.object({
  conversationId: z.string(),
  limit: z.number().min(1).max(100).optional().default(50),
});

export type GetHistoryInput = z.infer<typeof GetHistoryInputSchema>;

/**
 * Valida y parsea input de mensaje
 */
export function validateSendMessage(input: unknown): SendMessageInput {
  return SendMessageInputSchema.parse(input);
}

/**
 * Valida y parsea input de conversación
 */
export function validateCreateConversation(input: unknown): CreateConversationInput {
  return CreateConversationInputSchema.parse(input);
}
