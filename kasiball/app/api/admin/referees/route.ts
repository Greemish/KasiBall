import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { createRefereeSchema } from "@/lib/validations/referee";
import { listReferees, createReferee } from "@/lib/services/referees";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const activeParam = request.nextUrl.searchParams.get("isActive");
    const isActive =
      activeParam === "true" ? true : activeParam === "false" ? false : undefined;

    const referees = await listReferees({ isActive });

    return successResponse(referees);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const data = parseBody(createRefereeSchema, await request.json());

    const referee = await createReferee(data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "CREATE",
      entityType: "Referee",
      entityId: referee.id,
      newValues: {
        firstName: referee.firstName,
        lastName: referee.lastName,
        email: referee.user.email,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(referee, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}