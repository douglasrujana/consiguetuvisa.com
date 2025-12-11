<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children?: Snippet } = $props();
</script>

<div class="flex flex-col space-y-1.5 p-6 {className}">
  {#if children}{@render children()}{/if}
</div>
