import { prisma } from "@/lib/prisma";
import type {
  audit_action,
  Prisma,
} from "@/lib/generated/prisma/client";

export type AuditInput = {
  userId?: string | null;
  action: audit_action;
  entityType: string;
  entityId?: string | null;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Writes an audit log entry.
 *
 * Fire-and-forget by default: a failed audit write is logged to the
 * server console but never thrown, so it cannot break the calling
 * operation. Await it if you need to guarantee the write completed
 * (e.g. in tests).
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        oldValues: input.oldValues ?? undefined,
        newValues: input.newValues ?? undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
}