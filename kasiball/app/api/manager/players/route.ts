import { NextRequest } from "next/server";
import { requireManagerWithClub } from "@/lib/auth";
import { parseBody } from "@/lib/validate";
import { registerPlayerSchema } from "@/lib/validations/player";
import {
  registerPlayer,
  listClubPlayerRegistrations,
} from "@/lib/services/players";
import { audit } from "@/lib/audit";
import { getRequestContext } from "@/lib/request-context";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET() {
  try {
    const manager = await requireManagerWithClub();

    const registrations = await listClubPlayerRegistrations(manager.clubId!);

    return successResponse(registrations);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const manager = await requireManagerWithClub();

    const data = parseBody(registerPlayerSchema, await request.json());

    const registration = await registerPlayer(manager.clubId!, data);

    const ctx = getRequestContext();
    await audit({
      userId: manager.userId,          // ← Manager.userId is the User id
      action: "CREATE",
      entityType: "PlayerRegistration",
      entityId: registration.id,
      newValues: {
        playerId: registration.playerId,
        teamId: registration.teamId,
        seasonId: registration.seasonId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return successResponse(registration, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}