import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { updateGroundSchema } from "@/lib/validations/ground";
import { getGroundById, updateGround } from "@/lib/services/grounds";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = context.params;
    const ground = await getGroundById(id);
    return successResponse(ground);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = context.params;

    const before = await getGroundById(id);
    const data = parseBody(updateGroundSchema, await request.json());
    const ground = await updateGround(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Ground",
      entityId: ground.id,
      oldValues: { name: before.name, isActive: before.isActive },
      newValues: { name: ground.name, isActive: ground.isActive },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(ground);
  } catch (error) {
    return handleRouteError(error);
  }
}