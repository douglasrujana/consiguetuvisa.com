<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Table from '$lib/components/ui/table';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import Users from 'lucide-svelte/icons/users';
  import Clock from 'lucide-svelte/icons/clock';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Eye from 'lucide-svelte/icons/eye';
  import X from 'lucide-svelte/icons/x';
  import User from 'lucide-svelte/icons/user';
  import Bot from 'lucide-svelte/icons/bot';
  import Search from 'lucide-svelte/icons/search';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import Download from 'lucide-svelte/icons/download';

  let loading = $state(true);
  let error = $state<string | null>(null);
  let conversations = $state<any[]>([]);
  let stats = $state({ total: 0, today: 0, avgMessages: 0, thisWeek: 0, withUsers: 0, anonymous: 0 });
  let chartData = $state<{name: string, value: number}[]>([]);
  let pagination = $state({ page: 1, limit: 10, total: 0, totalPages: 1 });
  let searchQuery = $state('');
  let onlyUsers = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout>;

  // Tabs de conversaciones abiertas
  let openTabs = $state<any[]>([]);
  let activeTabId = $state<string | null>(null);
  let tabMessages = $state<Record<string, any[]>>({});
  let loadingTab = $state<string | null>(null);

  onMount(() => loadData());

  async function loadData(page = 1) {
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
      if (searchQuery) params.set('search', searchQuery);
      if (onlyUsers) params.set('onlyUsers', 'true');
      const res = await fetch('/api/admin/chat/conversations?' + params, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        conversations = data.conversations || [];
        stats = data.stats || stats;
        chartData = data.chartData || [];
        pagination = data.pagination || pagination;
      } else if (res.status === 403) {
        error = 'No tienes permisos de administrador';
      } else if (res.status === 302 || res.redirected) {
        error = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
      } else {
        error = `Error ${res.status}: ${await res.text()}`;
      }
    } catch (e) { 
      console.error('Error:', e); 
      error = 'Error de conexión';
    }
    finally { loading = false; }
  }

  function handleSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => loadData(1), 300); }

  async function openTab(conv: any) {
    // Si ya está abierto, solo activar
    if (openTabs.find(t => t.id === conv.id)) {
      activeTabId = conv.id;
      return;
    }
    // Agregar nuevo tab
    openTabs = [...openTabs, conv];
    activeTabId = conv.id;
    // Cargar mensajes
    loadingTab = conv.id;
    try {
      const res = await fetch('/api/admin/chat/conversations/' + conv.id, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        tabMessages = { ...tabMessages, [conv.id]: data.messages || [] };
      }
    } catch (e) { console.error('Error:', e); }
    finally { loadingTab = null; }
  }

  function closeTab(id: string) {
    openTabs = openTabs.filter(t => t.id !== id);
    delete tabMessages[id];
    if (activeTabId === id) activeTabId = openTabs[openTabs.length - 1]?.id || null;
  }

  async function deleteConv(id: string) {
    if (!confirm('¿Eliminar esta conversación?')) return;
    try {
      await fetch('/api/admin/chat/conversations/' + id, { method: 'DELETE', credentials: 'include' });
      closeTab(id);
      loadData(pagination.page);
    } catch (e) { console.error('Error:', e); }
  }

  function userName(c: any) { 
    const customer = c?.customer || c?.user; // Compatibilidad
    if (!customer) return 'Anónimo'; 
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || 'Anónimo'; 
  }
  function userEmail(c: any) {
    return c?.customer?.email || c?.user?.email || '';
  }
  function hasCustomer(c: any) {
    return !!(c?.customer || c?.user);
  }
  function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function fmtTime(d: string) { return new Date(d).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }); }

  function exportCSV() {
    const headers = ['ID', 'Cliente', 'Email', 'Título', 'Mensajes', 'Fecha'];
    const rows = conversations.map(c => [
      c.id,
      userName(c),
      userEmail(c),
      c.title || '',
      c._count?.messages || 0,
      new Date(c.createdAt).toISOString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversaciones-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>


<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div><h1 class="text-2xl font-semibold text-slate-800">Gestión de Chatbot</h1><p class="text-slate-500 font-light mt-1">Conversaciones y métricas</p></div>
    <div class="flex items-center gap-2">
      <button onclick={exportCSV} disabled={conversations.length === 0} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full disabled:opacity-40"><Download size={18} strokeWidth={1.5} /><span class="font-light">Exportar</span></button>
      <button onclick={() => loadData(pagination.page)} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full"><RefreshCw size={18} strokeWidth={1.5} /><span class="font-light">Actualizar</span></button>
    </div>
  </div>

  <!-- Stats Row 1 -->
  <div class="grid grid-cols-4 gap-4">
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <div class="flex items-center gap-2 text-slate-500 mb-1"><MessageSquare size={16} strokeWidth={1.5} /><span class="font-light text-xs">Total</span></div>
      <p class="text-2xl font-semibold text-slate-800">{stats.total}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-400">
      <div class="flex items-center gap-2 text-blue-500 mb-1"><Clock size={16} strokeWidth={1.5} /><span class="font-light text-xs">Hoy</span></div>
      <p class="text-2xl font-semibold text-blue-600">{stats.today}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-emerald-400">
      <div class="flex items-center gap-2 text-emerald-500 mb-1"><Users size={16} strokeWidth={1.5} /><span class="font-light text-xs">Esta semana</span></div>
      <p class="text-2xl font-semibold text-emerald-600">{stats.thisWeek}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <div class="flex items-center gap-2 text-slate-500 mb-1"><MessageSquare size={16} strokeWidth={1.5} /><span class="font-light text-xs">Prom. msgs</span></div>
      <p class="text-2xl font-semibold text-slate-800">{stats.avgMessages.toFixed(1)}</p>
    </div>
  </div>

  <!-- Stats Row 2: Chart + User breakdown -->
  <div class="grid grid-cols-3 gap-4">
    <!-- Mini Chart -->
    <div class="col-span-2 bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Conversaciones últimos 7 días</p>
      <div class="flex items-end gap-2 h-20">
        {#each chartData as day}
          {@const maxVal = Math.max(...chartData.map(d => d.value), 1)}
          {@const height = (day.value / maxVal) * 100}
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-blue-100 rounded-t relative" style="height: {height}%">
              <div class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-slate-500">{day.value || ''}</div>
            </div>
            <span class="text-xs text-slate-400">{day.name}</span>
          </div>
        {/each}
      </div>
    </div>
    <!-- User breakdown -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Tipo de usuario</p>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">Registrados</span>
          <span class="text-sm font-semibold text-blue-600">{stats.withUsers}</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2">
          <div class="bg-blue-500 h-2 rounded-full" style="width: {stats.total ? (stats.withUsers / stats.total * 100) : 0}%"></div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">Anónimos</span>
          <span class="text-sm font-semibold text-slate-500">{stats.anonymous}</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2">
          <div class="bg-slate-400 h-2 rounded-full" style="width: {stats.total ? (stats.anonymous / stats.total * 100) : 0}%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Filtros -->
  <div class="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
    <div class="relative flex-1 max-w-sm">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="text" bind:value={searchQuery} oninput={handleSearch} placeholder="Buscar conversaciones..." class="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 text-sm font-light focus:outline-none focus:border-slate-400" />
    </div>
    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" bind:checked={onlyUsers} onchange={() => loadData(1)} class="w-4 h-4 rounded" /><span class="text-sm font-light text-slate-600">Solo usuarios registrados</span></label>
  </div>

  <!-- DataTable -->
  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <Table.Root>
      <Table.Header>
        <Table.Row class="bg-slate-50">
          <Table.Head class="font-semibold">Usuario</Table.Head>
          <Table.Head class="font-semibold">Título</Table.Head>
          <Table.Head class="font-semibold text-center">Msgs</Table.Head>
          <Table.Head class="font-semibold">Fecha</Table.Head>
          <Table.Head class="font-semibold text-right">Acciones</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          {#each [1,2,3,4,5] as _}
            <Table.Row><Table.Cell colspan={5}><Skeleton class="h-8 w-full" /></Table.Cell></Table.Row>
          {/each}
        {:else if error}
          <Table.Row><Table.Cell colspan={5} class="text-center py-12 text-red-500">{error}</Table.Cell></Table.Row>
        {:else if conversations.length === 0}
          <Table.Row><Table.Cell colspan={5} class="text-center py-12 text-slate-400">No hay conversaciones</Table.Cell></Table.Row>
        {:else}
          {#each conversations as conv}
            <Table.Row class="hover:bg-slate-50 cursor-pointer" onclick={() => openTab(conv)}>
              <Table.Cell>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center {hasCustomer(conv) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}"><User size={16} /></div>
                  <div><p class="font-medium text-sm">{userName(conv)}</p>{#if hasCustomer(conv)}<p class="text-xs text-slate-400">{userEmail(conv)}</p>{/if}</div>
                </div>
              </Table.Cell>
              <Table.Cell><p class="font-medium text-sm truncate max-w-[200px]">{conv.title || 'Sin título'}</p>{#if conv.preview}<p class="text-xs text-slate-400 truncate max-w-[200px]">{conv.preview}</p>{/if}</Table.Cell>
              <Table.Cell class="text-center"><span class="px-2 py-1 rounded-full text-xs bg-slate-100">{conv._count?.messages || 0}</span></Table.Cell>
              <Table.Cell class="text-sm text-slate-500">{fmtDate(conv.createdAt)}</Table.Cell>
              <Table.Cell class="text-right">
                <button onclick={(e) => { e.stopPropagation(); openTab(conv); }} class="p-2 hover:bg-blue-50 rounded-full text-blue-600"><Eye size={16} /></button>
                <button onclick={(e) => { e.stopPropagation(); deleteConv(conv.id); }} class="p-2 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={16} /></button>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
    {#if pagination.totalPages > 1}
      <div class="p-4 border-t flex items-center justify-between">
        <span class="text-sm text-slate-500">{pagination.total} conversaciones</span>
        <div class="flex items-center gap-2">
          <button onclick={() => loadData(pagination.page - 1)} disabled={pagination.page <= 1} class="p-2 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
          <span class="text-sm">{pagination.page} / {pagination.totalPages}</span>
          <button onclick={() => loadData(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} class="p-2 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      </div>
    {/if}
  </div>


  <!-- Tabs de conversaciones abiertas -->
  {#if openTabs.length > 0}
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <!-- Tab Headers -->
      <div class="flex border-b overflow-x-auto">
        {#each openTabs as tab}
          <div class="flex items-center border-r {activeTabId === tab.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}">
            <button onclick={() => activeTabId = tab.id} class="flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap">
              <span class="font-medium truncate max-w-[150px]">{userName(tab)}</span>
              <span class="text-xs opacity-70">- {tab.title?.substring(0, 20) || 'Chat'}...</span>
            </button>
            <button onclick={() => closeTab(tab.id)} class="pr-3 p-1 rounded hover:bg-white/20"><X size={14} /></button>
          </div>
        {/each}
      </div>
      
      <!-- Tab Content -->
      {#each openTabs as tab}
        {#if activeTabId === tab.id}
          <div class="grid grid-cols-12 divide-x">
            <!-- Info del usuario -->
            <div class="col-span-3 p-4 bg-slate-50">
              <h3 class="font-semibold text-slate-800 mb-4">Información</h3>
              <div class="space-y-3 text-sm">
                <div><p class="text-slate-400 text-xs">Cliente</p><p class="font-medium">{userName(tab)}</p></div>
                {#if hasCustomer(tab)}<div><p class="text-slate-400 text-xs">Email</p><p>{userEmail(tab)}</p></div>{/if}
                <div><p class="text-slate-400 text-xs">Título</p><p>{tab.title || 'Sin título'}</p></div>
                <div><p class="text-slate-400 text-xs">Fecha</p><p>{fmtDate(tab.createdAt)}</p></div>
                <div><p class="text-slate-400 text-xs">Mensajes</p><p>{tab._count?.messages || tabMessages[tab.id]?.length || 0}</p></div>
              </div>
              <button onclick={() => deleteConv(tab.id)} class="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm"><Trash2 size={16} />Eliminar</button>
            </div>
            
            <!-- Mensajes -->
            <div class="col-span-9 p-4">
              <h3 class="font-semibold text-slate-800 mb-4">Conversación</h3>
              {#if loadingTab === tab.id}
                <div class="space-y-3">{#each [1,2,3] as _}<Skeleton class="h-16 w-full" />{/each}</div>
              {:else}
                <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {#each tabMessages[tab.id] || [] as msg}
                    <div class="flex gap-3 {msg.role === 'user' ? 'flex-row-reverse' : ''}">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 {msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}">
                        {#if msg.role === 'user'}<User size={16} />{:else}<Bot size={16} />{/if}
                      </div>
                      <div class="flex-1 max-w-[75%] {msg.role === 'user' ? 'text-right' : ''}">
                        <div class="inline-block p-3 rounded-2xl text-sm {msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'}">
                          <p class="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <p class="text-xs text-slate-400 mt-1">{fmtTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
