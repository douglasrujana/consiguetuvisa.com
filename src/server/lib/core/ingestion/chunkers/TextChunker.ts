// src/server/lib/core/ingestion/chunkers/TextChunker.ts

/**
 * CHUNKER DE TEXTO - Divide documentos en chunks con solapamiento
 * Estrategia: dividir por separadores naturales (párrafos, secciones)
 */

import type { IDocumentChunker, RawDocument, ProcessedChunk, ChunkingOptions } from '../Ingestion.port';
import { nanoid } from 'nanoid';

export class TextChunker implements IDocumentChunker {
  private defaultOptions: Required<ChunkingOptions> = {
    chunkSize: 1000,
    chunkOverlap: 200,
    separator: '\n\n',
  };

  chunk(doc: RawDocument, options?: ChunkingOptions): ProcessedChunk[] {
    const opts = { ...this.defaultOptions, ...options };
    const chunks: ProcessedChunk[] = [];

    // Primero dividir por separador natural
    const sections = doc.content.split(opts.separator).filter((s) => s.trim());

    let currentChunk = '';
    let chunkIndex = 0;

    for (const section of sections) {
      // Si la sección cabe en el chunk actual
      if (currentChunk.length + section.length + opts.separator.length <= opts.chunkSize) {
        currentChunk += (currentChunk ? opts.separator : '') + section;
      } else {
        // Guardar chunk actual si tiene contenido
        if (currentChunk.trim()) {
          chunks.push(this.createChunk(doc, currentChunk, chunkIndex++));
        }

        // Si la sección es más grande que chunkSize, dividirla
        if (section.length > opts.chunkSize) {
          const subChunks = this.splitLargeSection(section, opts);
          for (const subChunk of subChunks) {
            chunks.push(this.createChunk(doc, subChunk, chunkIndex++));
          }
          currentChunk = '';
        } else {
          // Iniciar nuevo chunk con overlap del anterior
          const overlap = this.getOverlap(currentChunk, opts.chunkOverlap);
          currentChunk = overlap + (overlap ? opts.separator : '') + section;
        }
      }
    }

    // Guardar último chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(doc, currentChunk, chunkIndex++));
    }

    // Actualizar totalChunks
    const total = chunks.length;
    return chunks.map((c) => ({ ...c, totalChunks: total }));
  }

  private createChunk(doc: RawDocument, content: string, index: number): ProcessedChunk {
    return {
      id: `${doc.id || nanoid()}-chunk-${index}`,
      content: content.trim(),
      source: doc.source,
      chunkIndex: index,
      totalChunks: 0, // Se actualiza después
      metadata: {
        ...doc.metadata,
        originalType: doc.type,
      },
    };
  }

  private splitLargeSection(section: string, opts: Required<ChunkingOptions>): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < section.length) {
      let end = start + opts.chunkSize;

      // Intentar cortar en un espacio o punto
      if (end < section.length) {
        const lastSpace = section.lastIndexOf(' ', end);
        const lastPeriod = section.lastIndexOf('. ', end);
        const cutPoint = Math.max(lastSpace, lastPeriod + 1);

        if (cutPoint > start + opts.chunkSize / 2) {
          end = cutPoint;
        }
      }

      chunks.push(section.slice(start, end).trim());
      start = end - opts.chunkOverlap;
    }

    return chunks;
  }

  private getOverlap(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;
    return text.slice(-overlapSize);
  }
}
