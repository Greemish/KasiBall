import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { updateClubSchema } from "@/lib/validations/club";
import { getClubById, updateClub } from "@/lib/services/clubs";
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
    const club = await getClubById(id);

    return successResponse(club);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();

    const { id } = context.params;
    const before = await getClubById(id);

    const data = parseBody(updateClubSchema, await request.json());

    const club = await updateClub(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Club",
      entityId: club.id,
      oldValues: { name: before.name, shortName: before.shortName },
      newValues: { name: club.name, shortName: club.shortName },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(club);
  } catch (error) {
    return handleRouteError(error);
  }
}