import { NextRequest } from "next/server";
import { requireManagerWithClub } from "@/lib/auth";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  documentTypeEnum,
} from "@/lib/validations/document";
import {
  uploadPlayerDocument,
  listRegistrationDocuments,
} from "@/lib/services/documents";
import { storage } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";
import { randomUUID } from "crypto";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { id } = context.params;

    const documents = await listRegistrationDocuments({
      clubId: manager.clubId!,
      registrationId: id,
    });

    // Enrich each with a retrieval URL.
    const withUrls = await Promise.all(
      documents.map(async (d) => ({
        ...d,
        url: await storage.getUrl(d.fileUrl),
      }))
    );

    return successResponse(withUrls);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { id } = context.params;

    const formData = await request.formData();
    const file = formData.get("file");
    const documentTypeRaw = formData.get("documentType");

    // Validate documentType
    const typeParsed = documentTypeEnum.safeParse(documentTypeRaw);
    if (!typeParsed.success) {
      return errorResponse(
        "Validation failed",
        400,
        { documentType: ["Invalid document type"] },
        "VALIDATION_ERROR"
      );
    }

    if (!(file instanceof File)) {
      return errorResponse(
        "No file provided",
        400,
        undefined,
        "VALIDATION_ERROR"
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as never)) {
      return errorResponse(
        "Unsupported file type",
        400,
        { file: ["Only PDF, JPG, or PNG allowed"] },
        "VALIDATION_ERROR"
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        "File too large",
        400,
        { file: ["Maximum size is 2 MB"] },
        "VALIDATION_ERROR"
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext =
      file.type === "application/pdf"
        ? "pdf"
        : file.type === "image/png"
        ? "png"
        : "jpg";

    const storageKey = `player-documents/${randomUUID()}.${ext}`;

    const stored = await storage.upload({
      key: storageKey,
      body: buffer,
      mimeType: file.type,
    });

    const document = await uploadPlayerDocument({
      clubId: manager.clubId!,
      registrationId: id,
      documentType: typeParsed.data,
      storageKey: stored.key,
      fileUrl: stored.key, // store the KEY; URL is derived via getUrl
    });

    const ctx = getRequestContext();
    await audit({
      userId: manager.userId,
      action: "CREATE",
      entityType: "PlayerDocument",
      entityId: document.id,
      newValues: {
        documentType: document.documentType,
        registrationId: id,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(
      { ...document, url: await storage.getUrl(stored.key) },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}