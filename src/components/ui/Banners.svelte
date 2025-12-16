<script lang="ts">
  // Banners.svelte - Muestra banners activos del sistema
  import { onMount } from 'svelte';
  import X from 'lucide-svelte/icons/x';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import Megaphone from 'lucide-svelte/icons/megaphone';
  import Wrench from 'lucide-svelte/icons/wrench';
  import Gift from 'lucide-svelte/icons/gift';
  import Info from 'lucide-svelte/icons/info';
  import Calendar from 'lucide-svelte/icons/calendar';

  interface Banner {
    id: string;
    type: string;
    message: string;
    link?: string;
    linkText?: string;
    dismissible: boolean;
    bgColor?: string;
    textColor?: string;
  }

  interface Props {
    currentPage?: string;
  }

  let { currentPage = '/' }: Props = $props();
  let banners = $state<Banner[]>([]);
  let dismissed = $state<Set<string>>(new Set());

  // Colores por tipo de banner
  const BANNER_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
    maintenance: { bg: 'bg-orange-500', text: 'text-white', icon: Wrench },
    environment: { bg: 'bg-purple-500', text: 'text-white', icon: Info },
    promotion: { bg: 'bg-emerald-500', text: 'text-white', icon: Gift },
    warning: { bg: 'bg-amber-400', text: 'text-amber-900', icon: AlertTriangle },
    announcement: { bg: 'bg-blue-500', text: 'text-white', icon: Megaphone },
    scheduled: { bg: 'bg-slate-600', text: 'text-white', icon: Calendar },
  };

  onMount(async () => {
    // Cargar banners descartados del localStorage
    const stored = localStorage.getItem('dismissed_banners');
    if (stored) {
      dismissed = new Set(JSON.parse(stored));
    }

    // Fetch banners activos
    try {
      const res = await fetch(`/api/banners?page=${encodeURIComponent(currentPage)}`);
      if (res.ok) {
        banners = await res.json();
      }
    } catch (e) {
      console.error('Error loading banners:', e);
    }
  });

  function dismissBanner(id: string) {
    dismissed.add(id);
    dismissed = new Set(dismissed); // Trigger reactivity
    localStorage.setItem('dismissed_banners', JSON.stringify([...dismissed]));
  }

  function getStyle(banner: Banner) {
    const style = BANNER_STYLES[banner.type] || BANNER_STYLES.announcement;
    return {
      bg: banner.bgColor || style.bg,
      text: banner.textColor || style.text,
      Icon: style.icon,
    };
  }

  // Filtrar banners no descartados
  let visibleBanners = $derived(banners.filter(b => !dismissed.has(b.id)));
</script>

{#if visibleBanners.length > 0}
  <div class="banners-container">
    {#each visibleBanners as banner (banner.id)}
      {@const style = getStyle(banner)}
      <div class="{style.bg} {style.text} px-4 py-2.5 text-sm relative">
        <div class="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <svelte:component this={style.Icon} size={16} class="shrink-0" />
          <span class="font-medium">{banner.message}</span>
          {#if banner.link}
            <a 
              href={banner.link} 
              class="underline underline-offset-2 hover:no-underline font-semibold"
            >
              {banner.linkText || 'Ver más'}
            </a>
          {/if}
          {#if banner.dismissible}
            <button 
              onclick={() => dismissBanner(banner.id)}
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded transition-colors"
              aria-label="Cerrar banner"
            >
              <X size={16} />
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
