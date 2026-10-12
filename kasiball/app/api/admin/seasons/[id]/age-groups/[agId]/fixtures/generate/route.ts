import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { generateFixturesSchema } from "@/lib/validations/fixture";
import { generateFixtures } from "@/lib/services/fixtures";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string; agId: string } };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id, agId } = context.params;

    const options = parseBody(generateFixturesSchema, await request.json());

    const fixtures = await generateFixtures(id, agId, options);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "GENERATE_FIXTURES",
      entityType: "AgeGroup",
      entityId: agId,
      newValues: {
        seasonId: id,
        fixtureCount: fixtures.length,
        doubleRoundRobin: options.doubleRoundRobin,
        balancedHomeAway: options.balancedHomeAway,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(
      { count: fixtures.length, fixtures },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}