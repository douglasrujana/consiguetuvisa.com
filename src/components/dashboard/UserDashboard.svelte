<script lang="ts">
  // UserDashboard.svelte - Estilo Jony Ive + Skeletons
  
  import type { Solicitud, DashboardStats } from '../../server/lib/features/solicitud';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  import FileText from 'lucide-svelte/icons/file-text';
  import Clock from 'lucide-svelte/icons/clock';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import Calendar from 'lucide-svelte/icons/calendar';
  import MessageCircle from 'lucide-svelte/icons/message-circle';
  import Plus from 'lucide-svelte/icons/plus';
  import AlertCircle from 'lucide-svelte/icons/alert-circle';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import FileCheck from 'lucide-svelte/icons/file-check';
  import PenLine from 'lucide-svelte/icons/pen-line';
  import CalendarCheck from 'lucide-svelte/icons/calendar-check';
  import Target from 'lucide-svelte/icons/target';
  import FolderOpen from 'lucide-svelte/icons/folder-open';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  
  interface Props {
    userId: string;
    userName?: string;
  }
  
  let { userId, userName = 'Usuario' }: Props = $props();
  
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
  
  let hasSolicitudes = $derived(solicitudes.length > 0);
  let progressPercentage = $derived(
    selectedSolicitud 
      ? Math.round((selectedSolicitud.currentStep / selectedSolicitud.totalSteps) * 100)
      : 0
  );
  
  $effect(() => { loadData(); });
  
  async function loadData() {
    loading = true;
    error = null;
    try {
      const [statsRes, solicitudesRes] = await Promise.all([
        fetch(`/api/solicitudes/stats?userId=${userId}`),
        fetch(`/api/solicitudes?userId=${userId}`),
      ]);
      if (statsRes.ok) stats = await statsRes.json();
      if (solicitudesRes.ok) {
        const data = await solicitudesRes.json();
        solicitudes = data.data || [];
        if (solicitudes.length > 0 && !selectedSolicitud) {
          selectedSolicitud = solicitudes[0];
        }
      }
    } catch (e) {
      error = 'Error cargando datos';
    } finally {
      loading = false;
    }
  }
  
  function selectSolicitud(sol: Solicitud) {
    selectedSolicitud = sol;
  }
  
  function getStatusStyle(status: string): { bg: string; text: string } {
    const styles: Record<string, { bg: string; text: string }> = {
      'NUEVA': { bg: 'bg-blue-50', text: 'text-blue-600' },
      'EN_REVISION': { bg: 'bg-amber-50', text: 'text-amber-600' },
      'DOCUMENTOS': { bg: 'bg-orange-50', text: 'text-orange-600' },
      'FORMULARIO': { bg: 'bg-violet-50', text: 'text-violet-600' },
      'CITA_AGENDADA': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
      'ENTREVISTA': { bg: 'bg-pink-50', text: 'text-pink-600' },
      'APROBADA': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
      'RECHAZADA': { bg: 'bg-red-50', text: 'text-red-600' },
      'CANCELADA': { bg: 'bg-slate-50', text: 'text-slate-500' },
    };
    return styles[status] || { bg: 'bg-slate-50', text: 'text-slate-500' };
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
    { num: 1, label: 'Evaluación', icon: ClipboardList },
    { num: 2, label: 'Documentos', icon: FileCheck },
    { num: 3, label: 'Formulario', icon: PenLine },
    { num: 4, label: 'Cita', icon: CalendarCheck },
    { num: 5, label: 'Entrevista', icon: Target },
  ];
</script>

