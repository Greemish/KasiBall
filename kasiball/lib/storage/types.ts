export type StoredFile = {
  key: string;        // unique storage key, e.g. "player-documents/<uuid>.pdf"
  url: string;        // retrievable URL (or a path for local)
  size: number;       // bytes
  mimeType: string;
};

export interface StorageProvider {
  /**
   * Store a file and return its metadata.
   */
  upload(params: {
    key: string;
    body: Buffer;
    mimeType: string;
  }): Promise<StoredFile>;

  /**
   * Delete a stored file by key.
   */
  delete(key: string): Promise<void>;

  /**
   * Get a URL the client can use to access the file.
   * For private files, this may be a time-limited signed URL.
   */
  getUrl(key: string): Promise<string>;
}