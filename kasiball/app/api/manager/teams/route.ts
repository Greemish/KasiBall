import { requireManagerWithClub } from "@/lib/auth";
import { listClubTeams } from "@/lib/services/teams";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    const manager = await requireManagerWithClub();

    const teams = await listClubTeams(manager.clubId!);

    return successResponse(teams);
  } catch (error) {
    return handleRouteError(error);
  }
}