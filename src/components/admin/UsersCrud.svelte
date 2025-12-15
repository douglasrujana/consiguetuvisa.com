<script lang="ts">
  // UsersCrud.svelte - Estilo Jony Ive + Skeletons
  
  import { Skeleton } from '$lib/components/ui/skeleton';
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import X from 'lucide-svelte/icons/x';
  import Search from 'lucide-svelte/icons/search';
  
  interface Customer {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    status: string;
    source: string | null;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    solicitudesCount?: number;
    conversationsCount?: number;
  }
  
  let customers = $state<Customer[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let total = $state(0);
  let search = $state('');
  let statusFilter = $state('');
  let page = $state(1);
  let limit = $state(20);
  let showModal = $state(false);
  let modalMode = $state<'create' | 'edit'>('create');
  let selectedCustomer = $state<Customer | null>(null);
  let saving = $state(false);
  let formData = $state({ email: '', firstName: '', lastName: '', phone: '', status: 'LEAD', source: 'WEB', isActive: true });
  
  let totalPages = $derived(Math.ceil(total / limit));
  let hasFilters = $derived(search !== '' || statusFilter !== '');
  
  $effect(() => { loadCustomers(); });
  
  async function loadCustomers() {
    loading = true; error = null;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) { const data = await res.json(); customers = data.data || []; total = data.total || 0; }
      else error = 'Error cargando clientes';
    } catch (e) { error = 'Error de conexión'; }
    finally { loading = false; }
  }
  
  function openCreateModal() {
    modalMode = 'create'; selectedCustomer = null;
    formData = { email: '', firstName: '', lastName: '', phone: '', status: 'LEAD', source: 'WEB', isActive: true };
    showModal = true;
  }
  
  function openEditModal(customer: Customer) {
    modalMode = 'edit'; selectedCustomer = customer;
    formData = { email: customer.email, firstName: customer.firstName || '', lastName: customer.lastName || '', phone: customer.phone || '', status: customer.status, source: customer.source || 'WEB', isActive: customer.isActive };
    showModal = true;
  }
  
  function closeModal() { showModal = false; selectedCustomer = null; }
  
  async function saveCustomer() {
    saving = true;
    try {
      const url = modalMode === 'create' ? '/api/admin/users' : `/api/admin/users/${selectedCustomer?.id}`;
      const res = await fetch(url, { method: modalMode === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { closeModal(); loadCustomers(); }
      else { const data = await res.json(); error = data.error || 'Error guardando'; }
    } catch (e) { error = 'Error de conexión'; }
    finally { saving = false; }
  }
  
  async function toggleActive(customer: Customer) {
    try {
      await fetch(`/api/admin/users/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !customer.isActive }) });
      loadCustomers();
    } catch (e) { console.error(e); }
  }
  
  async function deleteCustomer(customer: Customer) {
    if (!confirm(`¿Eliminar cliente ${customer.email}?`)) return;
    try { 
      const res = await fetch(`/api/admin/users/${customer.id}`, { method: 'DELETE' }); 
      if (!res.ok) {
        const data = await res.json();
        error = data.error || 'Error eliminando';
        return;
      }
      loadCustomers(); 
    }
    catch (e) { console.error(e); }
  }
  
  function clearFilters() { search = ''; statusFilter = ''; page = 1; }
  
  function getStatusBadge(status: string) {
    const badges: Record<string, { bg: string; text: string }> = {
      'LEAD': { bg: 'bg-amber-50', text: 'text-amber-600' },
      'ACTIVE': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
      'INACTIVE': { bg: 'bg-slate-100', text: 'text-slate-500' },
    };
    return badges[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Clientes</h1>
      <p class="text-slate-400 text-sm mt-1">{total} clientes registrados</p>
    </div>
    <button onclick={openCreateModal} class="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
      <UserPlus size={16} strokeWidth={1.5} />
      Nuevo Cliente
    </button>
  </div>
  
  <!-- Filters -->
  <div class="bg-white rounded-2xl p-4">
    <div class="flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          bind:value={search}
          oninput={() => { page = 1; loadCustomers(); }}
          class="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
        />
      </div>
      <select 
        bind:value={statusFilter} 
        onchange={() => { page = 1; loadCustomers(); }}
        class="px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900"
      >
        <option value="">Todos los estados</option>
        <option value="LEAD">Lead</option>
        <option value="ACTIVE">Activo</option>
        <option value="INACTIVE">Inactivo</option>
      </select>
      {#if hasFilters}
        <button onclick={clearFilters} class="px-4 py-3 text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1.5">
          <X size={14} strokeWidth={1.5} />
          Limpiar
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Table -->
  <div class="bg-white rounded-2xl overflow-hidden">
    {#if loading && customers.length === 0}
      <!-- Skeleton Table -->
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-100">
            <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-16 rounded" /></th>
            <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-12 rounded" /></th>
            <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-10 rounded" /></th>
            <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-14 rounded" /></th>
            <th class="px-6 py-4 text-left"><Skeleton class="h-3 w-16 rounded" /></th>
            <th class="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          {#each Array(8) as _}
            <tr>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <Skeleton class="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton class="h-4 w-28 rounded mb-1" />
                    <Skeleton class="h-3 w-16 rounded" />
                  </div>
                </div>
              </td>
              <td class="px-6 py-4"><Skeleton class="h-4 w-36 rounded" /></td>
              <td class="px-6 py-4"><Skeleton class="h-6 w-16 rounded-full" /></td>
              <td class="px-6 py-4"><Skeleton class="h-4 w-14 rounded" /></td>
              <td class="px-6 py-4"><Skeleton class="h-4 w-20 rounded" /></td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <Skeleton class="w-8 h-8 rounded-lg" />
                  <Skeleton class="w-8 h-8 rounded-lg" />
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if error}
      <div class="py-20 text-center">
        <p class="text-red-500 text-sm">{error}</p>
        <button onclick={loadCustomers} class="mt-4 text-slate-600 hover:text-slate-800 text-sm">Reintentar</button>
      </div>
    {:else if customers.length === 0}
      <div class="py-20 text-center">
        <p class="text-slate-400 text-sm">No se encontraron clientes</p>
      </div>
    {:else}
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-100">
            <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Cliente</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actividad</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Registro</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          {#each customers as customer}
            <tr class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-sm font-medium">
                    {(customer.firstName?.[0] || customer.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p class="font-medium text-slate-800">
                      {customer.firstName || ''} {customer.lastName || ''}
                      {#if !customer.firstName && !customer.lastName}
                        <span class="text-slate-400 font-normal">Sin nombre</span>
                      {/if}
                    </p>
                    <p class="text-xs text-slate-400">{customer.phone || '-'}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-slate-600 text-sm">{customer.email}</span>
                {#if customer.emailVerified}
                  <span class="text-emerald-500 ml-1" title="Verificado">✓</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                <span class="text-xs px-3 py-1 rounded-full font-medium {getStatusBadge(customer.status).bg} {getStatusBadge(customer.status).text}">
                  {customer.status}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3 text-xs text-slate-500">
                  <span title="Solicitudes">{customer.solicitudesCount || 0} sol.</span>
                  <span title="Conversaciones">{customer.conversationsCount || 0} chats</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-400">
                {new Date(customer.createdAt).toLocaleDateString('es-EC')}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <button onclick={() => openEditModal(customer)} class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Pencil size={16} strokeWidth={1.5} />
                  </button>
                  <button onclick={() => deleteCustomer(customer)} class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <p class="text-sm text-slate-400">
          {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
        </p>
        <div class="flex items-center gap-2">
          <button 
            onclick={() => { page--; loadCustomers(); }}
            disabled={page === 1}
            class="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            Anterior
          </button>
          <span class="text-sm text-slate-400 px-2">{page} / {totalPages}</span>
          <button 
            onclick={() => { page++; loadCustomers(); }}
            disabled={page >= totalPages}
            class="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick={closeModal}>
    <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onclick={(e) => e.stopPropagation()}>
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-800">{modalMode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</h3>
        <button onclick={closeModal} class="text-slate-400 hover:text-slate-600 p-1">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>
      
      <form class="p-6 space-y-4" onsubmit={(e) => { e.preventDefault(); saveCustomer(); }}>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <input type="email" bind:value={formData.email} required disabled={modalMode === 'edit'} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 disabled:opacity-50" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
            <input type="text" bind:value={formData.firstName} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Apellido</label>
            <input type="text" bind:value={formData.lastName} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
            <input type="tel" bind:value={formData.phone} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Estado</label>
            <select bind:value={formData.status} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900">
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Origen</label>
            <select bind:value={formData.source} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900">
              <option value="WEB">Web</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="REFERIDO">Referido</option>
              <option value="SOCIAL">Redes Sociales</option>
              <option value="ADS">Publicidad</option>
              <option value="ADMIN">Manual</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={formData.isActive} class="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <span class="text-sm text-slate-600">Cliente activo</span>
            </label>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" onclick={closeModal} class="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} class="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
