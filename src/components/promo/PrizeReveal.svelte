<script lang="ts">
  /**
   * PrizeReveal.svelte - Modal de revelación de premio
   */
  import { fade, scale } from 'svelte/transition';

  interface Prize {
    id: string;
    name: string;
    description?: string;
    type: string;
    value?: number;
  }

  interface Props {
    show: boolean;
    prize: Prize | null;
    prizeCode?: string;
    spinsRemaining?: number;
    onClose?: () => void;
    onPlayAgain?: () => void;
  }

  let { 
    show, 
    prize, 
    prizeCode,
    spinsRemaining = 0,
    onClose,
    onPlayAgain 
  }: Props = $props();

  const prizeEmojis: Record<string, string> = {
    travel: '✈️',
    giftcard: '🎁',
    service: '📋',
    discount: '💰',
    dinner: '🍽️',
    flight: '🎫',
    retry: '🔄',
  };

  function getEmoji(type: string): string {
    return prizeEmojis[type] || '🎉';
  }

  function isWinner(): boolean {
    return !!prize && prize.type !== 'retry';
  }
</script>

{#if show}
  <div class="overlay" transition:fade={{ duration: 200 }}>
    <div class="modal" transition:scale={{ duration: 300, start: 0.8 }}>
      {#if isWinner()}
        <!-- Ganador -->
        <div class="confetti">🎊</div>
        <div class="prize-emoji">{getEmoji(prize?.type || '')}</div>
        <h2 class="title winner">¡FELICIDADES!</h2>
        <p class="subtitle">Has ganado:</p>
        <div class="prize-name">{prize?.name}</div>
        
        {#if prize?.description}
          <p class="prize-description">{prize.description}</p>
        {/if}

        {#if prize?.value && prize.value > 0}
          <div class="prize-value">Valor: ${prize.value}</div>
        {/if}

        {#if prizeCode}
          <div class="prize-code-container">
            <span class="code-label">Tu código de premio:</span>
            <div class="prize-code">{prizeCode}</div>
            <p class="code-hint">Guarda este código. Te contactaremos para entregarte tu premio.</p>
          </div>
        {/if}
      {:else}
        <!-- No ganó o sigue participando -->
        <div class="prize-emoji">{getEmoji(prize?.type || 'retry')}</div>
        <h2 class="title retry">¡Sigue participando!</h2>
        <p class="subtitle">Esta vez no fue tu turno</p>
        
        {#if spinsRemaining > 0}
          <p class="spins-remaining">
            Tienes <strong>{spinsRemaining}</strong> giro{spinsRemaining > 1 ? 's' : ''} más
          </p>
        {/if}
      {/if}

      <div class="actions">
        {#if spinsRemaining > 0 && onPlayAgain}
          <button class="btn-primary" onclick={onPlayAgain}>
            🎰 Girar de nuevo ({spinsRemaining})
          </button>
        {/if}
        <button class="btn-secondary" onclick={onClose}>
          {isWinner() ? 'Cerrar' : 'Entendido'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .modal {
    background: white;
    border-radius: 24px;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .confetti {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 2rem;
    animation: bounce 0.5s ease infinite alternate;
  }

  @keyframes bounce {
    from { transform: translateY(0) rotate(-10deg); }
    to { transform: translateY(-10px) rotate(10deg); }
  }

  .prize-emoji {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: pop 0.5s ease;
  }

  @keyframes pop {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  .title {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 0.5rem;
  }

  .title.winner {
    color: #10b981;
    background: linear-gradient(135deg, #10b981, #059669);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .title.retry {
    color: var(--color-brand-secondary, #2d5be3);
  }

  .subtitle {
    color: var(--color-text-secondary, #64748b);
    margin: 0 0 1rem;
  }

  .prize-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-brand-primary, #1e3a5f);
    margin-bottom: 0.5rem;
  }

  .prize-description {
    color: var(--color-text-secondary, #64748b);
    font-size: 0.875rem;
    margin: 0 0 0.5rem;
  }

  .prize-value {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: white;
    padding: 0.25rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .prize-code-container {
    background: var(--color-surface-muted, #f1f5f9);
    padding: 1rem;
    border-radius: 12px;
    margin: 1rem 0;
  }

  .code-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .prize-code {
    font-size: 1.25rem;
    font-weight: 700;
    font-family: monospace;
    color: var(--color-brand-secondary, #2d5be3);
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    margin: 0.5rem 0;
    border: 2px dashed var(--color-brand-secondary, #2d5be3);
  }

  .code-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted, #94a3b8);
    margin: 0;
  }

  .spins-remaining {
    color: var(--color-text-secondary, #64748b);
    margin: 1rem 0;
  }

  .spins-remaining strong {
    color: var(--color-brand-secondary, #2d5be3);
    font-size: 1.25rem;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .btn-primary {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #2d5be3 0%, #1e3a5f 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(45, 91, 227, 0.4);
  }

  .btn-secondary {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #64748b);
    background: transparent;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: var(--color-surface-muted, #f1f5f9);
  }
</style>
