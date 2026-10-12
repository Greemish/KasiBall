import { listPublicClubs } from "@/lib/services/public";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    const clubs = await listPublicClubs();
    return successResponse(clubs);
  } catch (error) {
    return handleRouteError(error);
  }
}