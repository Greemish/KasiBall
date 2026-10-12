import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { computePlayerStats } from "@/lib/services/player-stats";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = context.params;
    const stats = await computePlayerStats(id);
    return successResponse(stats);
  } catch (error) {
    return handleRouteError(error);
  }
}