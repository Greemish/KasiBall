import { NextRequest } from "next/server";
import { getPublicSeason } from "@/lib/services/public";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const season = await getPublicSeason(id);
    return successResponse(season);
  } catch (error) {
    return handleRouteError(error);
  }
}