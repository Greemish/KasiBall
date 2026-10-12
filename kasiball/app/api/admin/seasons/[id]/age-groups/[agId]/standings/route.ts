import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getStandings } from "@/lib/services/standings";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string; agId: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, agId } = context.params;
    const standings = await getStandings(id, agId);
    return successResponse(standings);
  } catch (error) {
    return handleRouteError(error);
  }
}