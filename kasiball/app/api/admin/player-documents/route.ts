import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listAllDocuments } from "@/lib/services/documents";
import { storage } from "@/lib/storage";
import { successResponse } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api-handler";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const registrationId = request.nextUrl.searchParams.get("registrationId");
    const status = request.nextUrl.searchParams.get("status");

    const documents = await listAllDocuments({
      registrationId: registrationId ?? undefined,
      status: status
        ? (status as "PENDING" | "VERIFIED" | "REJECTED" | "CHANGES_REQUESTED")
        : undefined,
    });

    const withUrls = await Promise.all(
      documents.map(async (d) => ({
        ...d,
        url: await storage.getUrl(d.fileUrl),
      }))
    );

    return successResponse(withUrls);
  } catch (error) {
    return handleRouteError(error);
  }
}