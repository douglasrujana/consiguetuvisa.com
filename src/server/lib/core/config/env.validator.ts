// src/server/lib/core/config/env.validator.ts

/**
 * SISTEMA DE VALIDACIÓN CENTRALIZADA DE VARIABLES DE ENTORNO
 * Valida la existencia, formato y autenticidad de las variables de entorno
 * al arrancar la aplicación o procesar solicitudes.
 */

export interface EnvErrorDetail {
  variable: string;
  issue: string;
  actionRequired: string;
  isCritical: boolean;
}

export interface EnvValidationResult {
  isValid: boolean;
  hasCriticalErrors: boolean;
  errors: EnvErrorDetail[];
  warnings: EnvErrorDetail[];
  values: Record<string, string>;
}

// Lista de valores de prueba/ejemplo que NO son válidos para producción ni desarrollo real
const DUMMY_PLACEHOLDERS = [
  'pk_test_xxx',
  'sk_test_xxx',
  'whsec_xxx',
  'tu-token',
  'tu-token-aqui',
  'your_api_key_here',
  'YOUR_CLERK_PUBLISHABLE_KEY',
  'YOUR_CLERK_SECRET_KEY',
  'pk_test_123456789',
  'sk_test_123456789',
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return DUMMY_PLACEHOLDERS.some((ph) => trimmed.toLowerCase().includes(ph.toLowerCase()));
}

function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  return undefined;
}

/**
 * Realiza el diagnóstico completo del archivo .env y variables del sistema.
 */
