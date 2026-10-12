import { listPublicSeasons } from "@/lib/services/public";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    const seasons = await listPublicSeasons();
    return successResponse(seasons);
  } catch (error) {
    return handleRouteError(error);
  }
}