<script lang="ts">
  /**
   * CardSelector.svelte - Selector de Tarjetas de Crédito
   * El usuario selecciona los logos de las TDC que tiene
   */
  import { urlFor } from '@adapters/cms/sanity.client';

  interface CardBrand {
    id: string;
    name: string;
    slug: string;
    logo: any;
    spinsPerCard: number;
  }

  interface Props {
    cards: CardBrand[];
    selectedCards?: string[];
    maxSelections?: number;
    disabled?: boolean;
    onSelectionChange?: (selected: string[]) => void;
  }

  let { 
    cards, 
    selectedCards = [],
    maxSelections = 10,
    disabled = false,
    onSelectionChange 
  }: Props = $props();

  let selected = $state<string[]>(selectedCards);

  function toggleCard(slug: string) {
    if (disabled) return;

    if (selected.includes(slug)) {
      selected = selected.filter(s => s !== slug);
    } else if (selected.length < maxSelections) {
      selected = [...selected, slug];
    }
    
    onSelectionChange?.(selected);
  }

  function isSelected(slug: string): boolean {
    return selected.includes(slug);
  }

  // Calcular total de giros
  const totalSpins = $derived(
    selected.reduce((sum, slug) => {
      const card = cards.find(c => c.slug === slug);
      return sum + (card?.spinsPerCard ?? 1);
    }, 0)
  );

  function getImageUrl(logo: any): string {
    if (!logo?.asset) return '/placeholder-card.png';
    return urlFor(logo).width(120).height(80).url();
  }
</script>

<div class="card-selector">
  <div class="selector-header">
    <h3>¿Qué tarjetas de crédito tienes?</h3>
    <p class="hint">Selecciona los logos de tus tarjetas. Más tarjetas = más giros</p>
  </div>

  <div class="cards-grid">
    {#each cards as card}
      <button
        type="button"
        class="card-item"
        class:selected={isSelected(card.slug)}
        class:disabled={disabled}
        onclick={() => toggleCard(card.slug)}
        aria-pressed={isSelected(card.slug)}
        aria-label={`${card.name} - ${card.spinsPerCard} giro(s)`}
      >
        <div class="card-logo">
          <img 
            src={getImageUrl(card.logo)} 
            alt={card.name}
            loading="lazy"
          />
        </div>
        <span class="card-name">{card.name}</span>
        <span class="card-spins">+{card.spinsPerCard} giro{card.spinsPerCard > 1 ? 's' : ''}</span>
        
        {#if isSelected(card.slug)}
          <div class="check-badge">✓</div>
        {/if}
      </button>
    {/each}
  </div>

  {#if selected.length > 0}
    <div class="selection-summary">
      <div class="summary-item">
        <span class="label">Tarjetas seleccionadas:</span>
        <span class="value">{selected.length}</span>
      </div>
      <div class="summary-item highlight">
        <span class="label">Total de giros:</span>
        <span class="value">{totalSpins} 🎰</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .card-selector {
    width: 100%;
  }

  .selector-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .selector-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-brand-primary, #1e3a5f);
    margin: 0 0 0.5rem;
  }

  .hint {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #64748b);
    margin: 0;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .card-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .card-item:hover:not(.disabled) {
    border-color: var(--color-brand-secondary, #2d5be3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-item.selected {
    border-color: var(--color-brand-secondary, #2d5be3);
    background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
  }

  .card-item.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .card-logo {
    width: 80px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .card-logo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .card-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #1e293b);
    text-align: center;
  }

  .card-spins {
    font-size: 0.75rem;
    color: var(--color-brand-secondary, #2d5be3);
    font-weight: 600;
    margin-top: 0.25rem;
  }

  .check-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    background: var(--color-brand-secondary, #2d5be3);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .selection-summary {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 1rem;
    background: var(--color-surface-muted, #f1f5f9);
    border-radius: 8px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .summary-item .label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #64748b);
  }

  .summary-item .value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary, #1e293b);
  }

  .summary-item.highlight .value {
    color: var(--color-brand-secondary, #2d5be3);
  }
</style>
