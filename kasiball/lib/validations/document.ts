import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export const documentTypeEnum = z.enum([
  "IDENTITY_DOCUMENT",
  "BIRTH_CERTIFICATE",
  "PROOF_OF_AGE",
  "MEDICAL_DOCUMENT",
  "CONSENT_FORM",
  "OTHER",
]);

export type DocumentType = z.infer<typeof documentTypeEnum>;

/**
 * Validates the metadata for an upload. The actual file bytes are
 * handled by the route (multipart), not by this schema.
 */
export const uploadDocumentMetaSchema = z.object({
  documentType: documentTypeEnum,
});

export const reviewDocumentSchema = z.object({
  reviewNotes: z
    .string()
    .trim()
    .min(3, "A reason is required")
    .max(1000, "Reason is too long"),
});