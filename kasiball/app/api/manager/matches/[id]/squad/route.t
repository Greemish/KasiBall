import { NextRequest } from "next/server";
import { requireManagerWithClub } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { setSquadSchema } from "@/lib/validations/squad";
import { setMatchSquad, getClubMatchSquad } from "@/lib/services/squads";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { id } = context.params;
    const squad = await getClubMatchSquad(manager.clubId!, id);
    return successResponse(squad);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();
    const { id } = context.params;

    const data = parseBody(setSquadSchema, await request.json());
    const squad = await setMatchSquad(manager.clubId!, id, data);

    const ctx = getRequestContext();
    await audit({
      userId: manager.userId,
      action: "UPDATE",
      entityType: "MatchdaySquad",
      entityId: id,
      newValues: { playerCount: squad.length },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(squad);
  } catch (error) {
    return handleRouteError(error);
  }
}