# Getting Started

## Requisitos

- Node.js 20+
- pnpm 9+
- Cuenta en Vercel, Clerk, y Turso

## Instalación

```bash
# Clonar e instalar
git clone <repo>
cd consiguetuvisa.com
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
```

## Variables de Entorno

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth (Clerk)
PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# AI (Gemini)
GEMINI_API_KEY=

# Storage
STORAGE_PROVIDER=local  # local | vercel | r2

# Chat
CHAT_STORAGE_MODE=smart  # memory-only | persist-all | smart
```

## Comandos

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo
pnpm vercel-dev       # Desarrollo con Vercel CLI (recomendado para API)

# Base de datos
pnpm prisma generate  # Generar cliente Prisma
pnpm prisma migrate dev  # Ejecutar migraciones
pnpm prisma studio    # UI de base de datos

# Testing
pnpm test             # Ejecutar tests
pnpm test:watch       # Tests en modo watch

# Build
pnpm build            # Build de producción
pnpm preview          # Preview del build
```

## Primer Paso: Verificar Setup

```bash
# 1. Iniciar servidor
pnpm dev

# 2. Verificar API
curl http://localhost:4321/api/hello

# 3. Probar GraphQL
# Abrir http://localhost:4321/api/graphql
```

## Troubleshooting

### Error: PrismaClient not generated
```bash
pnpm prisma generate
```

### Error: Database not found
```bash
pnpm prisma migrate dev
```

### API Routes no funcionan con `pnpm dev`
Usar `pnpm vercel-dev` para desarrollo de API routes.
