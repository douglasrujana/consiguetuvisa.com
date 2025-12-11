<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    title: string;
    icon?: any;
    children?: Snippet;
  }
  
  let { title, icon: Icon, children }: Props = $props();
</script>

<div class="bg-surface-white rounded-xl border border-gray-100 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
    {#if Icon}<Icon size={18} class="text-text-muted" />{/if}
    <h3 class="font-semibold text-text-primary">{title}</h3>
  </div>
  <div class="p-6">
    {#if children}{@render children()}{/if}
  </div>
</div>
