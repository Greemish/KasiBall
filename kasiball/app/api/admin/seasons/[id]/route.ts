import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { updateSeasonSchema } from "@/lib/validations/season";
import { getSeasonById, updateSeason } from "@/lib/services/seasons";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = context.params;
    const season = await getSeasonById(id);

    return successResponse(season);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();

    const { id } = context.params;
    const before = await getSeasonById(id);

    const data = parseBody(updateSeasonSchema, await request.json());

    const season = await updateSeason(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Season",
      entityId: season.id,
      oldValues: { name: before.name, status: before.status },
      newValues: {
        name: season.name,
        status: season.status,
        cancellationReason: season.cancellationReason,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(season);
  } catch (error) {
    return handleRouteError(error);
  }
}