<script lang="ts">
  // UsersCrud.svelte - CRUD de usuarios con Svelte 5 runas + Phosphor Icons
  
  // Imports directos para mejor tree-shaking
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import X from 'lucide-svelte/icons/x';
  import Loader2 from 'lucide-svelte/icons/loader-2';
  
  interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
  }
  
  // Estado reactivo
  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let total = $state(0);
  
  // Filtros y paginación
  let search = $state('');
  let roleFilter = $state('');
  let page = $state(1);
  let limit = $state(20);
  
  // Modal
  let showModal = $state(false);
  let modalMode = $state<'create' | 'edit'>('create');
  let selectedUser = $state<User | null>(null);
  let saving = $state(false);
  
  // Form
  let formData = $state({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'USER',
    isActive: true,
  });
  
  // Derivados
  let totalPages = $derived(Math.ceil(total / limit));
  let hasFilters = $derived(search !== '' || roleFilter !== '');
  
  // Cargar datos
  $effect(() => {
    loadUsers();
  });
  
  async function loadUsers() {
    loading = true;
    error = null;
    
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));
      
      const res = await fetch(`/api/admin/users?${params}`);
      
      if (res.ok) {
        const data = await res.json();
        users = data.data || [];
        total = data.total || 0;
      } else {
        error = 'Error cargando usuarios';
      }
    } catch (e) {
      error = 'Error de conexión';
      console.error(e);
    } finally {
      loading = false;
    }
  }
  
  function openCreateModal() {
    modalMode = 'create';
    selectedUser = null;
    formData = {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'USER',
      isActive: true,
    };
    showModal = true;
  }
  
  function openEditModal(user: User) {
    modalMode = 'edit';
    selectedUser = user;
    formData = {
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
    };
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
    selectedUser = null;
  }
  
  async function saveUser() {
    saving = true;
    
    try {
      const url = modalMode === 'create' 
        ? '/api/admin/users' 
        : `/api/admin/users/${selectedUser?.id}`;
      
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        closeModal();
        loadUsers();
      } else {
        const data = await res.json();
        error = data.error || 'Error guardando usuario';
      }
    } catch (e) {
      error = 'Error de conexión';
    } finally {
      saving = false;
    }
  }
  
  async function toggleActive(user: User) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      
      if (res.ok) {
        loadUsers();
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  async function deleteUser(user: User) {
    if (!confirm(`¿Eliminar usuario ${user.email}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        loadUsers();
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  function clearFilters() {
    search = '';
    roleFilter = '';
    page = 1;
  }
  
  function getRoleBadge(role: string): string {
    const badges: Record<string, string> = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'USER': 'bg-blue-100 text-blue-800',
      'AGENT': 'bg-green-100 text-green-800',
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  }
</script>

<div class="users-crud">
  <!-- Header -->
  <div class="crud-header">
    <div>
      <h2 class="crud-title">Gestión de Usuarios</h2>
      <p class="crud-subtitle">{total} usuarios registrados</p>
    </div>
    <button class="btn-primary" onclick={openCreateModal}>
      <UserPlus size={18} />
      Nuevo Usuario
    </button>
  </div>
  
  <!-- Filters -->
  <div class="filters-bar">
    <input
      type="text"
      placeholder="Buscar por nombre o email..."
      bind:value={search}
      oninput={() => { page = 1; loadUsers(); }}
      class="filter-input"
    />
    <select 
      bind:value={roleFilter} 
      onchange={() => { page = 1; loadUsers(); }}
      class="filter-select"
    >
      <option value="">Todos los roles</option>
      <option value="ADMIN">Admin</option>
      <option value="USER">Usuario</option>
      <option value="AGENT">Agente</option>
    </select>
    {#if hasFilters}
      <button class="btn-ghost" onclick={clearFilters}>
        <X size={16} />
        Limpiar
      </button>
    {/if}
  </div>

  
  <!-- Table -->
  <div class="table-container">
    {#if loading}
      <div class="loading-state">
        <Loader2 size={32} class="spinner-icon" />
        <p>Cargando usuarios...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p>⚠️ {error}</p>
        <button class="btn-ghost" onclick={loadUsers}>Reintentar</button>
      </div>
    {:else if users.length === 0}
      <div class="empty-state">
        <p>👥 No se encontraron usuarios</p>
      </div>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr>
              <td>
                <div class="user-cell">
                  <div class="avatar">
                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p class="user-name">
                      {user.firstName || ''} {user.lastName || ''}
                      {#if !user.firstName && !user.lastName}
                        <span class="text-muted">Sin nombre</span>
                      {/if}
                    </p>
                    <p class="user-phone">{user.phone || '-'}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="email">{user.email}</span>
                {#if user.emailVerified}
                  <span class="verified-badge" title="Verificado">✓</span>
                {/if}
              </td>
              <td>
                <span class="role-badge {getRoleBadge(user.role)}">
                  {user.role}
                </span>
              </td>
              <td>
                <button 
                  class="status-toggle"
                  class:active={user.isActive}
                  onclick={() => toggleActive(user)}
                  title={user.isActive ? 'Desactivar' : 'Activar'}
                >
                  {#if user.isActive}
                    <CheckCircle size={16} class="text-green" />
                    Activo
                  {:else}
                    <XCircle size={16} class="text-red" />
                    Inactivo
                  {/if}
                </button>
              </td>
              <td class="date-cell">
                {new Date(user.createdAt).toLocaleDateString('es-EC')}
              </td>
              <td>
                <div class="actions">
                  <button class="btn-icon" onclick={() => openEditModal(user)} title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button class="btn-icon danger" onclick={() => deleteUser(user)} title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div class="pagination">
        <p class="pagination-info">
          Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
        </p>
        <div class="pagination-buttons">
          <button 
            class="btn-page"
            disabled={page === 1}
            onclick={() => { page--; loadUsers(); }}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <span class="page-indicator">{page} / {totalPages}</span>
          <button 
            class="btn-page"
            disabled={page >= totalPages}
            onclick={() => { page++; loadUsers(); }}
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal -->
{#if showModal}
  <div class="modal-overlay" onclick={closeModal}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>{modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</h3>
        <button class="btn-close" onclick={closeModal}>✕</button>
      </div>
      
      <form class="modal-body" onsubmit={(e) => { e.preventDefault(); saveUser(); }}>
        <div class="form-grid">
          <div class="form-group">
            <label for="email">Email *</label>
            <input 
              type="email" 
              id="email"
              bind:value={formData.email}
              required
              disabled={modalMode === 'edit'}
            />
          </div>
          
          <div class="form-group">
            <label for="role">Rol *</label>
            <select id="role" bind:value={formData.role}>
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
              <option value="AGENT">Agente</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="firstName">Nombre</label>
            <input type="text" id="firstName" bind:value={formData.firstName} />
          </div>
          
          <div class="form-group">
            <label for="lastName">Apellido</label>
            <input type="text" id="lastName" bind:value={formData.lastName} />
          </div>
          
          <div class="form-group">
            <label for="phone">Teléfono</label>
            <input type="tel" id="phone" bind:value={formData.phone} />
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" bind:checked={formData.isActive} />
              Usuario activo
            </label>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-ghost" onclick={closeModal}>Cancelar</button>
          <button type="submit" class="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}


<style>
  .users-crud {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .crud-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .crud-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .crud-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .filters-bar {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }
  
  .filter-input {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
  }
  
  .filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  
  .filter-select {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .data-table th {
    text-align: left;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .data-table td {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: middle;
  }
  
  .data-table tr:hover {
    background: #f9fafb;
  }
  
  .user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
  }
  
  .user-name {
    font-weight: 500;
    color: #1f2937;
  }
  
  .user-phone {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .text-muted {
    color: #9ca3af;
    font-style: italic;
  }
  
  .email {
    color: #4b5563;
  }
  
  .verified-badge {
    color: #10b981;
    margin-left: 0.25rem;
  }
  
  .role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .status-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .status-toggle:hover {
    background: #f3f4f6;
  }
  
  .date-cell {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 1rem;
  }
  
  .btn-icon:hover {
    background: #f3f4f6;
  }
  
  .btn-icon.danger:hover {
    background: #fee2e2;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-primary:hover {
    background: #2563eb;
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-ghost {
    background: none;
    border: 1px solid #d1d5db;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    color: #4b5563;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  
  .btn-ghost:hover {
    background: #f3f4f6;
  }
  
  /* States */
  .loading-state, .error-state, .empty-state {
    padding: 3rem;
    text-align: center;
    color: #6b7280;
  }
  
  :global(.spinner-icon) {
    color: #3b82f6;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  :global(.text-green) { color: #10b981; }
  :global(.text-red) { color: #ef4444; }
  
  /* Pagination */
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .pagination-info {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .pagination-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-page {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  
  .btn-page:hover:not(:disabled) {
    background: #f3f4f6;
  }
  
  .btn-page:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-indicator {
    padding: 0 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }
  
  .modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalIn 0.2s ease;
  }
  
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6b7280;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group input,
  .form-group select {
    padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  
  .form-group input:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
  
  .checkbox-group {
    grid-column: span 2;
  }
  
  .checkbox-group label {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
    margin-top: 1.5rem;
  }
  
  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .checkbox-group {
      grid-column: span 1;
    }
  }
</style>
