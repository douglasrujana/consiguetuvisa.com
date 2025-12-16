<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Table from '$lib/components/ui/table';
  import Bell from 'lucide-svelte/icons/bell';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import AlertCircle from 'lucide-svelte/icons/alert-circle';
  import Info from 'lucide-svelte/icons/info';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Filter from 'lucide-svelte/icons/filter';
  import Server from 'lucide-svelte/icons/server';
  import Briefcase from 'lucide-svelte/icons/briefcase';
  import MessageCircle from 'lucide-svelte/icons/message-circle';
  import Eye from 'lucide-svelte/icons/eye';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import X from 'lucide-svelte/icons/x';
  import Check from 'lucide-svelte/icons/check';

  interface AlertDomain { id: string; name: string; displayName: string; icon?: string; color?: string; }

  let loading = $state(true);
  let alerts = $state<any[]>([]);
  let domains = $state<AlertDomain[]>([]);
  let stats = $state({ total: 0, pending: 0, acknowledged: 0 });
  let filterDomain = $state('');
  let filterType = $state('');
  let filterPriority = $state('');

  // Panel lateral
  let selectedAlert = $state<any>(null);
  let acknowledging = $state(false);

  // KPIs calculados
  let criticalOpen = $derived(alerts.filter(a => a.priority === 'CRITICAL' && !a.acknowledgedAt).length);
  let resolutionRate = $derived(stats.total > 0 ? Math.round((stats.acknowledged / stats.total) * 100) : 0);
  
  let domainStats = $derived.by(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.domain?.name || 'unknown'] = (counts[a.domain?.name || 'unknown'] || 0) + 1; });
    const total = alerts.length || 1;
    return domains.map(d => ({
      name: d.name,
      displayName: d.displayName,
      color: d.color || '#64748b',
      count: counts[d.name] || 0,
      percent: Math.round(((counts[d.name] || 0) / total) * 100)
    }));
  });

  let typeStats = $derived.by(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  });

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-blue-100 text-blue-700',
  };
  const priorityIcons: Record<string, typeof Bell> = { CRITICAL: AlertTriangle, HIGH: AlertCircle, MEDIUM: Info, LOW: Bell };
  const domainIcons: Record<string, typeof Server> = { operations: Server, business: Briefcase, social: MessageCircle };
  const typeLabels: Record<string, string> = { COMPLAINT: 'Queja', POLICY_CHANGE: 'Cambio', SYSTEM_ERROR: 'Error', MENTION: 'Mención' };

  onMount(() => loadData());

  async function loadData() {
    loading = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($f: AlertFiltersInput, $l: Int) { 
            alertDomains { id name displayName icon color }
            alerts(filters: $f, limit: $l) { id type priority title content acknowledgedAt createdAt domain { id name displayName color } } 
            alertStats { total pending acknowledged } 
          }`,
          variables: { f: { type: filterType || null, priority: filterPriority || null, domainName: filterDomain || null, acknowledged: null }, l: 100 }
        })
      });
      const { data } = await res.json();
      if (data) { 
        alerts = data.alerts || []; 
        stats = data.alertStats || stats; 
        domains = data.alertDomains || [];
      }
    } catch (e) { console.error('Error:', e); }
    finally { loading = false; }
  }

  async function ackAlert(id: string) {
    acknowledging = true;
    try {
      await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation($id: ID!, $by: String!) { acknowledgeAlert(id: $id, acknowledgedBy: $by) { id } }`, variables: { id, by: 'admin' } })
      });
      loadData(); selectedAlert = null;
    } catch (e) { console.error(e); } finally { acknowledging = false; }
  }

  async function delAlert(id: string) {
    if (!confirm('¿Eliminar esta alerta?')) return;
    try {
      await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation($id: ID!) { deleteAlert(id: $id) }`, variables: { id } })
      });
      loadData(); if (selectedAlert?.id === id) selectedAlert = null;
    } catch (e) { console.error(e); }
  }

  function fmtDate(d: string) { 
    return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); 
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Centro de Alertas</h1>
      <p class="text-slate-500 font-light mt-1">Monitoreo y notificaciones</p>
    </div>
    <button onclick={() => loadData()} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full">
      <RefreshCw size={18} strokeWidth={1.5} /><span class="font-light">Actualizar</span>
    </button>
  </div>

  <!-- Stats Row 1 -->
  <div class="grid grid-cols-4 gap-4">
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <div class="flex items-center gap-2 text-slate-500 mb-1"><Bell size={16} strokeWidth={1.5} /><span class="font-light text-xs">Total</span></div>
      <p class="text-2xl font-semibold text-slate-800">{stats.total}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-orange-400">
      <div class="flex items-center gap-2 text-orange-500 mb-1"><AlertCircle size={16} strokeWidth={1.5} /><span class="font-light text-xs">Pendientes</span></div>
      <p class="text-2xl font-semibold text-orange-600">{stats.pending}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-green-400">
      <div class="flex items-center gap-2 text-green-500 mb-1"><CheckCircle size={16} strokeWidth={1.5} /><span class="font-light text-xs">Reconocidas</span></div>
      <p class="text-2xl font-semibold text-green-600">{stats.acknowledged}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-red-400">
      <div class="flex items-center gap-2 text-red-500 mb-1"><AlertTriangle size={16} strokeWidth={1.5} /><span class="font-light text-xs">Críticas abiertas</span></div>
      <p class="text-2xl font-semibold text-red-600">{criticalOpen}</p>
    </div>
  </div>

  <!-- KPIs Row 2 -->
  <div class="grid grid-cols-3 gap-4">
    <!-- Tasa de resolución -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Tasa de resolución</p>
      <div class="flex items-end gap-3">
        <p class="text-3xl font-semibold text-slate-800">{resolutionRate}%</p>
        <div class="flex-1">
          <div class="w-full bg-slate-100 rounded-full h-2">
            <div class="bg-green-500 h-2 rounded-full transition-all" style="width: {resolutionRate}%"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Distribución por dominio -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Por dominio</p>
      <div class="space-y-2">
        {#each domainStats as ds}
          {@const DIcon = domainIcons[ds.name] || Bell}
          <div class="flex items-center gap-2">
            <DIcon size={14} style="color: {ds.color}" />
            <span class="text-xs text-slate-600 w-20">{ds.displayName}</span>
            <div class="flex-1 bg-slate-100 rounded-full h-1.5">
              <div class="h-1.5 rounded-full" style="width: {ds.percent}%; background-color: {ds.color}"></div>
            </div>
            <span class="text-xs text-slate-500 w-6 text-right">{ds.count}</span>
          </div>
        {/each}
      </div>
    </div>
    <!-- Top tipos -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Tipos más frecuentes</p>
      <div class="space-y-2">
        {#each typeStats.slice(0, 4) as ts, i}
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 w-4">{i + 1}.</span>
            <span class="text-xs text-slate-600 flex-1">{typeLabels[ts.type] || ts.type}</span>
            <span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{ts.count}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Filtros -->
  <div class="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 flex-wrap">
    <div class="flex items-center gap-2 text-slate-500"><Filter size={16} strokeWidth={1.5} /><span class="font-light text-sm">Filtros:</span></div>
    <select bind:value={filterDomain} onchange={() => loadData()} class="px-4 py-2 rounded-full border border-slate-200 text-sm font-light">
      <option value="">Todos los dominios</option>
      {#each domains as d}<option value={d.name}>{d.displayName}</option>{/each}
    </select>
    <select bind:value={filterType} onchange={() => loadData()} class="px-4 py-2 rounded-full border border-slate-200 text-sm font-light">
      <option value="">Todos los tipos</option>
      <option value="COMPLAINT">Quejas</option>
      <option value="POLICY_CHANGE">Cambios</option>
      <option value="SYSTEM_ERROR">Errores</option>
      <option value="MENTION">Menciones</option>
    </select>
    <select bind:value={filterPriority} onchange={() => loadData()} class="px-4 py-2 rounded-full border border-slate-200 text-sm font-light">
      <option value="">Todas las prioridades</option>
      <option value="CRITICAL">Crítica</option>
      <option value="HIGH">Alta</option>
      <option value="MEDIUM">Media</option>
      <option value="LOW">Baja</option>
    </select>
  </div>

  <!-- DataTable -->
  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <Table.Root>
      <Table.Header>
        <Table.Row class="bg-slate-50">
          <Table.Head class="font-semibold">Dominio</Table.Head>
          <Table.Head class="font-semibold">Título</Table.Head>
          <Table.Head class="font-semibold text-center">Prioridad</Table.Head>
          <Table.Head class="font-semibold text-center">Tipo</Table.Head>
          <Table.Head class="font-semibold">Fecha</Table.Head>
          <Table.Head class="font-semibold text-right">Acciones</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          {#each [1,2,3,4,5] as _}
            <Table.Row><Table.Cell colspan={6}><Skeleton class="h-8 w-full" /></Table.Cell></Table.Row>
          {/each}
        {:else if alerts.length === 0}
          <Table.Row><Table.Cell colspan={6} class="text-center py-12 text-slate-400">No hay alertas</Table.Cell></Table.Row>
        {:else}
          {#each alerts as alert}
            {@const DomainIcon = domainIcons[alert.domain?.name] || Bell}
            {@const PriorityIcon = priorityIcons[alert.priority] || Bell}
            <Table.Row class="hover:bg-slate-50 cursor-pointer" onclick={() => selectedAlert = alert}>
              <Table.Cell>
                {#if alert.domain}
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style="background-color: {alert.domain.color}15; color: {alert.domain.color}">
                    <DomainIcon size={12} strokeWidth={1.5} />{alert.domain.displayName}
                  </span>
                {:else}
                  <span class="text-slate-400 text-xs">-</span>
                {/if}
              </Table.Cell>
              <Table.Cell>
                <div class="flex items-center gap-2">
                  {#if alert.acknowledgedAt}<CheckCircle size={14} class="text-green-500 flex-shrink-0" />{/if}
                  <p class="font-medium text-sm truncate max-w-[250px]">{alert.title}</p>
                </div>
              </Table.Cell>
              <Table.Cell class="text-center">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs {priorityColors[alert.priority]}">
                  <PriorityIcon size={12} strokeWidth={1.5} />{alert.priority}
                </span>
              </Table.Cell>
              <Table.Cell class="text-center">
                <span class="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">{typeLabels[alert.type] || alert.type}</span>
              </Table.Cell>
              <Table.Cell class="text-sm text-slate-500">{fmtDate(alert.createdAt)}</Table.Cell>
              <Table.Cell class="text-right">
                <button onclick={(e) => { e.stopPropagation(); selectedAlert = alert; }} class="p-2 hover:bg-blue-50 rounded-full text-blue-600"><Eye size={16} /></button>
                <button onclick={(e) => { e.stopPropagation(); delAlert(alert.id); }} class="p-2 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={16} /></button>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
    <div class="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">{alerts.length} alertas</div>
  </div>
</div>

<!-- Panel lateral de detalle -->
{#if selectedAlert}
  <div class="fixed inset-0 bg-black/20 z-40" onclick={() => selectedAlert = null}></div>
  <div class="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <h2 class="font-semibold text-slate-800">Detalle de Alerta</h2>
      <button onclick={() => selectedAlert = null} class="p-2 hover:bg-slate-100 rounded-full"><X size={18} /></button>
    </div>
    <div class="p-6 space-y-6">
      <!-- Badges -->
      <div class="flex items-center gap-2 flex-wrap">
        {#if selectedAlert.domain}
          {@const DIcon = domainIcons[selectedAlert.domain?.name] || Bell}
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style="background-color: {selectedAlert.domain.color}15; color: {selectedAlert.domain.color}">
            <DIcon size={14} strokeWidth={1.5} />{selectedAlert.domain.displayName}
          </span>
        {/if}
        <span class="px-3 py-1 rounded-full text-xs font-medium {priorityColors[selectedAlert.priority]}">{selectedAlert.priority}</span>
        <span class="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">{typeLabels[selectedAlert.type]}</span>
      </div>
      <!-- Título -->
      <div>
        <h3 class="text-lg font-semibold text-slate-800">{selectedAlert.title}</h3>
        <p class="text-sm text-slate-400 font-light mt-1">{fmtDate(selectedAlert.createdAt)}</p>
      </div>
      <!-- Contenido -->
      <div>
        <p class="text-sm font-light text-slate-500 mb-2">Contenido</p>
        <p class="text-slate-700 font-light">{selectedAlert.content}</p>
      </div>
      <!-- Estado -->
      {#if selectedAlert.acknowledgedAt}
        <div class="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl">
          <CheckCircle size={18} /><span class="text-sm">Reconocida</span>
        </div>
      {/if}
      <!-- Acciones -->
      <div class="flex gap-2 pt-4 border-t border-slate-100">
        {#if !selectedAlert.acknowledgedAt}
          <button onclick={() => ackAlert(selectedAlert.id)} disabled={acknowledging} class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 disabled:opacity-50">
            <Check size={16} strokeWidth={1.5} />Reconocer
          </button>
        {/if}
        <button onclick={() => delAlert(selectedAlert.id)} class="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-600 rounded-full text-sm hover:bg-red-200">
          <Trash2 size={16} strokeWidth={1.5} />Eliminar
        </button>
      </div>
    </div>
  </div>
{/if}
