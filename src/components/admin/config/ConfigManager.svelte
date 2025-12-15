<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Tabs from '$lib/components/ui/tabs';
  import Bot from 'lucide-svelte/icons/bot';
  import Database from 'lucide-svelte/icons/database';
  import HardDrive from 'lucide-svelte/icons/hard-drive';
  import Bell from 'lucide-svelte/icons/bell';
  import Plug from 'lucide-svelte/icons/plug';
  import Check from 'lucide-svelte/icons/check';
  import X from 'lucide-svelte/icons/x';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import Save from 'lucide-svelte/icons/save';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Activity from 'lucide-svelte/icons/activity';
  import Wifi from 'lucide-svelte/icons/wifi';
  import Globe from 'lucide-svelte/icons/globe';
  import Server from 'lucide-svelte/icons/server';
  import FileText from 'lucide-svelte/icons/file-text';
  import Megaphone from 'lucide-svelte/icons/megaphone';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Clock from 'lucide-svelte/icons/clock';
  import Zap from 'lucide-svelte/icons/zap';
  import Shield from 'lucide-svelte/icons/shield';
  import Gauge from 'lucide-svelte/icons/gauge';
  import Eye from 'lucide-svelte/icons/eye';

  interface Banner { id: string; type: string; message: string; link?: string; linkText?: string; dismissible: boolean; startDate?: string; endDate?: string; targetPages: string[]; targetRoles: string[]; bgColor?: string; textColor?: string; enabled: boolean; }
  interface DaySchedule { enabled: boolean; start: string; end: string; }

  let loading = $state(true);
  let saving = $state(false);
  let config = $state<any>({});
  let health = $state<any>(null);
  let editableConfig = $state<any>({});
  let hasChanges = $state(false);
  let saveMessage = $state<string | null>(null);
  let activeTab = $state('ai');
  let aiSubTab = $state('generation');
  let banners = $state<Banner[]>([]);
  let showBannerModal = $state(false);
  let editingBanner = $state<Banner | null>(null);
  let schedule = $state<Record<string, DaySchedule>>({});

  const DAYS = [{ key: 'monday', label: 'Lun' }, { key: 'tuesday', label: 'Mar' }, { key: 'wednesday', label: 'Mié' }, { key: 'thursday', label: 'Jue' }, { key: 'friday', label: 'Vie' }, { key: 'saturday', label: 'Sáb' }, { key: 'sunday', label: 'Dom' }];
  const BANNER_TYPES = [{ value: 'maintenance', label: 'Mantenimiento', color: 'bg-orange-500' }, { value: 'environment', label: 'Entorno', color: 'bg-purple-500' }, { value: 'promotion', label: 'Promoción', color: 'bg-green-500' }, { value: 'warning', label: 'Advertencia', color: 'bg-yellow-500' }, { value: 'announcement', label: 'Anuncio', color: 'bg-blue-500' }, { value: 'scheduled', label: 'Programado', color: 'bg-slate-500' }];
  const TIMEZONES = ['America/Guayaquil', 'America/Bogota', 'America/Lima', 'America/Mexico_City', 'America/New_York', 'Europe/Madrid'];

  onMount(() => { loadConfig(); loadHealth(); const interval = setInterval(loadHealth, 30000); return () => clearInterval(interval); });

  async function loadConfig() {
    loading = true;
    try {
      const res = await fetch('/api/admin/config', { credentials: 'include' });
      if (res.ok) {
        config = await res.json();
        editableConfig = {
          'ai.temperature': config.aiTemperature ?? 0.7, 'ai.topP': config.aiTopP ?? 0.95, 'ai.topK': config.aiTopK ?? 40,
          'ai.maxTokens': config.aiMaxTokens ?? 2048, 'ai.timeout': config.aiTimeout ?? 30000, 'ai.streaming': config.aiStreaming ?? true,
          'ai.quotaEnabled': config.aiQuotaEnabled ?? false, 'ai.dailyLimit': config.aiDailyLimit ?? 1000,
          'ai.quotaExceededMessage': config.aiQuotaExceededMessage ?? '', 'ai.availabilityMode': config.aiAvailabilityMode ?? '24/7',
          'ai.timezone': config.aiTimezone ?? 'America/Guayaquil', 'ai.unavailableMessage': config.aiUnavailableMessage ?? '',
          'chat.welcomeMessage': config.chatWelcomeMessage ?? '', 'chat.systemPrompt': config.chatSystemPrompt ?? '',
          'rag.topK': config.ragTopK ?? 5, 'rag.threshold': config.ragThreshold ?? 0.7, 'alert.emailTo': config.alertEmailTo ?? '',
        };
        schedule = config.aiSchedule ?? {};
        banners = config.banners ?? [];
      }
    } catch (e) { console.error('Error:', e); }
    finally { loading = false; }
  }

  async function loadHealth() { try { const res = await fetch('/api/health'); if (res.ok) health = await res.json(); } catch (e) { console.error('Health:', e); } }

  async function saveConfig() {
    saving = true; saveMessage = null;
    try {
      const payload = { ...editableConfig, 'ai.schedule': schedule, 'banners': banners };
      const res = await fetch('/api/admin/config', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { saveMessage = 'Guardado'; hasChanges = false; setTimeout(() => saveMessage = null, 3000); }
    } catch (e) { console.error('Error:', e); }
    finally { saving = false; }
  }

  function handleChange() { hasChanges = true; }
  function statusColor(s: string) { return s === 'up' ? 'text-emerald-500 bg-emerald-50' : s === 'down' ? 'text-red-500 bg-red-50' : 'text-amber-500 bg-amber-50'; }
  function addBanner() { editingBanner = { id: crypto.randomUUID(), type: 'announcement', message: '', dismissible: true, targetPages: ['*'], targetRoles: ['*'], enabled: true }; showBannerModal = true; }
  function editBannerFn(b: Banner) { editingBanner = { ...b }; showBannerModal = true; }
  function saveBanner() { if (!editingBanner) return; const idx = banners.findIndex(b => b.id === editingBanner!.id); if (idx >= 0) banners[idx] = editingBanner; else banners = [...banners, editingBanner]; showBannerModal = false; editingBanner = null; handleChange(); }
  function deleteBanner(id: string) { banners = banners.filter(b => b.id !== id); handleChange(); }
  function getBannerType(t: string) { return BANNER_TYPES.find(x => x.value === t) ?? BANNER_TYPES[4]; }
</script>


<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Configuración</h1>
      <p class="text-slate-500 font-light mt-1">Ajustes del sistema por dominio</p>
    </div>
    <div class="flex items-center gap-3">
      {#if saveMessage}<span class="text-emerald-600 text-sm flex items-center gap-1"><Check size={16} />{saveMessage}</span>{/if}
      <button onclick={() => { loadConfig(); loadHealth(); }} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
        <RefreshCw size={18} strokeWidth={1.5} /><span class="font-light">Recargar</span>
      </button>
      <button onclick={saveConfig} disabled={!hasChanges || saving} class="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white rounded-full disabled:opacity-40 transition-opacity">
        <Save size={18} strokeWidth={1.5} /><span class="font-medium">{saving ? 'Guardando...' : 'Guardar'}</span>
      </button>
    </div>
  </div>

  {#if loading}
    <Skeleton class="h-96 rounded-2xl" />
  {:else}
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <Tabs.Root bind:value={activeTab}>
        <Tabs.List class="flex border-b bg-slate-50 p-1 gap-1 overflow-x-auto">
          <Tabs.Trigger value="ai" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><Bot size={16} strokeWidth={1.5} />AI / LLM</Tabs.Trigger>
          <Tabs.Trigger value="rag" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><Database size={16} strokeWidth={1.5} />RAG</Tabs.Trigger>
          <Tabs.Trigger value="storage" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><HardDrive size={16} strokeWidth={1.5} />Storage</Tabs.Trigger>
          <Tabs.Trigger value="alerts" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><Bell size={16} strokeWidth={1.5} />Alertas</Tabs.Trigger>
          <Tabs.Trigger value="banners" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><Megaphone size={16} strokeWidth={1.5} />Banners</Tabs.Trigger>
          <Tabs.Trigger value="integrations" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><Plug size={16} strokeWidth={1.5} />Integraciones</Tabs.Trigger>
        </Tabs.List>

        <!-- Tab: AI/LLM -->
        <Tabs.Content value="ai" class="p-6">
          <!-- Sub-tabs para AI -->
          <div class="flex gap-2 mb-6 border-b pb-3">
            <button onclick={() => aiSubTab = 'generation'} class="px-3 py-1.5 rounded-full text-sm {aiSubTab === 'generation' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}"><Zap size={14} class="inline mr-1" />Generación</button>
            <button onclick={() => aiSubTab = 'quota'} class="px-3 py-1.5 rounded-full text-sm {aiSubTab === 'quota' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}"><Gauge size={14} class="inline mr-1" />Cuotas</button>
            <button onclick={() => aiSubTab = 'availability'} class="px-3 py-1.5 rounded-full text-sm {aiSubTab === 'availability' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}"><Clock size={14} class="inline mr-1" />Disponibilidad</button>
            <button onclick={() => aiSubTab = 'chat'} class="px-3 py-1.5 rounded-full text-sm {aiSubTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}"><Bot size={14} class="inline mr-1" />Chat</button>
          </div>

          <!-- Info cards -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><p class="text-xs text-slate-400 mb-1">Provider</p><p class="font-semibold text-slate-800 capitalize">{config.aiProvider || 'No configurado'}</p></div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><p class="text-xs text-slate-400 mb-1">Modelo</p><p class="font-semibold text-slate-800">{config.aiModel || 'N/A'}</p></div>
            <div class="p-4 rounded-xl border border-slate-100 {health?.services?.ai?.status === 'up' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}"><p class="text-xs text-slate-400 mb-1">Estado</p><p class="font-semibold {health?.services?.ai?.status === 'up' ? 'text-emerald-600' : 'text-red-600'}">{health?.services?.ai?.status === 'up' ? '● Activo' : '○ Inactivo'}</p></div>
          </div>

          {#if aiSubTab === 'generation'}
            <!-- Parámetros de Generación -->
            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="text-sm text-slate-600 mb-2 block font-medium">Temperature <span class="text-slate-400 font-normal">({editableConfig['ai.temperature']})</span></label>
                <input type="range" bind:value={editableConfig['ai.temperature']} oninput={handleChange} min={0} max={2} step={0.1} class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <p class="text-xs text-slate-400 mt-1">Creatividad de respuestas (0=determinista, 2=muy creativo)</p>
              </div>
              <div>
                <label class="text-sm text-slate-600 mb-2 block font-medium">Top P <span class="text-slate-400 font-normal">({editableConfig['ai.topP']})</span></label>
                <input type="range" bind:value={editableConfig['ai.topP']} oninput={handleChange} min={0} max={1} step={0.05} class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <p class="text-xs text-slate-400 mt-1">Nucleus sampling (0.1=conservador, 1=diverso)</p>
              </div>
              <div>
                <label class="text-sm text-slate-600 mb-2 block font-medium">Top K <span class="text-slate-400 font-normal">({editableConfig['ai.topK']})</span></label>
                <input type="range" bind:value={editableConfig['ai.topK']} oninput={handleChange} min={1} max={100} class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <p class="text-xs text-slate-400 mt-1">Tokens candidatos por paso</p>
              </div>
              <div>
                <label class="text-sm text-slate-600 mb-2 block font-medium">Max Tokens</label>
                <input type="number" bind:value={editableConfig['ai.maxTokens']} oninput={handleChange} min={100} max={8192} class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                <p class="text-xs text-slate-400 mt-1">Longitud máxima de respuesta</p>
              </div>
              <div>
                <label class="text-sm text-slate-600 mb-2 block font-medium">Timeout (ms)</label>
                <input type="number" bind:value={editableConfig['ai.timeout']} oninput={handleChange} min={5000} max={120000} step={1000} class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                <p class="text-xs text-slate-400 mt-1">Tiempo máximo de espera</p>
              </div>
              <div class="flex items-center gap-3">
                <label class="text-sm text-slate-600 font-medium">Streaming</label>
                <button onclick={() => { editableConfig['ai.streaming'] = !editableConfig['ai.streaming']; handleChange(); }} class="w-12 h-6 rounded-full transition-colors {editableConfig['ai.streaming'] ? 'bg-emerald-500' : 'bg-slate-300'}">
                  <div class="w-5 h-5 bg-white rounded-full shadow transform transition-transform {editableConfig['ai.streaming'] ? 'translate-x-6' : 'translate-x-0.5'}"></div>
                </button>
                <span class="text-xs text-slate-400">Respuestas en tiempo real</span>
              </div>
            </div>
          {/if}

          {#if aiSubTab === 'quota'}
            <!-- Control de Cuotas -->
            <div class="space-y-6">
              <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <p class="font-medium text-slate-800">Límite de cuota diaria</p>
                  <p class="text-sm text-slate-500">Limitar consultas por día para controlar costos</p>
                </div>
                <button onclick={() => { editableConfig['ai.quotaEnabled'] = !editableConfig['ai.quotaEnabled']; handleChange(); }} class="w-12 h-6 rounded-full transition-colors {editableConfig['ai.quotaEnabled'] ? 'bg-emerald-500' : 'bg-slate-300'}">
                  <div class="w-5 h-5 bg-white rounded-full shadow transform transition-transform {editableConfig['ai.quotaEnabled'] ? 'translate-x-6' : 'translate-x-0.5'}"></div>
                </button>
              </div>
              {#if editableConfig['ai.quotaEnabled']}
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <label class="text-sm text-slate-600 mb-2 block font-medium">Límite diario de consultas</label>
                    <input type="number" bind:value={editableConfig['ai.dailyLimit']} oninput={handleChange} min={10} max={100000} class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                    <p class="text-xs text-slate-400 mt-1">Máximo de mensajes de usuario por día</p>
                  </div>
                  <div class="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p class="text-sm text-blue-700 font-medium">Uso actual</p>
                    <p class="text-2xl font-bold text-blue-800 mt-1">{health?.metrics?.conversationsToday || 0} / {editableConfig['ai.dailyLimit']}</p>
                    <p class="text-xs text-blue-600 mt-1">consultas hoy</p>
                  </div>
                </div>
                <div>
                  <label class="text-sm text-slate-600 mb-2 block font-medium">Mensaje al exceder cuota</label>
                  <textarea bind:value={editableConfig['ai.quotaExceededMessage']} oninput={handleChange} rows={2} placeholder="Hemos alcanzado el límite de consultas..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
                </div>
              {/if}
            </div>
          {/if}

          {#if aiSubTab === 'availability'}
            <!-- Disponibilidad -->
            <div class="space-y-6">
              <div class="flex gap-4">
                <button onclick={() => { editableConfig['ai.availabilityMode'] = '24/7'; handleChange(); }} class="flex-1 p-4 rounded-xl border-2 transition-colors {editableConfig['ai.availabilityMode'] === '24/7' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}">
                  <p class="font-semibold text-slate-800">24/7</p>
                  <p class="text-sm text-slate-500">Siempre disponible</p>
                </button>
                <button onclick={() => { editableConfig['ai.availabilityMode'] = 'schedule'; handleChange(); }} class="flex-1 p-4 rounded-xl border-2 transition-colors {editableConfig['ai.availabilityMode'] === 'schedule' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}">
                  <p class="font-semibold text-slate-800">Horario personalizado</p>
                  <p class="text-sm text-slate-500">Definir días y horas</p>
                </button>
              </div>

              {#if editableConfig['ai.availabilityMode'] === 'schedule'}
                <div>
                  <label class="text-sm text-slate-600 mb-2 block font-medium">Zona horaria</label>
                  <select bind:value={editableConfig['ai.timezone']} onchange={handleChange} class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm">
                    {#each TIMEZONES as tz}<option value={tz}>{tz}</option>{/each}
                  </select>
                </div>
                <div class="space-y-2">
                  <p class="text-sm text-slate-600 font-medium mb-3">Horario por día</p>
                  {#each DAYS as day}
                    <div class="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                      <button onclick={() => { schedule[day.key] = { ...schedule[day.key], enabled: !schedule[day.key]?.enabled }; handleChange(); }} class="w-10 h-5 rounded-full transition-colors {schedule[day.key]?.enabled ? 'bg-emerald-500' : 'bg-slate-300'}">
                        <div class="w-4 h-4 bg-white rounded-full shadow transform transition-transform {schedule[day.key]?.enabled ? 'translate-x-5' : 'translate-x-0.5'}"></div>
                      </button>
                      <span class="w-12 text-sm font-medium text-slate-700">{day.label}</span>
                      {#if schedule[day.key]?.enabled}
                        <input type="time" value={schedule[day.key]?.start || '08:00'} onchange={(e) => { schedule[day.key] = { ...schedule[day.key], start: e.currentTarget.value }; handleChange(); }} class="px-3 py-1 rounded-lg border border-slate-200 text-sm" />
                        <span class="text-slate-400">a</span>
                        <input type="time" value={schedule[day.key]?.end || '20:00'} onchange={(e) => { schedule[day.key] = { ...schedule[day.key], end: e.currentTarget.value }; handleChange(); }} class="px-3 py-1 rounded-lg border border-slate-200 text-sm" />
                      {:else}
                        <span class="text-sm text-slate-400">No disponible</span>
                      {/if}
                    </div>
                  {/each}
                </div>
                <div>
                  <label class="text-sm text-slate-600 mb-2 block font-medium">Mensaje fuera de horario</label>
                  <textarea bind:value={editableConfig['ai.unavailableMessage']} oninput={handleChange} rows={2} placeholder="Nuestro asistente está disponible de..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
                </div>
              {/if}
            </div>
          {/if}

          {#if aiSubTab === 'chat'}
            <!-- Configuración del Chat -->
            <div class="space-y-4">
              <div>
                <label class="text-sm text-slate-600 mb-2 block font-medium">Mensaje de bienvenida</label>
                <textarea bind:value={editableConfig['chat.welcomeMessage']} oninput={handleChange} rows={2} placeholder="¡Hola! Soy el asistente virtual..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
                <p class="text-xs text-slate-400 mt-1">Primer mensaje que ve el usuario al abrir el chat</p>
              </div>
              <div>
                <label class="text-sm text-slate-600 mb-2 block font-medium">System Prompt</label>
                <textarea bind:value={editableConfig['chat.systemPrompt']} oninput={handleChange} rows={6} placeholder="Eres un asistente experto en visas..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none font-mono text-xs"></textarea>
                <p class="text-xs text-slate-400 mt-1">Instrucciones de comportamiento para el modelo</p>
              </div>
            </div>
          {/if}
        </Tabs.Content>

        <!-- Tab: RAG -->
        <Tabs.Content value="rag" class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><p class="text-xs text-slate-400 mb-1">Vector Store</p><p class="font-semibold text-slate-800">Turso (SQLite)</p></div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><p class="text-xs text-slate-400 mb-1">Embedding Model</p><p class="font-semibold text-slate-800">text-embedding-004</p></div>
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="text-sm text-slate-600 mb-2 block font-medium">Top K (resultados) <span class="text-slate-400 font-normal">({editableConfig['rag.topK']})</span></label>
              <input type="range" bind:value={editableConfig['rag.topK']} oninput={handleChange} min={1} max={20} class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              <p class="text-xs text-slate-400 mt-2">Cantidad de chunks a recuperar por consulta</p>
            </div>
            <div>
              <label class="text-sm text-slate-600 mb-2 block font-medium">Threshold (similitud) <span class="text-slate-400 font-normal">({editableConfig['rag.threshold']})</span></label>
              <input type="range" bind:value={editableConfig['rag.threshold']} oninput={handleChange} min={0} max={1} step={0.05} class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              <p class="text-xs text-slate-400 mt-2">Similitud mínima para incluir un resultado (0-1)</p>
            </div>
          </div>
        </Tabs.Content>

        <!-- Tab: Storage -->
        <Tabs.Content value="storage" class="p-6">
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><p class="text-xs text-slate-400 mb-1">Provider</p><p class="font-semibold text-slate-800 capitalize">{config.storageProvider || 'local'}</p></div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><p class="text-xs text-slate-400 mb-1">Chat Mode</p><p class="font-semibold text-slate-800">{config.chatStorageMode || 'smart'}</p></div>
            <div class="p-4 rounded-xl border border-slate-100 {health?.services?.storage?.status === 'up' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}"><p class="text-xs text-slate-400 mb-1">Estado</p><p class="font-semibold {health?.services?.storage?.status === 'up' ? 'text-emerald-600' : 'text-red-600'}">{health?.services?.storage?.status === 'up' ? '● Activo' : '○ Inactivo'}</p></div>
          </div>
          <div class="mt-6 p-4 bg-slate-50 rounded-xl">
            <p class="text-sm text-slate-600">El provider de storage se configura via variable de entorno <code class="bg-slate-200 px-1.5 py-0.5 rounded text-xs">STORAGE_PROVIDER</code></p>
            <p class="text-xs text-slate-400 mt-2">Opciones: local, vercel, r2, gdrive</p>
          </div>
        </Tabs.Content>

        <!-- Tab: Alertas -->
        <Tabs.Content value="alerts" class="p-6">
          <div class="max-w-md">
            <div>
              <label class="text-sm text-slate-600 mb-2 block font-medium">Email para alertas</label>
              <input type="email" bind:value={editableConfig['alert.emailTo']} oninput={handleChange} placeholder="admin@ejemplo.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
              <p class="text-xs text-slate-400 mt-2">Las alertas críticas se enviarán a este email</p>
            </div>
            <div class="mt-6 p-4 rounded-xl border {config.integrations?.resend ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}">
              <p class="text-sm font-medium {config.integrations?.resend ? 'text-emerald-700' : 'text-amber-700'}">{config.integrations?.resend ? '✓ Resend configurado - emails activos' : '⚠ Resend no configurado - emails deshabilitados'}</p>
            </div>
          </div>
        </Tabs.Content>

        <!-- Tab: Banners -->
        <Tabs.Content value="banners" class="p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="text-sm text-slate-600">Configura banners para mostrar mensajes importantes a los usuarios</p>
            </div>
            <button onclick={addBanner} class="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full text-sm">
              <Plus size={16} />Nuevo Banner
            </button>
          </div>

          {#if banners.length === 0}
            <div class="text-center py-12 text-slate-400">
              <Megaphone size={48} class="mx-auto mb-3 opacity-50" />
              <p>No hay banners configurados</p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each banners as banner}
                {@const typeInfo = getBannerType(banner.type)}
                <div class="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div class="w-3 h-3 rounded-full {typeInfo.color}"></div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-slate-800 truncate">{banner.message || '(Sin mensaje)'}</p>
                    <p class="text-xs text-slate-400">{typeInfo.label} • {banner.enabled ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <button onclick={() => { banner.enabled = !banner.enabled; handleChange(); }} class="w-10 h-5 rounded-full transition-colors {banner.enabled ? 'bg-emerald-500' : 'bg-slate-300'}">
                    <div class="w-4 h-4 bg-white rounded-full shadow transform transition-transform {banner.enabled ? 'translate-x-5' : 'translate-x-0.5'}"></div>
                  </button>
                  <button onclick={() => editBannerFn(banner)} class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Eye size={16} /></button>
                  <button onclick={() => deleteBanner(banner.id)} class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Preview -->
          {#if banners.some(b => b.enabled)}
            <div class="mt-6 p-4 bg-slate-50 rounded-xl">
              <p class="text-xs text-slate-500 mb-3 font-medium">Vista previa de banners activos:</p>
              {#each banners.filter(b => b.enabled) as banner}
                {@const typeInfo = getBannerType(banner.type)}
                <div class="mb-2 p-3 rounded-lg text-white text-sm {typeInfo.color}">{banner.message}</div>
              {/each}
            </div>
          {/if}
        </Tabs.Content>

        <!-- Tab: Integraciones -->
        <Tabs.Content value="integrations" class="p-6">
          <div class="grid grid-cols-2 gap-4">
            {#each Object.entries(config.integrations || {}) as [name, active]}
              <div class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg {statusColor(active ? 'up' : 'down')} flex items-center justify-center">
                    {#if active}<Check size={18} />{:else}<X size={18} />{/if}
                  </div>
                  <div>
                    <p class="font-medium text-slate-800 capitalize">{name}</p>
                    <p class="text-xs text-slate-400">{active ? 'Configurado' : 'No configurado'}</p>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-medium {active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">{active ? 'Activo' : 'Inactivo'}</span>
              </div>
            {/each}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>

    <!-- Health & Metrics Section -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Sistema -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center gap-2 mb-4">
          <Activity size={18} class="text-slate-400" />
          <h2 class="font-semibold text-slate-800">Sistema</h2>
          {#if health}
            <span class="ml-auto px-2.5 py-1 rounded-full text-xs font-medium {health.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : health.status === 'degraded' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
              {health.status === 'healthy' ? '● Saludable' : health.status === 'degraded' ? '◐ Degradado' : '○ No saludable'}
            </span>
          {/if}
        </div>
        {#if health}
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-xl bg-slate-50"><p class="text-xs text-slate-400 mb-1">Uptime</p><p class="text-lg font-semibold text-slate-800">{health.metrics?.uptime || 'N/A'}</p></div>
            <div class="p-3 rounded-xl bg-slate-50"><p class="text-xs text-slate-400 mb-1">Memoria</p><p class="text-lg font-semibold text-slate-800">{health.metrics?.memoryUsage || 0} / {health.metrics?.memoryTotal || 0} MB</p></div>
            <div class="p-3 rounded-xl bg-slate-50"><p class="text-xs text-slate-400 mb-1">Usuarios</p><p class="text-lg font-semibold text-slate-800">{health.metrics?.usersTotal || 0}</p></div>
            <div class="p-3 rounded-xl bg-slate-50"><p class="text-xs text-slate-400 mb-1">Documentos KB</p><p class="text-lg font-semibold text-slate-800">{health.metrics?.documentsTotal || 0}</p></div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            {#each Object.entries(health.services || {}) as [name, service]}
              {@const s = service as any}
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs {s.status === 'up' ? 'bg-emerald-50 text-emerald-700' : s.status === 'down' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}">
                {#if s.status === 'up'}<Check size={10} />{:else if s.status === 'down'}<X size={10} />{:else}<AlertTriangle size={10} />{/if}
                <span class="capitalize">{name}</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex items-center justify-center py-8 text-slate-400"><RefreshCw size={16} class="animate-spin mr-2" /> Cargando...</div>
        {/if}
      </div>

      <!-- Red & Latencias -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center gap-2 mb-4">
          <Wifi size={18} class="text-slate-400" />
          <h2 class="font-semibold text-slate-800">Red</h2>
        </div>
        {#if health?.network}
          <div class="space-y-3">
            {#if health.network.externalLatency > 0}
              {@const ms = health.network.externalLatency}
              {@const color = ms < 100 ? 'bg-emerald-500' : ms < 300 ? 'bg-amber-500' : 'bg-red-500'}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-slate-600">Latencia externa</span>
                  <span class="text-sm font-medium text-slate-800">{ms}ms</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full {color} rounded-full transition-all" style="width: {Math.min(ms / 5, 100)}%"></div>
                </div>
              </div>
            {/if}
            {#if health.network.dnsResolution > 0}
              {@const ms = health.network.dnsResolution}
              {@const color = ms < 50 ? 'bg-emerald-500' : ms < 150 ? 'bg-amber-500' : 'bg-red-500'}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-slate-600">DNS</span>
                  <span class="text-sm font-medium text-slate-800">{ms}ms</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full {color} rounded-full transition-all" style="width: {Math.min(ms / 3, 100)}%"></div>
                </div>
              </div>
            {/if}
            {#if health.network.geminiLatency}
              {@const ms = health.network.geminiLatency}
              {@const color = ms < 200 ? 'bg-emerald-500' : ms < 500 ? 'bg-amber-500' : 'bg-red-500'}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-slate-600">Gemini API</span>
                  <span class="text-sm font-medium text-slate-800">{ms}ms</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full {color} rounded-full transition-all" style="width: {Math.min(ms / 10, 100)}%"></div>
                </div>
              </div>
            {/if}
            {#if health.network.sanityLatency}
              {@const ms = health.network.sanityLatency}
              {@const color = ms < 200 ? 'bg-emerald-500' : ms < 500 ? 'bg-amber-500' : 'bg-red-500'}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-slate-600">Sanity CMS</span>
                  <span class="text-sm font-medium text-slate-800">{ms}ms</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full {color} rounded-full transition-all" style="width: {Math.min(ms / 10, 100)}%"></div>
                </div>
              </div>
            {/if}
            {#if health.services?.database?.latency}
              {@const ms = health.services.database.latency}
              {@const color = ms < 50 ? 'bg-emerald-500' : ms < 100 ? 'bg-amber-500' : 'bg-red-500'}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-slate-600">Database</span>
                  <span class="text-sm font-medium text-slate-800">{ms}ms</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full {color} rounded-full transition-all" style="width: {Math.min(ms / 2, 100)}%"></div>
                </div>
              </div>
            {/if}
          </div>
          <div class="mt-4 pt-4 border-t border-slate-100">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">Última verificación</span>
              <span class="text-slate-700">{new Date(health.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-center py-8 text-slate-400">
            <Globe size={16} class="mr-2" /> Sin datos de latencia
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Modal: Editar Banner -->
{#if showBannerModal && editingBanner}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showBannerModal = false}>
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-lg font-semibold text-slate-800 mb-4">{editingBanner.id ? 'Editar' : 'Nuevo'} Banner</h3>
      
      <div class="space-y-4">
        <div>
          <label class="text-sm text-slate-600 mb-2 block font-medium">Tipo</label>
          <select bind:value={editingBanner.type} class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm">
            {#each BANNER_TYPES as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="text-sm text-slate-600 mb-2 block font-medium">Mensaje</label>
          <textarea bind:value={editingBanner.message} rows={3} placeholder="Escribe el mensaje del banner..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-600 mb-2 block font-medium">Texto del enlace</label>
            <input type="text" bind:value={editingBanner.linkText} placeholder="Ver más" class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-sm text-slate-600 mb-2 block font-medium">URL del enlace</label>
            <input type="text" bind:value={editingBanner.link} placeholder="https://..." class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-600 mb-2 block font-medium">Fecha inicio</label>
            <input type="datetime-local" bind:value={editingBanner.startDate} class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="text-sm text-slate-600 mb-2 block font-medium">Fecha fin</label>
            <input type="datetime-local" bind:value={editingBanner.endDate} class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" bind:checked={editingBanner.dismissible} class="rounded" />
            Puede cerrarse
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" bind:checked={editingBanner.enabled} class="rounded" />
            Activo
          </label>
        </div>
        
        <!-- Preview -->
        <div class="p-4 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-500 mb-2">Vista previa:</p>
          {#if editingBanner.type}
            {@const typeInfo = getBannerType(editingBanner.type)}
            <div class="p-3 rounded-lg text-white text-sm {typeInfo.color}">
              {editingBanner.message || '(Sin mensaje)'}
              {#if editingBanner.linkText}
                <a href="#" class="underline ml-2">{editingBanner.linkText}</a>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-6">
        <button onclick={() => showBannerModal = false} class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full text-sm">Cancelar</button>
        <button onclick={saveBanner} class="px-5 py-2 bg-slate-800 text-white rounded-full text-sm">Guardar</button>
      </div>
    </div>
  </div>
{/if}
