<script lang="ts">
  // src/components/ui/AnimatedCounter.svelte
  // Contador animado que incrementa al entrar en viewport
  
  import { onMount } from 'svelte';
  
  export let value: string;
  export let duration: number = 2000;
  
  let displayValue = '0';
  let element: HTMLElement;
  
  // Extraer número y sufijo (ej: "500+" -> 500, "+")
  function parseValue(val: string): { num: number; prefix: string; suffix: string } {
    const match = val.match(/^([^\d]*)(\d+)(.*)$/);
    if (match) {
      return { prefix: match[1], num: parseInt(match[2]), suffix: match[3] };
    }
    return { prefix: '', num: 0, suffix: val };
  }
  
  function animateCount(target: number, prefix: string, suffix: string) {
    const startTime = performance.now();
    const startValue = 0;
    
    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (target - startValue) * eased);
      
      displayValue = `${prefix}${current.toLocaleString('es-EC')}${suffix}`;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        displayValue = value; // Asegurar valor final exacto
      }
    }
    
    requestAnimationFrame(update);
  }
  
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const { num, prefix, suffix } = parseValue(value);
            animateCount(num, prefix, suffix);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    if (element) {
      observer.observe(element);
    }
    
    return () => observer.disconnect();
  });
</script>

<span bind:this={element} class="tabular-nums">{displayValue}</span>
