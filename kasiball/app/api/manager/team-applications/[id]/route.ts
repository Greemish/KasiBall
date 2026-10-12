import { NextRequest } from "next/server";
import { requireManager } from "@/lib/auth";
import { getOwnApplication } from "@/lib/services/team-applications";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireManager();

    if (!user.manager) {
      return handleRouteError(
        new Error("MANAGER_PROFILE_MISSING")
      );
    }

    const { id } = context.params;
    const application = await getOwnApplication(user.manager.id, id);

    return successResponse(application);
  } catch (error) {
    return handleRouteError(error);
  }
}