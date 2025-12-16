<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Table from '$lib/components/ui/table';
  
  import BookOpen from 'lucide-svelte/icons/book-open';
  import FileText from 'lucide-svelte/icons/file-text';
  import Database from 'lucide-svelte/icons/database';
  import Search from 'lucide-svelte/icons/search';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Upload from 'lucide-svelte/icons/upload';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import Eye from 'lucide-svelte/icons/eye';
  import Layers from 'lucide-svelte/icons/layers';
  import X from 'lucide-svelte/icons/x';
  import Globe from 'lucide-svelte/icons/globe';
  import Cloud from 'lucide-svelte/icons/cloud';
  import Rss from 'lucide-svelte/icons/rss';
  import PenTool from 'lucide-svelte/icons/pen-tool';
  
  // Estado
  let loading = $state(true);
  let sources = $state<any[]>([]);
  let documents = $state<any[]>([]);
  let stats = $state({ totalSources: 0, totalDocuments: 0, totalChunks: 0 });
  let selectedSource = $state<any>(null);
  let selectedDoc = $state<any>(null);
  let loadingDocs = $state(false);
  
  // Modales
  let showIngestModal = $state(false);
  let showSearchModal = $state(false);
  
  // Formularios
  let ingestForm = $state({ sourceId: '', title: '', content: '' });
  let searchQuery = $state('');
  let searchResults = $state<any[]>([]);
  let searching = $state(false);
  let ingesting = $state(false);

  // KPIs calculados
  let avgChunksPerDoc = $derived(stats.totalDocuments > 0 ? Math.round(stats.totalChunks / stats.totalDocuments) : 0);
  let activeSourcesCount = $derived(sources.filter(s => s.isActive).length);
  
  let sourceTypeStats = $derived.by(() => {
    const counts: Record<string, number> = {};
    sources.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  });

  let topSources = $derived.by(() => {
    return [...sources].sort((a, b) => (b.documentsCount || 0) - (a.documentsCount || 0)).slice(0, 4);
  });

  const sourceTypeIcons: Record<string, typeof Globe> = { BLOB: Cloud, SANITY: Database, WEB: Globe, MANUAL: PenTool, RSS: Rss };
  const sourceTypeLabels: Record<string, string> = { BLOB: 'Blob', SANITY: 'Sanity', WEB: 'Web', MANUAL: 'Manual', RSS: 'RSS', SOCIAL: 'Social' };
  
  onMount(() => loadData());
  
  async function loadData() {
    loading = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { sources { id name type isActive documentsCount createdAt } knowledgeStats { totalSources totalDocuments totalChunks } }`
        })
      });
      const { data } = await res.json();
      if (data) {
        sources = data.sources || [];
        stats = data.knowledgeStats || stats;
      }
    } catch (e) { console.error('Error:', e); }
    finally { loading = false; }
  }
  
  async function loadDocuments(sourceId: string) {
    loadingDocs = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($sourceId: ID!) { documentsBySource(sourceId: $sourceId) { id title chunksCount status createdAt } }`,
          variables: { sourceId }
        })
      });
      const { data } = await res.json();
      documents = data?.documentsBySource || [];
    } catch (e) { console.error('Error:', e); }
    finally { loadingDocs = false; }
  }
  
  function selectSource(source: any) {
    selectedSource = source;
    selectedDoc = null;
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
          query: `query($input: SearchKnowledgeInput!) { searchKnowledge(input: $input) { results { content source score } totalResults } }`,
          variables: { input: { query: searchQuery, topK: 5 } }
        })
      });
      const { data } = await res.json();
      searchResults = data?.searchKnowledge?.results || [];
    } catch (e) { console.error('Error:', e); }
    finally { searching = false; }
  }
  
  async function handleIngest() {
    if (!ingestForm.sourceId || !ingestForm.title || !ingestForm.content) return;
    ingesting = true;
    try {
      const res = await fetch('/api/knowledge/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingestForm)
      });
      if (res.ok) {
        showIngestModal = false;
        ingestForm = { sourceId: '', title: '', content: '' };
        loadData();
        if (selectedSource) loadDocuments(selectedSource.id);
      }
    } catch (e) { console.error('Error:', e); }
    finally { ingesting = false; }
  }
  
  async function deleteDocument(docId: string) {
    if (!confirm('¿Eliminar este documento y sus chunks?')) return;
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation($id: ID!) { deleteDocument(id: $id) }`, variables: { id: docId } })
      });
      loadData();
      if (selectedSource) loadDocuments(selectedSource.id);
      selectedDoc = null;
    } catch (e) { console.error('Error:', e); }
  }

  function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }); }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Knowledge Base</h1>
      <p class="text-slate-500 font-light mt-1">Gestiona el contenido del chatbot RAG</p>
    </div>
    <div class="flex gap-2">
      <button onclick={() => loadData()} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full">
        <RefreshCw size={18} strokeWidth={1.5} /><span class="font-light">Actualizar</span>
      </button>
      <button onclick={() => showSearchModal = true} class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full">
        <Search size={18} strokeWidth={1.5} /><span class="font-light">Buscar</span>
      </button>
      <button onclick={() => showIngestModal = true} class="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-full">
        <Upload size={18} strokeWidth={1.5} /><span>Ingestar</span>
      </button>
    </div>
  </div>

  <!-- Stats Row 1 -->
  <div class="grid grid-cols-4 gap-4">
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <div class="flex items-center gap-2 text-slate-500 mb-1"><BookOpen size={16} strokeWidth={1.5} /><span class="font-light text-xs">Fuentes</span></div>
      <p class="text-2xl font-semibold text-slate-800">{stats.totalSources}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-400">
      <div class="flex items-center gap-2 text-blue-500 mb-1"><FileText size={16} strokeWidth={1.5} /><span class="font-light text-xs">Documentos</span></div>
      <p class="text-2xl font-semibold text-blue-600">{stats.totalDocuments}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-emerald-400">
      <div class="flex items-center gap-2 text-emerald-500 mb-1"><Layers size={16} strokeWidth={1.5} /><span class="font-light text-xs">Chunks</span></div>
      <p class="text-2xl font-semibold text-emerald-600">{stats.totalChunks}</p>
    </div>
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <div class="flex items-center gap-2 text-slate-500 mb-1"><CheckCircle size={16} strokeWidth={1.5} /><span class="font-light text-xs">Activas</span></div>
      <p class="text-2xl font-semibold text-slate-800">{activeSourcesCount}</p>
    </div>
  </div>

  <!-- KPIs Row 2 -->
  <div class="grid grid-cols-3 gap-4">
    <!-- Promedio chunks/doc -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Promedio chunks/documento</p>
      <div class="flex items-end gap-3">
        <p class="text-3xl font-semibold text-slate-800">{avgChunksPerDoc}</p>
        <span class="text-sm text-slate-400 mb-1">chunks</span>
      </div>
    </div>
    <!-- Por tipo de fuente -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Por tipo de fuente</p>
      <div class="flex flex-wrap gap-2">
        {#each sourceTypeStats as st}
          {@const Icon = sourceTypeIcons[st.type] || Database}
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
            <Icon size={12} strokeWidth={1.5} />{sourceTypeLabels[st.type] || st.type}: {st.count}
          </span>
        {/each}
      </div>
    </div>
    <!-- Top fuentes -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <p class="text-xs text-slate-400 mb-3">Top fuentes por documentos</p>
      <div class="space-y-1.5">
        {#each topSources as src, i}
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 w-4">{i + 1}.</span>
            <span class="text-xs text-slate-600 flex-1 truncate">{src.name}</span>
            <span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">{src.documentsCount}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- DataTable de Fuentes -->
  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div class="p-4 border-b border-slate-100 flex items-center justify-between">
      <h2 class="font-semibold text-slate-800">Fuentes de Conocimiento</h2>
    </div>
    <Table.Root>
      <Table.Header>
        <Table.Row class="bg-slate-50">
          <Table.Head class="font-semibold">Nombre</Table.Head>
          <Table.Head class="font-semibold text-center">Tipo</Table.Head>
          <Table.Head class="font-semibold text-center">Documentos</Table.Head>
          <Table.Head class="font-semibold text-center">Estado</Table.Head>
          <Table.Head class="font-semibold">Fecha</Table.Head>
          <Table.Head class="font-semibold text-right">Acciones</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          {#each [1,2,3,4] as _}
            <Table.Row><Table.Cell colspan={6}><Skeleton class="h-8 w-full" /></Table.Cell></Table.Row>
          {/each}
        {:else if sources.length === 0}
          <Table.Row><Table.Cell colspan={6} class="text-center py-12 text-slate-400">No hay fuentes configuradas</Table.Cell></Table.Row>
        {:else}
          {#each sources as source}
            {@const TypeIcon = sourceTypeIcons[source.type] || Database}
            <Table.Row class="hover:bg-slate-50 cursor-pointer {selectedSource?.id === source.id ? 'bg-blue-50' : ''}" onclick={() => selectSource(source)}>
              <Table.Cell><p class="font-medium text-sm">{source.name}</p></Table.Cell>
              <Table.Cell class="text-center">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                  <TypeIcon size={12} strokeWidth={1.5} />{sourceTypeLabels[source.type] || source.type}
                </span>
              </Table.Cell>
              <Table.Cell class="text-center"><span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">{source.documentsCount || 0}</span></Table.Cell>
              <Table.Cell class="text-center">
                {#if source.isActive}
                  <span class="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} />Activa</span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-slate-400 text-xs"><XCircle size={14} />Inactiva</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="text-sm text-slate-500">{fmtDate(source.createdAt)}</Table.Cell>
              <Table.Cell class="text-right">
                <button onclick={(e) => { e.stopPropagation(); selectSource(source); }} class="p-2 hover:bg-blue-50 rounded-full text-blue-600"><Eye size={16} /></button>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
    <div class="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">{sources.length} fuentes</div>
  </div>

  <!-- Documentos de la fuente seleccionada -->
  {#if selectedSource}
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 class="font-semibold text-slate-800">Documentos de "{selectedSource.name}"</h2>
        <button onclick={() => { selectedSource = null; documents = []; }} class="text-slate-400 hover:text-slate-600"><X size={18} /></button>
      </div>
      <Table.Root>
        <Table.Header>
          <Table.Row class="bg-slate-50">
            <Table.Head class="font-semibold">Título</Table.Head>
            <Table.Head class="font-semibold text-center">Chunks</Table.Head>
            <Table.Head class="font-semibold text-center">Estado</Table.Head>
            <Table.Head class="font-semibold">Fecha</Table.Head>
            <Table.Head class="font-semibold text-right">Acciones</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if loadingDocs}
            {#each [1,2,3] as _}
              <Table.Row><Table.Cell colspan={5}><Skeleton class="h-8 w-full" /></Table.Cell></Table.Row>
            {/each}
          {:else if documents.length === 0}
            <Table.Row><Table.Cell colspan={5} class="text-center py-8 text-slate-400">Sin documentos</Table.Cell></Table.Row>
          {:else}
            {#each documents as doc}
              <Table.Row class="hover:bg-slate-50">
                <Table.Cell><p class="font-medium text-sm truncate max-w-[300px]">{doc.title}</p></Table.Cell>
                <Table.Cell class="text-center"><span class="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-600">{doc.chunksCount}</span></Table.Cell>
                <Table.Cell class="text-center">
                  <span class="px-2 py-1 rounded-full text-xs {doc.status === 'INDEXED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">{doc.status}</span>
                </Table.Cell>
                <Table.Cell class="text-sm text-slate-500">{fmtDate(doc.createdAt)}</Table.Cell>
                <Table.Cell class="text-right">
                  <button onclick={() => deleteDocument(doc.id)} class="p-2 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={16} /></button>
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
      <div class="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">{documents.length} documentos</div>
    </div>
  {/if}
</div>

<!-- Modal: Ingestar -->
{#if showIngestModal}
  <div class="fixed inset-0 bg-black/20 z-40" onclick={() => showIngestModal = false}></div>
  <div class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 pointer-events-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-slate-800">Ingestar Documento</h3>
        <button onclick={() => showIngestModal = false} class="p-2 hover:bg-slate-100 rounded-full"><X size={18} /></button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-light text-slate-600 mb-1">Fuente</label>
          <select bind:value={ingestForm.sourceId} class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-sm">
            <option value="">Seleccionar...</option>
            {#each sources as s}<option value={s.id}>{s.name}</option>{/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-light text-slate-600 mb-1">Título</label>
          <input type="text" bind:value={ingestForm.title} placeholder="Ej: Requisitos Visa B1/B2" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-sm" />
        </div>
        <div>
          <label class="block text-sm font-light text-slate-600 mb-1">Contenido (Markdown)</label>
          <textarea bind:value={ingestForm.content} rows="6" placeholder="# Título..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-sm resize-none"></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button onclick={() => showIngestModal = false} class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full text-sm">Cancelar</button>
        <button onclick={handleIngest} disabled={ingesting || !ingestForm.sourceId || !ingestForm.title || !ingestForm.content} class="px-5 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-full text-sm disabled:opacity-50 flex items-center gap-2">
          {#if ingesting}<RefreshCw size={14} class="animate-spin" />{/if}Ingestar
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal: Búsqueda -->
{#if showSearchModal}
  <div class="fixed inset-0 bg-black/20 z-40" onclick={() => { showSearchModal = false; searchQuery = ''; searchResults = []; }}></div>
  <div class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 pointer-events-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-800">Búsqueda Semántica</h3>
        <button onclick={() => { showSearchModal = false; searchQuery = ''; searchResults = []; }} class="p-2 hover:bg-slate-100 rounded-full"><X size={18} /></button>
      </div>
      <div class="flex gap-2 mb-4">
        <input type="text" bind:value={searchQuery} placeholder="Ej: ¿Cuáles son los requisitos para la visa B1/B2?" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none text-sm" onkeydown={(e) => e.key === 'Enter' && handleSearch()} />
        <button onclick={handleSearch} disabled={searching || !searchQuery.trim()} class="px-5 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-full text-sm disabled:opacity-50 flex items-center gap-2">
          {#if searching}<RefreshCw size={14} class="animate-spin" />{:else}<Search size={14} />{/if}Buscar
        </button>
      </div>
      {#if searchResults.length > 0}
        <div class="space-y-2 max-h-72 overflow-y-auto">
          {#each searchResults as r}
            <div class="p-3 rounded-xl bg-slate-50">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{r.source}</span>
                <span class="text-xs text-slate-400">{(r.score * 100).toFixed(0)}%</span>
              </div>
              <p class="text-sm text-slate-600 font-light line-clamp-2">{r.content}</p>
            </div>
          {/each}
        </div>
      {:else if searchQuery && !searching}
        <div class="text-center text-slate-400 py-8"><Search size={28} strokeWidth={1} class="mx-auto mb-2 opacity-50" /><p class="font-light text-sm">Sin resultados</p></div>
      {/if}
    </div>
  </div>
{/if}
