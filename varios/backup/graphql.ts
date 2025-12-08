// src/pages/api/graphql.ts
import type { APIRoute } from 'astro';
import { graphql, buildSchema } from 'graphql';
import { typeDefs, resolvers } from '../../server/graphql/server';

const schema = buildSchema(typeDefs);

export const ALL: APIRoute = async ({ request }) => {
  if (request.method === 'POST') {
    try {
      const { query, variables } = await request.json();
      const response = await graphql({ schema, source: query, rootValue: resolvers, variableValues: variables });
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('GraphQL Error:', error);
      return new Response(JSON.stringify({ errors: [{ message: error.message || 'Internal Server Error' }] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else if (request.method === 'GET') {
    return new Response('GraphQL endpoint. Use POST with your GraphQL query.', { status: 405 });
  }

  return new Response('Method Not Allowed', { status: 405 });
};