import { NextRequest } from "next/server";
import {
  getLeaderboard,
  type LeaderboardSort,
} from "@/lib/services/player-stats";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const sortBy =
      (request.nextUrl.searchParams.get("sortBy") as LeaderboardSort) ?? "goals";
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);

    const rows = await getLeaderboard({ seasonId: id }, sortBy, limit);
    return successResponse(rows);
  } catch (error) {
    return handleRouteError(error);
  }
}