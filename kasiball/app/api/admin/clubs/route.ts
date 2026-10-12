import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { createClubSchema } from "@/lib/validations/club";
import { listClubs, createClub } from "@/lib/services/clubs";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    await requireAdmin();

    const clubs = await listClubs();

    return successResponse(clubs);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const data = parseBody(createClubSchema, await request.json());

    const club = await createClub(data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "CREATE",
      entityType: "Club",
      entityId: club.id,
      newValues: {
        name: club.name,
        shortName: club.shortName,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(club, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}