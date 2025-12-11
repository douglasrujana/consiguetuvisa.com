<script lang="ts">
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import TrendingDown from 'lucide-svelte/icons/trending-down';
  
  interface Props {
    title: string;
    value: number | string;
    icon: any;
    trend?: { value: number; label?: string } | null;
    variant?: 'default' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
  }
  
  let { title, value, icon: Icon, trend = null, variant = 'default' }: Props = $props();
  
  const variants = {
    default: { bg: 'bg-surface-muted', text: 'text-text-secondary', border: 'border-gray-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' }
  };
  
  const v = variants[variant];
</script>

<div class="bg-surface-white rounded-xl p-5 border {v.border} hover:shadow-md transition-shadow">
  <div class="flex items-start justify-between mb-4">
    <div class="{v.bg} p-2.5 rounded-xl">
      <Icon size={22} class={v.text} strokeWidth={1.5} />
    </div>
    {#if trend}
      <div class="flex items-center gap-1 text-xs font-medium {trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
        {#if trend.value >= 0}<TrendingUp size={14} />{:else}<TrendingDown size={14} />{/if}
        <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
      </div>
    {/if}
  </div>
  <p class="text-3xl font-bold text-text-primary mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
  <p class="text-sm text-text-muted">{title}</p>
</div>
