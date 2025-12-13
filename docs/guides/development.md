# Guía de Desarrollo

## Comandos Útiles

### Git

```bash

git status --short

# Pull con rebase (historial limpio)
git pull --rebase origin main

# Continuar después de resolver conflictos
git rebase --continue
```
Write-Host "Esperando deploy..."; Start-Sleep -Seconds 50

Invoke-RestMethod -Uri "https://consiguetuvisa-com.vercel.app/api/chat" -Method GET -TimeoutSec 120 | ConvertTo-Json


### Testing

```bash
# Ejecutar todos los tests
pnpm vitest --run

# Tests específicos
pnpm vitest run src/server/lib/features/chatbot

# Tests con verbose
pnpm vitest run --reporter=verbose

# Excluir carpeta debug
pnpm vitest --run --exclude "debug/**"

# Tests en paralelo (cuidado con DB)
pnpm vitest --run --no-file-parallelism --pool=forks
```

### TypeScript

```bash
# Verificar tipos
npx tsc --noEmit --skipLibCheck

# Verificar archivo específico
npx tsc --noEmit --skipLibCheck src/pages/api/chat/index.ts

# Primeros 50 errores
npx tsc --noEmit --skipLibCheck 2>&1 | Select-Object -First 50
```

### Astro

```bash
# Check de Astro
npx astro check --minimumSeverity error

# Svelte check
npx svelte-check --workspace src/components/chat


npx astro check --minimumSeverity error 2>&1 | Select-Object -First 50
```

### Build
---build
pnpm build 2>&1 | Select-Object -First 60
---

### Base de Datos

```bash
# Limpiar DB de test
if (Test-Path test.db) { Remove-Item test.db -Force }

# Regenerar cliente Prisma
pnpm prisma generate

# Nueva migración
pnpm prisma migrate dev --name nombre_migracion

# Reset completo
pnpm prisma migrate reset

pnpm prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --config ""

pnpm tsx prisma/seed-knowledge.ts

```

powershell -ExecutionPolicy Bypass -File scripts/turso-migrate.ps1

## Estructura de un Feature

```
src/server/lib/features/mi-feature/
├── MiFeature.entity.ts      # Tipos y entidades
├── MiFeature.dto.ts         # Validación Zod
├── MiFeature.port.ts        # Interfaces
├── MiFeature.repository.ts  # Acceso a datos
├── MiFeature.service.ts     # Lógica de negocio
├── MiFeature.graphql.ts     # Resolvers GraphQL
├── __tests__/
│   ├── MiFeature.unit.test.ts
│   └── MiFeature.property.test.ts
└── index.ts                 # Exports públicos
```

## Convenciones

### Naming

- **Archivos**: PascalCase para clases, kebab-case para configs
- **Interfaces**: Prefijo `I` (ej: `IVectorStore`)
- **Types**: Sin prefijo (ej: `SourceConfig`)
- **Tests**: `.test.ts` o `.property.test.ts`

### Imports

```typescript
// Usar path aliases
import { RAGService } from '@core/rag';
import { ChatbotService } from '@features/chatbot';

// NO usar paths relativos largos
// ❌ import { RAGService } from '../../../core/rag';
```

### Error Handling

```typescript
// Usar errores de dominio
import { DomainError } from '@core/error/Domain.error';

class SourceNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Source not found: ${id}`);
  }
}
```

## Debugging

### Logs

```typescript
// Usar prefijos para identificar módulo
console.log('[RAGService] Processing query:', query);
console.log('[PrismaIngestion] Created document:', doc.id);
```

### VS Code

Configuración recomendada en `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "editor.formatOnSave": true
}
```
