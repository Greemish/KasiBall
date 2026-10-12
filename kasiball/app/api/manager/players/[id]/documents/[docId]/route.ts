import { NextRequest } from "next/server";
import { requireManagerWithClub } from "@/lib/auth";
import {
  getClubDocument,
  deleteDocument,
} from "@/lib/services/documents";
import { storage } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string; docId: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { docId } = context.params;

    const doc = await getClubDocument(manager.clubId!, docId);

    return successResponse({
      ...doc,
      url: await storage.getUrl(doc.fileUrl),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { docId } = context.params;

    const doc = await deleteDocument(manager.clubId!, docId);

    // Remove the stored file too.
    await storage.delete(doc.fileUrl);

    const ctx = getRequestContext();
    await audit({
      userId: manager.userId,
      action: "DELETE",
      entityType: "PlayerDocument",
      entityId: docId,
      oldValues: { documentType: doc.documentType },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}