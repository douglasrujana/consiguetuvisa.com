<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import MessageCircle from 'lucide-svelte/icons/message-circle';
  import Twitter from 'lucide-svelte/icons/twitter';
  import Facebook from 'lucide-svelte/icons/facebook';
  import Instagram from 'lucide-svelte/icons/instagram';
  import ThumbsUp from 'lucide-svelte/icons/thumbs-up';
  import ThumbsDown from 'lucide-svelte/icons/thumbs-down';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import Minus from 'lucide-svelte/icons/minus';
  import Check from 'lucide-svelte/icons/check';
  import Clock from 'lucide-svelte/icons/clock';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Filter from 'lucide-svelte/icons/filter';
  import Eye from 'lucide-svelte/icons/eye';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Send from 'lucide-svelte/icons/send';
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import X from 'lucide-svelte/icons/x';
  import Zap from 'lucide-svelte/icons/zap';
  import Settings from 'lucide-svelte/icons/settings';

  interface Mention {
    id: string;
    platform: 'twitter' | 'facebook' | 'instagram';
    author: string;
    content: string;
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'COMPLAINT';
    suggestedResponse?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    publishedAt: string;
  }

  interface Stats {
    total: number;
    pendingReview: number;
    reviewed: number;
    bySentiment: { POSITIVE: number; NEUTRAL: number; NEGATIVE: number; COMPLAINT: number };
    byPlatform: { twitter: number; facebook: number; instagram: number };
  }

  interface TrendPoint {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    complaint: number;
  }

  let loading = $state(true);
  let mentions = $state<Mention[]>([]);
  let stats = $state<Stats | null>(null);
  let trend = $state<TrendPoint[]>([]);
  let selectedMention = $state<Mention | null>(null);
  let showDetail = $state(false);

  // Filtros
  let filterPlatform = $state<string>('');
  let filterSentiment = $state<string>('');
  let filterReviewed = $state<string>('');

  // Sincronización
  let syncing = $state(false);
  let syncMessage = $state<string | null>(null);

  const PLATFORMS = [
    { value: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-sky-500' },
    { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  ];

  const SENTIMENTS = [
    { value: 'POSITIVE', label: 'Positivo', icon: ThumbsUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { value: 'NEUTRAL', label: 'Neutral', icon: Minus, color: 'text-slate-500', bg: 'bg-slate-50' },
    { value: 'NEGATIVE', label: 'Negativo', icon: ThumbsDown, color: 'text-amber-500', bg: 'bg-amber-50' },
    { value: 'COMPLAINT', label: 'Queja', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  onMount(() => { loadData(); });

  async function runSync(platform?: string) {
    syncing = true; syncMessage = null;
    try {
      const res = await fetch('/api/admin/social/sync', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform }) });
      const data = await res.json();
      if (res.ok) { syncMessage = `Sincronizado: ${data.summary.totalNew} nuevas menciones`; loadData(); }
      else { syncMessage = `Error: ${data.error}`; }
      setTimeout(() => syncMessage = null, 5000);
    } catch (e) { syncMessage = 'Error de conexión'; console.error('Error syncing:', e); }
    finally { syncing = false; }
  }

  async function loadData() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (filterPlatform) params.set('platform', filterPlatform);
      if (filterSentiment) params.set('sentiment', filterSentiment);
      if (filterReviewed) params.set('reviewed', filterReviewed);
      const res = await fetch(`/api/admin/social?${params}`, { credentials: 'include' });
      if (res.ok) { const data = await res.json(); mentions = data.mentions; stats = data.stats; trend = data.trend; }
    } catch (e) { console.error('Error loading social data:', e); }
    finally { loading = false; }
  }

  async function markAsReviewed(id: string) {
    try {
      const res = await fetch(`/api/admin/social/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewedBy: 'admin' }) });
      if (res.ok) { loadData(); if (selectedMention?.id === id) { const updated = await res.json(); selectedMention = updated; } }
    } catch (e) { console.error('Error marking as reviewed:', e); }
  }

  async function deleteMention(id: string) {
    if (!confirm('¿Eliminar esta mención?')) return;
    try {
      const res = await fetch(`/api/admin/social/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { loadData(); if (selectedMention?.id === id) { showDetail = false; selectedMention = null; } }
    } catch (e) { console.error('Error deleting:', e); }
  }

  function openDetail(mention: Mention) { selectedMention = mention; showDetail = true; }
  function getSentimentInfo(sentiment: string) { return SENTIMENTS.find(s => s.value === sentiment) || SENTIMENTS[1]; }
  function getPlatformInfo(platform: string) { return PLATFORMS.find(p => p.value === platform) || PLATFORMS[0]; }
  function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function getMaxTrend() { if (!trend.length) return 10; return Math.max(...trend.map(t => t.positive + t.neutral + t.negative + t.complaint), 10); }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Social Listening</h1>
      <p class="text-slate-500 font-light mt-1">Monitoreo de menciones en redes sociales</p>
    </div>
    <div class="flex items-center gap-3">
      {#if syncMessage}<span class="text-sm text-emerald-600">{syncMessage}</span>{/if}
      <a href="/admin/config?tab=social" class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors text-sm">
        <Settings size={16} strokeWidth={1.5} />Configurar APIs
      </a>
      <button onclick={() => runSync()} disabled={syncing} class="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full text-sm disabled:opacity-50">
        <Zap size={16} class={syncing ? 'animate-pulse' : ''} />{syncing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
      <button onclick={loadData} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
        <RefreshCw size={18} strokeWidth={1.5} class={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  </div>

  {#if loading && !stats}
    <div class="grid grid-cols-4 gap-4">
      {#each Array(4) as _}<Skeleton class="h-24 rounded-2xl" />{/each}
    </div>
    <Skeleton class="h-64 rounded-2xl" />
  {:else}
    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><MessageCircle size={20} class="text-slate-600" strokeWidth={1.5} /></div>
          <div><p class="text-2xl font-semibold text-slate-800">{stats?.total ?? 0}</p><p class="text-xs text-slate-400">Total menciones</p></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Clock size={20} class="text-amber-500" strokeWidth={1.5} /></div>
          <div><p class="text-2xl font-semibold text-slate-800">{stats?.pendingReview ?? 0}</p><p class="text-xs text-slate-400">Pendientes</p></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle size={20} class="text-red-500" strokeWidth={1.5} /></div>
          <div><p class="text-2xl font-semibold text-slate-800">{stats?.bySentiment.COMPLAINT ?? 0}</p><p class="text-xs text-slate-400">Quejas</p></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ThumbsUp size={20} class="text-emerald-500" strokeWidth={1.5} /></div>
          <div><p class="text-2xl font-semibold text-slate-800">{stats?.bySentiment.POSITIVE ?? 0}</p><p class="text-xs text-slate-400">Positivas</p></div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-3 gap-4">
      <!-- Distribución por sentimiento -->
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <h3 class="text-sm font-medium text-slate-600 mb-4">Distribución de Sentimiento</h3>
        <div class="space-y-3">
          {#each SENTIMENTS as s}
            {@const count = stats?.bySentiment[s.value as keyof typeof stats.bySentiment] ?? 0}
            {@const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0}
            <div class="flex items-center gap-3">
              <svelte:component this={s.icon} size={16} class={s.color} />
              <span class="text-sm text-slate-600 w-20">{s.label}</span>
              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full {s.bg} transition-all" style="width: {pct}%"></div></div>
              <span class="text-sm font-medium text-slate-700 w-12 text-right">{count}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Distribución por plataforma -->
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <h3 class="text-sm font-medium text-slate-600 mb-4">Por Plataforma</h3>
        <div class="space-y-3">
          {#each PLATFORMS as p}
            {@const count = stats?.byPlatform[p.value as keyof typeof stats.byPlatform] ?? 0}
            {@const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0}
            <div class="flex items-center gap-3">
              <svelte:component this={p.icon} size={16} class={p.color} />
              <span class="text-sm text-slate-600 w-20">{p.label}</span>
              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-slate-300 transition-all" style="width: {pct}%"></div></div>
              <span class="text-sm font-medium text-slate-700 w-12 text-right">{count}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Tendencia -->
      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-4"><TrendingUp size={16} class="text-slate-400" /><h3 class="text-sm font-medium text-slate-600">Tendencia (7 días)</h3></div>
        <div class="flex items-end gap-1 h-24">
          {#each trend as day}
            {@const total = day.positive + day.neutral + day.negative + day.complaint}
            {@const maxH = getMaxTrend()}
            <div class="flex-1 flex flex-col gap-0.5" title={`${day.date}: ${total} menciones`}>
              <div class="bg-emerald-400 rounded-t" style="height: {(day.positive / maxH) * 80}px"></div>
              <div class="bg-slate-300" style="height: {(day.neutral / maxH) * 80}px"></div>
              <div class="bg-amber-400" style="height: {(day.negative / maxH) * 80}px"></div>
              <div class="bg-red-400 rounded-b" style="height: {(day.complaint / maxH) * 80}px"></div>
            </div>
          {/each}
        </div>
        <div class="flex justify-between mt-2 text-xs text-slate-400"><span>{trend[0]?.date.slice(5) || ''}</span><span>{trend[trend.length - 1]?.date.slice(5) || ''}</span></div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-2xl p-4 shadow-sm">
      <div class="flex items-center gap-4">
        <Filter size={18} class="text-slate-400" />
        <select bind:value={filterPlatform} onchange={loadData} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
          <option value="">Todas las plataformas</option>
          {#each PLATFORMS as p}<option value={p.value}>{p.label}</option>{/each}
        </select>
        <select bind:value={filterSentiment} onchange={loadData} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
          <option value="">Todos los sentimientos</option>
          {#each SENTIMENTS as s}<option value={s.value}>{s.label}</option>{/each}
        </select>
        <select bind:value={filterReviewed} onchange={loadData} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
          <option value="">Todas</option>
          <option value="false">Pendientes</option>
          <option value="true">Revisadas</option>
        </select>
        {#if filterPlatform || filterSentiment || filterReviewed}
          <button onclick={() => { filterPlatform = ''; filterSentiment = ''; filterReviewed = ''; loadData(); }} class="text-sm text-slate-500 hover:text-slate-700">Limpiar filtros</button>
        {/if}
      </div>
    </div>

    <!-- Lista de menciones -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100"><h3 class="font-medium text-slate-700">Menciones recientes</h3></div>
      
      {#if mentions.length === 0}
        <div class="p-12 text-center text-slate-400">
          <MessageCircle size={48} class="mx-auto mb-3 opacity-50" />
          <p>No hay menciones que mostrar</p>
          <p class="text-sm mt-1">Las menciones aparecerán aquí cuando se detecten</p>
        </div>
      {:else}
        <div class="divide-y divide-slate-100">
          {#each mentions as mention}
            {@const sentimentInfo = getSentimentInfo(mention.sentiment)}
            {@const platformInfo = getPlatformInfo(mention.platform)}
            <div class="p-4 hover:bg-slate-50 transition-colors">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svelte:component this={platformInfo.icon} size={20} class={platformInfo.color} />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-slate-800">@{mention.author}</span>
                    <span class="text-xs text-slate-400">{formatDate(mention.publishedAt)}</span>
                    <span class="px-2 py-0.5 rounded-full text-xs {sentimentInfo.bg} {sentimentInfo.color}">{sentimentInfo.label}</span>
                    {#if mention.reviewedAt}<span class="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-600"><Check size={12} class="inline" /> Revisada</span>{/if}
                  </div>
                  <p class="text-slate-600 text-sm line-clamp-2">{mention.content}</p>
                  {#if mention.suggestedResponse}<p class="text-xs text-slate-400 mt-1 italic">Respuesta sugerida: {mention.suggestedResponse.slice(0, 80)}...</p>{/if}
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button onclick={() => openDetail(mention)} class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="Ver detalle"><Eye size={16} /></button>
                  {#if !mention.reviewedAt}<button onclick={() => markAsReviewed(mention.id)} class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Marcar revisada"><Check size={16} /></button>{/if}
                  <button onclick={() => deleteMention(mention.id)} class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>


<!-- Modal de detalle -->
{#if showDetail && selectedMention}
  {@const sentimentInfo = getSentimentInfo(selectedMention.sentiment)}
  {@const platformInfo = getPlatformInfo(selectedMention.platform)}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showDetail = false} role="dialog" aria-modal="true">
    <div class="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl" onclick={(e) => e.stopPropagation()} role="document">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svelte:component this={platformInfo.icon} size={24} class={platformInfo.color} />
          <div>
            <h3 class="font-semibold text-slate-800">@{selectedMention.author}</h3>
            <p class="text-xs text-slate-400">{formatDate(selectedMention.publishedAt)}</p>
          </div>
        </div>
        <button onclick={() => showDetail = false} class="p-2 hover:bg-slate-100 rounded-lg"><X size={20} class="text-slate-400" /></button>
      </div>
      
      <div class="p-5 space-y-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500">Sentimiento:</span>
          <span class="px-3 py-1 rounded-full text-sm {sentimentInfo.bg} {sentimentInfo.color} flex items-center gap-1">
            <svelte:component this={sentimentInfo.icon} size={14} />{sentimentInfo.label}
          </span>
        </div>
        <div>
          <p class="text-sm text-slate-500 mb-1">Mensaje:</p>
          <p class="text-slate-700 bg-slate-50 p-3 rounded-xl">{selectedMention.content}</p>
        </div>
        {#if selectedMention.suggestedResponse}
          <div>
            <p class="text-sm text-slate-500 mb-1">Respuesta sugerida:</p>
            <p class="text-slate-700 bg-blue-50 p-3 rounded-xl text-sm">{selectedMention.suggestedResponse}</p>
          </div>
        {/if}
        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          {#if selectedMention.reviewedAt}
            <span class="text-sm text-emerald-600 flex items-center gap-1"><Check size={16} /> Revisada por {selectedMention.reviewedBy}</span>
          {:else}
            <span class="text-sm text-amber-600 flex items-center gap-1"><Clock size={16} /> Pendiente de revisión</span>
          {/if}
          <div class="flex gap-2">
            {#if selectedMention && !selectedMention.reviewedAt}
              <button onclick={() => selectedMention && markAsReviewed(selectedMention.id)} class="px-4 py-2 bg-emerald-500 text-white rounded-full text-sm hover:bg-emerald-600 flex items-center gap-1"><Check size={16} /> Marcar revisada</button>
            {/if}
            <button class="px-4 py-2 bg-slate-800 text-white rounded-full text-sm hover:bg-slate-700 flex items-center gap-1"><Send size={16} /> Responder</button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
