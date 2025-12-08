<script lang="ts">
  // Countdown.svelte - Contador regresivo para ofertas
  import { onMount, onDestroy } from 'svelte';
  
  // Fecha límite: 24 de Diciembre 2025 a las 23:59
  const targetDate = new Date('2025-12-24T23:59:59').getTime();
  
  let days = $state(0);
  let hours = $state(0);
  let minutes = $state(0);
  let seconds = $state(0);
  let expired = $state(false);
  
  let interval: ReturnType<typeof setInterval>;
  
  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    if (distance < 0) {
      expired = true;
      clearInterval(interval);
      return;
    }
    
    days = Math.floor(distance / (1000 * 60 * 60 * 24));
    hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((distance % (1000 * 60)) / 1000);
  }
  
  onMount(() => {
    updateCountdown();
    interval = setInterval(updateCountdown, 1000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

{#if !expired}
  <div class="flex justify-center gap-3 md:gap-4">
    <div class="countdown-box">
      <div class="countdown-number">{String(days).padStart(2, '0')}</div>
      <div class="countdown-label">Días</div>
    </div>
    <div class="countdown-box">
      <div class="countdown-number">{String(hours).padStart(2, '0')}</div>
      <div class="countdown-label">Horas</div>
    </div>
    <div class="countdown-box">
      <div class="countdown-number">{String(minutes).padStart(2, '0')}</div>
      <div class="countdown-label">Min</div>
    </div>
    <div class="countdown-box">
      <div class="countdown-number">{String(seconds).padStart(2, '0')}</div>
      <div class="countdown-label">Seg</div>
    </div>
  </div>
{:else}
  <div class="text-center text-white text-xl font-semibold">
    ¡La oferta ha terminado!
  </div>
{/if}
