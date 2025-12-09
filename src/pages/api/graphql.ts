// src/pages/api/graphql.ts

/**
 * Api gateway GraphQL
 * El Handler Serverless Puro para GraphQL
 * Aquí definimos el endpoint API que maneja las solicitudes GraphQL.
 * Utiliza el adaptador GraphQLjsRunnerAdapter para ejecutar las operaciones
 * GraphQL, manteniendo una separación clara entre la capa de transporte
 * y la lógica de negocio.
 * Inyección de Dependencias (IoC).
 */

import type { APIRoute } from 'astro';
import {
    GraphQLjsRunnerAdapter
} from '../../server/lib/adapters/GraphQLjsRunner.adapter';

import {
    buildContext
} from '../../server/lib/core/di/ContextFactory';
import type { GraphQLContext } from '../../server/lib/core/di/ContextFactory';

import {
    DomainError
} from '../../server/lib/core/error/Domain.error';

// Instanciamos el Runner una sola vez (Singleton) para reutilizar el esquema compilado.
const runner = new GraphQLjsRunnerAdapter();

// ----------------------------------------------------------------------
// FUNCIÓN HANDLER PARA PETICIONES POST
// ----------------------------------------------------------------------

export const POST: APIRoute = async ({ request }) => {
  console.log('[DEBUG] 🚀 GraphQL POST handler invoked');
  
  if (request.method !== 'POST') {
    console.log('[DEBUG] ❌ Method not POST:', request.method);
    return new Response(null, { status: 405 }); // Método no permitido
  }

  try {
    console.log('[DEBUG] 📝 Parsing request body...');
    const body = await request.json();
    console.log('[DEBUG] ✅ Body parsed:', JSON.stringify(body).substring(0, 100));
    
    const { query, variables } = body;
    console.log('[DEBUG] 📊 Query:', query?.substring(0, 50));
    console.log('[DEBUG] 📊 Variables:', JSON.stringify(variables));

    // 1. CREACIÓN DEL CONTENEDOR DE SERVICIO (IoC)
    // Se crea un nuevo Contexto con todas las dependencias cableadas por petición.
    console.log('[DEBUG] 🔧 Building context...');
    const context: GraphQLContext = buildContext(request);
    console.log('[DEBUG] ✅ Context built');

    // 2. EJECUCIÓN DE LA OPERACIÓN GRAPHQL
    console.log('[DEBUG] ⚙️ Executing GraphQL query...');
    const result = await runner.execute(query, variables, context);
    console.log('[DEBUG] ✅ GraphQL executed, result:', JSON.stringify(result).substring(0, 100));

    // 3. MANEJO UNIFICADO DE ERRORES (Profesional y Explícito)
    if (result.errors) {
      const safeErrors = result.errors.map(err => {
        // Mapeamos errores de Dominio a un código GraphQL explícito
        const code = err.originalError instanceof DomainError
          ? err.originalError.code
          : 'INTERNAL_SERVER_ERROR';

        return {
          message: err.message,
          locations: err.locations,
          path: err.path,
          extensions: {
            code: code,
          }
        };
      });

      // GraphQL siempre devuelve 200, los errores van en el body
      return new Response(JSON.stringify({ data: result.data, errors: safeErrors }), {
        status: 200, 
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. RESPUESTA EXITOSA
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("GraphQL Handler Error:", error);
    // Errores graves (ej: JSON mal formado, fallo de infraestructura)
    return new Response(
      JSON.stringify({
        errors: [{ message: 'Internal Server Error or Malformed Request' }]
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// ----------------------------------------------------------------------
// FUNCIÓN HANDLER PARA HEALTH CHECK (GET simple)
// ----------------------------------------------------------------------

export const GET: APIRoute = () => {
    return new Response(JSON.stringify({ status: "OK", server: "GraphQL.js Pure" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};