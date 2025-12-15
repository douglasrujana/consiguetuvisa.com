crawling
chuncking
Ratio de handoff a humano
fetch/SSE

Mintlify o Docusaurus


Soluciones por impacto:

| Solución | Impacto | Esfuerzo | |----------|---------|----------| | 1. Cache en memoria | 90% mejora | Bajo | | 2. Llamadas paralelas | 50% mejora | Bajo | | 3. Static Generation (SSG) | 99% mejora | Medio | | 4. Stale-While-Revalidate | 95% mejora | Bajo | | 5. Edge caching (Vercel) | 95% mejora | Bajo |

gRPC: No aplica - Sanity usa REST/GROQ GraphQL: Ya lo usas internamente, no es el problema

Mi recomendación:

Cache con TTL (5-10 min) para datos de Sanity
Llamadas paralelas con Promise.all()
ISR (Incremental Static Regeneration) de Astro
¿Implemento el cache + parallelización? Es lo más rápido y efectivo.

Credits used: 0.67
