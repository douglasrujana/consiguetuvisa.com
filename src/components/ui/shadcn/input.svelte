<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  
  interface Props extends HTMLInputAttributes {
    class?: string;
    value?: string;
  }
  
  let { class: className = '', value = $bindable(''), ...rest }: Props = $props();
</script>

<input bind:value class="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 {className}" {...rest} />
