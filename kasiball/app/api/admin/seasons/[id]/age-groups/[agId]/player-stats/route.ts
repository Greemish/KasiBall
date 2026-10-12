import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getLeaderboard,
  type LeaderboardSort,
} from "@/lib/services/player-stats";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string; agId: string } };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, agId } = context.params;

    const sortBy =
      (request.nextUrl.searchParams.get("sortBy") as LeaderboardSort) ?? "goals";

    const rows = await getLeaderboard(
      { seasonId: id, ageGroupId: agId },
      sortBy
    );

    return successResponse(rows);
  } catch (error) {
    return handleRouteError(error);
  }
}