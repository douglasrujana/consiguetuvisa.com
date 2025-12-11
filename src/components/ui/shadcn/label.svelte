<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLLabelAttributes } from 'svelte/elements';
  
  interface Props extends HTMLLabelAttributes {
    class?: string;
    children?: Snippet;
  }
  
  let { class: className = '', children, ...rest }: Props = $props();
</script>

<label class="text-sm font-medium text-text-primary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {className}" {...rest}>
  {#if children}{@render children()}{/if}
</label>
