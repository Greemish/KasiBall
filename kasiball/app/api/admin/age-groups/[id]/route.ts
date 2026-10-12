import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { updateAgeGroupSchema } from "@/lib/validations/age-group";
import {
  getAgeGroupById,
  updateAgeGroup,
} from "@/lib/services/age-groups";
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
    const ageGroup = await getAgeGroupById(id);

    return successResponse(ageGroup);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();

    const { id } = context.params;
    const before = await getAgeGroupById(id);

    const data = parseBody(updateAgeGroupSchema, await request.json());

    const ageGroup = await updateAgeGroup(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "AgeGroup",
      entityId: ageGroup.id,
      oldValues: {
        name: before.name,
        minAge: before.minAge,
        maxAge: before.maxAge,
      },
      newValues: {
        name: ageGroup.name,
        minAge: ageGroup.minAge,
        maxAge: ageGroup.maxAge,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(ageGroup);
  } catch (error) {
    return handleRouteError(error);
  }
}