import { NextRequest } from "next/server";
import { requireManagerWithClub } from "@/lib/auth";
import { getClubTeam } from "@/lib/services/teams";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const manager = await requireManagerWithClub();

    const { id } = context.params;
    const team = await getClubTeam(manager.clubId!, id);

    return successResponse(team);
  } catch (error) {
    return handleRouteError(error);
  }
}