import { LocalStorage } from "./local";
import type { StorageProvider } from "./types";
// import { S3Storage } from "./s3";   // ← add when AWS is ready

function createStorage(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER ?? "local";

  switch (driver) {
    case "local":
      return new LocalStorage();
    // case "s3":
    //   return new S3Storage();
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
  }
}

export const storage: StorageProvider = createStorage();

export type { StorageProvider, StoredFile } from "./types";