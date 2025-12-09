Intro del serteo
- mini seccion para jugar se aplican condiciones ser usario mínimo de una tdc y aclarar que no se piden datos,
sensibles para que el usuario no se visagee, proceso sencillo, rapido y transparente, premio se entrega en el email. El usario reibe todo los datps de la agencia: direccion, foto del local, telefono, RUC, pagina web todo lo que ayude a crear credebilidad. (mockear y paraemtrizar, se cambia segun ambiente de desarrollo)

¿Qué datos capturas del usuario?
- nombre, email, whatsapp
- TDC: solo se muestran los logo tipos estilo boton: Visa, Master Card, Dinners, Discovery American ExPress: 
mercado ecuatariono. El usuario hace clik solamnete
Límite de intentos por email
Verificación por email despues de jugar y paryicipar

 
## Probabilidades por premio
Inventario (ej: solo 5 viajes disponibles a galapago, boloeto aereos  cenas para dos personas, gifcard de consumo en viajes: 
20$, 50$ 100%, aseosrias gratis)
Fechas de vigencia
¿Cómo validas las tarjetas de crédito?: una persona llamara al lead para verificar via telefono y agendar entrega de premios 
- cual premio ganar configurable: 

dedes ssugerirme siempre cosas que yo omita y se deban usar 
(todo deberia ser parametrizado para campañas internaconales, paises, marcas de tdc, whatsapp y todo lo que intervenga).

¿El usuario sube foto del logo? = NO
¿Selecciona de una lista (Visa, Mastercard, Amex, Dinrers)? una fila cono todos los logos y sus avriantes: dorada, negra ect debes averiguar el sistema de tdc en el ecuador.
¿Solo declara cuántas tiene? = si el usuario elije marcando la ocpion 
¿Necesitas anti-fraude? = NO

¿Nombre + teléfono + email? = SI
¿Se integra con tu CRM (HubSpot)? = si el dato llega al crm agnostico (por definir crm aun)
¿Los premios son configurables desde Sanity? = SI totalmente

te tengo un nueo reto conces la ruleta y la raspadita loca ? usada en markating para sorteos, premio y puejos adpara a premios de biajes, aseosria gratis, gigcard d econsumo en nustra agencia de vaijes  de varios precios, participa teneindo tarjetas de ccredito miestra smas logos tengas mas intentos tienen dine que sabes ?

Kiro
Sí, conozco perfectamente esas mecánicas de gamificación para marketing. Son muy efectivas para captar leads y engagement.

Lo que entiendo del reto:

Ruleta de premios - El usuario gira y gana algo (viajes, asesoría gratis, gift cards)
Raspadita digital - Raspa con el dedo/mouse para revelar premio
Mecánica de intentos - Más logos de tarjetas de crédito = más oportunidades de jugar
Premios variados - Desde asesoría gratis hasta viajes completos
Preguntas antes de diseñar:

¿Dónde vivirá esto?

¿Landing page independiente (/sorteo o /ruleta)?
¿Pop-up en el homepage?
¿Ambos?
¿Qué datos capturas del usuario?

¿Solo email?
¿Nombre + teléfono + email?
¿Se integra con tu CRM (HubSpot)?
¿Los premios son configurables desde Sanity?

Probabilidades por premio
Inventario (ej: solo 5 viajes disponibles)
Fechas de vigencia
¿Cómo validas las tarjetas de crédito?

¿El usuario sube foto del logo?
¿Selecciona de una lista (Visa, Mastercard, Amex, Diners)?
¿Solo declara cuántas tiene?
¿Necesitas anti-fraude?

Límite de intentos por IP/email
Verificación por email antes de jugar
Respóndeme estas preguntas y te diseño la arquitectura + implementación completa.

Credits used: 1.15
Elapsed time: 38s
Checkpoint
Restore

#Current File que opinas de este aproach te doy un emeplo  que opina de la ruleta loca

Kiro
Me gusta el approach. La imagen de Easypromos es exactamente el concepto. Analizo y te doy mi opinión:

Tu approach: 8.5/10 ✅

Lo que está bien:

Parametrizable por campaña/país (escalable)
Sin datos sensibles de TDC (solo logos = confianza)
Verificación humana post-juego (evita fraude sin fricción)
Premios en Sanity (marketing puede cambiar sin deploy)
Integración CRM agnóstica (futuro-proof)
Lo que agregaría:

| Elemento | Por qué | |----------|---------| | Términos y condiciones | Legal obligatorio en Ecuador | | Política de privacidad | RGPD/LOPDP compliance | | Fecha de expiración del premio | Evita reclamos eternos | | Código único de premio | Para validar en llamada telefónica | | Historial de participaciones | Para auditoría y reportes | | Sonidos/animación | Aumenta engagement 40%+ |

Sistema de TDC en Ecuador:

| Marca | Variantes comunes | |-------|-------------------| | Visa | Clásica, Gold, Platinum, Signature, Infinite | | Mastercard | Clásica, Gold, Platinum, Black, World Elite | | Diners Club | Clásica, Gold, Black | | American Express | Green, Gold, Platinum | | Discover | Poco común en Ecuador |

