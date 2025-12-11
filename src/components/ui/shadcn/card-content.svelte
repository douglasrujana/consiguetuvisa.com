<script lang="ts">
  import type { Snippet } from 'svelte';
  let { class: className = '', children }: { class?: string; children?: Snippet } = $props();
</script>

<div class="p-6 pt-0 {className}">
  {#if children}{@render children()}{/if}
</div>
