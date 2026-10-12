import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  listFixturesByAgeGroup,
  clearFixtures,
} from "@/lib/services/fixtures";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string; agId: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, agId } = context.params;
    const fixtures = await listFixturesByAgeGroup(id, agId);
    return successResponse(fixtures);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id, agId } = context.params;

    const result = await clearFixtures(id, agId);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "DELETE",
      entityType: "AgeGroup",
      entityId: agId,
      oldValues: { clearedFixtures: result.deleted, seasonId: id },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
