# Guía de Deployment

## Plataforma

El proyecto está configurado para **Vercel** con:
- Astro SSR adapter
- Serverless Functions para API
- Edge Functions (opcional)

## Configuración

### vercel.json

```json
{
  "framework": "astro",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist"
}
```

### Variables de Entorno en Vercel

```
# Database (Turso)
DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Auth (Clerk)
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# AI
GEMINI_API_KEY=...

# Storage
STORAGE_PROVIDER=vercel
BLOB_READ_WRITE_TOKEN=...

# Notifications
RESEND_API_KEY=...
ALERT_EMAIL_TO=admin@consiguetuvisa.com
```

## Comandos de Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Ver logs
vercel logs

# Ver deployments
vercel ls
```

## CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Base de Datos

### Turso (Producción)

```bash
# Crear database
turso db create consiguetuvisa

# Obtener URL
turso db show consiguetuvisa --url

# Crear token
turso db tokens create consiguetuvisa
```

### Migraciones

```bash
# Aplicar migraciones en producción
DATABASE_URL=libsql://... pnpm prisma migrate deploy
```

## Monitoreo

### Vercel Analytics
Habilitado automáticamente para:
- Web Vitals
- Serverless Function duration
- Error tracking

### Logs
```bash
# Ver logs en tiempo real
vercel logs --follow

# Filtrar por función
vercel logs --filter api/graphql
```

## Rollback

```bash
# Listar deployments
vercel ls

# Promover deployment anterior
vercel promote <deployment-url>
```

## Checklist Pre-Deploy

- [ ] Tests pasan (`pnpm test`)
- [ ] Build exitoso (`pnpm build`)
- [ ] Variables de entorno configuradas
- [ ] Migraciones de DB aplicadas
- [ ] Preview deployment verificado
