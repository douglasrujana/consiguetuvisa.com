<script lang="ts">
  let { value = 0, max = 100, class: className = '' }: { value?: number; max?: number; class?: string } = $props();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
</script>

<div class="relative h-2 w-full overflow-hidden rounded-full bg-surface-muted {className}">
  <div class="h-full bg-brand-accent transition-all duration-300" style="width: {percentage}%"></div>
</div>
