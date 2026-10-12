import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminMatchSquads } from "@/lib/services/squads";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = context.params;
    const squads = await getAdminMatchSquads(id);
    return successResponse(squads);
  } catch (error) {
    return handleRouteError(error);
  }
}