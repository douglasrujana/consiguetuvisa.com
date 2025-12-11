<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children?: Snippet } = $props();
</script>

<h3 class="text-lg font-semibold text-brand-primary leading-none tracking-tight {className}">
  {#if children}{@render children()}{/if}
</h3>
