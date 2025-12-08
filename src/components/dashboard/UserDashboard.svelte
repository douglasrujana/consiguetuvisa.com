<script lang="ts">
  // UserDashboard.svelte - Dashboard del usuario para seguimiento de solicitudes
  // Svelte 5 con runas ($state, $derived, $effect)
  
  import type { Solicitud, DashboardStats } from '../../server/lib/features/solicitud';
  
  // Props
  interface Props {
    userId: string;
    userName?: string;
    userRole?: string;
  }
  
  let { userId, userName = 'Usuario', userRole = 'USER' }: Props = $props();
  
  // Estado reactivo con runas
  let stats = $state<DashboardStats>({
    totalSolicitudes: 0,
    nuevas: 0,
    enProceso: 0,
    aprobadas: 0,
    rechazadas: 0,
    citasPendientes: 0,
  });
  
  let solicitudes = $state<Solicitud[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let selectedSolicitud = $state<Solicitud | null>(null);
  
  // Derivados
  let hasSolicitudes = $derived(solicitudes.length > 0);
  let progressPercentage = $derived(
    selectedSolicitud 
      ? Math.round((selectedSolicitud.currentStep / selectedSolicitud.totalSteps) * 100)
      : 0
  );
  
  // Cargar datos al montar
  $effect(() => {
    loadData();
  });
  
  async function loadData() {
    loading = true;
    error = null;
    
    try {
      const [statsRes, solicitudesRes] = await Promise.all([
        fetch(`/api/solicitudes/stats?userId=${userId}`),
        fetch(`/api/solicitudes?userId=${userId}`),
      ]);
      
      if (statsRes.ok) {
        stats = await statsRes.json();
      }
      
      if (solicitudesRes.ok) {
        const data = await solicitudesRes.json();
        solicitudes = data.data || [];
        if (solicitudes.length > 0 && !selectedSolicitud) {
          selectedSolicitud = solicitudes[0];
        }
      }
    } catch (e) {
      error = 'Error cargando datos';
      console.error(e);
    } finally {
      loading = false;
    }
  }
  
  function selectSolicitud(sol: Solicitud) {
    selectedSolicitud = sol;
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
  
  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'NUEVA': 'Nueva',
      'EN_REVISION': 'En Revisión',
      'DOCUMENTOS': 'Documentos',
      'FORMULARIO': 'Formulario',
      'CITA_AGENDADA': 'Cita Agendada',
      'ENTREVISTA': 'Entrevista',
      'APROBADA': 'Aprobada',
      'RECHAZADA': 'Rechazada',
      'CANCELADA': 'Cancelada',
    };
    return labels[status] || status;
  }
  
  const steps = [
    { num: 1, label: 'Evaluación', icon: '📋' },
    { num: 2, label: 'Documentos', icon: '📄' },
    { num: 3, label: 'Formulario', icon: '✍️' },
    { num: 4, label: 'Cita', icon: '📅' },
    { num: 5, label: 'Entrevista', icon: '🎯' },
  ];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Hola, {userName}</h1>
      <p class="text-gray-600">Aquí puedes ver el estado de tus solicitudes</p>
    </div>
    <a 
      href="/#contacto" 
      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Nueva Solicitud
    </a>
  </div>
  
  <!-- Stats Cards -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl p-4 shadow-sm border">
      <p class="text-3xl font-bold text-blue-600">{stats.totalSolicitudes}</p>
      <p class="text-gray-600 text-sm">Total</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border">
      <p class="text-3xl font-bold text-yellow-600">{stats.enProceso}</p>
      <p class="text-gray-600 text-sm">En Proceso</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border">
      <p class="text-3xl font-bold text-green-600">{stats.aprobadas}</p>
      <p class="text-gray-600 text-sm">Aprobadas</p>
    </div>
    <div class="bg-white rounded-xl p-4 shadow-sm border">
      <p class="text-3xl font-bold text-indigo-600">{stats.citasPendientes}</p>
      <p class="text-gray-600 text-sm">Citas Pendientes</p>
    </div>
  </div>
  
  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-gray-600 mt-2">Cargando...</p>
    </div>
  {:else if error}
    <div class="bg-red-50 text-red-700 p-4 rounded-lg">
      {error}
    </div>
  {:else if !hasSolicitudes}
    <div class="bg-white rounded-xl p-12 text-center shadow-sm border">
      <div class="text-6xl mb-4">📋</div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">No tienes solicitudes aún</h2>
      <p class="text-gray-600 mb-6">Comienza tu proceso de visa con una evaluación gratuita</p>
      <a 
        href="/#contacto" 
        class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Solicitar Evaluación
      </a>
    </div>
  {:else}
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Lista de solicitudes -->
      <div class="lg:col-span-1 space-y-3">
        <h2 class="font-semibold text-gray-900">Mis Solicitudes</h2>
        {#each solicitudes as sol}
          <button
            onclick={() => selectSolicitud(sol)}
            class="w-full text-left bg-white rounded-xl p-4 shadow-sm border transition-all {selectedSolicitud?.id === sol.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900">{sol.destinationCountry}</span>
              <span class="text-xs px-2 py-1 rounded-full {getStatusColor(sol.status)}">
                {getStatusLabel(sol.status)}
              </span>
            </div>
            <p class="text-sm text-gray-600">{sol.visaType.replace('_', ' ')}</p>
            <div class="mt-2 bg-gray-100 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all"
                style="width: {(sol.currentStep / sol.totalSteps) * 100}%"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">Paso {sol.currentStep} de {sol.totalSteps}</p>
          </button>
        {/each}
      </div>
      
      <!-- Detalle de solicitud -->
      {#if selectedSolicitud}
        <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-bold text-gray-900">{selectedSolicitud.destinationCountry}</h2>
              <p class="text-gray-600">{selectedSolicitud.visaType.replace('_', ' ')}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(selectedSolicitud.status)}">
              {getStatusLabel(selectedSolicitud.status)}
            </span>
          </div>
          
          <!-- Progress Steps -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Progreso</span>
              <span class="text-sm text-gray-600">{progressPercentage}%</span>
            </div>
            <div class="bg-gray-100 rounded-full h-3 mb-4">
              <div 
                class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style="width: {progressPercentage}%"
              ></div>
            </div>
            
            <div class="flex justify-between">
              {#each steps as step}
                <div class="flex flex-col items-center">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg {selectedSolicitud.currentStep >= step.num ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}">
                    {step.icon}
                  </div>
                  <span class="text-xs mt-1 text-gray-600 hidden sm:block">{step.label}</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Info -->
          <div class="grid md:grid-cols-2 gap-4 text-sm">
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-gray-500">Solicitante</p>
              <p class="font-medium text-gray-900">{selectedSolicitud.fullName}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-gray-500">Email</p>
              <p class="font-medium text-gray-900">{selectedSolicitud.email}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-gray-500">Teléfono</p>
              <p class="font-medium text-gray-900">{selectedSolicitud.phone}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-gray-500">Fecha de solicitud</p>
              <p class="font-medium text-gray-900">
                {new Date(selectedSolicitud.createdAt).toLocaleDateString('es-EC')}
              </p>
            </div>
            {#if selectedSolicitud.appointmentDate}
              <div class="bg-blue-50 rounded-lg p-3 md:col-span-2">
                <p class="text-blue-600">📅 Cita programada</p>
                <p class="font-medium text-blue-900">
                  {new Date(selectedSolicitud.appointmentDate).toLocaleDateString('es-EC', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            {/if}
          </div>
          
          <!-- Actions -->
          <div class="mt-6 flex gap-3">
            <a 
              href="https://wa.me/593999999999?text=Hola, tengo una consulta sobre mi solicitud {selectedSolicitud.id}"
              target="_blank"
              class="flex-1 bg-green-500 text-white text-center py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              💬 Consultar por WhatsApp
            </a>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
