import { NextRequest } from "next/server";
import { requireManager } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { createTeamApplicationSchema } from "@/lib/validations/team-application";
import {
  createTeamApplication,
  listOwnApplications,
} from "@/lib/services/team-applications";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    const user = await requireManager();

    if (!user.manager) {
      return successResponse([]);
    }

    const applications = await listOwnApplications(user.manager.id);

    return successResponse(applications);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireManager();

    if (!user.manager) {
      throw new Error("MANAGER_PROFILE_MISSING");
    }

    const data = parseBody(
      createTeamApplicationSchema,
      await request.json()
    );

    const application = await createTeamApplication(
      user.manager.id,
      data
    );

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "CREATE",
      entityType: "TeamApplication",
      entityId: application.id,
      newValues: {
        teamName: application.teamName,
        clubName: application.clubName,
        ageGroupId: application.ageGroupId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(application, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}