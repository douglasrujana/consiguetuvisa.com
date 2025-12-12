# Debug & Legacy Tests

> ⚠️ Esta carpeta contiene tests legacy y herramientas de debugging.
> Los tests principales están en `src/server/lib/**/\__tests__/`

## Contenido

### Tests Legacy (Asesoria Feature)
Tests de la feature Asesoria que necesitan actualización:
- `layer-1-prisma.test.ts`
- `layer-2-repository.test.ts`
- `layer-3-service.test.ts`
- `layer-4-graphql-schema.test.ts`
- `prisma-basic.test.ts`

### E2E Tests
- `e2e/appointment-flow.test.ts` - Flow de citas

### Performance Tests (k6)
```bash
# Ejecutar test de carga
k6 run debug/tests-performance/load_test_graphql.js
```

### HTTP Tests
- `test.http` - Requests para VS Code REST Client

## Nota
Para ejecutar solo los tests del sistema RAG (sin legacy):
```bash
pnpm vitest run src/server/lib --reporter=verbose
```