export function validateEnv(): EnvValidationResult {
  const errors: EnvErrorDetail[] = [];
  const warnings: EnvErrorDetail[] = [];
  const values: Record<string, string> = {};

  const nodeEnv = getEnvVar('NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  // ----------------------------------------------------
  // 1. AUTENTICACIÓN - CLERK (CRÍTICO)
  // ----------------------------------------------------
  const clerkPubKey = getEnvVar('PUBLIC_CLERK_PUBLISHABLE_KEY');
  const clerkSecretKey = getEnvVar('CLERK_SECRET_KEY');

  if (!clerkPubKey || clerkPubKey.trim() === '') {
    errors.push({
      variable: 'PUBLIC_CLERK_PUBLISHABLE_KEY',
      issue: 'Variable no encontrada en el archivo .env / .env.local',
      actionRequired:
        'Crea el archivo .env.local y agrega PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... desde https://dashboard.clerk.com',
      isCritical: true,
    });
  } else if (isPlaceholder(clerkPubKey)) {
    errors.push({
      variable: 'PUBLIC_CLERK_PUBLISHABLE_KEY',
      issue: `La llave provista ("${clerkPubKey}") es un valor de ejemplo no válido.`,
      actionRequired:
        'Reemplaza el valor de prueba por tu llave real obtenida de https://dashboard.clerk.com',
      isCritical: true,
    });
  } else if (!clerkPubKey.startsWith('pk_test_') && !clerkPubKey.startsWith('pk_live_')) {
    errors.push({
      variable: 'PUBLIC_CLERK_PUBLISHABLE_KEY',
      issue: `Formato de llave no válido. Debe comenzar con "pk_test_" o "pk_live_".`,
      actionRequired: 'Verifica la clave copiada desde Clerk Dashboard.',
      isCritical: true,
    });
  } else {
    values.PUBLIC_CLERK_PUBLISHABLE_KEY = clerkPubKey;
  }

  if (!clerkSecretKey || clerkSecretKey.trim() === '') {
    errors.push({
      variable: 'CLERK_SECRET_KEY',
      issue: 'Variable privada no encontrada en el archivo .env / .env.local',
      actionRequired:
        'Agrega CLERK_SECRET_KEY=sk_test_... desde https://dashboard.clerk.com a tu .env.local',
      isCritical: true,
    });
  } else if (isPlaceholder(clerkSecretKey)) {
    errors.push({
      variable: 'CLERK_SECRET_KEY',
      issue: `La llave secreta provista ("${clerkSecretKey}") es un valor de ejemplo no válido.`,
      actionRequired:
        'Reemplaza el valor genérico sk_test_xxx por tu Secret Key real de Clerk.',
      isCritical: true,
    });
  } else if (!clerkSecretKey.startsWith('sk_test_') && !clerkSecretKey.startsWith('sk_live_')) {
    errors.push({
      variable: 'CLERK_SECRET_KEY',
      issue: `Formato de Secret Key no válido. Debe comenzar con "sk_test_" o "sk_live_".`,
      actionRequired: 'Verifica tu Secret Key en el panel de Clerk.',
      isCritical: true,
    });
  } else {
    values.CLERK_SECRET_KEY = clerkSecretKey;
  }

  // ----------------------------------------------------
  // 2. BASE DE DATOS (CRÍTICO)
  // ----------------------------------------------------
  const dbUrl = getEnvVar('DATABASE_URL');
  if (!dbUrl || dbUrl.trim() === '') {
    errors.push({
      variable: 'DATABASE_URL',
      issue: 'La URL de conexión a la base de datos está vacía.',
      actionRequired:
        'En desarrollo local, usa DATABASE_URL="file:./dev.db". En producción usa la URL de Turso (libsql://...).',
      isCritical: true,
    });
  } else {
    values.DATABASE_URL = dbUrl;
    if (dbUrl.startsWith('libsql://')) {
      const tursoToken = getEnvVar('TURSO_AUTH_TOKEN');
      if (!tursoToken || isPlaceholder(tursoToken)) {
        errors.push({
          variable: 'TURSO_AUTH_TOKEN',
          issue: 'DATABASE_URL es de Turso (libsql://) pero no se proveyó el token de autenticación.',
          actionRequired:
            'Genera tu token con `turso db tokens create` o en el panel de Turso y agrégalo a tu entorno.',
          isCritical: isProduction,
        });
      }
    }
  }

  // ----------------------------------------------------
  // 3. INTEGRACIONES MODULARES (DEGRADACIÓN ELEGANTE)
  // ----------------------------------------------------
  const geminiKey = getEnvVar('GEMINI_API_KEY');
  if (!geminiKey || isPlaceholder(geminiKey)) {
    warnings.push({
      variable: 'GEMINI_API_KEY',
      issue: 'API Key de Gemini no configurada.',
      actionRequired:
        'El Chatbot RAG funcionará en modo fallback. Para activar IA completa, obtén una API Key gratis en https://aistudio.google.com.',
      isCritical: false,
    });
  } else {
    values.GEMINI_API_KEY = geminiKey;
  }

  const resendKey = getEnvVar('RESEND_API_KEY');
  if (!resendKey || isPlaceholder(resendKey)) {
    warnings.push({
      variable: 'RESEND_API_KEY',
      issue: 'Resend API Key no configurada.',
      actionRequired:
        'Los correos se registrarán únicamente en la consola local. Agrega tu API Key de https://resend.com para envío de emails reales.',
      isCritical: false,
    });
  } else {
    values.RESEND_API_KEY = resendKey;
  }

  const sanityToken = getEnvVar('SANITY_API_TOKEN');
  if (!sanityToken || isPlaceholder(sanityToken)) {
    warnings.push({
      variable: 'SANITY_API_TOKEN',
      issue: 'Token de API de Sanity CMS no configurado.',
      actionRequired:
        'El contenido se leerá únicamente en modo público. Para revalidaciones o escrituras, configura SANITY_API_TOKEN en .env.local.',
      isCritical: false,
    });
  } else {
    values.SANITY_API_TOKEN = sanityToken;
  }

  const hasCriticalErrors = errors.some((e) => e.isCritical);

  return {
    isValid: errors.length === 0,
    hasCriticalErrors,
    errors,
    warnings,
    values,
  };
}

/**
 * Renderiza una página HTML descriptiva cuando faltan variables críticas
 */
export function renderEnvDiagnosticHtml(validation: EnvValidationResult): string {
  const criticalItemsHtml = validation.errors
    .map(
      (err) => `
      <div class="card error-card">
        <div class="card-header">
          <span class="badge badge-error">ERROR CRÍTICO</span>
          <code class="var-name">${err.variable}</code>
        </div>
        <p class="issue"><strong>Causa:</strong> ${err.issue}</p>
        <p class="action"><strong>Solución:</strong> ${err.actionRequired}</p>
      </div>`
    )
    .join('');

  const warningItemsHtml = validation.warnings
    .map(
      (warn) => `
      <div class="card warning-card">
        <div class="card-header">
          <span class="badge badge-warning">MODULAR / OPCIONAL</span>
          <code class="var-name">${warn.variable}</code>
        </div>
        <p class="issue"><strong>Estado:</strong> ${warn.issue}</p>
        <p class="action"><strong>Efecto:</strong> ${warn.actionRequired}</p>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuración Requerida - ConsigueTuVisa</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --danger: #ef4444;
      --danger-bg: rgba(239, 68, 68, 0.15);
      --warning: #f59e0b;
      --warning-bg: rgba(245, 158, 11, 0.15);
      --primary: #3b82f6;
      --code-bg: #020617;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 820px;
      width: 100%;
    }
    .header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
    }
    .header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #f87171;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .header p {
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.5;
    }
    .cards {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .error-card {
      border-left: 4px solid var(--danger);
    }
    .warning-card {
      border-left: 4px solid var(--warning);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-error {
      background: var(--danger-bg);
      color: #fca5a5;
      border: 1px solid #7f1d1d;
    }
    .badge-warning {
      background: var(--warning-bg);
      color: #fde68a;
      border: 1px solid #78350f;
    }
    .var-name {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 1.1rem;
      font-weight: 600;
      color: #60a5fa;
      background: var(--code-bg);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .issue, .action {
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }
    .action {
      color: #cbd5e1;
    }
    .guide-box {
      background: #090d16;
      border: 1px dashed var(--primary);
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 1rem;
    }
    .guide-box h3 {
      font-size: 1.1rem;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    .guide-box code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: var(--code-bg);
      color: #a7f3d0;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    .footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Diagnóstico de Entorno - ConsigueTuVisa</h1>
      <p>La aplicación interceptó problemas de configuración en tus variables de entorno para evitar fallos internos inesperados.</p>
    </div>

    <div class="cards">
      ${criticalItemsHtml}
      ${warningItemsHtml}
    </div>

    <div class="guide-box">
      <h3>🚀 ¿Cómo solucionarlo en 3 pasos?</h3>
      <ol style="margin-left: 1.25rem; line-height: 1.8; color: #e2e8f0;">
        <li>Crea o edita el archivo <code>.env.local</code> en la raíz de tu proyecto.</li>
        <li>Completa las variables requeridas (p. ej. las llaves de Clerk desde <a href="https://dashboard.clerk.com" target="_blank" style="color: #60a5fa;">dashboard.clerk.com</a>).</li>
        <li>Reinicia el servidor de desarrollo en la consola (<code>pnpm dev</code>).</li>
      </ol>
    </div>

    <div class="footer">
      ConsigueTuVisa.com &bull; Sistema Centralizado de Diagnóstico & Manejo de Errores
    </div>
  </div>
</body>
</html>`;
}
