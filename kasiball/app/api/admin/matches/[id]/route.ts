import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getMatchById } from "@/lib/services/matches";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = context.params;
    const match = await getMatchById(id);
    return successResponse(match);
  } catch (error) {
    return handleRouteError(error);
  }
}