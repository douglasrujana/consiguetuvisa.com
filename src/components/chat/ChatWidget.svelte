<script lang="ts">
  /**
   * CHAT WIDGET - Componente de chat con RAG y Streaming
   * UI minimalista y funcional para el chatbot.
   * Requirements: 9.2 - Streaming de respuestas con tokens incrementales
   */

  import { onMount } from 'svelte';
  import Send from 'lucide-svelte/icons/send';
  import Bot from 'lucide-svelte/icons/bot';
  import User from 'lucide-svelte/icons/user';
  import Loader from 'lucide-svelte/icons/loader-2';
  import MessageCircle from 'lucide-svelte/icons/message-circle';
  import X from 'lucide-svelte/icons/x';

  interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{ content: string; source: string; score: number }>;
  }

  interface ChatStreamChunk {
    type: 'content' | 'sources' | 'done' | 'error';
    content?: string;
    sources?: Array<{ content: string; source: string; score: number }>;
    error?: string;
  }

  // Props
  let { 
    title = 'Asistente Virtual',
    placeholder = '¿En qué puedo ayudarte?',
    welcomeMessage = '¡Hola! Soy el asistente virtual de ConsigueTuVisa. ¿Tienes preguntas sobre trámites de visa?',
    enableStreaming = true
  } = $props<{
    title?: string;
    placeholder?: string;
    welcomeMessage?: string;
    enableStreaming?: boolean;
  }>();

  // State
  let isOpen = $state(false);
  let messages = $state<Message[]>([]);
  let inputValue = $state('');
  let isLoading = $state(false);
  let isStreaming = $state(false);
  let conversationId = $state<string | null>(null);
  let messagesContainer = $state<HTMLDivElement | null>(null);
  let abortController = $state<AbortController | null>(null);
  let isWarmedUp = $state(false);

  // Inicializar con mensaje de bienvenida y pre-calentar el chatbot
  onMount(() => {
    messages = [
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
      },
    ];
    
    // Pre-calentar el chatbot en background (no bloquea UI)
    warmupChatbot();
  });

  /**
   * Pre-calienta el chatbot llamando al endpoint GET
   * Esto indexa los documentos antes de que el usuario envíe un mensaje
   */
  async function warmupChatbot() {
    try {
      const response = await fetch('/api/chat', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        isWarmedUp = data.status === 'ready';
        console.log(`[ChatWidget] Chatbot warmed up in ${data.warmupTime}ms`);
      }
    } catch (error) {
      console.warn('[ChatWidget] Warmup failed, will initialize on first message');
    }
  }

  // Scroll al último mensaje
  function scrollToBottom() {
    const container = messagesContainer;
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  /**
   * Parse SSE data from a line
   * Requirements: 9.2
   */
  function parseSSELine(line: string): { event?: string; data?: string } {
    if (line.startsWith('event:')) {
      return { event: line.slice(6).trim() };
    }
    if (line.startsWith('data:')) {
      return { data: line.slice(5).trim() };
    }
    return {};
  }

  /**
   * Send message with streaming support
   * Requirements: 9.2 - Display tokens incrementally
   */
  async function sendMessageStreaming() {
    if (!inputValue.trim() || isLoading || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
    };

    messages = [...messages, userMessage];
    const messageText = inputValue;
    inputValue = '';
    isStreaming = true;
    scrollToBottom();

    // Create placeholder for assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      sources: [],
    };
    messages = [...messages, assistantMessage];

    // Create abort controller for cancellation
    abortController = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message: messageText,
          conversationId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEvent = '';
        
        for (const line of lines) {
          if (!line.trim()) continue;

          const parsed = parseSSELine(line);
          
          if (parsed.event) {
            currentEvent = parsed.event;
            continue;
          }

          if (parsed.data) {
            // Handle conversationId event
            if (currentEvent === 'conversationId') {
              try {
                const eventData = JSON.parse(parsed.data);
                if (eventData.conversationId) {
                  conversationId = eventData.conversationId;
                }
              } catch {
                // Ignore parse errors for conversationId
              }
              currentEvent = '';
              continue;
            }

            // Parse chunk data
            try {
              const chunk: ChatStreamChunk = JSON.parse(parsed.data);
              
              // Update message based on chunk type
              if (chunk.type === 'content' && chunk.content) {
                // Append content incrementally
                messages = messages.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: m.content + chunk.content }
                    : m
                );
                scrollToBottom();
              } else if (chunk.type === 'sources' && chunk.sources) {
                // Add sources when received
                messages = messages.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, sources: chunk.sources }
                    : m
                );
              } else if (chunk.type === 'error' && chunk.error) {
                // Handle error
                messages = messages.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: `Error: ${chunk.error}` }
                    : m
                );
              }
              // 'done' type just signals completion, no action needed
            } catch {
              // Ignore parse errors for individual chunks
            }
          }
        }
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Streaming cancelled by user');
        return;
      }
      
      console.error('Streaming error:', error);
      messages = messages.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: 'Error de conexión. Verifica tu internet e intenta de nuevo.' }
          : m
      );
    } finally {
      isStreaming = false;
      abortController = null;
      scrollToBottom();
    }
  }

  /**
   * Send message without streaming (fallback)
   */
  async function sendMessageNonStreaming() {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
    };

    messages = [...messages, userMessage];
    const messageText = inputValue;
    inputValue = '';
    isLoading = true;
    scrollToBottom();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        conversationId = data.conversationId;

        const assistantMessage: Message = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          sources: data.sources,
        };

        messages = [...messages, assistantMessage];
      } else {
        messages = [
          ...messages,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
          },
        ];
      }
    } catch (error) {
      console.error('Chat error:', error);
      messages = [
        ...messages,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
        },
      ];
    } finally {
      isLoading = false;
      scrollToBottom();
    }
  }

  /**
   * Main send message function - uses streaming if enabled
   * Requirements: 9.2
   */
  async function sendMessage() {
    if (enableStreaming) {
      await sendMessageStreaming();
    } else {
      await sendMessageNonStreaming();
    }
  }

  /**
   * Cancel ongoing streaming request
   */
  function cancelStreaming() {
    if (abortController) {
      abortController.abort();
      isStreaming = false;
      abortController = null;
    }
  }

  // Manejar Enter
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

