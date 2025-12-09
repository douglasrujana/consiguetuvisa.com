<script lang="ts">
  /**
   * ParticipationForm.svelte - Formulario de participación
   */

  interface Props {
    campaignId: string;
    selectedCards: string[];
    totalSpins: number;
    disabled?: boolean;
    onSubmit?: (data: FormData) => void;
  }

  interface FormData {
    name: string;
    email: string;
    phone: string;
    acceptTerms: boolean;
  }

  let { 
    campaignId,
    selectedCards,
    totalSpins,
    disabled = false,
    onSubmit 
  }: Props = $props();

  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let acceptTerms = $state(false);
  let errors = $state<Record<string, string>>({});
  let isSubmitting = $state(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.length < 2) {
      newErrors.name = 'Ingresa tu nombre completo';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!phone.trim() || phone.length < 8) {
      newErrors.phone = 'Ingresa tu número de WhatsApp';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
    }

    if (selectedCards.length === 0) {
      newErrors.cards = 'Selecciona al menos una tarjeta';
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!validate() || isSubmitting || disabled) return;

    isSubmitting = true;

    try {
      onSubmit?.({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        acceptTerms
      });
    } finally {
      isSubmitting = false;
    }
  }

  // Formatear teléfono mientras escribe
  function formatPhone(value: string): string {
    // Remover todo excepto números y +
    return value.replace(/[^\d+]/g, '');
  }
</script>

<form class="participation-form" onsubmit={handleSubmit}>
  <div class="form-header">
    <h3>Completa tus datos para participar</h3>
    <p class="spins-badge">🎰 {totalSpins} giro{totalSpins > 1 ? 's' : ''} disponible{totalSpins > 1 ? 's' : ''}</p>
  </div>

  <div class="form-fields">
    <div class="field">
      <label for="name">Nombre completo</label>
      <input
        type="text"
        id="name"
        bind:value={name}
        placeholder="Ej: María García"
        class:error={errors.name}
        disabled={disabled || isSubmitting}
      />
      {#if errors.name}
        <span class="error-message">{errors.name}</span>
      {/if}
    </div>

    <div class="field">
      <label for="email">Correo electrónico</label>
      <input
        type="email"
        id="email"
        bind:value={email}
        placeholder="tu@email.com"
        class:error={errors.email}
        disabled={disabled || isSubmitting}
      />
      {#if errors.email}
        <span class="error-message">{errors.email}</span>
      {/if}
    </div>

    <div class="field">
      <label for="phone">WhatsApp</label>
      <input
        type="tel"
        id="phone"
        value={phone}
        oninput={(e) => phone = formatPhone((e.target as HTMLInputElement).value)}
        placeholder="+593 99 123 4567"
        class:error={errors.phone}
        disabled={disabled || isSubmitting}
      />
      {#if errors.phone}
        <span class="error-message">{errors.phone}</span>
      {/if}
    </div>

    <div class="field checkbox">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={acceptTerms}
          disabled={disabled || isSubmitting}
        />
        <span class="checkmark"></span>
        <span class="checkbox-text">
          Acepto los <a href="#terminos" target="_blank">términos y condiciones</a> 
          y la <a href="#privacidad" target="_blank">política de privacidad</a>
        </span>
      </label>
      {#if errors.terms}
        <span class="error-message">{errors.terms}</span>
      {/if}
    </div>

    {#if errors.cards}
      <div class="alert-error">
        ⚠️ {errors.cards}
      </div>
    {/if}
  </div>

  <button
    type="submit"
    class="submit-btn"
    disabled={disabled || isSubmitting || selectedCards.length === 0}
  >
    {#if isSubmitting}
      <span class="spinner"></span>
      Registrando...
    {:else}
      🎰 ¡Participar y Girar!
    {/if}
  </button>

  <p class="disclaimer">
    Al participar, autorizas que te contactemos para entregarte tu premio.
  </p>
</form>

<style>
  .participation-form {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .form-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .form-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-brand-primary, #1e3a5f);
    margin: 0 0 0.5rem;
  }

  .spins-badge {
    display: inline-block;
    background: linear-gradient(135deg, #2d5be3 0%, #1e3a5f 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #1e293b);
  }

  .field input[type="text"],
  .field input[type="email"],
  .field input[type="tel"] {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;
    background: white;
  }

  .field input:focus {
    outline: none;
    border-color: var(--color-brand-secondary, #2d5be3);
    box-shadow: 0 0 0 3px rgba(45, 91, 227, 0.1);
  }

  .field input.error {
    border-color: #ef4444;
  }

  .error-message {
    font-size: 0.75rem;
    color: #ef4444;
  }

  .checkbox {
    margin-top: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: var(--color-brand-secondary, #2d5be3);
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .checkbox-text {
    color: var(--color-text-secondary, #64748b);
    line-height: 1.4;
  }

  .checkbox-text a {
    color: var(--color-brand-secondary, #2d5be3);
    text-decoration: underline;
  }

  .alert-error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    text-align: center;
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    margin-top: 1.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .disclaimer {
    text-align: center;
    font-size: 0.75rem;
    color: var(--color-text-muted, #94a3b8);
    margin-top: 1rem;
  }
</style>
