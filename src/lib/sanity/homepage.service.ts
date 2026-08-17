// src/lib/sanity/homepage.service.ts
/**
 * ============================================================================
 * HOMEPAGE DATA SERVICE - Con Cache SWR (Stale-While-Revalidate)
 * ============================================================================
 * 
 * OPTIMIZACIÓN DE RENDIMIENTO:
 * 
 * ANTES (sin cache):
 * - 10 llamadas a Sanity CMS
 * - Cada llamada: 2-5 segundos
 * - Total: 20-50 segundos de carga 😱
 * 
 * DESPUÉS (con SWR):
 * - Primera visita: ~5s (carga y cachea)
 * - Visitas siguientes: <100ms (desde cache) 🚀
 * - Revalidación: En background, sin bloquear
 * 
 * ¿POR QUÉ SWR Y NO ISR?
 * - ISR (Incremental Static Regeneration): Regenera cada X minutos
 *   → Editores esperan hasta 5 min para ver cambios ❌
 * 
 * - SWR (Stale-While-Revalidate): Sirve cache, revalida en background
 *   → Editores ven cambios en ~30 segundos ✅
 *   → Usuarios siempre tienen respuesta instantánea ✅
 * 
 * FLUJO:
 * 1. Usuario visita /
 * 2. getHomepageData() revisa cache
 * 3. Si hay cache válido → retorna inmediatamente
 * 4. Si cache está "stale" → retorna cache + revalida en background
 * 5. Si no hay cache → carga de Sanity (solo primera vez)
 * 
 * ============================================================================
 */

import { getHero } from './hero.service';
import { getBenefits } from './benefits.service';
import { getServices } from './services.service';
import { getTestimonials } from './testimonials.service';
import { getSteps } from './steps.service';
import { getTrust } from './trust.service';
import { getTrustLogos } from './trustLogos.service';
import { getFAQ } from './faq.service';
import { getContact } from './contact.service';
import { getSiteSettings } from './siteSettings.service';
import { withSWR } from './cache';

export interface HomepageData {
  hero: Awaited<ReturnType<typeof getHero>>;
  benefits: Awaited<ReturnType<typeof getBenefits>>;
  services: Awaited<ReturnType<typeof getServices>>;
  testimonials: Awaited<ReturnType<typeof getTestimonials>>;
  steps: Awaited<ReturnType<typeof getSteps>>;
  trust: Awaited<ReturnType<typeof getTrust>>;
  trustLogos: Awaited<ReturnType<typeof getTrustLogos>>;
  faq: Awaited<ReturnType<typeof getFAQ>>;
  contact: Awaited<ReturnType<typeof getContact>>;
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
}

/**
 * Carga todos los datos del homepage con cache SWR
 * 
 * ESTRATEGIA DE CACHE:
 * - Cada sección tiene su propia entrada de cache
 * - Permite invalidación granular (ej: solo invalidar hero)
 * - Revalidación independiente por sección
 * 
 * TIEMPOS DE CACHE (configurados en cache.ts):
 * - staleTime: 30s → después de esto, revalida en background
 * - maxAge: 5min → después de esto, fuerza recarga
 */
export async function getHomepageData(): Promise<HomepageData> {
  // Promise.allSettled: si un servicio falla, los otros 9 siguen renderizando.
  const results = await Promise.allSettled([
    withSWR('sanity:hero', getHero),
    withSWR('sanity:benefits', getBenefits),
    withSWR('sanity:services', getServices),
    withSWR('sanity:testimonials', getTestimonials),
    withSWR('sanity:steps', getSteps),
    withSWR('sanity:trust', getTrust),
    withSWR('sanity:trustLogos', getTrustLogos),
    withSWR('sanity:faq', getFAQ),
    withSWR('sanity:contact', getContact),
    withSWR('sanity:settings', getSiteSettings),
  ]);

  // Extraer valor o fallback por posición - cada servicio ya tiene su propio FALLBACK
  const [hero, benefits, services, testimonials, steps, trust, trustLogos, faq, contact, settings] =
    results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.warn(`[Homepage] Sección ${i} falló, usando fallback:`, (r as PromiseRejectedResult).reason);
      return null;
    });

  return {
    hero: hero ?? (await getHero()),
    benefits: benefits ?? (await getBenefits()),
    services: services ?? (await getServices()),
    testimonials: testimonials ?? (await getTestimonials()),
    steps: steps ?? (await getSteps()),
    trust: trust ?? (await getTrust()),
    trustLogos: trustLogos ?? (await getTrustLogos()),
    faq: faq ?? (await getFAQ()),
    contact: contact ?? (await getContact()),
    settings: settings ?? (await getSiteSettings()),
  };
}

/**
 * ALTERNATIVA: Cache a nivel de página completa
 * 
 * Usar si prefieres invalidar todo el homepage de una vez.
 * Menos granular pero más simple.
 * 
 * @example
 * const data = await getHomepageDataCached();
 */
export async function getHomepageDataCached(): Promise<HomepageData> {
  return withSWR('sanity:homepage:all', async () => {
    // Carga todo en paralelo sin cache individual
    const [
      hero,
      benefits,
      services,
      testimonials,
      steps,
      trust,
      trustLogos,
      faq,
      contact,
      settings,
    ] = await Promise.all([
      getHero(),
      getBenefits(),
      getServices(),
      getTestimonials(),
      getSteps(),
      getTrust(),
      getTrustLogos(),
      getFAQ(),
      getContact(),
      getSiteSettings(),
    ]);

    return {
      hero,
      benefits,
      services,
      testimonials,
      steps,
      trust,
      trustLogos,
      faq,
      contact,
      settings,
    };
  });
}
