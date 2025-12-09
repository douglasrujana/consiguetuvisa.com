<script lang="ts">
  /**
   * SpinWheel.svelte - Componente Core de la Ruleta
   * Reutilizable en Landing y Kiosko
   */
  
  interface Prize {
    id: string;
    name: string;
    color?: string;
    type: string;
  }

  interface Props {
    prizes: Prize[];
    disabled?: boolean;
    size?: number;
    onSpinStart?: () => void;
    onSpinEnd?: (prizeIndex: number) => void;
  }

  let { 
    prizes, 
    disabled = false, 
    size = 400,
    onSpinStart,
    onSpinEnd 
  }: Props = $props();

  let rotation = $state(0);
  let isSpinning = $state(false);
  let selectedPrizeIndex = $state<number | null>(null);

  // Colores por defecto para los segmentos
  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ];

  function getSegmentColor(index: number, prize: Prize): string {
    if (prize.color) return prize.color;
    return defaultColors[index % defaultColors.length];
  }

  // Calcular ángulo por segmento
  const segmentAngle = $derived(360 / prizes.length);

  // Generar path SVG para cada segmento
  function getSegmentPath(index: number, total: number, radius: number): string {
    const angle = 360 / total;
    const startAngle = index * angle - 90;
    const endAngle = startAngle + angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = radius + radius * Math.cos(startRad);
    const y1 = radius + radius * Math.sin(startRad);
    const x2 = radius + radius * Math.cos(endRad);
    const y2 = radius + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  // Calcular posición del texto
  function getTextPosition(index: number, total: number, radius: number) {
    const angle = 360 / total;
    const midAngle = index * angle + angle / 2 - 90;
    const rad = (midAngle * Math.PI) / 180;
    const textRadius = radius * 0.65;
    
    return {
      x: radius + textRadius * Math.cos(rad),
      y: radius + textRadius * Math.sin(rad),
      rotation: midAngle + 90
    };
  }

  export function spin(targetPrizeIndex?: number) {
    if (isSpinning || disabled) return;
    
    isSpinning = true;
    onSpinStart?.();

    // Si no se especifica, elegir aleatorio
    const prizeIndex = targetPrizeIndex ?? Math.floor(Math.random() * prizes.length);
    selectedPrizeIndex = prizeIndex;

    // Calcular rotación final
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 vueltas
    const prizeAngle = prizeIndex * segmentAngle;
    const finalRotation = rotation + (extraSpins * 360) + (360 - prizeAngle) - (segmentAngle / 2);
    
    rotation = finalRotation;

    // Esperar a que termine la animación
    setTimeout(() => {
      isSpinning = false;
      onSpinEnd?.(prizeIndex);
    }, 5000);
  }

  // Exponer método para control externo
  export function reset() {
    rotation = 0;
    selectedPrizeIndex = null;
    isSpinning = false;
  }
</script>

<div class="spin-wheel-container" style="--size: {size}px;">
  <!-- Indicador/Flecha -->
  <div class="wheel-pointer">
    <svg viewBox="0 0 40 50" class="pointer-svg">
      <polygon points="20,50 0,0 40,0" fill="#1e3a5f" />
      <polygon points="20,45 5,5 35,5" fill="#2d5be3" />
    </svg>
  </div>

  <!-- Ruleta -->
  <div 
    class="wheel"
    class:spinning={isSpinning}
    style="transform: rotate({rotation}deg);"
  >
    <svg viewBox="0 0 {size} {size}" class="wheel-svg">
      <!-- Segmentos -->
      {#each prizes as prize, i}
        <path
          d={getSegmentPath(i, prizes.length, size / 2)}
          fill={getSegmentColor(i, prize)}
          stroke="#fff"
          stroke-width="2"
        />
      {/each}
      
      <!-- Textos -->
      {#each prizes as prize, i}
        {@const pos = getTextPosition(i, prizes.length, size / 2)}
        <text
          x={pos.x}
          y={pos.y}
          transform="rotate({pos.rotation}, {pos.x}, {pos.y})"
          text-anchor="middle"
          dominant-baseline="middle"
          class="prize-text"
          fill="#fff"
          font-size="{Math.max(10, 14 - prizes.length)}px"
          font-weight="bold"
        >
          {prize.name.length > 12 ? prize.name.slice(0, 12) + '...' : prize.name}
        </text>
      {/each}

      <!-- Centro -->
      <circle cx={size / 2} cy={size / 2} r={size * 0.08} fill="#1e3a5f" />
      <circle cx={size / 2} cy={size / 2} r={size * 0.06} fill="#2d5be3" />
    </svg>
  </div>

  <!-- Botón de girar (opcional, puede controlarse externamente) -->
  <button
    class="spin-button"
    onclick={() => spin()}
    disabled={isSpinning || disabled}
  >
    {isSpinning ? '🎰' : '¡GIRAR!'}
  </button>
</div>

<style>
  .spin-wheel-container {
    position: relative;
    width: var(--size);
    height: var(--size);
    margin: 0 auto;
  }

  .wheel-pointer {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
  }

  .pointer-svg {
    width: 40px;
    height: 50px;
  }

  .wheel {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-shadow: 
      0 0 0 8px #1e3a5f,
      0 0 0 12px #2d5be3,
      0 0 30px rgba(0, 0, 0, 0.3);
    transition: transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  }

  .wheel.spinning {
    /* La animación se maneja con transform inline */
  }

  .wheel-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .prize-text {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    user-select: none;
  }

  .spin-button {
    position: absolute;
    bottom: -60px;
    left: 50%;
    transform: translateX(-50%);
    padding: 16px 48px;
    font-size: 1.25rem;
    font-weight: bold;
    color: white;
    background: linear-gradient(135deg, #2d5be3 0%, #1e3a5f 100%);
    border: none;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(45, 91, 227, 0.4);
    transition: all 0.3s ease;
  }

  .spin-button:hover:not(:disabled) {
    transform: translateX(-50%) scale(1.05);
    box-shadow: 0 6px 20px rgba(45, 91, 227, 0.5);
  }

  .spin-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spin-button:active:not(:disabled) {
    transform: translateX(-50%) scale(0.98);
  }
</style>
