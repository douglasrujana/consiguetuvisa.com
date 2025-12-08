// vite.config.ts

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 1. Entorno: 'node' es ideal para el backend serverless.
    environment: 'node', 
    
    // 2. Cobertura: Habilitamos el reporte de cobertura.
    coverage: {
      provider: 'v8', // Motor moderno para cobertura
      reporter: ['text', 'json', 'html'], // Formatos de reporte
      include: ['src/server/lib/features/**/Asesoria.service.ts'], // Enfócate en la lógica pura (Servicios)
      exclude: ['src/server/lib/features/**/Asesoria.repository.ts'], // Excluir repositorios (se prueban con Integración)
    },
    
    // 3. Setup global para configuraciones de DB o entorno
    // globalSetup: './__tests__/globalSetup.ts', 

    // 4. Mapeo de paths (si usas aliases como '~/')
    alias: {
      // Agrega aquí cualquier alias de ruta que uses, ej: '~/': './src/'
    }
  },
});