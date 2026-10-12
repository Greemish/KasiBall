import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getFixtureById } from "@/lib/services/fixtures";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = context.params;
    const fixture = await getFixtureById(id);
    return successResponse(fixture);
  } catch (error) {
    return handleRouteError(error);
  }
}
