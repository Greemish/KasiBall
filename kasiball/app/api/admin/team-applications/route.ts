import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listApplications } from "@/lib/services/team-applications";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const statusParam = request.nextUrl.searchParams.get("status");

    const applications = await listApplications(
      statusParam ? { status: statusParam as never } : undefined
    );

    return successResponse(applications);
  } catch (error) {
    return handleRouteError(error);
  }
}