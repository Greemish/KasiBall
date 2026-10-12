import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { createAgeGroupSchema } from "@/lib/validations/age-group";
import {
  listAgeGroups,
  createAgeGroup,
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
    const ageGroups = await listAgeGroups(id);

    return successResponse(ageGroups);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();

    const { id } = context.params;
    const data = parseBody(createAgeGroupSchema, await request.json());

    const ageGroup = await createAgeGroup(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "CREATE",
      entityType: "AgeGroup",
      entityId: ageGroup.id,
      newValues: {
        name: ageGroup.name,
        minAge: ageGroup.minAge,
        maxAge: ageGroup.maxAge,
        seasonId: ageGroup.seasonId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(ageGroup, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}