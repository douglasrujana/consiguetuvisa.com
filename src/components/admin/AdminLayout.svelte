<script lang="ts">
  // AdminLayout.svelte - Estilo Jony Ive
  
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
  import BookOpen from 'lucide-svelte/icons/book-open';
  import Bell from 'lucide-svelte/icons/bell';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import Radio from 'lucide-svelte/icons/radio';
  
  import type { Snippet } from 'svelte';
  
  interface Props {
    adminName?: string;
    currentPage?: string;
    children?: Snippet;
  }
  
  let { adminName = 'Admin', currentPage = 'usuarios', children }: Props = $props();
  
  let sidebarOpen = $state(true);
  
  const menuItems = [
    { id: 'clientes', label: 'Clientes', icon: Users, href: '/admin' },
    { id: 'equipo', label: 'Equipo', icon: ShieldCheck, href: '/admin/equipo' },
    { id: 'solicitudes', label: 'Solicitudes', icon: FileText, href: '/admin/solicitudes' },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, href: '/admin/knowledge' },
    { id: 'social', label: 'Social Listening', icon: Radio, href: '/admin/social' },
    { id: 'alertas', label: 'Alertas Sistema', icon: Bell, href: '/admin/alertas' },
    { id: 'chat', label: 'Chatbot', icon: MessageSquare, href: '/admin/chat' },
    { id: 'participaciones', label: 'Sorteos', icon: Gift, href: '/admin/participaciones' },
    { id: 'configuracion', label: 'Configuración', icon: Settings, href: '/admin/config' },
  ];

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
      <a href="/" class="logo" data-astro-prefetch="viewport">
        {#if sidebarOpen}
          <span class="logo-text">Consigue<span class="accent">TuVisa</span></span>
        {:else}
          <span class="logo-icon">C</span>
        {/if}
      </a>
      <button class="toggle-btn" onclick={toggleSidebar}>
        {#if sidebarOpen}
          <ChevronLeft size={14} strokeWidth={1.5} />
        {:else}
          <ChevronRight size={14} strokeWidth={1.5} />
        {/if}
      </button>
    </div>
    
    <nav class="sidebar-nav">
      {#each menuItems as item}
        {@const Icon = item.icon}
        <a 
          href={item.href}
          class="nav-item"
          class:active={currentPage === item.id}
        >
          <span class="nav-icon">
            <Icon size={18} strokeWidth={currentPage === item.id ? 2 : 1.5} />
          </span>
          {#if sidebarOpen}
            <span class="nav-label">{item.label}</span>
          {/if}
        </a>
      {/each}
      
      {#if externalLinks.length > 0}
        <div class="nav-divider"></div>
        {#each externalLinks as link}
          {@const Icon = link.icon}
          <a 
            href={link.href}
            class="nav-item external"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="nav-icon">
              <Icon size={18} strokeWidth={1.5} />
            </span>
            {#if sidebarOpen}
              <span class="nav-label">{link.label}</span>
              <ExternalLink size={12} class="external-indicator" />
            {/if}
          </a>
        {/each}
      {/if}
    </nav>
    
    <div class="sidebar-footer">
      <a href="/dashboard" class="nav-item">
        <span class="nav-icon">
          <Home size={18} strokeWidth={1.5} />
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
        <p class="page-subtitle">Panel de Administración</p>
      </div>
      <div class="top-bar-right">
        <span class="admin-badge">
          <ShieldCheck size={14} strokeWidth={1.5} />
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
    background: #f8fafc;
  }
  
  /* Sidebar - Jony Ive style */
  .sidebar {
    width: 240px;
    background: #0f172a;
    display: flex;
    flex-direction: column;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
  }
  
  .sidebar.collapsed {
    width: 72px;
  }
  
  .sidebar-header {
    padding: 1.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .logo {
    text-decoration: none;
  }
  
  .logo-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: white;
    letter-spacing: -0.02em;
  }
  
  .logo-text .accent {
    color: #60a5fa;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }
  
  .toggle-btn {
    background: rgba(255,255,255,0.05);
    border: none;
    color: rgba(255,255,255,0.5);
    width: 28px;
    height: 28px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  
  .toggle-btn:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .nav-item:hover {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.9);
  }
  
  .nav-item.active {
    background: rgba(255,255,255,0.1);
    color: white;
  }
  
  .nav-icon {
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-label {
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  
  .nav-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 12px 8px;
  }
  
  .nav-item.external {
    color: rgba(255,255,255,0.35);
  }
  
  .nav-item.external:hover {
    color: rgba(255,255,255,0.7);
  }
  
  .nav-item.external :global(.external-indicator) {
    margin-left: auto;
    opacity: 0.4;
  }
  
  .sidebar-footer {
    padding: 0.5rem;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 240px;
    transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 100vh;
  }
  
  .sidebar.collapsed + .main-content,
  .sidebar.collapsed ~ .main-content {
    margin-left: 72px;
  }
  
  .top-bar {
    background: white;
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 40;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .page-subtitle {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }
  
  .admin-badge {
    background: #f1f5f9;
    color: #475569;
    padding: 8px 14px;
    border-radius: 100px;
    font-size: 0.8125rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  
  .content-area {
    padding: 2rem;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      width: 72px;
    }
    .sidebar .nav-label,
    .sidebar .logo-text,
    .sidebar .toggle-btn {
      display: none;
    }
    .sidebar-header {
      justify-content: center;
      padding: 1.25rem 0.5rem;
    }
    .main-content {
      margin-left: 72px;
    }
    .nav-item {
      justify-content: center;
      padding: 12px;
    }
    .nav-icon {
      margin: 0;
    }
    .admin-badge span {
      display: none;
    }
    .top-bar {
      padding: 1rem;
    }
    .content-area {
      padding: 1rem;
    }
  }
</style>
