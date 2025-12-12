// src/server/lib/core/storage/adapters/VercelBlobStorage.adapter.ts

/**
 * VERCEL BLOB STORAGE ADAPTER
 * Implementación del puerto IStorageProvider para Vercel Blob.
 * 
 * Ventajas:
 * - 1GB gratis sin TDC
 * - Integración nativa con Vercel
 * - API simple y moderna
 * - CDN global incluido
 * 
 * Requiere: BLOB_READ_WRITE_TOKEN en env
 */

import {
  put,
  del,
  list,
  head,
  copy as blobCopy,
  type PutBlobResult,
  type ListBlobResult,
  type HeadBlobResult,
} from '@vercel/blob';
import type {
  IStorageProvider,
  FileMetadata,
  UploadOptions,
  ListOptions,
  ListResult,
  SignedUrl,
} from '../Storage.port';

export class VercelBlobStorageAdapter implements IStorageProvider {
  readonly providerName = 'vercel-blob';
  readonly bucketName: string;
  private readonly token: string;

  constructor(config: { token?: string; storeId?: string }) {
    this.token = config.token || process.env.BLOB_READ_WRITE_TOKEN || '';
    this.bucketName = config.storeId || 'default';

    if (!this.token) {
      console.warn('[VercelBlob] BLOB_READ_WRITE_TOKEN no configurado');
    }
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    const blob = await put(key, data, {
      access: options?.isPublic ? 'public' : 'public', // Vercel Blob es público por defecto
      contentType: options?.contentType,
      cacheControlMaxAge: options?.cacheControl ? parseInt(options.cacheControl) : undefined,
      token: this.token,
      addRandomSuffix: false, // Mantener el nombre exacto
    });

    return this.blobToMetadata(blob, key);
  }

  async download(key: string): Promise<Buffer> {
    const metadata = await this.getMetadata(key);
    if (!metadata) {
      throw new Error(`File not found: ${key}`);
    }

    // Vercel Blob devuelve URL pública, hacemos fetch
    const response = await fetch(metadata.customMetadata?.url || this.getPublicUrl(key));
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    try {
      // Buscar el blob por pathname
      const { blobs } = await list({
        prefix: key,
        limit: 1,
        token: this.token,
      });

      const blob = blobs.find(b => b.pathname === key);
      if (!blob) return null;

      return {
        key: blob.pathname,
        size: blob.size,
        contentType: blob.contentType || 'application/octet-stream',
        lastModified: new Date(blob.uploadedAt),
        customMetadata: { url: blob.url },
      };
    } catch (error) {
      console.error('[VercelBlob] getMetadata error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    // Necesitamos la URL completa para eliminar
    const metadata = await this.getMetadata(key);
    if (metadata?.customMetadata?.url) {
      await del(metadata.customMetadata.url, { token: this.token });
    }
  }

  async deleteBatch(keys: string[]): Promise<void> {
    const urls: string[] = [];
    
    for (const key of keys) {
      const metadata = await this.getMetadata(key);
      if (metadata?.customMetadata?.url) {
        urls.push(metadata.customMetadata.url);
      }
    }

    if (urls.length > 0) {
      await del(urls, { token: this.token });
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const result = await list({
      prefix: options?.prefix,
      limit: options?.limit || 100,
      cursor: options?.cursor,
      token: this.token,
    });

    return {
      files: result.blobs.map(blob => ({
        key: blob.pathname,
        size: blob.size,
        contentType: blob.contentType || 'application/octet-stream',
        lastModified: new Date(blob.uploadedAt),
        customMetadata: { url: blob.url },
      })),
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  }

  async exists(key: string): Promise<boolean> {
    const metadata = await this.getMetadata(key);
    return metadata !== null;
  }

  async copy(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
    const sourceMetadata = await this.getMetadata(sourceKey);
    if (!sourceMetadata?.customMetadata?.url) {
      throw new Error(`Source file not found: ${sourceKey}`);
    }

    const result = await blobCopy(sourceMetadata.customMetadata.url, destinationKey, {
      access: 'public',
      token: this.token,
      addRandomSuffix: false,
    });

    return this.blobToMetadata(result, destinationKey);
  }

  getPublicUrl(key: string): string {
    // Vercel Blob genera URLs automáticamente
    // Este método es para compatibilidad, pero la URL real viene del metadata
    return `https://${this.bucketName}.public.blob.vercel-storage.com/${key}`;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<SignedUrl> {
    // Vercel Blob no tiene URLs firmadas, todos los blobs son públicos
    // Retornamos la URL pública con una fecha de expiración ficticia
    const metadata = await this.getMetadata(key);
    const url = metadata?.customMetadata?.url || this.getPublicUrl(key);

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Intentar listar para verificar conexión
      await list({ limit: 1, token: this.token });
      return true;
    } catch {
      return false;
    }
  }

  private blobToMetadata(blob: PutBlobResult, key: string): FileMetadata {
    return {
      key,
      size: 0, // put no devuelve size, se obtiene después
      contentType: blob.contentType || 'application/octet-stream',
      lastModified: new Date(),
      customMetadata: { url: blob.url },
    };
  }
}