</script>

<!-- Botón flotante -->
{#if !isOpen}
  <button
    onclick={() => (isOpen = true)}
    class="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-secondary text-white shadow-xl hover:scale-105 hover:bg-brand-accent transition-all duration-300 border-none cursor-pointer"
    aria-label="Abrir chat"
  >
    <MessageCircle class="w-6 h-6" />
  </button>
{/if}

<!-- Ventana de chat -->
{#if isOpen}
  <div
    class="fixed bottom-20 right-6 z-50 flex h-[500px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/20 bg-brand-secondary px-4 py-3 text-white">
      <div class="flex items-center gap-2">
        <Bot class="w-5 h-5 text-white" />
        <span class="font-medium text-sm">{title}</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          onclick={() => (isOpen = false)}
          class="rounded-full p-1 text-white hover:bg-black/10 transition-colors border-none bg-transparent cursor-pointer"
          aria-label="Cerrar"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div
      bind:this={messagesContainer}
      class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50"
    >
      {#each messages as message (message.id)}
        <div class="flex gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
          <!-- Avatar -->
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {message.role === 'user' ? 'bg-brand-secondary text-white' : 'bg-slate-200 text-slate-700'}">
            {#if message.role === 'user'}
              <User class="w-4 h-4" />
            {:else}
              <Bot class="w-4 h-4" />
            {/if}
          </div>

          <!-- Bubble -->
          <div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm {message.role === 'user' ? 'bg-brand-secondary text-white' : 'bg-white text-slate-800 border border-slate-100 shadow-sm'}">
            <p class="whitespace-pre-wrap m-0 leading-relaxed">{message.content}</p>

            <!-- Sources -->
            {#if message.sources && message.sources.length > 0}
              <div class="mt-2 pt-2 border-t border-slate-100/30 text-xs">
                <p class="opacity-75 font-semibold m-0 mb-1">Fuentes:</p>
                {#each message.sources.slice(0, 2) as source}
                  <p class="opacity-60 m-0 truncate text-[11px]">• {source.source}</p>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}

      <!-- Loading indicator (non-streaming) -->
      {#if isLoading}
        <div class="flex gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
            <Bot class="w-4 h-4" />
          </div>
          <div class="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2.5 text-sm text-slate-600 shadow-sm">
            <Loader class="w-4 h-4 animate-spin text-brand-secondary" />
            <span>Pensando...</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input -->
    <div class="border-t border-slate-200 p-3 bg-white">
      <div class="flex items-center gap-2">
        <input
          type="text"
          bind:value={inputValue}
          onkeydown={handleKeydown}
          {placeholder}
          disabled={isLoading || isStreaming}
          class="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brand-secondary focus:bg-white transition-colors"
        />
        {#if isStreaming}
          <!-- Cancel button during streaming -->
          <button
            onclick={cancelStreaming}
            class="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors border-none cursor-pointer shrink-0"
            aria-label="Cancelar"
          >
            <X class="w-4 h-4" />
          </button>
        {:else}
          <!-- Send button -->
          <button
            onclick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-secondary text-white hover:bg-brand-accent disabled:opacity-40 transition-all border-none cursor-pointer shrink-0"
            aria-label="Enviar"
          >
            <Send class="w-4 h-4" />
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
