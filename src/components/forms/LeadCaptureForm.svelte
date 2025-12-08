<script lang="ts">
  // LeadCaptureForm.svelte
  // Formulario reutilizable para captura de leads
  // Svelte 5 con runas
  
  interface Props {
    formId?: string;
    campaign?: string;
    source?: string;
    showVisaType?: boolean;
    showCity?: boolean;
    showMessage?: boolean;
    submitText?: string;
    successMessage?: string;
    redirectUrl?: string;
    class?: string;
  }
  
  let {
    formId = 'contact-main',
    campaign,
    source,
    showVisaType = true,
    showCity = true,
    showMessage = true,
    submitText = 'Enviar Solicitud',
    successMessage = '¡Gracias! Te contactaremos pronto.',
    redirectUrl,
    class: className = '',
  }: Props = $props();
  
  // Estado del formulario
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let city = $state('');
  let visaType = $state('');
  let message = $state('');
  
  let loading = $state(false);
  let success = $state(false);
  let error = $state<string | null>(null);
  let fieldErrors = $state<Record<string, string>>({});
  
  // Opciones de visa
  const visaOptions = [
    { value: '', label: 'Selecciona tipo de visa' },
    { value: 'USA_TURISMO', label: 'Visa Estados Unidos' },
    { value: 'CANADA_VISITANTE', label: 'Visa Canadá' },
    { value: 'SCHENGEN', label: 'Visa Schengen (Europa)' },
    { value: 'UK', label: 'Visa Reino Unido' },
    { value: 'MEXICO', label: 'Visa México' },
    { value: 'OTRO', label: 'Otro destino' },
  ];
  
  // Obtener UTM params de la URL
  function getUTMParams() {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    };
  }
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    loading = true;
    error = null;
    fieldErrors = {};
    
    try {
      const utmParams = getUTMParams();
      
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          campaign,
          source,
          name,
          email,
          phone,
          city: showCity ? city : undefined,
          visaType: showVisaType ? visaType : undefined,
          message: showMessage ? message : undefined,
          landingPage: window.location.href,
          ...utmParams,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        success = true;
        
        // Redirect si está configurado
        if (redirectUrl || data.redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl || data.redirectUrl;
          }, 2000);
        }
      } else {
        if (data.details) {
          // Errores de validación por campo
          data.details.forEach((d: { field: string; message: string }) => {
            fieldErrors[d.field] = d.message;
          });
        }
        error = data.error || 'Error al enviar el formulario';
      }
    } catch (e) {
      error = 'Error de conexión. Intenta de nuevo.';
    } finally {
      loading = false;
    }
  }
  
  function resetForm() {
    name = '';
    email = '';
    phone = '';
    city = '';
    visaType = '';
    message = '';
    success = false;
    error = null;
    fieldErrors = {};
  }
</script>

{#if success}
  <div class="bg-green-50 border border-green-200 rounded-xl p-8 text-center {className}">
    <div class="text-5xl mb-4">✅</div>
    <h3 class="text-xl font-bold text-green-800 mb-2">{successMessage}</h3>
    <p class="text-green-600 mb-4">Revisa tu email para más información.</p>
    <button 
      onclick={resetForm}
      class="text-green-700 underline hover:no-underline"
    >
      Enviar otra solicitud
    </button>
  </div>
{:else}
  <form onsubmit={handleSubmit} class="space-y-4 {className}">
    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    {/if}
    
    <!-- Nombre -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
        Nombre completo *
      </label>
      <input
        type="text"
        id="name"
        bind:value={name}
        required
        disabled={loading}
        class="w-full px-4 py-3 rounded-lg border {fieldErrors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        placeholder="Tu nombre"
      />
      {#if fieldErrors.name}
        <p class="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
      {/if}
    </div>
    
    <!-- Email -->
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
        Email *
      </label>
      <input
        type="email"
        id="email"
        bind:value={email}
        required
        disabled={loading}
        class="w-full px-4 py-3 rounded-lg border {fieldErrors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        placeholder="tu@email.com"
      />
      {#if fieldErrors.email}
        <p class="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
      {/if}
    </div>
    
    <!-- Teléfono -->
    <div>
      <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
        WhatsApp / Teléfono
      </label>
      <input
        type="tel"
        id="phone"
        bind:value={phone}
        disabled={loading}
        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        placeholder="+593 99 999 9999"
      />
    </div>
    
    <!-- Ciudad -->
    {#if showCity}
      <div>
        <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
          Ciudad
        </label>
        <input
          type="text"
          id="city"
          bind:value={city}
          disabled={loading}
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="Tu ciudad"
        />
      </div>
    {/if}
    
    <!-- Tipo de Visa -->
    {#if showVisaType}
      <div>
        <label for="visaType" class="block text-sm font-medium text-gray-700 mb-1">
          Tipo de visa de interés
        </label>
        <select
          id="visaType"
          bind:value={visaType}
          disabled={loading}
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {#each visaOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
    {/if}
    
    <!-- Mensaje -->
    {#if showMessage}
      <div>
        <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
          Mensaje (opcional)
        </label>
        <textarea
          id="message"
          bind:value={message}
          disabled={loading}
          rows="3"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none"
          placeholder="¿Tienes alguna pregunta?"
        ></textarea>
      </div>
    {/if}
    
    <!-- Submit -->
    <button
      type="submit"
      disabled={loading}
      class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      {#if loading}
        <span class="animate-spin">⏳</span>
        Enviando...
      {:else}
        {submitText}
      {/if}
    </button>
    
    <p class="text-xs text-gray-500 text-center">
      Al enviar aceptas nuestra política de privacidad.
    </p>
  </form>
{/if}
