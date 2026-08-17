// src/scripts/scroll-animations.ts
// Activador resiliente de animaciones al hacer scroll (compatible con Astro ViewTransitions)

export function initScrollAnimations() {
  if (typeof window === 'undefined') return;

  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  // Si el navegador no soporta IntersectionObserver, revelar todo de inmediato
  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.05,
      rootMargin: '0px 0px -20px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// Inicialización automática compatible con Astro ViewTransitions y DOM estándar
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initScrollAnimations);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}
