import { requireRefereeProfile } from "@/lib/auth";
import { listRefereeMatches } from "@/lib/services/matches";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    const referee = await requireRefereeProfile();
    const matches = await listRefereeMatches(referee.id);
    return successResponse(matches);
  } catch (error) {
    return handleRouteError(error);
  }
}