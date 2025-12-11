<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  
  interface Props extends HTMLSelectAttributes {
    class?: string;
    value?: string;
    children?: Snippet;
  }
  
  let { class: className = '', value = $bindable(''), children, ...rest }: Props = $props();
</script>

<select bind:value class="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 {className}" {...rest}>
  {#if children}{@render children()}{/if}
</select>
