<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  
  type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  type Size = 'default' | 'sm' | 'lg' | 'icon';
  
  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    class?: string;
    children?: Snippet;
  }
  
  let { variant = 'default', size = 'default', class: className = '', children, ...rest }: Props = $props();
  
  const variants: Record<Variant, string> = {
    default: 'bg-brand-secondary text-white hover:bg-brand-accent shadow-sm',
    secondary: 'bg-surface-muted text-text-primary hover:bg-gray-200',
    outline: 'border border-gray-200 bg-white hover:bg-surface-light text-text-primary',
    ghost: 'hover:bg-surface-light text-text-primary',
    destructive: 'bg-error text-white hover:bg-error/90'
  };
  
  const sizes: Record<Size, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-10 w-10'
  };
</script>

<button class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:pointer-events-none disabled:opacity-50 {variants[variant]} {sizes[size]} {className}" {...rest}>
  {#if children}{@render children()}{/if}
</button>
