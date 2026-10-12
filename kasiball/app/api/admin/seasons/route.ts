import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { createSeasonSchema } from "@/lib/validations/season";
import { listSeasons, createSeason } from "@/lib/services/seasons";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    await requireAdmin();

    const seasons = await listSeasons();

    return successResponse(seasons);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const data = parseBody(createSeasonSchema, await request.json());

    const season = await createSeason(data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "CREATE",
      entityType: "Season",
      entityId: season.id,
      newValues: {
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(season, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}