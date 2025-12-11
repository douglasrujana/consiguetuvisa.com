<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    headers: string[];
    children?: Snippet;
  }
  
  let { headers, children }: Props = $props();
</script>

<div class="bg-surface-white rounded-xl border border-gray-100 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-surface-light border-b border-gray-100">
        <tr>
          {#each headers as header}
            <th class="px-5 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{header}</th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        {#if children}{@render children()}{/if}
      </tbody>
    </table>
  </div>
</div>
