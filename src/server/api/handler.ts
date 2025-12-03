// src/server/api/handler.ts

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { json } from 'body-parser';

// --- (Paso 1: Definición del Schema) ---
// **NOTA:** ESTO ES SOLO UN MOCK. Lo reemplazaremos por el real.
const typeDefs = `#graphql
  type Service {
    id: ID!
    name: String!
    price: Float!
  }
  type Query {
    services: [Service]
    health: String
  }
`;

// --- (Paso 2: Definición de los Resolvers) ---
// **NOTA:** ESTO ES SOLO UN MOCK. Lo reemplazaremos por la lógica de negocio.
const resolvers = {
  Query: {
    services: () => [
      { id: 1, name: 'Visa Turista Mock', price: 50.00 },
      { id: 2, name: 'Visa Estudiante Mock', price: 100.00 },
    ],
    health: () => "OK - GraphQL Server is live!",
  },
};

// 1. Inicializar Apollo Server (Standalone Architecture)
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// 2. Crear la app de Express para el middleware (Auth/Health Check)
const app = express();
app.use(json());

// Montar el Apollo Server como middleware en Express
app.use(
  '/api/graphql', // El endpoint que Astro nos dará
  expressMiddleware(server, {
    context: async ({ req }) => {
      // **Aquí es donde inyectaremos el Auth Adapter**
      // const user = await authAdapter.getUser(req.headers.authorization);
      return { token: req.headers.authorization };
    },
  }),
);

// Agregar el Health Check de Express (para K6 en una prueba simple)
app.get('/api/health', (req, res) => {
  res.status(200).send({ status: 'OK' });
});

// Exportar la instancia de Express para que Astro la pueda montar
export const handler = app;