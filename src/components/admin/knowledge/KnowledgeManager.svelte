<script lang="ts">
  // KnowledgeManager.svelte - Gestión de Knowledge Base
  // Estilo Jony Ive
  
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  import BookOpen from 'lucide-svelte/icons/book-open';
  import FileText from 'lucide-svelte/icons/file-text';
  import Database from 'lucide-svelte/icons/database';
  import Search from 'lucide-svelte/icons/search';
  import Plus from 'lucide-svelte/icons/plus';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Upload from 'lucide-svelte/icons/upload';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import Eye from 'lucide-svelte/icons/eye';
  import Layers from 'lucide-svelte/icons/layers';
  
  // Estado
  let loading = $state(true);
  let sources = $state<any[]>([]);
  let stats = $state({ totalSources: 0, totalDocuments: 0, totalChunks: 0 });
  let selectedSource = $state<any>(null);
  let documents = $state<any[]>([]);
  let loadingDocs = $state(false);
  
  // Modales
  let showIngestModal = $state(false);
  let showSearchModal = $state(false);
  let showSourceModal = $state(false);
  
  // Formularios
  let ingestForm = $state({ sourceId: '', title: '', content: '' });
  let searchQuery = $state('');
  let searchResults = $state<any[]>([]);
  let searching = $state(false);
  let ingesting = $state(false);
  
  onMount(() => {
    loadData();
  });
  
  async function loadData() {
    loading = true;
    try {
      // Cargar sources y stats via GraphQL
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              sources { id name type isActive documentsCount createdAt }
              knowledgeStats { totalSources totalDocuments totalChunks }
            }
          `
        })
      });
      const { data } = await res.json();
      if (data) {
        sources = data.sources || [];
        stats = data.knowledgeStats || stats;
      }
    } catch (e) {
      console.error('Error loading knowledge data:', e);
    } finally {
      loading = false;
    }
  }
  
  async function loadDocuments(sourceId: string) {
    loadingDocs = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query($sourceId: ID!) {
              documentsBySource(sourceId: $sourceId) {
                id title chunksCount createdAt
              }
            }
          `,
          variables: { sourceId }
        })
      });
      const { data } = await res.json();
      documents = data?.documentsBySource || [];
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      loadingDocs = false;
    }
  }
  
  function selectSource(source: any) {
    selectedSource = source;
    loadDocuments(source.id);
  }
  
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    searching = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query($input: SearchKnowledgeInput!) {
              searchKnowledge(input: $input) {
                results { content source score }
                totalResults
              }
            }
          `,
          variables: { input: { query: searchQuery, topK: 5 } }
        })
      });
      const { data } = await res.json();
      searchResults = data?.searchKnowledge?.results || [];
    } catch (e) {
      console.error('Error searching:', e);
    } finally {
      searching = false;
    }
  }
  
  async function handleIngest() {
    if (!ingestForm.sourceId || !ingestForm.title || !ingestForm.content) return;
    ingesting = true;
    try {
      const res = await fetch('/api/knowledge/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: ingestForm.sourceId,
          title: ingestForm.title,
          content: ingestForm.content
        })
      });
      if (res.ok) {
        showIngestModal = false;
        ingestForm = { sourceId: '', title: '', content: '' };
        loadData();
        if (selectedSource) loadDocuments(selectedSource.id);
      }
    } catch (e) {
      console.error('Error ingesting:', e);
    } finally {
      ingesting = false;
    }
  }
  
  async function deleteDocument(docId: string) {
    if (!confirm('¿Eliminar este documento y sus chunks?')) return;
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation($id: ID!) { deleteDocument(id: $id) }`,
          variables: { id: docId }
        })
      });
      loadData();
      if (selectedSource) loadDocuments(selectedSource.id);
    } catch (e) {
      console.error('Error deleting:', e);
    }
  }
</script>


