// Test Layer 4: GraphQL Schema Compilation
// Objetivo: Verificar que el schema de GraphQL se compila correctamente

import { describe, it, expect } from 'vitest';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs, resolvers } from '../src/server/graphql/schema';

describe('Layer 4: GraphQL Schema Compilation', () => {
  it('should have valid typeDefs', () => {
    expect(typeDefs).toBeDefined();
    expect(typeof typeDefs).toBe('object');
  });

  it('should have valid resolvers', () => {
    expect(resolvers).toBeDefined();
    expect(typeof resolvers).toBe('object');
  });

  it('should compile schema without errors', () => {
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });
    expect(schema).toBeDefined();
    expect(schema.getQueryType()).toBeDefined();
    expect(schema.getMutationType()).toBeDefined();
  });

  it('should have citasUsuario query in schema', () => {
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const queryType = schema.getQueryType();
    const fields = queryType?.getFields();
    expect(fields).toBeDefined();
    expect(fields?.citasUsuario).toBeDefined();
  });
});
