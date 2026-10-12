import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPlayerRegistrationById } from "@/lib/services/players";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = context.params;
    const registration = await getPlayerRegistrationById(id);

    return successResponse(registration);
  } catch (error) {
    return handleRouteError(error);
  }
}