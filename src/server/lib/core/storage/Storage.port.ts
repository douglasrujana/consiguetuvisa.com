// src/server/lib/core/storage/Storage.port.ts

/**
 * PUERTO STORAGE - Contrato para proveedores de almacenamiento
 * Define la interfaz que DEBE cumplir cualquier proveedor.
 * Cloudflare R2, AWS S3, Vercel Blob, Local - todos deben implementar esto.
 */

/**
 * Metadata de un archivo
 */
export interface FileMetadata {
  key: string; // Path/nombre del archivo
  size: number; // Bytes
  contentType: string;
  lastModified: Date;
  etag?: string;
  customMetadata?: Record<string, string>;
}

/**
 * Opciones para subir archivo
 */
export interface UploadOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
  isPublic?: boolean;
}

/**
 * Opciones para listar archivos
 */
export interface ListOptions {
  prefix?: string; // Filtrar por prefijo (carpeta)
  limit?: number; // Máximo de resultados
  cursor?: string; // Para paginación
}

/**
 * Resultado de listar archivos
 */
export interface ListResult {
  files: FileMetadata[];
  cursor?: string; // Para siguiente página
  hasMore: boolean;
}

/**
 * URL firmada para acceso temporal
 */
export interface SignedUrl {
  url: string;
  expiresAt: Date;
}

/**
 * Contrato para proveedores de Storage.
 * R2, S3, Vercel Blob - todos deben implementar esto.
 */
export interface IStorageProvider {
  /**
   * Nombre del proveedor para logging
   */
  readonly providerName: string;

  /**
   * Bucket/container activo
   */
  readonly bucketName: string;

  /**
   * Sube un archivo
   * @param key Path del archivo (ej: "docs/visa-usa.pdf")
   * @param data Contenido del archivo
   * @param options Opciones de upload
   */
  upload(key: string, data: Buffer | Uint8Array | string, options?: UploadOptions): Promise<FileMetadata>;

  /**
   * Descarga un archivo
   * @param key Path del archivo
   * @returns Buffer con el contenido
   */
  download(key: string): Promise<Buffer>;

  /**
   * Obtiene metadata de un archivo
   */
  getMetadata(key: string): Promise<FileMetadata | null>;

  /**
   * Elimina un archivo
   */
  delete(key: string): Promise<void>;

  /**
   * Elimina múltiples archivos
   */
  deleteBatch(keys: string[]): Promise<void>;

  /**
   * Lista archivos
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Verifica si un archivo existe
   */
  exists(key: string): Promise<boolean>;

  /**
   * Copia un archivo
   */
  copy(sourceKey: string, destinationKey: string): Promise<FileMetadata>;

  /**
   * Genera URL pública (si el bucket lo permite)
   */
  getPublicUrl(key: string): string;

  /**
   * Genera URL firmada para acceso temporal
   * @param key Path del archivo
   * @param expiresInSeconds Tiempo de expiración (default: 3600)
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<SignedUrl>;

  /**
   * Verifica conexión con el proveedor
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuración para crear un proveedor de Storage
 */
export interface StorageConfig {
  provider: 'r2' | 's3' | 'vercel' | 'local' | 'gdrive';
  bucket: string;
  // Credenciales específicas por proveedor
  accountId?: string; // R2
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string; // S3
  endpoint?: string; // Custom endpoint
  publicUrl?: string; // URL base para archivos públicos
  // Google Drive
  credentials?: {
    client_email: string;
    private_key: string;
  };
  folderId?: string; // ID de carpeta raíz en Drive
}
