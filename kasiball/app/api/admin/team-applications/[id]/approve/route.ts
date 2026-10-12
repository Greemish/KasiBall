import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { approveApplication } from "@/lib/services/team-applications";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = {
  params: { id: string };
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();

    const { id } = context.params;
    const result = await approveApplication(id, user.id);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "APPROVE",
      entityType: "TeamApplication",
      entityId: result.application.id,
      newValues: {
        status: "APPROVED",
        approvedTeamId: result.team.id,
        clubId: result.club.id,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}