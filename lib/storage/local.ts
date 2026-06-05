import { promises as fs } from "node:fs";
import path from "node:path";
import type { Storage } from "./index";

// Implementación local del Storage para el MVP. Guarda los archivos en un
// directorio del disco (STORAGE_DIR) y los expone vía /api/files/<key>.
//
// `key` puede tener subcarpetas (p.ej. "presupuestos/abc.pdf"); se sanitiza
// para evitar path traversal.
export class LocalStorage implements Storage {
  private root: string;

  constructor(root = process.env.STORAGE_DIR ?? "./storage") {
    this.root = path.resolve(process.cwd(), root);
  }

  private resolveKey(key: string): string {
    const normalized = path
      .normalize(key)
      .replace(/^(\.\.(\/|\\|$))+/, "")
      .replace(/^[/\\]+/, "");
    const full = path.resolve(this.root, normalized);
    if (!full.startsWith(this.root)) {
      throw new Error(`Key inválida (path traversal): ${key}`);
    }
    return full;
  }

  async put(key: string, buffer: Buffer): Promise<string> {
    const full = this.resolveKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return `/api/files/${key}`;
  }

  async get(key: string): Promise<Buffer> {
    const full = this.resolveKey(key);
    return fs.readFile(full);
  }
}
