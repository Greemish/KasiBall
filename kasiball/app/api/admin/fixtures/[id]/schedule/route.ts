import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { scheduleFixtureSchema } from "@/lib/validations/schedule";
import { scheduleFixture, unscheduleFixture } from "@/lib/services/scheduling";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = context.params;

    const data = parseBody(scheduleFixtureSchema, await request.json());
    const fixture = await scheduleFixture(id, data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Fixture",
      entityId: fixture.id,
      newValues: {
        scheduled_date: fixture.scheduled_date,
        kickoff_time: fixture.kickoff_time,
        groundId: fixture.groundId,
        refereeId: fixture.refereeId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(fixture);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = context.params;

    const fixture = await unscheduleFixture(id);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Fixture",
      entityId: id,
      newValues: { unscheduled: true },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(fixture);
  } catch (error) {
    return handleRouteError(error);
  }
}