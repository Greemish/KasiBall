import { NextRequest } from "next/server";
import { getPublicClub } from "@/lib/services/public";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const club = await getPublicClub(id);
    return successResponse(club);
  } catch (error) {
    return handleRouteError(error);
  }
}