<div class="space-y-8">
  <!-- Header - Minimalista -->
  <div class="pt-4">
    <p class="text-sm text-slate-400 font-medium">Bienvenido de vuelta</p>
    <h1 class="text-3xl font-semibold text-slate-800 mt-1">{userName}</h1>
  </div>
  
  <!-- Stats - Estilo Apple -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
    {#if loading}
      {#each Array(4) as _}
        <div class="bg-white rounded-3xl p-6">
          <Skeleton class="w-6 h-6 rounded mb-4" />
          <Skeleton class="h-10 w-16 rounded mb-2" />
          <Skeleton class="h-4 w-20 rounded" />
        </div>
      {/each}
    {:else}
      {#each [
        { value: stats.totalSolicitudes, label: 'Total', icon: FileText, color: 'text-slate-600' },
        { value: stats.enProceso, label: 'En Proceso', icon: Clock, color: 'text-amber-500' },
        { value: stats.aprobadas, label: 'Aprobadas', icon: CheckCircle, color: 'text-emerald-500' },
        { value: stats.citasPendientes, label: 'Citas', icon: Calendar, color: 'text-blue-500' },
      ] as stat}
        {@const Icon = stat.icon}
        <div class="group">
          <div class="bg-white rounded-3xl p-6 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
            <Icon size={24} class="{stat.color} mb-4" strokeWidth={1.5} />
            <p class="text-4xl font-light text-slate-800">{stat.value}</p>
            <p class="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>
  
  {#if loading}
    <!-- Skeleton para lista de solicitudes -->
    <div class="grid lg:grid-cols-5 gap-8">
      <div class="lg:col-span-2 space-y-2">
        <Skeleton class="h-4 w-24 rounded mb-4" />
        {#each Array(3) as _}
          <div class="bg-white rounded-2xl p-5">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex-1">
                <Skeleton class="h-5 w-32 rounded mb-2" />
                <Skeleton class="h-4 w-24 rounded" />
              </div>
              <Skeleton class="h-6 w-20 rounded-full" />
            </div>
            <Skeleton class="h-1 w-full rounded-full mb-2" />
            <Skeleton class="h-3 w-20 rounded" />
          </div>
        {/each}
      </div>
      <div class="lg:col-span-3 bg-white rounded-3xl p-8">
        <div class="flex items-start justify-between mb-10">
          <div>
            <Skeleton class="h-6 w-20 rounded-full mb-3" />
            <Skeleton class="h-8 w-40 rounded mb-2" />
            <Skeleton class="h-4 w-28 rounded" />
          </div>
          <div class="text-right">
            <Skeleton class="h-12 w-16 rounded mb-1" />
            <Skeleton class="h-3 w-20 rounded" />
          </div>
        </div>
        <Skeleton class="h-1 w-full rounded-full mb-8" />
        <div class="flex justify-between mb-10">
          {#each Array(5) as _}
            <div class="flex flex-col items-center">
              <Skeleton class="w-12 h-12 rounded-2xl mb-3" />
              <Skeleton class="h-3 w-16 rounded" />
            </div>
          {/each}
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          {#each Array(4) as _}
            <div class="bg-slate-50 rounded-2xl p-4">
              <Skeleton class="h-3 w-16 rounded mb-2" />
              <Skeleton class="h-5 w-32 rounded" />
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-3">
      <AlertCircle size={20} strokeWidth={1.5} />
      <span class="text-sm">{error}</span>
    </div>
  {:else if !hasSolicitudes}
    <div class="bg-white rounded-3xl p-16 text-center">
      <div class="w-24 h-24 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center">
        <FolderOpen size={40} class="text-slate-300" strokeWidth={1.5} />
      </div>
      <h2 class="text-xl font-medium text-slate-800 mb-2">Sin solicitudes</h2>
      <p class="text-slate-400 mb-8 max-w-sm mx-auto">
        Comienza tu proceso de visa con una evaluación personalizada
      </p>
      <a 
        href="/#contacto" 
        class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
      >
        <Plus size={16} strokeWidth={2} />
        Nueva Solicitud
      </a>
    </div>
  {:else}
    <div class="grid lg:grid-cols-5 gap-8">
      <!-- Lista de solicitudes -->
      <div class="lg:col-span-2 space-y-2">
        <p class="text-xs text-slate-400 uppercase tracking-wider font-medium px-1 mb-4">
          Mis Solicitudes
        </p>
        {#each solicitudes as sol}
          {@const style = getStatusStyle(sol.status)}
          <button
            onclick={() => selectSolicitud(sol)}
            class="w-full text-left bg-white rounded-2xl p-5 transition-all duration-300 {selectedSolicitud?.id === sol.id ? 'ring-2 ring-slate-900 shadow-lg' : 'hover:shadow-md'}"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-800 truncate">{sol.destinationCountry}</p>
                <p class="text-sm text-slate-400 mt-0.5">{sol.visaType.replace('_', ' ')}</p>
              </div>
              <span class="text-xs px-3 py-1 rounded-full font-medium {style.bg} {style.text}">
                {getStatusLabel(sol.status)}
              </span>
            </div>
            <div class="mt-4">
              <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-slate-900 rounded-full transition-all duration-500"
                  style="width: {(sol.currentStep / sol.totalSteps) * 100}%"
                ></div>
              </div>
              <p class="text-xs text-slate-400 mt-2">Paso {sol.currentStep} de {sol.totalSteps}</p>
            </div>
          </button>
        {/each}
        
        <a 
          href="/#contacto"
          class="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors mt-4"
        >
          <Plus size={18} strokeWidth={1.5} />
          <span class="text-sm font-medium">Agregar solicitud</span>
        </a>
      </div>
      
      <!-- Detalle -->
      {#if selectedSolicitud}
        {@const style = getStatusStyle(selectedSolicitud.status)}
        <div class="lg:col-span-3 bg-white rounded-3xl p-8">
          <!-- Header -->
          <div class="flex items-start justify-between mb-10">
            <div>
              <span class="text-xs px-3 py-1 rounded-full font-medium {style.bg} {style.text}">
                {getStatusLabel(selectedSolicitud.status)}
              </span>
              <h2 class="text-2xl font-semibold text-slate-800 mt-3">{selectedSolicitud.destinationCountry}</h2>
              <p class="text-slate-400 mt-1">{selectedSolicitud.visaType.replace('_', ' ')}</p>
            </div>
            <div class="text-right">
              <p class="text-4xl font-light text-slate-800">{progressPercentage}%</p>
              <p class="text-xs text-slate-400 mt-1">completado</p>
            </div>
          </div>
          
          <!-- Progress Steps -->
          <div class="mb-10">
            <div class="h-1 bg-slate-100 rounded-full mb-8">
              <div 
                class="h-full bg-gradient-to-r from-slate-800 to-slate-600 rounded-full transition-all duration-700"
                style="width: {progressPercentage}%"
              ></div>
            </div>
            
            <div class="flex justify-between">
              {#each steps as step}
                {@const Icon = step.icon}
                {@const isActive = selectedSolicitud.currentStep >= step.num}
                {@const isCurrent = selectedSolicitud.currentStep === step.num}
                <div class="flex flex-col items-center">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 {isActive ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-300'} {isCurrent ? 'ring-4 ring-slate-200' : ''}">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <span class="text-xs mt-3 text-slate-500 hidden sm:block">{step.label}</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Info Grid -->
          <div class="grid sm:grid-cols-2 gap-4 mb-8">
            {#each [
              { label: 'Solicitante', value: selectedSolicitud.fullName },
              { label: 'Email', value: selectedSolicitud.email },
              { label: 'Teléfono', value: selectedSolicitud.phone },
              { label: 'Fecha', value: new Date(selectedSolicitud.createdAt).toLocaleDateString('es-EC') },
            ] as field}
              <div class="bg-slate-50 rounded-2xl p-4">
                <p class="text-xs text-slate-400 uppercase tracking-wider">{field.label}</p>
                <p class="text-slate-800 font-medium mt-1 truncate">{field.value}</p>
              </div>
            {/each}
          </div>
          
          {#if selectedSolicitud.appointmentDate}
            <div class="bg-blue-50 rounded-2xl p-5 mb-8 flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <CalendarCheck size={24} class="text-blue-600" strokeWidth={1.5} />
              </div>
              <div>
                <p class="text-xs text-blue-600 uppercase tracking-wider font-medium">Cita programada</p>
                <p class="text-blue-900 font-medium mt-0.5">
                  {new Date(selectedSolicitud.appointmentDate).toLocaleDateString('es-EC', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          {/if}
          
          <!-- Action -->
          <a 
            href="https://wa.me/593999999999?text=Hola, tengo una consulta sobre mi solicitud {selectedSolicitud.id}"
            target="_blank"
            class="flex items-center justify-between w-full bg-emerald-500 text-white p-5 rounded-2xl hover:bg-emerald-600 transition-colors group"
          >
            <div class="flex items-center gap-3">
              <MessageCircle size={20} strokeWidth={1.5} />
              <span class="font-medium">Consultar por WhatsApp</span>
            </div>
            <ChevronRight size={20} class="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>
