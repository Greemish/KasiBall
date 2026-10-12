import { NextRequest } from "next/server";
import { requireRefereeProfile } from "@/lib/auth";
import { deleteEvent } from "@/lib/services/matches";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string; eventId: string } };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const referee = await requireRefereeProfile();
    const { id, eventId } = context.params;

    await deleteEvent(referee.id, id, eventId);

    const ctx = getRequestContext();
    await audit({
      userId: referee.userId,
      action: "DELETE",
      entityType: "MatchEvent",
      entityId: eventId,
      oldValues: { matchId: id },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}