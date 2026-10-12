import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listTeams } from "@/lib/services/teams";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const clubId = request.nextUrl.searchParams.get("clubId");
    const ageGroupId = request.nextUrl.searchParams.get("ageGroupId");

    const teams = await listTeams({
      clubId: clubId ?? undefined,
      ageGroupId: ageGroupId ?? undefined,
    });

    return successResponse(teams);
  } catch (error) {
    return handleRouteError(error);
  }
}