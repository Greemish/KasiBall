import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { updateTeamSchema } from "@/lib/validations/team";
import { getTeamById, updateTeam } from "@/lib/services/teams";
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
    const team = await getTeamById(id);

    return successResponse(team);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();

    const { id } = context.params;
    const before = await getTeamById(id);

    const data = parseBody(updateTeamSchema, await request.json());

    const team = await updateTeam(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Team",
      entityId: team.id,
      oldValues: {
        name: before.name,
        shortName: before.shortName,
        status: before.status,
      },
      newValues: {
        name: team.name,
        shortName: team.shortName,
        status: team.status,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(team);
  } catch (error) {
    return handleRouteError(error);
  }
}