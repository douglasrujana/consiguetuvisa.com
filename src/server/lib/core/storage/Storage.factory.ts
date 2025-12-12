// src/server/lib/core/storage/Storage.factory.ts

/**
 * FACTORY STORAGE - Crea instancias de proveedores de Storage
 * Permite cambiar de proveedor sin modificar la lógica de negocio.
 */

import type { IStorageProvider, StorageConfig } from './Storage.port';
import { LocalStorageAdapter } from './adapters/LocalStorage.adapter';
import { R2StorageAdapter } from './adapters/R2Storage.adapter';
import { GoogleDriveStorageAdapter } from './adapters/GoogleDriveStorage.adapter';
import { VercelBlobStorageAdapter } from './adapters/VercelBlobStorage.adapter';

/**
 * Crea un proveedor de Storage según la configuración
 */
export function createStorage(config: StorageConfig): IStorageProvider {
  switch (config.provider) {
    case 'r2':
      if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
        throw new Error('R2 requires accountId, accessKeyId, and secretAccessKey');
      }
      return new R2StorageAdapter({
        accountId: config.accountId,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        bucket: config.bucket,
        publicUrl: config.publicUrl,
      });

    case 'gdrive':
      if (!config.credentials || !config.folderId) {
        throw new Error('Google Drive requires credentials and folderId');
      }
      return new GoogleDriveStorageAdapter({
        credentials: config.credentials,
        folderId: config.folderId,
      });

    case 's3':
      // TODO: Implementar S3StorageAdapter
      throw new Error('S3 adapter not implemented yet');

    case 'vercel':
      return new VercelBlobStorageAdapter({
        token: process.env.BLOB_READ_WRITE_TOKEN,
        storeId: config.bucket,
      });

    case 'local':
    default:
      return new LocalStorageAdapter(config.bucket, config.publicUrl);
  }
}

/**
 * Crea storage desde variables de entorno
 */
export function createStorageFromEnv(): IStorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageConfig['provider'];

  switch (provider) {
    case 'r2':
      return createStorage({
        provider: 'r2',
        bucket: process.env.R2_BUCKET || 'default',
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        publicUrl: process.env.R2_PUBLIC_URL,
      });

    case 'gdrive':
      const credentialsJson = process.env.GDRIVE_CREDENTIALS_JSON;
      if (!credentialsJson) {
        throw new Error('GDRIVE_CREDENTIALS_JSON is required for Google Drive storage');
      }
      const credentials = JSON.parse(credentialsJson);
      return createStorage({
        provider: 'gdrive',
        bucket: 'gdrive',
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        folderId: process.env.GDRIVE_FOLDER_ID || '',
      });

    case 'vercel':
      return createStorage({
        provider: 'vercel',
        bucket: process.env.BLOB_STORE_ID || 'default',
      });

    case 'local':
    default:
      return createStorage({
        provider: 'local',
        bucket: process.env.LOCAL_STORAGE_PATH || './storage',
        publicUrl: '/storage',
      });
  }
}

/**
 * Presets comunes
 */
export const StoragePresets = {
  /** Storage local para desarrollo */
  local: (path = './storage'): IStorageProvider =>
    createStorage({ provider: 'local', bucket: path }),

  /** Cloudflare R2 */
  r2: (bucket: string): IStorageProvider =>
    createStorage({
      provider: 'r2',
      bucket,
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      publicUrl: process.env.R2_PUBLIC_URL,
    }),

  /** Vercel Blob (1GB gratis) */
  vercel: (storeId = 'default'): IStorageProvider =>
    createStorage({ provider: 'vercel', bucket: storeId }),
};

/**
 * Singleton para reutilizar instancia
 */
let storageInstance: IStorageProvider | null = null;

export function getStorage(): IStorageProvider {
  if (!storageInstance) {
    storageInstance = createStorageFromEnv();
  }
  return storageInstance;
}
