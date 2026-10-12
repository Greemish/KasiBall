import { NextRequest } from "next/server";
import { requireRefereeProfile } from "@/lib/auth";
import { submitMatch } from "@/lib/services/matches";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const referee = await requireRefereeProfile();
    const { id } = context.params;

    const match = await submitMatch(referee.id, referee.userId, id);

    const ctx = getRequestContext();
    await audit({
      userId: referee.userId,
      action: "SUBMIT_RESULT",
      entityType: "Match",
      entityId: match.id,
      newValues: {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: "COMPLETED",
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(match);
  } catch (error) {
    return handleRouteError(error);
  }
}