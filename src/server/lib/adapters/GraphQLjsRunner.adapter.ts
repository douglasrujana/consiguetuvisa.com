// src/server/lib/adapters/GraphQLjsRunner.adapter.ts

/**
 * Adaptador del Ejecutor GraphQL.js
 * Adaptador para ejecutar operaciones GraphQL usando graphql.js
 * Aquí implementamos el adaptador que utiliza la librería graphql.js
 * para ejecutar las operaciones GraphQL definidas en nuestro esquema.
 * Este adaptador cumple con el contrato definido en IGraphQLRunner,
 * asegurando una separación clara entre la lógica de negocio y la capa de transporte.
 */

import { graphql } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs, resolvers } from '../../graphql/schema'; 
import { IGraphQLRunner } from '../ports/GraphQL.port';

// El schema se compila una sola vez
const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export class GraphQLjsRunnerAdapter implements IGraphQLRunner {
  
  async execute(query: string, variables: any, context: any): Promise<any> {
    
    // Aquí es donde reside la lógica de graphql.js
    const result = await graphql({
      schema: executableSchema,
      source: query,
      rootValue: undefined, // Resolvers are already attached to schema
      contextValue: context,  // El contexto (Auth, Servicios)
      variableValues: variables,
    });

    return result;
  }
}