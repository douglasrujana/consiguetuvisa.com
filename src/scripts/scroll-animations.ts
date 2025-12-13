// src/scripts/scroll-animations.ts
// Script para activar animaciones cuando los elementos entran en viewport

export function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Dejar de observar después de animar (solo anima una vez)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1, // Activa cuando 10% del elemento es visible
      rootMargin: '0px 0px -50px 0px', // Activa un poco antes de que sea completamente visible
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// Auto-inicializar cuando el DOM está listo
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}
