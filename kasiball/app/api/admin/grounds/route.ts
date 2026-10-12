import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { createGroundSchema } from "@/lib/validations/ground";
import { listGrounds, createGround } from "@/lib/services/grounds";
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

    const grounds = await listGrounds({ isActive });

    return successResponse(grounds);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const data = parseBody(createGroundSchema, await request.json());

    const ground = await createGround(data);

    const ctx = getRequestContext();
    await audit({
      userId: user.id,
      action: "CREATE",
      entityType: "Ground",
      entityId: ground.id,
      newValues: { name: ground.name },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(ground, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}