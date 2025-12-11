<script lang="ts">
  // AdminLayout.svelte - Layout con sidebar para panel admin
  // Svelte 5 con runas + Phosphor Icons
  
  // Imports directos para mejor tree-shaking
  import Users from 'lucide-svelte/icons/users';
  import FileText from 'lucide-svelte/icons/file-text';
  import Gift from 'lucide-svelte/icons/gift';
  import Settings from 'lucide-svelte/icons/settings';
  import Home from 'lucide-svelte/icons/home';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import ShieldCheck from 'lucide-svelte/icons/shield-check';
  import PenSquare from 'lucide-svelte/icons/pen-square';
  import Database from 'lucide-svelte/icons/database';
  import ExternalLink from 'lucide-svelte/icons/external-link';
  
  import type { Snippet } from 'svelte';
  
  interface Props {
    adminName?: string;
    currentPage?: string;
    children?: Snippet;
  }
  
  let { adminName = 'Admin', currentPage = 'usuarios', children }: Props = $props();
  
  let sidebarOpen = $state(true);
  
  const menuItems = [
    { id: 'usuarios', label: 'Usuarios', icon: Users, href: '/admin' },
    { id: 'solicitudes', label: 'Solicitudes', icon: FileText, href: '/admin/solicitudes' },
    { id: 'participaciones', label: 'Sorteos', icon: Gift, href: '/admin/participaciones' },
    { id: 'configuracion', label: 'Configuración', icon: Settings, href: '/admin/config' },
  ];

  // Links externos (abren en nueva pestaña)
  const externalLinks = [
    { id: 'contenido', label: 'Editor CMS', icon: PenSquare, href: '/studio' },
    { id: 'turso', label: 'Turso DB', icon: Database, href: 'https://turso.tech/app' },
  ];
  
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

<div class="admin-layout">
  <!-- Sidebar -->
  <aside class="sidebar" class:collapsed={!sidebarOpen}>
    <div class="sidebar-header">
      <a href="/" class="logo">
        {#if sidebarOpen}
          <span class="logo-text">Consigue<span class="accent">TuVisa</span></span>
        {:else}
          <span class="logo-icon">C</span>
        {/if}
      </a>
      <button class="toggle-btn" onclick={toggleSidebar}>
        {#if sidebarOpen}
          <ChevronLeft size={16} />
        {:else}
          <ChevronRight size={16} />
        {/if}
      </button>
    </div>
    
    <nav class="sidebar-nav">
      {#each menuItems as item}
        <a 
          href={item.href}
          class="nav-item"
          class:active={currentPage === item.id}
        >
          <span class="nav-icon">
            <item.icon size={20} strokeWidth={currentPage === item.id ? 2.5 : 1.5} />
          </span>
          {#if sidebarOpen}
            <span class="nav-label">{item.label}</span>
          {/if}
        </a>
      {/each}
      
      <!-- External Links -->
      {#if externalLinks.length > 0}
        <div class="nav-divider"></div>
        {#each externalLinks as link}
          <a 
            href={link.href}
            class="nav-item external"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="nav-icon">
              <link.icon size={20} strokeWidth={1.5} />
            </span>
            {#if sidebarOpen}
              <span class="nav-label">{link.label}</span>
              <ExternalLink size={14} class="external-indicator" />
            {/if}
          </a>
        {/each}
      {/if}
    </nav>
    
    <div class="sidebar-footer">
      <a href="/dashboard" class="nav-item">
        <span class="nav-icon">
          <Home size={20} />
        </span>
        {#if sidebarOpen}
          <span class="nav-label">Volver al Panel</span>
        {/if}
      </a>
    </div>
  </aside>
  
  <!-- Main Content -->
  <main class="main-content">
    <header class="top-bar">
      <div class="top-bar-left">
        <h1 class="page-title">Panel de Administración</h1>
      </div>
      <div class="top-bar-right">
        <span class="admin-badge">
          <ShieldCheck size={16} />
          <span>{adminName}</span>
        </span>
      </div>
    </header>
    
    <div class="content-area">
      {@render children?.()}
    </div>
  </main>
</div>

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f3f4f6;
  }
  
  /* Sidebar */
  .sidebar {
    width: 260px;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
  }
  
  .sidebar.collapsed {
    width: 70px;
  }
  
  .sidebar-header {
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  
  .logo {
    text-decoration: none;
  }
  
  .logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }
  
  .logo-text .accent {
    color: #3b82f6;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
    background: #3b82f6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
  }
  
  .toggle-btn {
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 1rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .nav-item:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
  
  .nav-item.active {
    background: #3b82f6;
    color: white;
  }
  
  .nav-icon {
    font-size: 1.25rem;
    width: 24px;
    text-align: center;
  }
  
  .nav-label {
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .nav-divider {
    height: 1px;
    background: rgba(255,255,255,0.1);
    margin: 0.75rem 0.5rem;
  }
  
  .nav-item.external {
    color: rgba(255,255,255,0.5);
  }
  
  .nav-item.external:hover {
    color: rgba(255,255,255,0.9);
  }
  
  .nav-item.external :global(.external-indicator) {
    margin-left: auto;
    opacity: 0.5;
  }
  
  .sidebar-footer {
    padding: 1rem 0.5rem;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 260px;
    transition: margin-left 0.3s ease;
  }
  
  .sidebar.collapsed + .main-content,
  .sidebar.collapsed ~ .main-content {
    margin-left: 70px;
  }
  
  .top-bar {
    background: white;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 40;
  }
  
  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .admin-badge {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .content-area {
    padding: 1.5rem;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      width: 70px;
    }
    .sidebar .nav-label,
    .sidebar .logo-text,
    .sidebar .toggle-btn {
      display: none;
    }
    .sidebar-header {
      justify-content: center;
    }
    .main-content {
      margin-left: 70px;
    }
    .nav-item {
      justify-content: center;
      padding: 0.75rem;
    }
    .nav-icon {
      margin: 0;
    }
    .admin-badge span {
      display: none;
    }
    .top-bar {
      padding: 0.75rem 1rem;
    }
    .page-title {
      font-size: 1rem;
    }
  }
</style>
