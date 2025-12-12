// src/server/lib/core/storage/adapters/GoogleDriveStorage.adapter.ts

/**
 * ADAPTADOR GOOGLE DRIVE STORAGE
 * Implementación usando Google Drive API.
 * Free tier: 15GB con cuenta Gmail, sin TDC.
 */

import type {
  IStorageProvider,
  FileMetadata,
  UploadOptions,
  ListOptions,
  ListResult,
  SignedUrl,
} from '../Storage.port';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export interface GoogleDriveConfig {
  credentials: {
    client_email: string;
    private_key: string;
  };
  folderId: string; // ID de la carpeta raíz en Drive
}

export class GoogleDriveStorageAdapter implements IStorageProvider {
  readonly providerName = 'google-drive';
  readonly bucketName: string;

  private drive: drive_v3.Drive;
  private folderId: string;
  private folderCache: Map<string, string> = new Map(); // path -> folderId

  constructor(config: GoogleDriveConfig) {
    this.folderId = config.folderId;
    this.bucketName = config.folderId;

    // Autenticación con Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: config.credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.folderCache.set('', this.folderId);
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<FileMetadata> {
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : Buffer.from(data);
    const { folderPath, fileName } = this.parsePath(key);

    // Obtener o crear carpeta padre
    const parentId = await this.getOrCreateFolder(folderPath);

    // Verificar si el archivo ya existe
    const existingFile = await this.findFile(fileName, parentId);

    const fileMetadata: drive_v3.Schema$File = {
      name: fileName,
      parents: existingFile ? undefined : [parentId],
      mimeType: options?.contentType || 'application/octet-stream',
    };

    const media = {
      mimeType: options?.contentType || 'application/octet-stream',
      body: Readable.from(buffer),
    };

    let response: drive_v3.Schema$File;

    if (existingFile) {
      // Actualizar archivo existente
      const res = await this.drive.files.update({
        fileId: existingFile.id!,
        requestBody: fileMetadata,
        media,
        fields: 'id, name, size, mimeType, modifiedTime',
      });
      response = res.data;
    } else {
      // Crear nuevo archivo
      const res = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, size, mimeType, modifiedTime',
      });
      response = res.data;
    }

    return {
      key,
      size: buffer.length,
      contentType: response.mimeType || 'application/octet-stream',
      lastModified: new Date(response.modifiedTime || Date.now()),
    };
  }

  async download(key: string): Promise<Buffer> {
    const fileId = await this.getFileId(key);
    if (!fileId) {
      throw new Error(`File not found: ${key}`);
    }

    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    const fileId = await this.getFileId(key);
    if (!fileId) return null;

    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, size, mimeType, modifiedTime',
    });

    const file = response.data;
    return {
      key,
      size: parseInt(file.size || '0', 10),
      contentType: file.mimeType || 'application/octet-stream',
      lastModified: new Date(file.modifiedTime || Date.now()),
    };
  }

  async delete(key: string): Promise<void> {
    const fileId = await this.getFileId(key);
    if (fileId) {
      await this.drive.files.delete({ fileId });
    }
  }

  async deleteBatch(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const prefix = options?.prefix || '';
    const limit = options?.limit || 100;

    // Obtener folder ID del prefix
    let parentId = this.folderId;
    if (prefix) {
      const folderId = await this.getFolderId(prefix);
      if (folderId) parentId = folderId;
    }

    const query = `'${parentId}' in parents and trashed = false`;

    const response = await this.drive.files.list({
      q: query,
      pageSize: limit,
      pageToken: options?.cursor,
      fields: 'nextPageToken, files(id, name, size, mimeType, modifiedTime)',
    });

    const files: FileMetadata[] = (response.data.files || [])
      .filter((f) => f.mimeType !== 'application/vnd.google-apps.folder')
      .map((file) => ({
        key: prefix ? `${prefix}/${file.name}` : file.name!,
        size: parseInt(file.size || '0', 10),
        contentType: file.mimeType || 'application/octet-stream',
        lastModified: new Date(file.modifiedTime || Date.now()),
      }));

    return {
      files,
      cursor: response.data.nextPageToken || undefined,
      hasMore: !!response.data.nextPageToken,
    };
  }

  async exists(key: string): Promise<boolean> {
    const fileId = await this.getFileId(key);
    return fileId !== null;
  }

  async copy(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
    const sourceId = await this.getFileId(sourceKey);
    if (!sourceId) {
      throw new Error(`Source file not found: ${sourceKey}`);
    }

    const { folderPath, fileName } = this.parsePath(destinationKey);
    const parentId = await this.getOrCreateFolder(folderPath);

    const response = await this.drive.files.copy({
      fileId: sourceId,
      requestBody: {
        name: fileName,
        parents: [parentId],
      },
      fields: 'id, name, size, mimeType, modifiedTime',
    });

    const file = response.data;
    return {
      key: destinationKey,
      size: parseInt(file.size || '0', 10),
      contentType: file.mimeType || 'application/octet-stream',
      lastModified: new Date(file.modifiedTime || Date.now()),
    };
  }

  getPublicUrl(key: string): string {
    // Google Drive no tiene URLs públicas directas sin configuración adicional
    throw new Error('Google Drive requires sharing settings for public URLs. Use getSignedUrl instead.');
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<SignedUrl> {
    const fileId = await this.getFileId(key);
    if (!fileId) {
      throw new Error(`File not found: ${key}`);
    }

    // Hacer el archivo accesible temporalmente
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.drive.files.get({ fileId: this.folderId });
      return true;
    } catch {
      return false;
    }
  }

  // ============ Helpers ============

  private parsePath(key: string): { folderPath: string; fileName: string } {
    const parts = key.split('/');
    const fileName = parts.pop() || key;
    const folderPath = parts.join('/');
    return { folderPath, fileName };
  }

  private async getFileId(key: string): Promise<string | null> {
    const { folderPath, fileName } = this.parsePath(key);
    const parentId = await this.getFolderId(folderPath);
    if (!parentId) return null;

    const file = await this.findFile(fileName, parentId);
    return file?.id || null;
  }

  private async findFile(name: string, parentId: string): Promise<drive_v3.Schema$File | null> {
    const query = `name = '${name}' and '${parentId}' in parents and trashed = false`;

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 1,
    });

    return response.data.files?.[0] || null;
  }

  private async getFolderId(path: string): Promise<string | null> {
    if (!path) return this.folderId;
    if (this.folderCache.has(path)) return this.folderCache.get(path)!;

    const parts = path.split('/').filter(Boolean);
    let currentId = this.folderId;

    for (const part of parts) {
      const folder = await this.findFolder(part, currentId);
      if (!folder) return null;
      currentId = folder.id!;
    }

    this.folderCache.set(path, currentId);
    return currentId;
  }

  private async getOrCreateFolder(path: string): Promise<string> {
    if (!path) return this.folderId;
    if (this.folderCache.has(path)) return this.folderCache.get(path)!;

    const parts = path.split('/').filter(Boolean);
    let currentId = this.folderId;

    for (const part of parts) {
      let folder = await this.findFolder(part, currentId);

      if (!folder) {
        // Crear carpeta
        const response = await this.drive.files.create({
          requestBody: {
            name: part,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentId],
          },
          fields: 'id',
        });
        folder = response.data;
      }

      currentId = folder.id!;
    }

    this.folderCache.set(path, currentId);
    return currentId;
  }

  private async findFolder(name: string, parentId: string): Promise<drive_v3.Schema$File | null> {
    const query = `name = '${name}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 1,
    });

    return response.data.files?.[0] || null;
  }
}
