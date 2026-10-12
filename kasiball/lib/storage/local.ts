import { promises as fs } from "fs";
import path from "path";
import type { StorageProvider, StoredFile } from "./types";

/**
 * Local filesystem storage — DEVELOPMENT ONLY.
 *
 * Files are written to <project>/.storage/. This does NOT work in
 * serverless / production environments (no persistent disk).
 * Replace with an S3 (or similar) implementation before deploying.
 *
 * The file-serving route (/api/files/[...key]) is currently UNAUTHENTICATED.
 * It must be secured before production — see deployment notes.
 */
const ROOT = path.join(process.cwd(), ".storage");

export class LocalStorage implements StorageProvider {
  async upload({
    key,
    body,
    mimeType,
  }: {
    key: string;
    body: Buffer;
    mimeType: string;
  }): Promise<StoredFile> {
    const fullPath = path.join(ROOT, key);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, body);

    return {
      key,
      url: `/api/files/${key}`,
      size: body.length,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(ROOT, key);
    await fs.unlink(fullPath).catch(() => {});
  }

  async getUrl(key: string): Promise<string> {
    return `/api/files/${key}`;
  }
}