<!-- Template -->
<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Knowledge Base</h1>
      <p class="text-slate-500 font-light mt-1">Gestiona el contenido del chatbot RAG</p>
    </div>
    <div class="flex gap-3">
      <button 
        onclick={() => loadData()}
        class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
      >
        <RefreshCw size={18} strokeWidth={1.5} />
        <span class="font-light">Actualizar</span>
      </button>
      <button 
        onclick={() => showSearchModal = true}
        class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
      >
        <Search size={18} strokeWidth={1.5} />
        <span class="font-light">Buscar</span>
      </button>
      <button 
        onclick={() => showIngestModal = true}
        class="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-full transition-all"
      >
        <Upload size={18} strokeWidth={1.5} />
        <span>Ingestar</span>
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  {#if loading}
    <div class="grid grid-cols-3 gap-6">
      {#each [1, 2, 3] as _}
        <div class="bg-white rounded-3xl p-6 shadow-sm">
          <Skeleton class="h-4 w-24 mb-3" />
          <Skeleton class="h-8 w-16" />
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3 text-slate-500 mb-2">
          <BookOpen size={20} strokeWidth={1.5} />
          <span class="font-light text-sm">Fuentes</span>
        </div>
        <p class="text-3xl font-semibold text-slate-800">{stats.totalSources}</p>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3 text-slate-500 mb-2">
          <FileText size={20} strokeWidth={1.5} />
          <span class="font-light text-sm">Documentos</span>
        </div>
        <p class="text-3xl font-semibold text-slate-800">{stats.totalDocuments}</p>
      </div>
      <div class="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3 text-slate-500 mb-2">
          <Layers size={20} strokeWidth={1.5} />
          <span class="font-light text-sm">Chunks</span>
        </div>
        <p class="text-3xl font-semibold text-slate-800">{stats.totalChunks}</p>
      </div>
    </div>
  {/if}

  <!-- Main Content: Sources + Documents -->
  <div class="grid grid-cols-12 gap-6">
    <!-- Sources List -->
    <div class="col-span-5 bg-white rounded-3xl shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100">
        <h2 class="font-semibold text-slate-800">Fuentes de Conocimiento</h2>
      </div>
      
      {#if loading}
        <div class="p-4 space-y-3">
          {#each [1, 2, 3, 4] as _}
            <div class="p-4 rounded-2xl bg-slate-50">
              <Skeleton class="h-4 w-32 mb-2" />
              <Skeleton class="h-3 w-20" />
            </div>
          {/each}
        </div>
      {:else if sources.length === 0}
        <div class="p-8 text-center text-slate-400">
          <Database size={40} strokeWidth={1} class="mx-auto mb-3 opacity-50" />
          <p class="font-light">No hay fuentes configuradas</p>
        </div>
      {:else}
        <div class="p-4 space-y-2 max-h-96 overflow-y-auto">
          {#each sources as source}
            <button
              onclick={() => selectSource(source)}
              class="w-full p-4 rounded-2xl text-left transition-all {selectedSource?.id === source.id ? 'bg-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">{source.name}</p>
                  <p class="text-sm opacity-70 font-light">{source.documentsCount} documentos</p>
                </div>
                <div class="flex items-center gap-2">
                  {#if source.isActive}
                    <CheckCircle size={16} strokeWidth={1.5} class="text-green-500" />
                  {:else}
                    <XCircle size={16} strokeWidth={1.5} class="text-red-400" />
                  {/if}
                  <ChevronRight size={18} strokeWidth={1.5} class="opacity-50" />
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Documents List -->
    <div class="col-span-7 bg-white rounded-3xl shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100">
        <h2 class="font-semibold text-slate-800">
          {selectedSource ? `Documentos de "${selectedSource.name}"` : 'Selecciona una fuente'}
        </h2>
      </div>
      
      {#if !selectedSource}
        <div class="p-12 text-center text-slate-400">
          <Eye size={40} strokeWidth={1} class="mx-auto mb-3 opacity-50" />
          <p class="font-light">Selecciona una fuente para ver sus documentos</p>
        </div>
      {:else if loadingDocs}
        <div class="p-4 space-y-3">
          {#each [1, 2, 3] as _}
            <div class="p-4 rounded-2xl bg-slate-50 flex justify-between">
              <div>
                <Skeleton class="h-4 w-48 mb-2" />
                <Skeleton class="h-3 w-24" />
              </div>
              <Skeleton class="h-8 w-8 rounded-full" />
            </div>
          {/each}
        </div>
      {:else if documents.length === 0}
        <div class="p-12 text-center text-slate-400">
          <FileText size={40} strokeWidth={1} class="mx-auto mb-3 opacity-50" />
          <p class="font-light">Esta fuente no tiene documentos</p>
        </div>
      {:else}
        <div class="p-4 space-y-2 max-h-96 overflow-y-auto">
          {#each documents as doc}
            <div class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
              <div>
                <p class="font-medium text-slate-700">{doc.title}</p>
                <p class="text-sm text-slate-400 font-light">{doc.chunksCount} chunks</p>
              </div>
              <button
                onclick={() => deleteDocument(doc.id)}
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <Trash2 size={18} strokeWidth={1.5} />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal: Ingestar Documento -->
{#if showIngestModal}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
      <h3 class="text-xl font-semibold text-slate-800 mb-6">Ingestar Documento</h3>
      
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-light text-slate-600 mb-2">Fuente</label>
          <select 
            bind:value={ingestForm.sourceId}
            class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-400 focus:outline-none font-light"
          >
            <option value="">Seleccionar fuente...</option>
            {#each sources as source}
              <option value={source.id}>{source.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-light text-slate-600 mb-2">Título</label>
          <input 
            type="text"
            bind:value={ingestForm.title}
            placeholder="Ej: Requisitos Visa B1/B2"
            class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-400 focus:outline-none font-light"
          />
        </div>
        
        <div>
          <label class="block text-sm font-light text-slate-600 mb-2">Contenido (Markdown)</label>
          <textarea 
            bind:value={ingestForm.content}
            rows="8"
            placeholder="# Título&#10;&#10;Contenido del documento..."
            class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-400 focus:outline-none font-light resize-none"
          ></textarea>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-8">
        <button 
          onclick={() => showIngestModal = false}
          class="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all font-light"
        >
          Cancelar
        </button>
        <button 
          onclick={handleIngest}
          disabled={ingesting || !ingestForm.sourceId || !ingestForm.title || !ingestForm.content}
          class="px-6 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if ingesting}
            <RefreshCw size={16} class="animate-spin" />
          {/if}
          Ingestar
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal: Búsqueda Semántica -->
{#if showSearchModal}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8">
      <h3 class="text-xl font-semibold text-slate-800 mb-6">Búsqueda Semántica</h3>
      
      <div class="flex gap-3 mb-6">
        <input 
          type="text"
          bind:value={searchQuery}
          placeholder="Ej: ¿Cuáles son los requisitos para la visa B1/B2?"
          class="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-400 focus:outline-none font-light"
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onclick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          class="px-6 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-full transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {#if searching}
            <RefreshCw size={16} class="animate-spin" />
          {:else}
            <Search size={16} strokeWidth={1.5} />
          {/if}
          Buscar
        </button>
      </div>
      
      {#if searchResults.length > 0}
        <div class="space-y-3 max-h-80 overflow-y-auto">
          {#each searchResults as result, i}
            <div class="p-4 rounded-2xl bg-slate-50">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                  {result.source}
                </span>
                <span class="text-xs text-slate-400">
                  Score: {(result.score * 100).toFixed(1)}%
                </span>
              </div>
              <p class="text-sm text-slate-600 font-light line-clamp-3">{result.content}</p>
            </div>
          {/each}
        </div>
      {:else if searchQuery && !searching}
        <div class="text-center text-slate-400 py-8">
          <Search size={32} strokeWidth={1} class="mx-auto mb-2 opacity-50" />
          <p class="font-light">No se encontraron resultados</p>
        </div>
      {/if}
      
      <div class="flex justify-end mt-6">
        <button 
          onclick={() => { showSearchModal = false; searchQuery = ''; searchResults = []; }}
          class="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all font-light"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
{/if}
