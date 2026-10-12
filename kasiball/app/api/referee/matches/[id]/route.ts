import { NextRequest } from "next/server";
import { requireRefereeProfile } from "@/lib/auth";
import { getRefereeMatch } from "@/lib/services/matches";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const referee = await requireRefereeProfile();
    const { id } = context.params;
    const match = await getRefereeMatch(referee.id, id);
    return successResponse(match);
  } catch (error) {
    return handleRouteError(error);
  }
}