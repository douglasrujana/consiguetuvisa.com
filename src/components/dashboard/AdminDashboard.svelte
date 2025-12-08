<script lang="ts">
  // AdminDashboard.svelte - Dashboard de administración para gestión de solicitudes
  // Svelte 5 con runas ($state, $derived, $effect)
  
  import type { SolicitudSummary, DashboardStats, SolicitudFiltersDTO } from '../../server/lib/features/solicitud';
  
  // Props
  interface Props {
    adminName?: string;
  }
  
  let { adminName = 'Admin' }: Props = $props();
  
  // Estado reactivo con runas
  let stats = $state<DashboardStats>({
    totalSolicitudes: 0,
    nuevas: 0,
    enProceso: 0,
    aprobadas: 0,
    rechazadas: 0,
    citasPendientes: 0,
  });
  
  let solicitudes = $state<SolicitudSummary[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let total = $state(0);
  
  // Filtros
  let filters = $state<SolicitudFiltersDTO>({
    status: '',
    visaType: '',
    priority: '',
    search: '',
    page: 1,
    limit: 20,
  });
  
  // Modal de detalle
  let showModal = $state(false);
  let selectedId = $state<string | null>(null);
  let selectedDetail = $state<any>(null);
  let loadingDetail = $state(false);
  
  // Derivados
  let totalPages = $derived(Math.ceil(total / filters.limit));
  let hasFilters = $derived(
    filters.status !== '' || 
    filters.visaType !== '' || 
    filters.priority !== '' || 
    filters.search !== ''
  );
  
  // Cargar datos al montar y cuando cambian filtros
  $effect(() => {
    loadData();
  });
  
  async function loadData() {
    loading = true;
    error = null;
    
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.visaType) params.set('visaType', filters.visaType);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));
      
      const [statsRes, solicitudesRes] = await Promise.all([
        fetch('/api/admin/solicitudes/stats'),
        fetch(`/api/admin/solicitudes?${params}`),
      ]);
      
      if (statsRes.ok) {
        stats = await statsRes.json();
      }
      
      if (solicitudesRes.ok) {
        const data = await solicitudesRes.json();
        solicitudes = data.data || [];
        total = data.total || 0;
      }
    } catch (e) {
      error = 'Error cargando datos';
      console.error(e);
    } finally {
      loading = false;
    }
  }
  
  async function openDetail(id: string) {
    selectedId = id;
    showModal = true;
    loadingDetail = true;
    
    try {
      const res = await fetch(`/api/admin/solicitudes/${id}`);
      if (res.ok) {
        selectedDetail = await res.json();
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingDetail = false;
    }
  }
  
  function closeModal() {
    showModal = false;
    selectedId = null;
    selectedDetail = null;
  }
  
  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/solicitudes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        loadData();
        if (selectedDetail) {
          selectedDetail.status = newStatus;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  function clearFilters() {
    filters = { ...filters, status: '', visaType: '', priority: '', search: '', page: 1 };
  }
  
  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'NUEVA': 'bg-blue-100 text-blue-800',
      'EN_REVISION': 'bg-yellow-100 text-yellow-800',
      'DOCUMENTOS': 'bg-orange-100 text-orange-800',
      'FORMULARIO': 'bg-purple-100 text-purple-800',
      'CITA_AGENDADA': 'bg-indigo-100 text-indigo-800',
      'ENTREVISTA': 'bg-pink-100 text-pink-800',
      'APROBADA': 'bg-green-100 text-green-800',
      'RECHAZADA': 'bg-red-100 text-red-800',
      'CANCELADA': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
  
  function getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'LOW': 'text-gray-500',
      'NORMAL': 'text-blue-500',
      'HIGH': 'text-orange-500',
      'URGENT': 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  }
  
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'NUEVA', label: 'Nueva' },
    { value: 'EN_REVISION', label: 'En Revisión' },
    { value: 'DOCUMENTOS', label: 'Documentos' },
    { value: 'FORMULARIO', label: 'Formulario' },
    { value: 'CITA_AGENDADA', label: 'Cita Agendada' },
    { value: 'ENTREVISTA', label: 'Entrevista' },
    { value: 'APROBADA', label: 'Aprobada' },
    { value: 'RECHAZADA', label: 'Rechazada' },
  ];
  
  const visaOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'USA_TURISMO', label: 'USA Turismo' },
    { value: 'CANADA_VISITANTE', label: 'Canadá' },
    { value: 'SCHENGEN', label: 'Schengen' },
    { value: 'UK', label: 'Reino Unido' },
    { value: 'MEXICO', label: 'México' },
  ];
  
  const priorityOptions = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'LOW', label: 'Baja' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'URGENT', label: 'Urgente' },
  ];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Hola, {adminName}</h1>
      <p class="text-gray-600">Panel de Administración — Gestión de solicitudes</p>
    </div>
    <button 
      onclick={() => loadData()}
      class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
    >
      🔄 Actualizar
    </button>
  </div>
  
  <!-- Stats Cards -->
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <div class="bg-white rounded-xl p-4 shadow-sm border">
      <p class="text-3xl font-bold text-gray-900">{stats.totalSolicitudes}</p>
      <p class="text-gray-600 text-sm">Total</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
      <p class="text-3xl font-bold text-blue-600">{stats.nuevas}</p>
      <p class="text-gray-600 text-sm">Nuevas</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
      <p class="text-3xl font-bold text-yellow-600">{stats.enProceso}</p>
      <p class="text-gray-600 text-sm">En Proceso</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border border-green-200">
      <p class="text-3xl font-bold text-green-600">{stats.aprobadas}</p>
      <p class="text-gray-600 text-sm">Aprobadas</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border border-red-200">
      <p class="text-3xl font-bold text-red-600">{stats.rechazadas}</p>
      <p class="text-gray-600 text-sm">Rechazadas</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border border-indigo-200">
      <p class="text-3xl font-bold text-indigo-600">{stats.citasPendientes}</p>
      <p class="text-gray-600 text-sm">Citas Hoy</p>
    </div>
  </div>
  
  <!-- Filters -->
  <div class="bg-white rounded-xl p-4 shadow-sm border">
    <div class="grid md:grid-cols-5 gap-4">
      <input
        type="text"
        placeholder="Buscar por nombre, email..."
        bind:value={filters.search}
        class="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <select bind:value={filters.status} class="px-3 py-2 border rounded-lg">
        {#each statusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <select bind:value={filters.visaType} class="px-3 py-2 border rounded-lg">
        {#each visaOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <select bind:value={filters.priority} class="px-3 py-2 border rounded-lg">
        {#each priorityOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      {#if hasFilters}
        <button onclick={clearFilters} class="text-gray-600 hover:text-gray-900">
          ✕ Limpiar filtros
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Table -->
  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
      </div>
    {:else if error}
      <div class="p-4 text-red-600">{error}</div>
    {:else if solicitudes.length === 0}
      <div class="text-center py-12 text-gray-500">
        No se encontraron solicitudes
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            {#each solicitudes as sol}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{sol.fullName}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-sm text-gray-600">{sol.destinationCountry}</p>
                  <p class="text-xs text-gray-400">{sol.visaType.replace('_', ' ')}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 rounded-full {getStatusColor(sol.status)}">
                    {sol.status.replace('_', ' ')}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-20 bg-gray-100 rounded-full h-2">
                      <div 
                        class="bg-blue-600 h-2 rounded-full"
                        style="width: {(sol.currentStep / sol.totalSteps) * 100}%"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-500">{sol.currentStep}/{sol.totalSteps}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="text-sm font-medium {getPriorityColor(sol.priority)}">
                    {sol.priority}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {new Date(sol.createdAt).toLocaleDateString('es-EC')}
                </td>
                <td class="px-4 py-3">
                  <button 
                    onclick={() => openDetail(sol.id)}
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="px-4 py-3 border-t flex items-center justify-between">
        <p class="text-sm text-gray-600">
          Mostrando {(filters.page - 1) * filters.limit + 1} - {Math.min(filters.page * filters.limit, total)} de {total}
        </p>
        <div class="flex gap-2">
          <button 
            onclick={() => filters.page = Math.max(1, filters.page - 1)}
            disabled={filters.page === 1}
            class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button 
            onclick={() => filters.page = Math.min(totalPages, filters.page + 1)}
            disabled={filters.page >= totalPages}
            class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal de detalle -->
{#if showModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b flex items-center justify-between">
        <h2 class="text-xl font-bold">Detalle de Solicitud</h2>
        <button onclick={closeModal} class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      
      {#if loadingDetail}
        <div class="p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      {:else if selectedDetail}
        <div class="p-6 space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Nombre</p>
              <p class="font-medium">{selectedDetail.fullName}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="font-medium">{selectedDetail.email}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Teléfono</p>
              <p class="font-medium">{selectedDetail.phone}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Ciudad</p>
              <p class="font-medium">{selectedDetail.city || '-'}</p>
            </div>
          </div>
          
          <hr />
          
          <div>
            <p class="text-sm text-gray-500 mb-2">Cambiar Estado</p>
            <div class="flex flex-wrap gap-2">
              {#each statusOptions.slice(1) as opt}
                <button
                  onclick={() => updateStatus(selectedDetail.id, opt.value)}
                  class="px-3 py-1 text-sm rounded-full border {selectedDetail.status === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}"
                >
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
