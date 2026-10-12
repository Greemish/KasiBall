import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listMatches } from "@/lib/services/matches";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const seasonId = request.nextUrl.searchParams.get("seasonId");
    const ageGroupId = request.nextUrl.searchParams.get("ageGroupId");
    const status = request.nextUrl.searchParams.get("status");

    const matches = await listMatches({
      seasonId: seasonId ?? undefined,
      ageGroupId: ageGroupId ?? undefined,
      status: status ? (status as never) : undefined,
    });

    return successResponse(matches);
  } catch (error) {
    return handleRouteError(error);
  }
}