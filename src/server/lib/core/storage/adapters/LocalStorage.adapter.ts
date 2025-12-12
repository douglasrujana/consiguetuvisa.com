// src/server/lib/core/storage/adapters/LocalStorage.adapter.ts

/**
 * ADAPTADOR LOCAL STORAGE
 * Implementación usando el filesystem local.
 * Útil para desarrollo y testing.
 */

import type {
  IStorageProvider,
  FileMetadata,
  UploadOptions,
  ListOptions,
  ListResult,
  SignedUrl,
} from '../Storage.port';
import { readFile, writeFile, unlink, stat, readdir, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { lookup } from 'mime-types';

export class LocalStorageAdapter implements IStorageProvider {
  readonly providerName = 'local';
  readonly bucketName: string;

  private basePath: string;
  private publicUrl: string;

  constructor(basePath: string = './storage', publicUrl: string = '/storage') {
    this.basePath = basePath;
    this.bucketName = basename(basePath);
    this.publicUrl = publicUrl;

    // Crear directorio base si no existe
    if (!existsSync(basePath)) {
      mkdir(basePath, { recursive: true });
    }
  }

  private getFullPath(key: string): string {
    return join(this.basePath, key);
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    const fullPath = this.getFullPath(key);
    const dir = dirname(fullPath);

    // Crear directorio si no existe
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Convertir a Buffer si es string
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : Buffer.from(data);

    await writeFile(fullPath, buffer);

    const stats = await stat(fullPath);
    const contentType = options?.contentType || lookup(key) || 'application/octet-stream';

    return {
      key,
      size: stats.size,
      contentType,
      lastModified: stats.mtime,
    };
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = this.getFullPath(key);
    return readFile(fullPath);
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const fullPath = this.getFullPath(key);
      const stats = await stat(fullPath);

      return {
        key,
        size: stats.size,
        contentType: lookup(key) || 'application/octet-stream',
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    await unlink(fullPath);
  }

  async deleteBatch(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const prefix = options?.prefix || '';
    const limit = options?.limit || 1000;
    const searchPath = this.getFullPath(prefix);

    const files: FileMetadata[] = [];

    try {
      const entries = await readdir(searchPath, { withFileTypes: true, recursive: true });

      for (const entry of entries) {
        if (entry.isFile() && files.length < limit) {
          const key = join(prefix, entry.name);
          const metadata = await this.getMetadata(key);
          if (metadata) {
            files.push(metadata);
          }
        }
      }
    } catch {
      // Directorio no existe
    }

    return {
      files,
      hasMore: false,
    };
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    return existsSync(fullPath);
  }

  async copy(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
    const sourcePath = this.getFullPath(sourceKey);
    const destPath = this.getFullPath(destinationKey);
    const destDir = dirname(destPath);

    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true });
    }

    await copyFile(sourcePath, destPath);
    return this.getMetadata(destinationKey) as Promise<FileMetadata>;
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<SignedUrl> {
    // Local storage no tiene URLs firmadas reales
    // Retornamos la URL pública con un timestamp
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    return {
      url: `${this.getPublicUrl(key)}?expires=${expiresAt.getTime()}`,
      expiresAt,
    };
  }

  async isAvailable(): Promise<boolean> {
    return existsSync(this.basePath);
  }
}
