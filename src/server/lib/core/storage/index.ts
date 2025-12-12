// src/server/lib/core/storage/index.ts

/**
 * CORE STORAGE - Exportaciones públicas
 */

// Ports (Interfaces)
export type {
  IStorageProvider,
  FileMetadata,
  UploadOptions,
  ListOptions,
  ListResult,
  SignedUrl,
  StorageConfig,
} from './Storage.port';

// Factory
export { createStorage, createStorageFromEnv, getStorage, StoragePresets } from './Storage.factory';

// Adapters
export { LocalStorageAdapter } from './adapters/LocalStorage.adapter';
export { R2StorageAdapter, type R2Config } from './adapters/R2Storage.adapter';
export { GoogleDriveStorageAdapter, type GoogleDriveConfig } from './adapters/GoogleDriveStorage.adapter';
export { VercelBlobStorageAdapter } from './adapters/VercelBlobStorage.adapter';
