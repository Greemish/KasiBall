import { NextRequest } from "next/server";
import { getPublicTeam } from "@/lib/services/public";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const team = await getPublicTeam(id);
    return successResponse(team);
  } catch (error) {
    return handleRouteError(error);
  }
}