<script lang="ts">
  // src/components/home/TrustLogos.svelte
  // Carrusel de logos usando shadcn-svelte Carousel
  
  import * as Carousel from '$lib/components/ui/carousel/index';
  import { Shield, Lock, Headphones, BadgeCheck } from 'lucide-svelte';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context';
  // @ts-ignore - embla-carousel-autoplay types
  import Autoplay from 'embla-carousel-autoplay';
  
  // Props
  interface Props {
    logos?: { name: string; imageUrl: string }[];
    autoplay?: boolean;
    autoplayDelay?: number;
  }
  
  let { 
    logos = [], 
    autoplay = true,
    autoplayDelay = 3000 
  }: Props = $props();
  
  // Fallback logos
  const defaultLogos = [
    { name: 'Visa', imageUrl: '/images/payments/visa.svg' },
    { name: 'Mastercard', imageUrl: '/images/payments/mastercard.svg' },
    { name: 'Mastercard Produbanco', imageUrl: '/images/payments/classic_mastercard-produbanco.png' },
    { name: 'American Express', imageUrl: '/images/payments/amex.svg' },
    { name: 'PayPal', imageUrl: '/images/payments/paypal.svg' },
    { name: 'Diners Club', imageUrl: '/images/payments/diners.svg' },
  ];
  
  const displayLogos = $derived(logos.length > 0 ? logos : defaultLogos);
  
  // Plugins condicionales
  const plugins = $derived(
    autoplay 
      ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
      : []
  );
  
  // Badges minimalistas
  const badges = [
    { label: 'Datos Protegidos', Icon: Lock },
    { label: 'Pago Seguro', Icon: Shield },
    { label: 'Soporte 24/7', Icon: Headphones },
    { label: 'Verificado', Icon: BadgeCheck },
  ];
  
  // Carousel state
  let api: CarouselAPI | undefined = $state(undefined);
  let selectedIndex = $state(0);
  
  function handleApiInit(newApi: CarouselAPI) {
    api = newApi;
  }
  
  $effect(() => {
    if (api) {
      api.on('select', () => {
        selectedIndex = api!.selectedScrollSnap();
      });
    }
  });
</script>

<section class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    
    <!-- Badges -->
    <div class="flex flex-wrap justify-center gap-8 md:gap-16 mb-16">
      {#each badges as badge}
        {@const Icon = badge.Icon}
        <div class="flex flex-col items-center gap-3 group">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-500 group-hover:scale-105">
            <Icon class="w-6 h-6 text-slate-600" strokeWidth={1.5} />
          </div>
          <span class="text-sm font-medium text-slate-600 tracking-tight">{badge.label}</span>
        </div>
      {/each}
    </div>
    
    <div class="w-16 h-px bg-slate-200 mx-auto mb-12"></div>
    
    <p class="text-center text-xs font-medium text-slate-400 tracking-[0.2em] uppercase mb-10">
      Métodos de pago aceptados
    </p>
    
    <!-- Carrusel con botones externos -->
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center gap-4 md:gap-8">
        <!-- Prev -->
        <button
          type="button"
          onclick={() => api?.scrollPrev()}
          class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <svg class="w-4 h-4 md:w-5 md:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <!-- Carousel -->
        <div class="flex-1 overflow-hidden">
          <Carousel.Root
            opts={{ align: 'start', loop: true }}
            {plugins}
            setApi={handleApiInit}
            class="w-full"
          >
            <Carousel.Content class="-ml-4">
              {#each displayLogos as logo}
                <Carousel.Item class="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
                  <div class="h-24 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-center p-4 hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all duration-500 group">
                    <img 
                      src={logo.imageUrl} 
                      alt={logo.name}
                      class="h-10 w-auto max-w-full object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </div>
                </Carousel.Item>
              {/each}
            </Carousel.Content>
          </Carousel.Root>
        </div>
        
        <!-- Next -->
        <button
          type="button"
          onclick={() => api?.scrollNext()}
          class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <svg class="w-4 h-4 md:w-5 md:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <!-- Indicadores -->
      <div class="flex justify-center gap-2 mt-8">
        {#each displayLogos as _, index}
          <button
            type="button"
            class="w-2 h-2 rounded-full transition-all duration-300 {selectedIndex === index ? 'bg-blue-600 w-6' : 'bg-slate-300 hover:bg-slate-400'}"
            onclick={() => api?.scrollTo(index)}
          ></button>
        {/each}
      </div>
    </div>
    
    <p class="text-center text-xs text-slate-400 mt-12 flex items-center justify-center gap-2">
      <Lock class="w-3.5 h-3.5" strokeWidth={1.5} />
      <span>Encriptación SSL de 256 bits</span>
    </p>
    
  </div>
</section>
