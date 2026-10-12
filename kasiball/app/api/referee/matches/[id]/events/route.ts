import { NextRequest } from "next/server";
import { requireRefereeProfile } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { recordEventSchema } from "@/lib/validations/match-event";
import { recordEvent } from "@/lib/services/matches";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const referee = await requireRefereeProfile();
    const { id } = context.params;

    const data = parseBody(recordEventSchema, await request.json());
    const event = await recordEvent(referee.id, id, data);

    const ctx = getRequestContext();
    await audit({
      userId: referee.userId,
      action: "CREATE",
      entityType: "MatchEvent",
      entityId: event.id,
      newValues: {
        matchId: id,
        eventType: event.eventType,
        teamId: event.teamId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(event, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}