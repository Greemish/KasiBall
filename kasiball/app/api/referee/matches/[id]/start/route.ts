import { NextRequest } from "next/server";
import { requireRefereeProfile } from "@/lib/auth";
import { startMatch } from "@/lib/services/matches";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const referee = await requireRefereeProfile();
    const { id } = context.params;

    const match = await startMatch(referee.id, id);

    const ctx = getRequestContext();
    await audit({
      userId: referee.userId,
      action: "UPDATE",
      entityType: "Match",
      entityId: match.id,
      newValues: { status: "IN_PROGRESS" },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(match);
  } catch (error) {
    return handleRouteError(error);
  }
}