<script lang="ts">
  let { class: className = '' }: { class?: string } = $props();
</script>

<div class="animate-pulse rounded-lg bg-surface-muted {className}"></div>
