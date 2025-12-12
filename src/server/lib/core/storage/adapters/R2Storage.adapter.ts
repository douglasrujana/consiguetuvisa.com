// src/server/lib/core/storage/adapters/R2Storage.adapter.ts

/**
 * ADAPTADOR CLOUDFLARE R2
 * Implementación usando Cloudflare R2 (compatible con S3).
 * Free tier: 10GB storage + 10M requests/mes
 */

import type {
  IStorageProvider,
  FileMetadata,
  UploadOptions,
  ListOptions,
  ListResult,
  SignedUrl,
} from '../Storage.port';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string; // URL del dominio público de R2
}

export class R2StorageAdapter implements IStorageProvider {
  readonly providerName = 'cloudflare-r2';
  readonly bucketName: string;

  private client: S3Client;
  private publicUrl?: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucket;
    this.publicUrl = config.publicUrl;

    // R2 usa endpoint compatible con S3
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    const body = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: options?.contentType || 'application/octet-stream',
      CacheControl: options?.cacheControl,
      Metadata: options?.customMetadata,
    });

    await this.client.send(command);

    return {
      key,
      size: body.length,
      contentType: options?.contentType || 'application/octet-stream',
      lastModified: new Date(),
      customMetadata: options?.customMetadata,
    };
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    // Convertir stream a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag,
        customMetadata: response.Metadata,
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  async deleteBatch(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    await this.client.send(command);
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: options?.prefix,
      MaxKeys: options?.limit || 1000,
      ContinuationToken: options?.cursor,
    });

    const response = await this.client.send(command);

    const files: FileMetadata[] = (response.Contents || []).map((obj) => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      contentType: 'application/octet-stream', // R2 no retorna content-type en list
      lastModified: obj.LastModified || new Date(),
      etag: obj.ETag,
    }));

    return {
      files,
      cursor: response.NextContinuationToken,
      hasMore: response.IsTruncated || false,
    };
  }

  async exists(key: string): Promise<boolean> {
    const metadata = await this.getMetadata(key);
    return metadata !== null;
  }

  async copy(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
    });

    await this.client.send(command);
    return this.getMetadata(destinationKey) as Promise<FileMetadata>;
  }

  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    // Sin dominio público configurado
    throw new Error('Public URL not configured for this R2 bucket');
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<SignedUrl> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.list({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
