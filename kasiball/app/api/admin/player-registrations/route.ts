import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listAllPlayerRegistrations } from "@/lib/services/players";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const seasonId = request.nextUrl.searchParams.get("seasonId");
    const teamId = request.nextUrl.searchParams.get("teamId");
    const status = request.nextUrl.searchParams.get("status");

    const registrations = await listAllPlayerRegistrations({
      seasonId: seasonId ?? undefined,
      teamId: teamId ?? undefined,
      status: status
        ? (status as "PENDING" | "VERIFIED" | "REJECTED")
        : undefined,
    });

    return successResponse(registrations);
  } catch (error) {
    return handleRouteError(error);
  }
}