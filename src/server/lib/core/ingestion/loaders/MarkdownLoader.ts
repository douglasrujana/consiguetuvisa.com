// src/server/lib/core/ingestion/loaders/MarkdownLoader.ts

/**
 * LOADER MARKDOWN - Carga archivos .md desde el filesystem
 */

import type { IDocumentLoader, RawDocument } from '../Ingestion.port';
import { readFile } from 'fs/promises';
import { basename } from 'path';

export class MarkdownLoader implements IDocumentLoader {
  readonly supportedTypes = ['markdown', 'md'];

  async load(source: string): Promise<RawDocument> {
    try {
      const content = await readFile(source, 'utf-8');
      const title = this.extractTitle(content);

      return {
        content: this.cleanMarkdown(content),
        source,
        type: 'markdown',
        metadata: {
          title: title || basename(source, '.md'),
          filename: basename(source),
        },
      };
    } catch (error) {
      throw new Error(`Error loading markdown file ${source}: ${(error as Error).message}`);
    }
  }

  canLoad(source: string): boolean {
    return source.endsWith('.md') || source.endsWith('.mdx');
  }

  /**
   * Extrae el título del primer H1
   */
  private extractTitle(content: string): string | null {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }

  /**
   * Limpia el markdown para mejor chunking
   */
  private cleanMarkdown(content: string): string {
    return (
      content
        // Remover frontmatter YAML
        .replace(/^---[\s\S]*?---\n*/m, '')
        // Remover comentarios HTML
        .replace(/<!--[\s\S]*?-->/g, '')
        // Normalizar saltos de línea
        .replace(/\r\n/g, '\n')
        // Remover líneas vacías múltiples
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }
}
