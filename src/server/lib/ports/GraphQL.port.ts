// src/server/lib/ports/GraphQL.port.ts

/**
 * Puerto del Ejecutor GraphQL
 * Puerto para la ejecución de operaciones GraphQL
 * Aquí definimos la interfaz que cualquier adaptador de ejecución
 * de GraphQL debe implementar. Esto permite una abstracción
 * entre la lógica de negocio y la capa de transporte.  
 */

export interface IGraphQLRunner {
  /**
   * Ejecuta una operación GraphQL.
   * @param query La cadena de query/mutation.
   * @param variables Objeto con las variables.
   * @param context El objeto de contexto (Auth, Servicios, etc.).
   * @returns El resultado de la operación (data o errors).
   */
  execute(query: string, variables: unknown, context: unknown): Promise<unknown>;
}