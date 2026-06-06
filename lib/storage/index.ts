// Interfaz de Storage. Todo el código consume esto, nunca el filesystem
// directamente, para poder mover a S3 sin tocar lógica.
export interface Storage {
  /**
   * Guarda un buffer bajo `key` y devuelve una URL accesible por la app
   * (en LocalStorage: /api/files/<key>; en S3: la URL pública/firmada).
   */
  put(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /** Lee el contenido crudo de `key`. */
  get(key: string): Promise<Buffer>;

  /** Elimina `key` si existe (no falla si no existe). */
  delete(key: string): Promise<void>;
}

import { LocalStorage } from "./local";

// Singleton del storage activo (MVP: local). Cuando exista S3, se elige acá
// por env (p.ej. STORAGE_DRIVER) sin tocar el resto del código.
const globalForStorage = globalThis as unknown as {
  storage: Storage | undefined;
};

export const storage: Storage =
  globalForStorage.storage ?? new LocalStorage();

if (process.env.NODE_ENV !== "production") {
  globalForStorage.storage = storage;
}
