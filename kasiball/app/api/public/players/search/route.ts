import { NextRequest } from "next/server";
import { searchPublicPlayers } from "@/lib/services/public";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const players = await searchPublicPlayers(q);
    return successResponse(players);
  } catch (error) {
    return handleRouteError(error);
  }
}