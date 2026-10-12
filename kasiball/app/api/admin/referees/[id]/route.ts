import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { updateRefereeSchema } from "@/lib/validations/referee";
import { getRefereeById, updateReferee } from "@/lib/services/referees";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = context.params;
    const referee = await getRefereeById(id);
    return successResponse(referee);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = context.params;

    const before = await getRefereeById(id);
    const data = parseBody(updateRefereeSchema, await request.json());
    const referee = await updateReferee(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Referee",
      entityId: referee.id,
      oldValues: {
        firstName: before.firstName,
        lastName: before.lastName,
        isActive: before.isActive,
      },
      newValues: {
        firstName: referee.firstName,
        lastName: referee.lastName,
        isActive: referee.isActive,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(referee);
  } catch (error) {
    return handleRouteError(error);
  }
}