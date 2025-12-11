<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  
  export type CardProps = HTMLAttributes<HTMLDivElement> & {
    class?: string;
    children?: Snippet;
  };
</script>

<script lang="ts">
  let { class: className = '', children, ...rest }: CardProps = $props();
</script>

<div class="bg-surface-white rounded-xl shadow-sm border border-gray-100 {className}" {...rest}>
  {#if children}{@render children()}{/if}
</div>
