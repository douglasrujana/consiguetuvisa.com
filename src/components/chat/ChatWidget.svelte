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
    style="position: fixed; bottom: 80px; right: 24px; z-index: 9999; display: flex; height: 56px; width: 56px; align-items: center; justify-content: center; border-radius: 50%; background: #7c3aed; color: white; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
    aria-label="Abrir chat"
  >
    <MessageCircle style="width: 24px; height: 24px;" />
  </button>
{/if}

<!-- Ventana de chat -->
{#if isOpen}
  <div
    style="position: fixed; bottom: 80px; right: 24px; z-index: 9999; display: flex; height: 500px; width: 380px; flex-direction: column; overflow: hidden; border-radius: 16px; border: 1px solid #e5e7eb; background: white; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);"
  >
    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.2); background: #7c3aed; padding: 12px 16px; color: white;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <Bot style="width: 20px; height: 20px;" />
        <span style="font-weight: 500;">{title}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 4px;">
        <button
          onclick={() => (isOpen = false)}
          style="border-radius: 50%; padding: 4px; background: transparent; border: none; color: white; cursor: pointer;"
          aria-label="Cerrar"
        >
          <X style="width: 20px; height: 20px;" />
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div
      bind:this={messagesContainer}
      style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px;"
    >
      {#each messages as message (message.id)}
        <div style="display: flex; gap: 12px; {message.role === 'user' ? 'flex-direction: row-reverse;' : ''}">
          <!-- Avatar -->
          <div style="display: flex; height: 32px; width: 32px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 50%; {message.role === 'user' ? 'background: #7c3aed; color: white;' : 'background: #f3f4f6;'}">
            {#if message.role === 'user'}
              <User style="width: 16px; height: 16px;" />
            {:else}
              <Bot style="width: 16px; height: 16px;" />
            {/if}
          </div>

          <!-- Bubble -->
          <div style="max-width: 80%; border-radius: 16px; padding: 8px 16px; {message.role === 'user' ? 'background: #7c3aed; color: white;' : 'background: #f3f4f6; color: #1f2937;'}">
            <p style="font-size: 14px; white-space: pre-wrap; margin: 0;">{message.content}</p>

            <!-- Sources -->
            {#if message.sources && message.sources.length > 0}
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.1);">
                <p style="font-size: 11px; opacity: 0.7; margin: 0 0 4px 0;">Fuentes:</p>
                {#each message.sources.slice(0, 2) as source}
                  <p style="font-size: 11px; opacity: 0.6; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">• {source.source}</p>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}

      <!-- Loading indicator (non-streaming) -->
      {#if isLoading}
        <div style="display: flex; gap: 12px;">
          <div style="display: flex; height: 32px; width: 32px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 50%; background: #f3f4f6;">
            <Bot style="width: 16px; height: 16px;" />
          </div>
          <div style="display: flex; align-items: center; gap: 8px; border-radius: 16px; background: #f3f4f6; padding: 8px 16px;">
            <Loader style="width: 16px; height: 16px; animation: spin 1s linear infinite;" />
            <span style="font-size: 14px;">Pensando...</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input -->
    <div style="border-top: 1px solid #e5e7eb; padding: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <input
          type="text"
          bind:value={inputValue}
          onkeydown={handleKeydown}
          {placeholder}
          disabled={isLoading || isStreaming}
          style="flex: 1; border-radius: 24px; border: 1px solid #e5e7eb; background: #f9fafb; padding: 8px 16px; font-size: 14px; outline: none;"
        />
        {#if isStreaming}
          <!-- Cancel button during streaming -->
          <button
            onclick={cancelStreaming}
            style="display: flex; height: 40px; width: 40px; align-items: center; justify-content: center; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer;"
            aria-label="Cancelar"
          >
            <X style="width: 16px; height: 16px;" />
          </button>
        {:else}
          <!-- Send button -->
          <button
            onclick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            style="display: flex; height: 40px; width: 40px; align-items: center; justify-content: center; border-radius: 50%; background: #7c3aed; color: white; border: none; cursor: pointer; opacity: {!inputValue.trim() || isLoading ? '0.5' : '1'};"
            aria-label="Enviar"
          >
            <Send style="width: 16px; height: 16px;" />
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
