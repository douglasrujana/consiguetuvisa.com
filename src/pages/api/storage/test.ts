// src/pages/api/storage/test.ts
// Endpoint de prueba para el sistema de Storage

import type { APIRoute } from 'astro';
import { getStorage } from '@core/storage';

export const GET: APIRoute = async () => {
  const logs: string[] = [];
  
  try {
    logs.push('1. Obteniendo instancia de Storage...');
    const storage = getStorage();
    logs.push(`   Provider: ${storage.providerName}`);
    logs.push(`   Bucket: ${storage.bucketName}`);

    logs.push('2. Verificando disponibilidad...');
    const isAvailable = await storage.isAvailable();
    logs.push(`   Disponible: ${isAvailable}`);

    if (!isAvailable) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Storage no disponible. Verifica las credenciales.',
          logs,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logs.push('3. Subiendo archivo de prueba...');
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testKey = 'test/hello.txt';
    
    const uploadResult = await storage.upload(testKey, testContent, {
      contentType: 'text/plain',
    });
    logs.push(`   Subido: ${uploadResult.key}`);

    logs.push('4. Verificando existencia...');
    const exists = await storage.exists(testKey);
    logs.push(`   Existe: ${exists}`);

    logs.push('5. Descargando archivo...');
    const downloaded = await storage.download(testKey);
    const downloadedContent = downloaded.toString('utf-8');
    logs.push(`   Contenido: ${downloadedContent.substring(0, 50)}...`);

    logs.push('6. Listando archivos...');
    const listResult = await storage.list({ prefix: 'test/', limit: 10 });
    logs.push(`   Archivos encontrados: ${listResult.files.length}`);
    listResult.files.forEach(f => logs.push(`   - ${f.key} (${f.size} bytes)`));

    logs.push('7. Obteniendo URL pública...');
    const publicUrl = storage.getPublicUrl(testKey);
    logs.push(`   URL: ${publicUrl}`);

    logs.push('8. Limpiando archivo de prueba...');
    await storage.delete(testKey);
    logs.push('   Eliminado OK');

    return new Response(
      JSON.stringify({
        success: true,
        provider: storage.providerName,
        bucket: storage.bucketName,
        logs,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logs.push(`ERROR: ${message}`);
    
    return new Response(
      JSON.stringify({ success: false, error: message, logs }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
