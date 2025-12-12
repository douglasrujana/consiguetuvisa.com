// src/server/graphql/server.ts
// This file is now only for exporting the raw GraphQL schema parts
// without instantiating any server.
// src/server/graphql/schema.ts
// ORQUESTADOR DEL ESQUEMA GRAPHQL (SCHEMA MERGER)
// Fusiona los esquemas de todas las features en un único Schema ejecutable.

/**
 * GraphQL Schema Definition
 * Type Definitions y Resolvers
 * Aquí definimos los tipos GraphQL, queries y mutations.
 * Definimos el esquema GraphQL utilizando SDL (Schema Definition Language).
 * Aquí se describen los tipos, queries y mutations disponibles en la API.
 */

import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'; 
import { gql } from 'graphql-tag';
// Importamos las features
import {
    asesoriaTypeDefs,
    asesoriaResolvers
} from '../lib/features/asesoria/Asesoria.graphql';
import {
    pageTypeDefs,
    pageResolvers
} from '../lib/features/page/Page.graphql';
import {
    blogTypeDefs,
    blogResolvers
} from '../lib/features/blog/Blog.graphql';
import {
    promoTypeDefs,
    promoResolvers
} from '../lib/features/promo/Promo.graphql';
import {
    knowledgeTypeDefs,
    knowledgeResolvers
} from '../lib/features/knowledge/Knowledge.graphql';
import {
    alertTypeDefs,
    alertResolvers
} from '../lib/features/alerts/Alert.graphql';

// ----------------------------------------------------------------------
// 1. DEFINICIONES BASE DEL SISTEMA
// ----------------------------------------------------------------------

/**
 * Los tipos base contienen los puntos de entrada (Query y Mutation).
 * Las features individuales usan 'extend type' para añadirse a estos.
 */
const baseTypeDefs = gql`
  # Siempre necesita una Query y una Mutation raíz
  type Query {
    # Query de ejemplo para la salud del servicio
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
`;

// ----------------------------------------------------------------------
// 2. FUSIÓN DE TYPE DEFS
// ----------------------------------------------------------------------

/**
 * Fusionamos la definición base con las definiciones de todas las features.
 */
export const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  asesoriaTypeDefs,
  pageTypeDefs,
  blogTypeDefs,
  promoTypeDefs,
  knowledgeTypeDefs,
  alertTypeDefs,
]);

// ----------------------------------------------------------------------
// 3. FUSIÓN DE RESOLVERS
// ----------------------------------------------------------------------

/**
 * Fusionamos la lógica de Resolvers de todas las features.
 */
export const resolvers = mergeResolvers([
  asesoriaResolvers,
  pageResolvers,
  blogResolvers,
  promoResolvers,
  knowledgeResolvers,
  alertResolvers,
]);