Bancos emisores principales: Pichincha, Guayaquil, Pacífico, Produbanco, Bolivariano, Internacional.

Arquitectura propuesta:

src/server/lib/features/
└── promo/
    ├── Promo.entity.ts       # Campaign, Prize, Participation
    ├── Promo.dto.ts          # Validación Zod
    ├── Promo.port.ts         # IPromoRepository
    ├── Promo.repository.ts   # Prisma (participaciones) + Sanity (config)
    ├── Promo.service.ts      # Lógica de sorteo, probabilidades
    ├── Promo.graphql.ts      # Mutations: participate, spin
    └── index.ts

sanity/schemas/documents/
├── campaign.ts              # Campaña (fechas, país, activa)
├── prize.ts                 # Premio (nombre, probabilidad, inventario)
└── cardBrand.ts             # Marcas TDC por país

src/pages/
└── sorteo/
    └── [campaign].astro     # /sorteo/navidad-2025

src/components/promo/
├── SpinWheel.svelte         # Ruleta animada
├── CardSelector.svelte      # Selector de logos TDC
├── PrizeReveal.svelte       # Animación de premio
└── ParticipationForm.svelte # Formulario
Flujo del usuario:

1. Usuario llega a /sorteo/navidad-2025
2. Ve intro + credenciales de la agencia
3. Selecciona logos de TDC que tiene (1 logo = 1 intento)
4. Ingresa: nombre, email, WhatsApp
5. Acepta términos
6. Gira la ruleta (animación)
7. Ve premio ganado + código único
8. Recibe email con detalles
9. Lead llega al CRM
10. Agente llama para verificar y entregar
¿Procedemos con la implementación?

Te sugiero empezar por:

Schemas de Sanity (campaign, prize, cardBrand)
Feature promo en Clean Architecture
Componente de ruleta (Svelte para animación fluida)
Página del sorteo
¿Aprobado?

Credits used: 1.29
Elapsed time: 1m 28s
Checkpoint
Restore
etoy enredado en la aruitectuta la ruleta loca sera independonete o anclada au landig, ejemplo ruleta+landig ?la ruleta loca tambie  la quiere usar independote en un cecntro comercal los promores usando una lato hacen girar la ruleta loca es idependoente, que opinas d eusar https://www.shadcn-svelte.com/

Kiro
Excelente pregunta. Tienes dos casos de uso diferentes:

Análisis de los escenarios:

| Escenario | Contexto | Necesidades | |-----------|----------|-------------| | Landing + Ruleta | Usuario en casa, web | Formulario completo, email, CRM | | Ruleta standalone | Centro comercial, tablet/laptop | Solo girar, promotor captura datos después |

Mi recomendación: Componente modular

src/components/promo/
├── SpinWheel.svelte          # 🎯 CORE - Solo la ruleta (reutilizable)
├── PromoLanding.astro        # Landing completa (form + ruleta + info)
├── PromoKiosk.astro          # Modo kiosko (solo ruleta, pantalla completa)
├── CardSelector.svelte       # Selector de TDC
├── PrizeReveal.svelte        # Animación premio
└── ParticipationForm.svelte  # Formulario

src/pages/
├── sorteo/
│   └── [campaign].astro      # /sorteo/navidad-2025 (landing completa)
└── kiosko/
    └── [campaign].astro      # /kiosko/navidad-2025 (modo promotor)
Modo Kiosko (centro comercial):

Pantalla completa, sin distracciones
Solo ruleta + botón girar
Promotor registra datos en otra pantalla/app
Puede funcionar offline (PWA)
Sobre shadcn-svelte: 9/10 ✅

Ventajas:

Componentes accesibles (a11y)
Tailwind nativo (ya lo usas)
Copy-paste, no dependencia
Svelte = performance brutal
Consistente con tu design system
Lo usaría para:

Formularios (Input, Select, Checkbox)
Modales (Dialog)
Toasts (notificaciones)
Buttons, Cards
NO lo usaría para:

La ruleta (custom, necesitas canvas/SVG animado)
Animaciones complejas (usar Svelte transitions + CSS)
Arquitectura final propuesta:

┌─────────────────────────────────────────────────────────┐
│                    SpinWheel.svelte                      │
│              (Componente core reutilizable)              │
│         Props: prizes[], onSpin(), disabled              │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────────┐     ┌───────────────────┐
│  PromoLanding     │     │   PromoKiosk      │
│  /sorteo/[camp]   │     │  /kiosko/[camp]   │
├───────────────────┤     ├───────────────────┤
│ - Info agencia    │     │ - Pantalla full   │
│ - Form completo   │     │ - Solo ruleta     │
│ - TDC selector    │     │ - Botón grande    │
│ - Términos        │     │ - Modo offline    │
│ - Email + CRM     │     │ - PIN promotor    │
└───────────────────┘     └───────────────────┘
¿Instalamos shadcn-svelte y empezamos?

pnpm add -D bits-ui clsx tailwind-variants
¿Aprobado el approach?














