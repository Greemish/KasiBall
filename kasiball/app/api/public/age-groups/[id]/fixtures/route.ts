import { NextRequest } from "next/server";
import { listPublicFixtures } from "@/lib/services/public";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const fixtures = await listPublicFixtures(id);
    return successResponse(fixtures);
  } catch (error) {
    return handleRouteError(error);
  }
}