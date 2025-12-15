// src/server/lib/core/ingestion/loaders/PDFLoader.ts

/**
 * LOADER PDF - Carga archivos PDF y extrae texto
 * Usa pdf-parse para extraer contenido de PDFs
 */

import type { IDocumentLoader, RawDocument } from '../Ingestion.port';
import { readFile } from 'fs/promises';
import { basename } from 'path';
import { existsSync } from 'fs';

export class PDFLoader implements IDocumentLoader {
  readonly supportedTypes = ['pdf'];

  async load(source: string): Promise<RawDocument> {
    // Verificar que el archivo existe
    if (!existsSync(source)) {
      throw new Error(`PDF file not found: ${source}`);
    }

    // Leer el archivo como buffer
    const dataBuffer = await readFile(source);
    
    // Importar pdf-parse dinámicamente (es CommonJS)
    const pdfParse = (await import('pdf-parse')).default;
    
    // Parsear el PDF
    const data = await pdfParse(dataBuffer);

    return {
      content: data.text,
      source,
      type: 'pdf',
      metadata: {
        filename: basename(source),
        pages: data.numpages,
        info: data.info,
      },
    };
  }

  /**
   * Carga un PDF desde un Buffer (útil para uploads)
   */
  async loadFromBuffer(buffer: Buffer, filename: string): Promise<RawDocument> {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    return {
      content: data.text,
      source: filename,
      type: 'pdf',
      metadata: {
        filename,
        pages: data.numpages,
        info: data.info,
      },
    };
  }

  canLoad(source: string): boolean {
    return source.toLowerCase().endsWith('.pdf');
  }
}
