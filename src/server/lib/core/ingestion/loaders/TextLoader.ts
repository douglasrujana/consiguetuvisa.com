// src/server/lib/core/ingestion/loaders/TextLoader.ts

/**
 * LOADER TEXT - Carga archivos de texto plano o contenido directo
 */

import type { IDocumentLoader, RawDocument } from '../Ingestion.port';
import { readFile } from 'fs/promises';
import { basename } from 'path';
import { existsSync } from 'fs';

export class TextLoader implements IDocumentLoader {
  readonly supportedTypes = ['text', 'txt'];

  async load(source: string): Promise<RawDocument> {
    // Si es un archivo, leerlo
    if (existsSync(source)) {
      const content = await readFile(source, 'utf-8');
      return {
        content,
        source,
        type: 'text',
        metadata: {
          filename: basename(source),
        },
      };
    }

    // Si no es archivo, asumir que es contenido directo
    return {
      content: source,
      source: 'inline',
      type: 'text',
    };
  }

  canLoad(source: string): boolean {
    return source.endsWith('.txt') || !source.includes('.');
  }
}
