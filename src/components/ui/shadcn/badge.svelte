<script lang="ts">
  import type { Snippet } from 'svelte';
  
  type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  
  let { variant = 'default', class: className = '', children }: { variant?: Variant; class?: string; children?: Snippet } = $props();
  
  const variants: Record<Variant, string> = {
    default: 'bg-brand-secondary text-white',
    secondary: 'bg-surface-muted text-text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    outline: 'border border-gray-200 text-text-secondary bg-transparent'
  };
</script>

<span class="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium {variants[variant]} {className}">
  {#if children}{@render children()}{/if}
</span>
