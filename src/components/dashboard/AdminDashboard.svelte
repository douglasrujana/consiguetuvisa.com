<script lang="ts">
  import { onMount } from 'svelte';
  import type { SolicitudSummary, DashboardStats, SolicitudFiltersDTO } from '../../server/lib/features/solicitud';
  
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import FileText from 'lucide-svelte/icons/file-text';
  import Clock from 'lucide-svelte/icons/clock';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import Calendar from 'lucide-svelte/icons/calendar';
  import Inbox from 'lucide-svelte/icons/inbox';
  import Search from 'lucide-svelte/icons/search';
  import Filter from 'lucide-svelte/icons/filter';
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
  
  let stats = $state<DashboardStats>({ totalSolicitudes: 0, nuevas: 0, enProceso: 0, aprobadas: 0, rechazadas: 0, citasPendientes: 0 });
  let solicitudes = $state<SolicitudSummary[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let total = $state(0);
  let filters = $state<SolicitudFiltersDTO>({ status: '', visaType: '', priority: '', search: '', page: 1, limit: 10 });
  let showModal = $state(false);
  let selectedId = $state<string | null>(null);
  let selectedDetail = $state<any>(null);
  let loadingDetail = $state(false);
  
  let totalPages = $derived(Math.ceil(total / filters.limit));
  let hasFilters = $derived(filters.status !== '' || filters.visaType !== '' || filters.priority !== '' || filters.search !== '');
  
  const kpiCards = $derived([
    { label: 'Total', value: stats.totalSolicitudes, icon: FileText, textColor: 'text-slate-700', borderColor: 'border-slate-200', iconBg: 'bg-slate-100', trend: null },
    { label: 'Nuevas', value: stats.nuevas, icon: Inbox, textColor: 'text-blue-700', borderColor: 'border-blue-200', iconBg: 'bg-blue-100', trend: 'up' },
    { label: 'En Proceso', value: stats.enProceso, icon: Clock, textColor: 'text-amber-700', borderColor: 'border-amber-200', iconBg: 'bg-amber-100', trend: null },
    { label: 'Aprobadas', value: stats.aprobadas, icon: CheckCircle, textColor: 'text-emerald-700', borderColor: 'border-emerald-200', iconBg: 'bg-emerald-100', trend: 'up' },
    { label: 'Rechazadas', value: stats.rechazadas, icon: XCircle, textColor: 'text-rose-700', borderColor: 'border-rose-200', iconBg: 'bg-rose-100', trend: 'down' },
    { label: 'Citas Hoy', value: stats.citasPendientes, icon: Calendar, textColor: 'text-violet-700', borderColor: 'border-violet-200', iconBg: 'bg-violet-100', trend: null },
  ]);
  
  onMount(() => { loadData(); });
  
  $effect(() => { if (statusChartCanvas && stats.totalSolicitudes > 0) updateCharts(); });
  
  function updateCharts() {
    if (statusChart) statusChart.destroy();
    if (weeklyChart) weeklyChart.destroy();
    
    statusChart = new Chart(statusChartCanvas, {
      type: 'doughnut',
      data: { labels: ['Nuevas', 'En Proceso', 'Aprobadas', 'Rechazadas'], datasets: [{ data: [stats.nuevas, stats.enProceso, stats.aprobadas, stats.rechazadas], backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } } }
    });
    
    weeklyChart = new Chart(weeklyChartCanvas, {
      type: 'bar',
      data: { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ label: 'Solicitudes', data: [12, 19, 8, 15, 22, 5, 3], backgroundColor: '#6366f1', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
    });
  }
  
  async function loadData() {
    loading = true; error = null;
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.visaType) params.set('visaType', filters.visaType);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));
      
      const [statsRes, solicitudesRes] = await Promise.all([fetch('/api/admin/solicitudes/stats'), fetch(`/api/admin/solicitudes?${params}`)]);
      if (statsRes.ok) stats = await statsRes.json();
      if (solicitudesRes.ok) { const data = await solicitudesRes.json(); solicitudes = data.data || []; total = data.total || 0; }
    } catch (e) { error = 'Error cargando datos'; console.error(e); }
    finally { loading = false; }
  }
  
  async function openDetail(id: string) {
    selectedId = id; showModal = true; loadingDetail = true;
    try { const res = await fetch(`/api/admin/solicitudes/${id}`); if (res.ok) selectedDetail = await res.json(); }
    catch (e) { console.error(e); } finally { loadingDetail = false; }
  }
  
  function closeModal() { showModal = false; selectedId = null; selectedDetail = null; }
  
  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/solicitudes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { loadData(); if (selectedDetail) selectedDetail.status = newStatus; }
    } catch (e) { console.error(e); }
  }
  
  function clearFilters() { filters = { ...filters, status: '', visaType: '', priority: '', search: '', page: 1 }; loadData(); }
  function applyFilters() { filters.page = 1; loadData(); }
  
  function getStatusColor(s: string) {
    const c: Record<string, string> = { 'NUEVA': 'bg-blue-100 text-blue-700', 'EN_REVISION': 'bg-yellow-100 text-yellow-700', 'DOCUMENTOS': 'bg-orange-100 text-orange-700', 'FORMULARIO': 'bg-purple-100 text-purple-700', 'CITA_AGENDADA': 'bg-indigo-100 text-indigo-700', 'ENTREVISTA': 'bg-pink-100 text-pink-700', 'APROBADA': 'bg-emerald-100 text-emerald-700', 'RECHAZADA': 'bg-rose-100 text-rose-700', 'CANCELADA': 'bg-gray-100 text-gray-700' };
    return c[s] || 'bg-gray-100 text-gray-700';
  }
  
  function getPriorityBadge(p: string) {
    const b: Record<string, { bg: string; text: string; label: string }> = { 'LOW': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Baja' }, 'NORMAL': { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Normal' }, 'HIGH': { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Alta' }, 'URGENT': { bg: 'bg-red-100', text: 'text-red-600', label: 'Urgente' } };
    return b[p] || b['NORMAL'];
  }
  
  const statusOptions = [{ value: '', label: 'Todos' }, { value: 'NUEVA', label: 'Nueva' }, { value: 'EN_REVISION', label: 'En Revisión' }, { value: 'DOCUMENTOS', label: 'Documentos' }, { value: 'FORMULARIO', label: 'Formulario' }, { value: 'CITA_AGENDADA', label: 'Cita Agendada' }, { value: 'ENTREVISTA', label: 'Entrevista' }, { value: 'APROBADA', label: 'Aprobada' }, { value: 'RECHAZADA', label: 'Rechazada' }];
  const visaOptions = [{ value: '', label: 'Todos' }, { value: 'USA_TURISMO', label: 'USA' }, { value: 'CANADA_VISITANTE', label: 'Canadá' }, { value: 'SCHENGEN', label: 'Schengen' }, { value: 'UK', label: 'UK' }, { value: 'MEXICO', label: 'México' }];
  const priorityOptions = [{ value: '', label: 'Todas' }, { value: 'LOW', label: 'Baja' }, { value: 'NORMAL', label: 'Normal' }, { value: 'HIGH', label: 'Alta' }, { value: 'URGENT', label: 'Urgente' }];
</script>


<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Hola, {adminName}</h1>
      <p class="text-gray-500 text-sm mt-1">Panel de Administración — Gestión de solicitudes</p>
    </div>
    <button onclick={() => loadData()} disabled={loading} class="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
      <RefreshCw size={18} class={loading ? 'animate-spin' : ''} />
      <span class="font-medium">Actualizar</span>
    </button>
  </div>
  
  <!-- KPI Cards -->
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {#each kpiCards as kpi}
      <div class="bg-white rounded-2xl p-4 shadow-sm border {kpi.borderColor} hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="{kpi.iconBg} p-2 rounded-xl">
            <kpi.icon size={20} class={kpi.textColor} strokeWidth={1.5} />
          </div>
          {#if kpi.trend === 'up'}
            <TrendingUp size={14} class="text-emerald-600" />
          {:else if kpi.trend === 'down'}
            <TrendingDown size={14} class="text-rose-600" />
          {/if}
        </div>
        <p class="text-2xl font-bold text-gray-900">{kpi.value}</p>
        <p class="text-gray-500 text-sm mt-1">{kpi.label}</p>
      </div>
    {/each}
  </div>
  
  <!-- Charts -->
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center gap-2 mb-4">
        <PieChart size={20} class="text-gray-400" />
        <h3 class="font-semibold text-gray-900">Distribución por Estado</h3>
      </div>
      <div class="h-64"><canvas bind:this={statusChartCanvas}></canvas></div>
    </div>
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center gap-2 mb-4">
        <BarChart3 size={20} class="text-gray-400" />
        <h3 class="font-semibold text-gray-900">Actividad Semanal</h3>
      </div>
      <div class="h-64"><canvas bind:this={weeklyChartCanvas}></canvas></div>
    </div>
  </div>
  
  <!-- Filters -->
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <div class="flex items-center gap-2 mb-4">
      <Filter size={18} class="text-gray-400" />
      <span class="font-medium text-gray-700">Filtros</span>
      {#if hasFilters}
        <button onclick={clearFilters} class="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <X size={14} /> Limpiar
        </button>
      {/if}
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div class="relative">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar..." bind:value={filters.search} onkeydown={(e) => e.key === 'Enter' && applyFilters()} class="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
      </div>
      <select bind:value={filters.status} onchange={applyFilters} class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
        {#each statusOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
      <select bind:value={filters.visaType} onchange={applyFilters} class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
        {#each visaOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
      <select bind:value={filters.priority} onchange={applyFilters} class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
        {#each priorityOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
      <button onclick={applyFilters} class="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium">Buscar</button>
    </div>
  </div>

  
  <!-- Table -->
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    {#if loading}
      <div class="text-center py-16">
        <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-500 mt-4">Cargando...</p>
      </div>
    {:else if error}
      <div class="p-6 text-center">
        <XCircle size={48} class="text-rose-400 mx-auto mb-3" />
        <p class="text-rose-600">{error}</p>
      </div>
    {:else if solicitudes.length === 0}
      <div class="text-center py-16">
        <Inbox size={48} class="text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">No se encontraron solicitudes</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Solicitante</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Visa</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progreso</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prioridad</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            {#each solicitudes as sol}
              <tr class="hover:bg-gray-50/50">
                <td class="px-4 py-4 font-medium text-gray-900">{sol.fullName}</td>
                <td class="px-4 py-4">
                  <p class="text-sm text-gray-700">{sol.destinationCountry}</p>
                  <p class="text-xs text-gray-400">{sol.visaType.replace('_', ' ')}</p>
                </td>
                <td class="px-4 py-4">
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium {getStatusColor(sol.status)}">{sol.status.replace('_', ' ')}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-20 bg-gray-100 rounded-full h-1.5">
                      <div class="bg-blue-600 h-1.5 rounded-full" style="width: {(sol.currentStep / sol.totalSteps) * 100}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">{sol.currentStep}/{sol.totalSteps}</span>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium {getPriorityBadge(sol.priority).bg} {getPriorityBadge(sol.priority).text}">{getPriorityBadge(sol.priority).label}</span>
                </td>
                <td class="px-4 py-4 text-sm text-gray-500">{new Date(sol.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}</td>
                <td class="px-4 py-4">
                  <button onclick={() => openDetail(sol.id)} class="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2.5 py-1.5 rounded-lg">
                    <Eye size={16} /> Ver
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm text-gray-500">Mostrando {(filters.page - 1) * filters.limit + 1} - {Math.min(filters.page * filters.limit, total)} de {total}</p>
        <div class="flex items-center gap-2">
          <button onclick={() => { filters.page = Math.max(1, filters.page - 1); loadData(); }} disabled={filters.page === 1} class="inline-flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">
            <ChevronLeft size={16} /> Anterior
          </button>
          <span class="text-sm text-gray-600 px-2">{filters.page} / {totalPages || 1}</span>
          <button onclick={() => { filters.page = Math.min(totalPages, filters.page + 1); loadData(); }} disabled={filters.page >= totalPages} class="inline-flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>


<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="p-6 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
        <h2 class="text-xl font-bold text-gray-900">Detalle de Solicitud</h2>
        <button onclick={closeModal} class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg">
          <X size={20} />
        </button>
      </div>
      {#if loadingDetail}
        <div class="p-12 text-center">
          <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      {:else if selectedDetail}
        <div class="p-6 space-y-6">
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 uppercase mb-1">Nombre</p>
              <p class="font-medium text-gray-900">{selectedDetail.fullName}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 uppercase mb-1">Email</p>
              <p class="font-medium text-gray-900">{selectedDetail.email}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 uppercase mb-1">Teléfono</p>
              <p class="font-medium text-gray-900">{selectedDetail.phone || '-'}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 uppercase mb-1">Ciudad</p>
              <p class="font-medium text-gray-900">{selectedDetail.city || '-'}</p>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700 mb-3">Cambiar Estado</p>
            <div class="flex flex-wrap gap-2">
              {#each statusOptions.slice(1) as opt}
                <button onclick={() => updateStatus(selectedDetail.id, opt.value)} class="px-3 py-1.5 text-sm rounded-lg border transition-all {selectedDetail.status === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}">
                  {opt.label}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
