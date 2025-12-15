<script lang="ts">
  // AdminDashboard.svelte - Estilo Jony Ive + Skeletons
  
  import { onMount } from 'svelte';
  import type { SolicitudSummary, DashboardStats, SolicitudFiltersDTO } from '../../server/lib/features/solicitud';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import FileText from 'lucide-svelte/icons/file-text';
  import Clock from 'lucide-svelte/icons/clock';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import Calendar from 'lucide-svelte/icons/calendar';
  import Inbox from 'lucide-svelte/icons/inbox';
  import Search from 'lucide-svelte/icons/search';
  import X from 'lucide-svelte/icons/x';
  import Eye from 'lucide-svelte/icons/eye';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import TrendingDown from 'lucide-svelte/icons/trending-down';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
  import PieChart from 'lucide-svelte/icons/pie-chart';
  
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend, BarController, CategoryScale, LinearScale, BarElement } from 'chart.js';
  Chart.register(DoughnutController, ArcElement, Tooltip, Legend, BarController, CategoryScale, LinearScale, BarElement);
  
  interface Props { adminName?: string; }
  let { adminName = 'Admin' }: Props = $props();
  
  let statusChartCanvas: HTMLCanvasElement;
  let weeklyChartCanvas: HTMLCanvasElement;
  let statusChart: Chart | null = null;
  let weeklyChart: Chart | null = null;
  let chartsInitialized = $state(false);
  
  let stats = $state<DashboardStats>({ totalSolicitudes: 0, nuevas: 0, enProceso: 0, aprobadas: 0, rechazadas: 0, citasPendientes: 0 });
  let solicitudes = $state<SolicitudSummary[]>([]);
  let loadingStats = $state(true);
  let loadingTable = $state(true);
  let error = $state<string | null>(null);
  let total = $state(0);
  let filters = $state<SolicitudFiltersDTO>({ status: '', visaType: '', priority: '', search: '', page: 1, limit: 10 });
  let showModal = $state(false);
  let selectedDetail = $state<any>(null);
  let loadingDetail = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  
  let totalPages = $derived(Math.ceil(total / filters.limit));
  let hasFilters = $derived(filters.status !== '' || filters.visaType !== '' || filters.priority !== '' || filters.search !== '');
  
  const kpiCards = $derived([
    { label: 'Total', value: stats.totalSolicitudes, icon: FileText, color: 'text-slate-600', trend: null },
    { label: 'Nuevas', value: stats.nuevas, icon: Inbox, color: 'text-blue-500', trend: 'up' },
    { label: 'En Proceso', value: stats.enProceso, icon: Clock, color: 'text-amber-500', trend: null },
    { label: 'Aprobadas', value: stats.aprobadas, icon: CheckCircle, color: 'text-emerald-500', trend: 'up' },
    { label: 'Rechazadas', value: stats.rechazadas, icon: XCircle, color: 'text-rose-500', trend: 'down' },
    { label: 'Citas Hoy', value: stats.citasPendientes, icon: Calendar, color: 'text-violet-500', trend: null },
  ]);
  
  onMount(() => {
    loadStats();
    loadSolicitudes();
  });
  
  // Charts solo cuando stats cambian Y canvas existe
  $effect(() => {
    if (statusChartCanvas && weeklyChartCanvas && stats.totalSolicitudes > 0 && !chartsInitialized) {
      initCharts();
      chartsInitialized = true;
    }
  });
  
  function initCharts() {
    statusChart = new Chart(statusChartCanvas, {
      type: 'doughnut',
      data: { 
        labels: ['Nuevas', 'En Proceso', 'Aprobadas', 'Rechazadas'], 
        datasets: [{ data: [stats.nuevas, stats.enProceso, stats.aprobadas, stats.rechazadas], backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#f43f5e'], borderWidth: 0, borderRadius: 4 }] 
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', animation: { duration: 600 }, plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } } } }
    });
    
    weeklyChart = new Chart(weeklyChartCanvas, {
      type: 'bar',
      data: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ label: 'Solicitudes', data: [12, 19, 8, 15, 22, 5, 3], backgroundColor: '#1e293b', borderRadius: 8, borderSkipped: false }] },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } }
    });
  }
  
  function updateChartData() {
    if (statusChart) {
      statusChart.data.datasets[0].data = [stats.nuevas, stats.enProceso, stats.aprobadas, stats.rechazadas];
      statusChart.update('none'); // Sin animación para updates
    }
  }
  
  async function loadStats() {
    loadingStats = true;
    try {
      const res = await fetch('/api/admin/solicitudes/stats');
      if (res.ok) {
        stats = await res.json();
        if (chartsInitialized) updateChartData();
      }
    } catch (e) { console.error(e); }
    finally { loadingStats = false; }
  }
  
  async function loadSolicitudes() {
    loadingTable = true; error = null;
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.visaType) params.set('visaType', filters.visaType);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));
      
      const res = await fetch(`/api/admin/solicitudes?${params}`);
      if (res.ok) { const data = await res.json(); solicitudes = data.data || []; total = data.total || 0; }
    } catch (e) { error = 'Error cargando datos'; console.error(e); }
    finally { loadingTable = false; }
  }
  
  function refreshAll() { loadStats(); loadSolicitudes(); }
  
  // Debounce para búsqueda
  function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { filters.page = 1; loadSolicitudes(); }, 400);
  }
  
  function applyFilters() { filters.page = 1; loadSolicitudes(); }
  function clearFilters() { filters = { ...filters, status: '', visaType: '', priority: '', search: '', page: 1 }; loadSolicitudes(); }
  function goToPage(page: number) { filters.page = page; loadSolicitudes(); }

  async function openDetail(id: string) {
    showModal = true; loadingDetail = true;
    try { const res = await fetch(`/api/admin/solicitudes/${id}`); if (res.ok) selectedDetail = await res.json(); }
    catch (e) { console.error(e); } finally { loadingDetail = false; }
  }
  
  function closeModal() { showModal = false; selectedDetail = null; }
  
  async function updateStatus(id: string, newStatus: string) {
    const prevStatus = selectedDetail?.status;
    if (selectedDetail) selectedDetail.status = newStatus; // Optimistic
    try {
      const res = await fetch(`/api/admin/solicitudes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { loadStats(); loadSolicitudes(); }
      else if (selectedDetail) selectedDetail.status = prevStatus; // Rollback
    } catch (e) { if (selectedDetail) selectedDetail.status = prevStatus; console.error(e); }
  }
  
  function getStatusStyle(s: string) {
    const styles: Record<string, { bg: string; text: string }> = {
      'NUEVA': { bg: 'bg-blue-50', text: 'text-blue-600' }, 'EN_REVISION': { bg: 'bg-amber-50', text: 'text-amber-600' },
      'DOCUMENTOS': { bg: 'bg-orange-50', text: 'text-orange-600' }, 'FORMULARIO': { bg: 'bg-violet-50', text: 'text-violet-600' },
      'CITA_AGENDADA': { bg: 'bg-indigo-50', text: 'text-indigo-600' }, 'ENTREVISTA': { bg: 'bg-pink-50', text: 'text-pink-600' },
      'APROBADA': { bg: 'bg-emerald-50', text: 'text-emerald-600' }, 'RECHAZADA': { bg: 'bg-rose-50', text: 'text-rose-600' },
      'CANCELADA': { bg: 'bg-slate-50', text: 'text-slate-500' }
    };
    return styles[s] || { bg: 'bg-slate-50', text: 'text-slate-500' };
  }
  
  function getPriorityStyle(p: string) {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      'LOW': { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Baja' }, 'NORMAL': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Normal' },
      'HIGH': { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Alta' }, 'URGENT': { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Urgente' }
    };
    return styles[p] || styles['NORMAL'];
  }
  
  const statusOptions = [{ value: '', label: 'Todos' }, { value: 'NUEVA', label: 'Nueva' }, { value: 'EN_REVISION', label: 'En Revisión' }, { value: 'DOCUMENTOS', label: 'Documentos' }, { value: 'FORMULARIO', label: 'Formulario' }, { value: 'CITA_AGENDADA', label: 'Cita Agendada' }, { value: 'ENTREVISTA', label: 'Entrevista' }, { value: 'APROBADA', label: 'Aprobada' }, { value: 'RECHAZADA', label: 'Rechazada' }];
  const visaOptions = [{ value: '', label: 'Todos' }, { value: 'USA_TURISMO', label: 'USA' }, { value: 'CANADA_VISITANTE', label: 'Canadá' }, { value: 'SCHENGEN', label: 'Schengen' }, { value: 'UK', label: 'UK' }, { value: 'MEXICO', label: 'México' }];
  const priorityOptions = [{ value: '', label: 'Todas' }, { value: 'LOW', label: 'Baja' }, { value: 'NORMAL', label: 'Normal' }, { value: 'HIGH', label: 'Alta' }, { value: 'URGENT', label: 'Urgente' }];
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
    <div>
      <p class="text-sm text-slate-400 font-medium">Panel de Administración</p>
      <h1 class="text-3xl font-semibold text-slate-800 mt-1">Hola, {adminName}</h1>
    </div>
    <button onclick={refreshAll} disabled={loadingStats || loadingTable} class="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
      <RefreshCw size={16} class={(loadingStats || loadingTable) ? 'animate-spin' : ''} strokeWidth={1.5} />
      Actualizar
    </button>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {#if loadingStats}
      {#each Array(6) as _}
        <div class="bg-white rounded-3xl p-5">
          <div class="flex items-start justify-between mb-3">
            <Skeleton class="w-6 h-6 rounded" />
            <Skeleton class="w-4 h-4 rounded" />
          </div>
          <Skeleton class="h-9 w-16 rounded mb-2" />
          <Skeleton class="h-4 w-20 rounded" />
        </div>
      {/each}
    {:else}
      {#each kpiCards as kpi}
        {@const Icon = kpi.icon}
        <div class="bg-white rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-200/50">
          <div class="flex items-start justify-between mb-3">
            <Icon size={22} class={kpi.color} strokeWidth={1.5} />
            {#if kpi.trend === 'up'}<TrendingUp size={14} class="text-emerald-500" strokeWidth={1.5} />
            {:else if kpi.trend === 'down'}<TrendingDown size={14} class="text-rose-500" strokeWidth={1.5} />{/if}
          </div>
          <p class="text-3xl font-light text-slate-800 tabular-nums">{kpi.value}</p>
          <p class="text-sm text-slate-400 mt-1">{kpi.label}</p>
        </div>
      {/each}
    {/if}
  </div>
  
  <!-- Charts -->
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-3xl p-6">
      <div class="flex items-center gap-2 mb-6">
        <PieChart size={18} class="text-slate-400" strokeWidth={1.5} />
        <h3 class="font-medium text-slate-700">Distribución por Estado</h3>
      </div>
      <div class="h-64"><canvas bind:this={statusChartCanvas}></canvas></div>
    </div>
    <div class="bg-white rounded-3xl p-6">
      <div class="flex items-center gap-2 mb-6">
        <BarChart3 size={18} class="text-slate-400" strokeWidth={1.5} />
        <h3 class="font-medium text-slate-700">Actividad Semanal</h3>
      </div>
      <div class="h-64"><canvas bind:this={weeklyChartCanvas}></canvas></div>
    </div>
  </div>
  
  <!-- Filters -->
  <div class="bg-white rounded-3xl p-5">
    <div class="flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
        <input type="text" placeholder="Buscar por nombre..." bind:value={filters.search} oninput={onSearchInput} class="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" />
      </div>
      <select bind:value={filters.status} onchange={applyFilters} class="px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900">
        {#each statusOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
      <select bind:value={filters.visaType} onchange={applyFilters} class="px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900">
        {#each visaOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
      <select bind:value={filters.priority} onchange={applyFilters} class="px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900">
        {#each priorityOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
      {#if hasFilters}
        <button onclick={clearFilters} class="px-4 py-3 text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1.5">
          <X size={14} strokeWidth={1.5} /> Limpiar
        </button>
      {/if}
    </div>
  </div>


  <!-- Table con Skeleton loading -->
  <div class="bg-white rounded-3xl overflow-hidden">
    {#if loadingTable && solicitudes.length === 0}
      <!-- Skeleton Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-20 rounded" /></th>
              <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-12 rounded" /></th>
              <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-14 rounded" /></th>
              <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-16 rounded" /></th>
              <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-16 rounded" /></th>
              <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-12 rounded" /></th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            {#each Array(5) as _, i}
              <tr>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <Skeleton class="w-10 h-10 rounded-full" />
                    <Skeleton class="h-4 w-28 rounded" />
                  </div>
                </td>
                <td class="px-6 py-4">
                  <Skeleton class="h-4 w-16 rounded mb-1" />
                  <Skeleton class="h-3 w-20 rounded" />
                </td>
                <td class="px-6 py-4"><Skeleton class="h-6 w-20 rounded-full" /></td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <Skeleton class="h-1 w-16 rounded-full" />
                    <Skeleton class="h-3 w-8 rounded" />
                  </div>
                </td>
                <td class="px-6 py-4"><Skeleton class="h-6 w-16 rounded-full" /></td>
                <td class="px-6 py-4"><Skeleton class="h-4 w-14 rounded" /></td>
                <td class="px-6 py-4"><Skeleton class="h-8 w-14 rounded-xl" /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if error}
      <div class="py-20 text-center">
        <XCircle size={40} class="text-rose-300 mx-auto mb-3" strokeWidth={1.5} />
        <p class="text-rose-500 text-sm">{error}</p>
        <button onclick={loadSolicitudes} class="mt-4 text-slate-600 hover:text-slate-800 text-sm">Reintentar</button>
      </div>
    {:else if solicitudes.length === 0 && !loadingTable}
      <div class="py-20 text-center">
        <Inbox size={40} class="text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
        <p class="text-slate-400 text-sm">No se encontraron solicitudes</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Solicitante</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Visa</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Progreso</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Prioridad</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            {#each solicitudes as sol (sol.id)}
              {@const statusStyle = getStatusStyle(sol.status)}
              {@const priorityStyle = getPriorityStyle(sol.priority)}
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {sol.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span class="font-medium text-slate-800 truncate max-w-[150px]">{sol.fullName}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-slate-700">{sol.destinationCountry}</p>
                  <p class="text-xs text-slate-400">{sol.visaType.replace('_', ' ')}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap {statusStyle.bg} {statusStyle.text}">{sol.status.replace('_', ' ')}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-16 bg-slate-100 rounded-full h-1">
                      <div class="bg-slate-900 h-1 rounded-full" style="width: {(sol.currentStep / sol.totalSteps) * 100}%"></div>
                    </div>
                    <span class="text-xs text-slate-400 tabular-nums">{sol.currentStep}/{sol.totalSteps}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-xs px-3 py-1 rounded-full font-medium {priorityStyle.bg} {priorityStyle.text}">{priorityStyle.label}</span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                  {new Date(sol.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                </td>
                <td class="px-6 py-4">
                  <button onclick={() => openDetail(sol.id)} class="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors">
                    <Eye size={16} strokeWidth={1.5} /> Ver
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm text-slate-400 tabular-nums">
          {(filters.page - 1) * filters.limit + 1} - {Math.min(filters.page * filters.limit, total)} de {total}
        </p>
        <div class="flex items-center gap-2">
          <button onclick={() => goToPage(filters.page - 1)} disabled={filters.page === 1 || loadingTable} class="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={16} strokeWidth={1.5} /> Anterior
          </button>
          <span class="text-sm text-slate-400 px-2 tabular-nums">{filters.page} / {totalPages || 1}</span>
          <button onclick={() => goToPage(filters.page + 1)} disabled={filters.page >= totalPages || loadingTable} class="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Siguiente <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>


<!-- Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" tabindex="-1" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" role="document" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <div class="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
        <h2 class="text-xl font-semibold text-slate-800">Detalle de Solicitud</h2>
        <button onclick={closeModal} class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>
      
      {#if loadingDetail}
        <div class="p-16 text-center">
          <RefreshCw size={24} class="animate-spin text-slate-300 mx-auto" strokeWidth={1.5} />
          <p class="text-slate-400 mt-4 text-sm">Cargando...</p>
        </div>
      {:else if selectedDetail}
        <div class="p-6 space-y-6">
          <div class="grid md:grid-cols-2 gap-4">
            {#each [{ label: 'Nombre', value: selectedDetail.fullName }, { label: 'Email', value: selectedDetail.email }, { label: 'Teléfono', value: selectedDetail.phone || '-' }, { label: 'Ciudad', value: selectedDetail.city || '-' }] as field}
              <div class="bg-slate-50 rounded-2xl p-4">
                <p class="text-xs text-slate-400 uppercase tracking-wider">{field.label}</p>
                <p class="font-medium text-slate-800 mt-1 truncate">{field.value}</p>
              </div>
            {/each}
          </div>
          
          <div>
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-3">Cambiar Estado</p>
            <div class="flex flex-wrap gap-2">
              {#each statusOptions.slice(1) as opt}
                {@const isActive = selectedDetail.status === opt.value}
                <button onclick={() => updateStatus(selectedDetail.id, opt.value)} class="px-4 py-2 text-sm rounded-full transition-all {isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                  {opt.label}
                </button>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex justify-end">
          <button onclick={closeModal} class="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors">Cerrar</button>
        </div>
      {/if}
    </div>
  </div>
{/if}
