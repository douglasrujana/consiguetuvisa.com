<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import Bell from 'lucide-svelte/icons/bell';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import AlertCircle from 'lucide-svelte/icons/alert-circle';
  import Info from 'lucide-svelte/icons/info';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Filter from 'lucide-svelte/icons/filter';
  import Check from 'lucide-svelte/icons/check';
  import Trash2 from 'lucide-svelte/icons/trash-2';

  let loading = $state(true);
  let alerts = $state<any[]>([]);
  let stats = $state({ total: 0, pending: 0, acknowledged: 0 });
  let selectedAlert = $state<any>(null);
  let filterType = $state('');
  let filterPriority = $state('');
  let showAcknowledged = $state(false);
  let acknowledging = $state<string | null>(null);

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-blue-100 text-blue-700',
  };
  const priorityIcons: Record<string, typeof Bell> = { CRITICAL: AlertTriangle, HIGH: AlertCircle, MEDIUM: Info, LOW: Bell };
  const typeLabels: Record<string, string> = { COMPLAINT: 'Queja', POLICY_CHANGE: 'Cambio Política', SYSTEM_ERROR: 'Error Sistema', MENTION: 'Mención' };
  const skeletonItems = [1, 2, 3, 4, 5];

  onMount(() => loadData());

  async function loadData() {
    loading = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($f: AlertFiltersInput, $l: Int) { alerts(filters: $f, limit: $l) { id type priority title content acknowledgedAt acknowledgedBy createdAt } alertStats { total pending acknowledged } }`,
          variables: { f: { type: filterType || null, priority: filterPriority || null, acknowledged: showAcknowledged ? null : false }, l: 100 }
        })
      });
      const { data } = await res.json();
      if (data) { alerts = data.alerts || []; stats = data.alertStats || stats; }
    } catch (e) { console.error('Error:', e); }
    finally { loading = false; }
  }

  async function ackAlert(id: string) {
    acknowledging = id;
    try {
      await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation($id: ID!, $by: String!) { acknowledgeAlert(id: $id, acknowledgedBy: $by) { id } }`, variables: { id, by: 'admin' } })
      });
      loadData(); if (selectedAlert?.id === id) selectedAlert = null;
    } catch (e) { console.error(e); } finally { acknowledging = null; }
  }

  async function delAlert(id: string) {
    if (!confirm('¿Eliminar?')) return;
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


<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Centro de Alertas</h1>
      <p class="text-slate-500 font-light mt-1">Monitoreo y notificaciones</p>
    </div>
    <button onclick={() => loadData()} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full">
      <RefreshCw size={18} strokeWidth={1.5} /><span class="font-light">Actualizar</span>
    </button>
  </div>

  {#if loading}
    <div class="grid grid-cols-3 gap-6">
      {#each skeletonItems.slice(0,3) as _}
        <div class="bg-white rounded-3xl p-6 shadow-sm"><Skeleton class="h-4 w-24 mb-3" /><Skeleton class="h-8 w-16" /></div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white rounded-3xl p-6 shadow-sm">
        <div class="flex items-center gap-3 text-slate-500 mb-2"><Bell size={20} strokeWidth={1.5} /><span class="font-light text-sm">Total</span></div>
        <p class="text-3xl font-semibold text-slate-800">{stats.total}</p>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-sm border-l-4 border-orange-400">
        <div class="flex items-center gap-3 text-orange-500 mb-2"><AlertCircle size={20} strokeWidth={1.5} /><span class="font-light text-sm">Pendientes</span></div>
        <p class="text-3xl font-semibold text-orange-600">{stats.pending}</p>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-sm">
        <div class="flex items-center gap-3 text-green-500 mb-2"><CheckCircle size={20} strokeWidth={1.5} /><span class="font-light text-sm">Reconocidas</span></div>
        <p class="text-3xl font-semibold text-green-600">{stats.acknowledged}</p>
      </div>
    </div>
  {/if}

  <div class="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4 flex-wrap">
    <div class="flex items-center gap-2 text-slate-500"><Filter size={18} strokeWidth={1.5} /><span class="font-light text-sm">Filtros:</span></div>
    <select bind:value={filterType} onchange={() => loadData()} class="px-4 py-2 rounded-full border border-slate-200 text-sm font-light">
      <option value="">Todos los tipos</option>
      <option value="COMPLAINT">Quejas</option>
      <option value="POLICY_CHANGE">Cambios</option>
      <option value="SYSTEM_ERROR">Errores</option>
      <option value="MENTION">Menciones</option>
    </select>
    <select bind:value={filterPriority} onchange={() => loadData()} class="px-4 py-2 rounded-full border border-slate-200 text-sm font-light">
      <option value="">Todas</option>
      <option value="CRITICAL">Crítica</option>
      <option value="HIGH">Alta</option>
      <option value="MEDIUM">Media</option>
      <option value="LOW">Baja</option>
    </select>
  </div>


  <div class="grid grid-cols-12 gap-6">
    <div class="col-span-7 bg-white rounded-3xl shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100"><h2 class="font-semibold text-slate-800">Alertas ({alerts.length})</h2></div>
      {#if loading}
        <div class="p-4 space-y-3">
          {#each skeletonItems as _}
            <div class="p-4 rounded-2xl bg-slate-50"><Skeleton class="h-4 w-48 mb-2" /><Skeleton class="h-3 w-32" /></div>
          {/each}
        </div>
      {:else if alerts.length === 0}
        <div class="p-12 text-center text-slate-400">
          <CheckCircle size={40} strokeWidth={1} class="mx-auto mb-3 opacity-50" />
          <p class="font-light">No hay alertas</p>
        </div>
      {:else}
        <div class="p-4 space-y-2 max-h-96 overflow-y-auto">
          {#each alerts as alert}
            {@const Icon = priorityIcons[alert.priority] || Bell}
            <button onclick={() => selectedAlert = alert} class="w-full p-4 rounded-2xl text-left transition-all {selectedAlert?.id === alert.id ? 'bg-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100'}">
              <div class="flex items-start gap-3">
                <Icon size={18} strokeWidth={1.5} />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-medium truncate">{alert.title}</p>
                    {#if alert.acknowledgedAt}<CheckCircle size={14} class="text-green-500" />{/if}
                  </div>
                  <div class="flex items-center gap-2 text-xs {selectedAlert?.id === alert.id ? 'text-slate-300' : 'text-slate-400'}">
                    <span class="px-2 py-0.5 rounded-full {selectedAlert?.id === alert.id ? 'bg-slate-700' : priorityColors[alert.priority]}">{alert.priority}</span>
                    <span>•</span><span>{typeLabels[alert.type]}</span><span>•</span><span>{fmtDate(alert.createdAt)}</span>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="col-span-5 bg-white rounded-3xl shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100"><h2 class="font-semibold text-slate-800">Detalle</h2></div>
      {#if !selectedAlert}
        <div class="p-12 text-center text-slate-400">
          <Bell size={40} strokeWidth={1} class="mx-auto mb-3 opacity-50" />
          <p class="font-light">Selecciona una alerta</p>
        </div>
      {:else}
        <div class="p-6 space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-3 py-1 rounded-full text-xs font-medium {priorityColors[selectedAlert.priority]}">{selectedAlert.priority}</span>
              <span class="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">{typeLabels[selectedAlert.type]}</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-800">{selectedAlert.title}</h3>
            <p class="text-sm text-slate-400 font-light mt-1">{fmtDate(selectedAlert.createdAt)}</p>
          </div>
          <div>
            <p class="text-sm font-light text-slate-500 mb-2">Contenido</p>
            <p class="text-slate-700 font-light">{selectedAlert.content}</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
