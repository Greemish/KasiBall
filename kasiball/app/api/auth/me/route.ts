import { getCurrentUser } from "@/lib/auth";
import {
  errorResponse,
  successResponse,
} from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(
        "Authentication required",
        401
      );
    }

    return successResponse({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      manager: user.manager
        ? {
            id: user.manager.id,
            firstName: user.manager.firstName,
            lastName: user.manager.lastName,
            phone: user.manager.phone,
          }
        : null,
      referee: user.referee
        ? {
            id: user.referee.id,
            firstName: user.referee.firstName,
            lastName: user.referee.lastName,
            phone: user.referee.phone,
            licenseNumber: user.referee.licenseNumber,
          }
        : null,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return errorResponse(
      "Unable to retrieve current user",
      500
    );
  }
}