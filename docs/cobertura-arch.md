Aspecto Cubierto,Solución Adoptada,Riesgo Mitigado (Deuda Técnica)
Arquitectura Central,Clean Architecture (Patrón Feature-based),Elimina el código espagueti y hace que la lógica de negocio sea testeable.
Separación de Capas,Monorepo Lógico (/src vs. /src/server),Garantiza que el Frontend (Astro) y el Backend (Express) sean totalmente independientes.
Rendimiento,JAMstack (Astro/Vercel),Elimina los problemas de velocidad de carga y reduce los costos de hosting.
Vendor Locking (Nube),Serverless Framework + Express,Permite cambiar de Vercel a AWS o Netlify sin reescribir la lógica de la API.
Vendor Locking (Auth),Patrón Adapter (IAuthService.ts),Permite cambiar de Supabase Auth a Clerk sin modificar la lógica de negocio.
Calidad de Datos,Zod + DTOs,Previene bugs por datos malformados y garantiza el contrato entre capas.
Pruebas y QA,"Vitest, Playwright, JSDoc",Permite una estrategia de TDD (Desarrollo Guiado por Pruebas) y asegura el comportamiento de la aplicación antes de cada deployment.
Manejo de Errores,Sentry,Asegura la observabilidad. Sabrán inmediatamente cuando un error afecte a los usuarios en producción.
Estrategia de Datos,Sanity (Contenido) + Supabase (Transacciones),"Separa la gestión del contenido (marketing) de la gestión de datos críticos (citas, usuarios)."