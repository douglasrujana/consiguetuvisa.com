# Guía de Testing

## Stack de Testing

- **Vitest**: Unit tests y property tests
- **fast-check**: Property-based testing
- **Playwright**: E2E tests (futuro)

## Tipos de Tests

### Unit Tests
Verifican comportamiento específico:

```typescript
// MiFeature.unit.test.ts
describe('MiFeature', () => {
  it('should do something specific', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Property Tests
Verifican propiedades universales:

```typescript
// MiFeature.property.test.ts
import fc from 'fast-check';

/**
 * **Feature: rag-knowledge-system, Property 2: Content Hash Determinism**
 * For any document content, calculating the hash twice should produce identical results.
 */
test('hash is deterministic', () => {
  fc.assert(
    fc.property(fc.string(), (content) => {
      const hash1 = calculateHash(content);
      const hash2 = calculateHash(content);
      return hash1 === hash2;
    })
  );
});
```

## Estructura de Tests

```
src/server/lib/features/chatbot/
├── __tests__/
│   ├── StoreSelector.property.test.ts   # Property tests
│   ├── Conversation.property.test.ts
│   └── Chatbot.unit.test.ts             # Unit tests
```

## Ejecutar Tests

```bash
# Todos los tests
pnpm vitest --run

# Solo property tests
pnpm vitest run --testNamePattern "Property"

# Feature específico
pnpm vitest run src/server/lib/features/chatbot

# Con coverage
pnpm vitest run --coverage
```

## Property Tests del Sistema RAG

| Property | Descripción | Archivo |
|----------|-------------|---------|
| 1 | Source config validation | Source.property.test.ts |
| 2 | Content hash determinism | Document.property.test.ts |
| 3 | Ingestion idempotence | PrismaIngestion.property.test.ts |
| 4 | Ingestion round-trip | PrismaIngestion.property.test.ts |
| 5 | Vector store persistence | TursoVectorStore.property.test.ts |
| 6 | Similarity search self-match | TursoVectorStore.property.test.ts |
| 7 | Cascade delete integrity | TursoVectorStore.property.test.ts |
| 8 | StoreSelector mode consistency | StoreSelector.property.test.ts |
| 9 | Conversation message round-trip | Conversation.property.test.ts |
| 11 | Complaint detection creates alert | SentimentClassification.property.test.ts |

## Best Practices

### DO ✅

```typescript
// Usar generators de fast-check
fc.property(fc.string(), fc.integer(), (str, num) => {
  // Test con inputs aleatorios
});

// Aislar tests con beforeEach
beforeEach(async () => {
  await cleanupDatabase();
});

// Usar assertions claras
expect(result).toHaveProperty('id');
expect(result.status).toBe('INDEXED');
```

### DON'T ❌

```typescript
// No usar mocks para hacer pasar tests
const mockDb = { find: () => ({ id: 'fake' }) }; // ❌

// No depender de orden de ejecución
let sharedState; // ❌

// No ignorar errores
try { ... } catch { } // ❌
```

## Debugging Tests

```bash
# Ver output detallado
pnpm vitest run --reporter=verbose

# Solo tests fallidos
pnpm vitest run --reporter=verbose 2>&1 | grep -A 10 "FAIL"

# Con logs
DEBUG=* pnpm vitest run
```
