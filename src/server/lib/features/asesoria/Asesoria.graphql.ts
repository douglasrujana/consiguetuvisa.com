// src/server/lib/features/asesoria/asesoria.graphql.ts

/** 
* DEFINICIÓN Y RESOLVERS PARA LA FEATURE DE ASESORÍA
* Aquí se definen los tipos de datos y resolvers para 
* la funcionalidad de Asesoría.
* Los resolvers son funciones que se ejecutan cuando 
* se realiza una consulta o mutación.
* Los resolvers reciben los argumentos de la consulta 
* o mutación y retornan los datos solicitados.
* Los resolvers pueden ser síncronos o asíncronos.
* Los resolvers pueden recibir argumentos y devolver valores.
* Los resolvers pueden recibir argumentos de contexto, 
* que son datos que se pasan a los resolvers.
* Los resolvers pueden recibir argumentos de contexto, 
* que son datos que se pasan a los resolvers.
*/

import { gql } from 'graphql-tag';
import { ZodError } from 'zod';
import { AgendarCitaInputSchema } from './Asesoria.dto';
import {
    AuthenticationError,
    BusinessRuleError
} from '../../core/error/Domain.error';
import { GraphQLContext } from '../../core/di/ContextFactory'; 

// ----------------------------------------------------------------------
// 1. TYPE DEFINITIONS DE ASESORÍA
// ----------------------------------------------------------------------

export const asesoriaTypeDefs = gql`
  # Tipos y Entidades
  enum ServiceType {
    Visa_Turista
    Visa_Estudiante
    Visa_Trabajo
    Otro
  }

  enum AppointmentStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  type Cita {
    id: ID!
    userId: ID!
    serviceType: ServiceType!
    scheduledDate: String!
    status: AppointmentStatus!
    notes: String
    createdAt: String!
  }

  input AgendarCitaInput {
    serviceType: ServiceType!
    scheduledDate: String!
    notes: String
  }
  
  # La Query/Mutation de esta feature se fusionarán al esquema principal
  extend type Query {
    "Obtiene todas las citas agendadas por el usuario autenticado."
    citasUsuario: [Cita!]!
  }

  extend type Mutation {
    "Permite agendar una nueva cita."
    agendarCita(input: AgendarCitaInput!): Cita!
  }
`;

// ----------------------------------------------------------------------
// 2. RESOLVERS DE ASESORÍA (Controller)
// ----------------------------------------------------------------------

export const asesoriaResolvers = {
  Query: {
    citasUsuario: async (_: any, args: any, context: GraphQLContext) => {
      // --- Lógica del Controller ---
      const userId = 'a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890'; // SIMULACIÓN DE USER ID LOGUEADO
      
      if (!userId) {
        throw new AuthenticationError('Debes estar autenticado para ver tus citas.');
      }
      
      return context.asesoriaService.getCitasUsuario(userId);
    },
  },

  Mutation: {
    agendarCita: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      // --- Lógica del Controller ---
      const userId = 'a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890'; // SIMULACIÓN DE USER ID LOGUEADO

      if (!userId) {
        throw new AuthenticationError('Debes estar autenticado para agendar.');
      }

      try {
        // Validamos e Inyectamos el userId
        const safeInput = AgendarCitaInputSchema.parse({
          ...input,
          userId: userId, 
        });

        // Llamada al Servicio (Lógica de Negocio)
        return context.asesoriaService.agendarCita(safeInput);
        
      } catch (error) {
        if (error instanceof ZodError) {
          throw new BusinessRuleError(`Error de validación: ${error.issues.map(i => i.message).join(', ')}`, 'VALIDATION_ERROR');
        }
        if (error instanceof DomainError) throw error;
        throw new Error('Error desconocido al agendar la cita.');
      }
    },
  },
};