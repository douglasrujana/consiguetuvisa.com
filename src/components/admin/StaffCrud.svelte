<script lang="ts">
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
  import ShieldCheck from 'lucide-svelte/icons/shield-check';
  
  interface Props { currentUserId?: string; }
  let { currentUserId }: Props = $props();
  
  interface StaffMember {
    id: string; email: string; firstName: string; lastName: string;
    role: string; department: string | null; isActive: boolean;
    clerkId: string | null; createdAt: string;
  }
  
  let staff = $state<StaffMember[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let total = $state(0);
  let search = $state('');
  let roleFilter = $state('');
  let page = $state(1);
  let limit = $state(20);
  let showModal = $state(false);
  let modalMode = $state<'create' | 'edit'>('create');
  let selectedStaff = $state<StaffMember | null>(null);
  let saving = $state(false);
  let formData = $state({ email: '', firstName: '', lastName: '', role: 'SALES', department: '', isActive: true });
  
  let totalPages = $derived(Math.ceil(total / limit));
  let hasFilters = $derived(search !== '' || roleFilter !== '');
  
  $effect(() => { loadStaff(); });
  
  async function loadStaff() {
    loading = true; error = null;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await fetch(`/api/admin/staff?${params}`);
      if (res.ok) { const data = await res.json(); staff = data.data || []; total = data.total || 0; }
      else error = 'Error cargando equipo';
    } catch { error = 'Error de conexión'; }
    finally { loading = false; }
  }
  
  function openCreateModal() {
    modalMode = 'create'; selectedStaff = null;
    formData = { email: '', firstName: '', lastName: '', role: 'SALES', department: '', isActive: true };
    showModal = true;
  }
  
  function openEditModal(member: StaffMember) {
    modalMode = 'edit'; selectedStaff = member;
    formData = { email: member.email, firstName: member.firstName, lastName: member.lastName, role: member.role, department: member.department || '', isActive: member.isActive };
    showModal = true;
  }
  
  function closeModal() { showModal = false; selectedStaff = null; }
  
  async function saveStaff() {
    saving = true;
    try {
      const url = modalMode === 'create' ? '/api/admin/staff' : `/api/admin/staff/${selectedStaff?.id}`;
      const res = await fetch(url, { method: modalMode === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { closeModal(); loadStaff(); }
      else { const data = await res.json(); error = data.error || 'Error guardando'; }
    } catch { error = 'Error de conexión'; }
    finally { saving = false; }
  }
  
  async function toggleActive(member: StaffMember) {
    if (member.id === currentUserId) { error = 'No puedes desactivarte'; return; }
    try { await fetch(`/api/admin/staff/${member.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !member.isActive }) }); loadStaff(); }
    catch { /* ignore */ }
  }
  
  async function deleteStaff(member: StaffMember) {
    if (member.id === currentUserId) { error = 'No puedes eliminarte'; return; }
    if (!confirm(`¿Eliminar a ${member.firstName} ${member.lastName}?`)) return;
    try { const res = await fetch(`/api/admin/staff/${member.id}`, { method: 'DELETE' }); if (!res.ok) { const d = await res.json(); error = d.error; return; } loadStaff(); }
    catch { /* ignore */ }
  }
  
  function clearFilters() { search = ''; roleFilter = ''; page = 1; }
  
  function getRoleBadge(role: string) {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'ADMIN': { bg: 'bg-violet-50', text: 'text-violet-600', label: 'Admin' },
      'DEV': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Dev' },
      'SALES': { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Ventas' },
      'COMMUNITY': { bg: 'bg-pink-50', text: 'text-pink-600', label: 'Community' },
      'SUPPORT': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Soporte' },
    };
    return badges[role] || { bg: 'bg-slate-100', text: 'text-slate-600', label: role };
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Equipo</h1>
      <p class="text-slate-400 text-sm mt-1">{total} miembros</p>
    </div>
    <button onclick={openCreateModal} class="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800">
      <UserPlus size={16} strokeWidth={1.5} /> Invitar
    </button>
  </div>
  
  <div class="bg-white rounded-2xl p-4">
    <div class="flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
        <input type="text" placeholder="Buscar..." bind:value={search} oninput={() => { page = 1; loadStaff(); }} class="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-slate-900" />
      </div>
      <select bind:value={roleFilter} onchange={() => { page = 1; loadStaff(); }} class="px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm">
        <option value="">Todos</option>
        <option value="ADMIN">Admin</option>
        <option value="DEV">Dev</option>
        <option value="SALES">Ventas</option>
        <option value="COMMUNITY">Community</option>
        <option value="SUPPORT">Soporte</option>
      </select>
      {#if hasFilters}<button onclick={clearFilters} class="px-4 py-3 text-slate-500 text-sm"><X size={14} /> Limpiar</button>{/if}
    </div>
  </div>

  <div class="bg-white rounded-2xl overflow-hidden">
    {#if loading && staff.length === 0}
      <div class="p-8 space-y-4">{#each Array(3) as _}<Skeleton class="h-12 w-full rounded" />{/each}</div>
    {:else if error}
      <div class="py-20 text-center"><p class="text-red-500 text-sm">{error}</p><button onclick={loadStaff} class="mt-4 text-slate-600 text-sm">Reintentar</button></div>
    {:else if staff.length === 0}
      <div class="py-20 text-center"><ShieldCheck size={48} class="mx-auto text-slate-300 mb-4" /><p class="text-slate-400 text-sm">Sin miembros</p></div>
    {:else}
      <table class="w-full">
        <thead><tr class="border-b border-slate-100">
          <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Miembro</th>
          <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
          <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Rol</th>
          <th class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Estado</th>
          <th class="px-6 py-4"></th>
        </tr></thead>
        <tbody class="divide-y divide-slate-50">
          {#each staff as member}
            {@const badge = getRoleBadge(member.role)}
            <tr class="hover:bg-slate-50/50">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-sm font-medium">{member.firstName[0]}{member.lastName[0]}</div>
                  <div><p class="font-medium text-slate-800">{member.firstName} {member.lastName}{#if member.id === currentUserId}<span class="text-xs text-slate-400 ml-1">(tú)</span>{/if}</p><p class="text-xs text-slate-400">{member.department || '-'}</p></div>
                </div>
              </td>
              <td class="px-6 py-4"><span class="text-slate-600 text-sm">{member.email}</span>{#if member.clerkId}<span class="text-emerald-500 ml-1">✓</span>{/if}</td>
              <td class="px-6 py-4"><span class="text-xs px-3 py-1 rounded-full font-medium {badge.bg} {badge.text}">{badge.label}</span></td>
              <td class="px-6 py-4">
                <button onclick={() => toggleActive(member)} disabled={member.id === currentUserId} class="flex items-center gap-1.5 text-sm {member.isActive ? 'text-emerald-600' : 'text-slate-400'} disabled:opacity-50">
                  {#if member.isActive}<CheckCircle size={14} /><span>Activo</span>{:else}<XCircle size={14} /><span>Inactivo</span>{/if}
                </button>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <button onclick={() => openEditModal(member)} class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Pencil size={16} /></button>
                  {#if member.id !== currentUserId}<button onclick={() => deleteStaff(member)} class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>{/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if totalPages > 1}
        <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-400">{(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}</p>
          <div class="flex items-center gap-2">
            <button onclick={() => { page--; loadStaff(); }} disabled={page === 1} class="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40"><ChevronLeft size={16} /> Ant</button>
            <span class="text-sm text-slate-400">{page}/{totalPages}</span>
            <button onclick={() => { page++; loadStaff(); }} disabled={page >= totalPages} class="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40">Sig <ChevronRight size={16} /></button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if showModal}
<div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl">
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-800">{modalMode === 'create' ? 'Invitar Miembro' : 'Editar'}</h3>
      <button onclick={closeModal} class="text-slate-400 hover:text-slate-600"><X size={20} /></button>
    </div>
    <form class="p-6 space-y-4" onsubmit={(e) => { e.preventDefault(); saveStaff(); }}>
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2"><label for="email" class="block text-xs font-medium text-slate-500 uppercase mb-2">Email</label><input id="email" type="email" bind:value={formData.email} required disabled={modalMode === 'edit'} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm disabled:opacity-50" /></div>
        <div><label for="fn" class="block text-xs font-medium text-slate-500 uppercase mb-2">Nombre</label><input id="fn" type="text" bind:value={formData.firstName} required class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm" /></div>
        <div><label for="ln" class="block text-xs font-medium text-slate-500 uppercase mb-2">Apellido</label><input id="ln" type="text" bind:value={formData.lastName} required class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm" /></div>
        <div><label for="role" class="block text-xs font-medium text-slate-500 uppercase mb-2">Rol</label><select id="role" bind:value={formData.role} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm"><option value="ADMIN">Admin</option><option value="DEV">Dev</option><option value="SALES">Ventas</option><option value="COMMUNITY">Community</option><option value="SUPPORT">Soporte</option></select></div>
        <div><label for="dept" class="block text-xs font-medium text-slate-500 uppercase mb-2">Depto</label><input id="dept" type="text" bind:value={formData.department} class="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm" /></div>
        <div class="col-span-2"><label class="flex items-center gap-3"><input type="checkbox" bind:checked={formData.isActive} class="w-5 h-5 rounded" /><span class="text-sm text-slate-600">Activo</span></label></div>
      </div>
      <div class="flex justify-end gap-3 pt-4">
        <button type="button" onclick={closeModal} class="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-full">Cancelar</button>
        <button type="submit" disabled={saving} class="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  </div>
</div>
{/if}
