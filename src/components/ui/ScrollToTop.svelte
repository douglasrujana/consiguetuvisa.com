<script lang="ts">
  // ScrollToTop.svelte - Botón lateral para scroll al inicio
  import { onMount } from 'svelte';
  
  let visible = $state(false);
  
  function handleScroll() {
    visible = window.scrollY > 400;
  }
  
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  onMount(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

{#if visible}
  <button
    onclick={scrollToTop}
    class="fixed right-0 top-1/2 -translate-y-1/2 z-40 group"
    aria-label="Volver arriba"
  >
    <div class="bg-brand-secondary hover:bg-brand-accent text-white px-2 py-4 rounded-l-xl shadow-lg transition-all duration-300 hover:px-3 flex flex-col items-center gap-1">
      <!-- Arrow up icon -->
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2.5" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="group-hover:-translate-y-1 transition-transform"
      >
        <path d="M18 15l-6-6-6 6"/>
      </svg>
      
      <!-- Vertical text -->
      <span class="text-xs font-semibold tracking-wider" style="writing-mode: vertical-rl; text-orientation: mixed;">
        SUBIR
      </span>
    </div>
  </button>
{/if}
