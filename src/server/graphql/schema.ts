// src/server/graphql/server.ts
// This file is now only for exporting the raw GraphQL schema parts
// without instantiating any server.

export const typeDefs = `#graphql
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

export const resolvers = {
  Query: {
    services: () => [
      { id: 1, name: 'Visa Turista Mock', price: 50.00 },
      { id: 2, name: 'Visa Estudiante Mock', price: 100.00 },
    ],
    health: () => "OK - GraphQL Server is live!",
  },
};
