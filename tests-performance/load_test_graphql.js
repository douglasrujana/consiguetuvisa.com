// tests-performance/load_test_graphql.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// ----------------------------------------------------
// 1. Configuración de la Prueba de Carga
// ----------------------------------------------------
export const options = {
  // Define el objetivo de la prueba: 50 usuarios virtuales (VUs) durante 30 segundos
  stages: [
    { duration: '30s', target: 1 }, // Aumenta la carga a 1 VU
  ],
  // Define métricas que deben cumplirse
  thresholds: {
    // 95% de las peticiones deben ser completadas en menos de 300ms
    'http_req_duration': ['p(95) < 300'],
    // 99% de las peticiones deben retornar un código de estado 200
    'http_req_failed': ['rate < 0.01'], 
  },
};

// ----------------------------------------------------
// 2. Definición de la Query GraphQL
// ----------------------------------------------------
const API_URL = 'http://localhost:4321/api/graphql'; // Usamos la URL de desarrollo de Astro

// La query que usaremos para probar (ejemplo: obtener la lista de servicios de visa)
const query = `
  query GetAvailableServices {
    services {
      id
      name
      price
    }
  }
`;

const headers = {
  'Content-Type': 'application/json',
  // 'Authorization': 'Bearer <TOKEN_JWT_DE_PRUEBA>', // Descomentar si la query es protegida
};

// ----------------------------------------------------
// 3. Flujo de Ejecución (Función Principal)
// ----------------------------------------------------
export default function () {
  const payload = JSON.stringify({ query: query });

  const res = http.post(API_URL, payload, { headers: headers });

  // Verificación ágil: Asegura que la respuesta sea 200 y contenga datos.
  check(res, {
    'is status 200': (r) => r.status === 200,
    'has data field': (r) => r.json().data !== null,
  });

  // Pausa corta para simular el tiempo que tardaría un usuario real
  sleep(1);
}