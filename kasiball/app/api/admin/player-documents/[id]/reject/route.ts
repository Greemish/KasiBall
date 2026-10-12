import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rejectDocument } from "@/lib/services/documents";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = context.params;

    const doc = await rejectDocument(id, user.id);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "REJECT",
      entityType: "PlayerDocument",
      entityId: doc.id,
      newValues: { verification_status: "REJECTED" },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(doc);
  } catch (error) {
    return handleRouteError(error);
  }
}