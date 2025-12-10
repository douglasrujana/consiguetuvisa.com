# Proyecto: Ruleta Loca - ConsigueTuVisa.com

## Estado Actual: ✅ Implementación Completa

### Resumen
Sistema de gamificación para marketing con **Ruleta de Premios** para captura de leads en agencia de viajes.

---

## Arquitectura Implementada

### Backend (Clean Architecture)
```
src/server/lib/features/promo/
├── Promo.entity.ts       # Entidades: Campaign, Prize, Participation
├── Promo.dto.ts          # Validación Zod
├── Promo.port.ts         # Interfaces/Puertos
├── Campaign.repository.ts # Repositorio Sanity
├── Participation.repository.ts # Repositorio Prisma
├── Promo.service.ts      # Lógica de sorteo, probabilidades
├── Promo.graphql.ts      # Queries y Mutations
└── index.ts              # Exportaciones
```

### Sanity Schemas (CMS)
```
sanity/schemas/documents/
├── campaign.ts    # Campaña (fechas, país, premios, TDC)
├── prize.ts       # Premio (nombre, probabilidad, inventario, color)
└── cardBrand.ts   # Marcas TDC (Visa, Mastercard, Diners, Amex)
```

### Prisma Model
- `Participation` en `prisma/schema.prisma` - Guarda participaciones, códigos de premio, estado

### Componentes Svelte
```
src/components/promo/
├── SpinWheel.svelte         # Ruleta animada (core reutilizable)
├── CardSelector.svelte      # Selector de logos TDC
├── ParticipationForm.svelte # Formulario de registro
├── PrizeReveal.svelte       # Modal de premio
└── index.ts
```

### Páginas
```
src/pages/
├── sorteo/[campaign].astro  # Landing completa (form + ruleta + CRM)
└── kiosko/
    ├── [campaign].astro     # Modo kiosko conectado a Sanity
    └── demo.astro           # ⭐ MODO STANDALONE (100% independiente)
```

---

## Modo Kiosko Standalone (`/kiosko/demo`)

### Características Actuales
- ✅ 100% independiente (sin Sanity, sin backend)
- ✅ Diseño premium navideño con glassmorphism
- ✅ Layout horizontal: Ruleta izquierda + Panel premio derecha
- ✅ Branding ConsigueTuVisa.com
- ✅ Título: "¡TE PONEMOS A VIAJAR!"
- ✅ Luces LED animadas alrededor
- ✅ Partículas de nieve
- ✅ Texto vertical en segmentos
- ✅ Panel de premio con código único
- ✅ Botones compartir: Facebook, WhatsApp
- ✅ Copiar código al portapapeles

### Sonidos (Mixkit CDN)
```javascript
const sounds = {
  start: 'click al presionar JUGAR',
  spin: 'suspenso mientras gira',
  win: 'escándalo/fanfarria al ganar',
  lose: 'sad trombone al perder'
};
```

### Premios Hardcodeados
1. VIAJE GALÁPAGOS (travel)
2. GIFT CARD $100 (giftcard)
3. SIGUE JUGANDO (retry)
4. GIFT CARD $50 (giftcard)
5. ASESORÍA GRATIS (service)
6. SIGUE JUGANDO (retry)
7. DESCUENTO 20% (discount)
8. CENA PARA 2 (dinner)

---

## URLs de Prueba

| Ambiente | URL |
|----------|-----|
| Local | `http://localhost:3000/kiosko/demo` |
| Producción | `https://consiguetuvisa-com.vercel.app/kiosko/demo` |

---

## Flujo del Usuario (Landing `/sorteo/[campaign]`)

1. Usuario llega a `/sorteo/navidad-2025`
2. Ve intro + credenciales de la agencia
3. Selecciona logos de TDC (1 logo = 1 intento)
4. Ingresa: nombre, email, WhatsApp
5. Acepta términos
6. Gira la ruleta (animación)
7. Ve premio ganado + código único
8. Recibe email con detalles
9. Lead llega al CRM
10. Agente llama para verificar y entregar

---

## GraphQL API

### Queries
- `campaign(slug)` - Obtener campaña
- `campaigns(country)` - Listar campañas activas
- `calculateSpins(campaignId, selectedCards)` - Calcular giros
- `campaignStats(campaignId)` - Estadísticas

### Mutations
- `createParticipation(input)` - Registrar participación
- `spin(participationId)` - Girar ruleta
- `verifyPrize(prizeCode)` - Verificar premio (admin)
- `deliverPrize(prizeCode)` - Entregar premio (admin)

---

## Pendientes / Ideas Futuras

- [ ] Raspadita digital (alternativa a ruleta)
- [ ] PWA para modo offline en kiosko
- [ ] Integración email (Resend)
- [ ] Integración CRM (HubSpot/Bitrix)
- [ ] Dashboard admin de participaciones
- [ ] Sonidos locales en `/public/sounds/`

---

## Notas Técnicas

- Stack: Astro 5 + Svelte 5 + Tailwind 4
- CMS: Sanity
- DB: Prisma + SQLite/Turso
- Deploy: Vercel
- Dependencias: bits-ui, tailwind-variants, nanoid
