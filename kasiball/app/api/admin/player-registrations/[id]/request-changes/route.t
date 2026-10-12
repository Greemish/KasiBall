import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { reviewPlayerRegistrationSchema } from "@/lib/validations/player";
import { requestRegistrationChanges } from "@/lib/services/players";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = context.params;

    const data = parseBody(
      reviewPlayerRegistrationSchema,
      await request.json()
    );

    const registration = await requestRegistrationChanges(
      id,
      user.id,
      data.reviewNotes
    );

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "UPDATE",
      entityType: "PlayerRegistration",
      entityId: registration.id,
      newValues: {
        registrationStatus: "CHANGES_REQUESTED",
        reviewNotes: data.reviewNotes,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(registration);
  } catch (error) {
    return handleRouteError(error);
  }
}