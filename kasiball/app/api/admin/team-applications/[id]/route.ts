import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { reviewTeamApplicationSchema } from "@/lib/validations/team-application";
import {
  getApplicationById,
  reviewApplication,
} from "@/lib/services/team-applications";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = context.params;
    const application = await getApplicationById(id);

    return successResponse(application);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();

    const { id } = context.params;
    const data = parseBody(
      reviewTeamApplicationSchema,
      await request.json()
    );

    const application = await reviewApplication(id, user.id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "TeamApplication",
      entityId: application.id,
      newValues: {
        status: application.status,
        reviewNotes: application.reviewNotes,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(application);
  } catch (error) {
    return handleRouteError(error);
  }
}