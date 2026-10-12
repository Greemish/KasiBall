import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  BusinessRuleError,
} from "@/lib/errors";
import type { DocumentType } from "@/lib/validations/document";

// ---------------------------------------------------------------------------
// Upload (manager)
// ---------------------------------------------------------------------------

export async function uploadPlayerDocument(params: {
  clubId: string;
  registrationId: string;
  documentType: DocumentType;
  storageKey: string;
  fileUrl: string;
}) {
  // The registration must belong to a team in the manager's club.
  const reg = await prisma.playerRegistration.findUnique({
    where: { id: params.registrationId },
    include: { team: { select: { clubId: true } } },
  });

  if (!reg || reg.team.clubId !== params.clubId) {
    throw new NotFoundError(
      "Player registration not found",
      "PLAYER_REGISTRATION_NOT_FOUND"
    );
  }

  return prisma.playerDocument.create({
    data: {
      player_registration_id: params.registrationId,
      documentType: params.documentType,
      fileUrl: params.fileUrl,
      verification_status: "PENDING",
    },
  });
}

export async function listRegistrationDocuments(params: {
  clubId: string;
  registrationId: string;
}) {
  const reg = await prisma.playerRegistration.findUnique({
    where: { id: params.registrationId },
    include: { team: { select: { clubId: true } } },
  });

  if (!reg || reg.team.clubId !== params.clubId) {
    throw new NotFoundError(
      "Player registration not found",
      "PLAYER_REGISTRATION_NOT_FOUND"
    );
  }

  return prisma.playerDocument.findMany({
    where: { player_registration_id: params.registrationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClubDocument(clubId: string, documentId: string) {
  const doc = await prisma.playerDocument.findUnique({
    where: { id: documentId },
    include: {
      player_registration: {
        include: { team: { select: { clubId: true } } },
      },
    },
  });

  if (!doc || doc.player_registration.team.clubId !== clubId) {
    throw new NotFoundError("Document not found", "DOCUMENT_NOT_FOUND");
  }

  return doc;
}

export async function deleteDocument(clubId: string, documentId: string) {
  const doc = await getClubDocument(clubId, documentId);

  if (doc.verification_status === "VERIFIED") {
    throw new BusinessRuleError(
      "A verified document cannot be deleted",
      "DOCUMENT_LOCKED"
    );
  }

  await prisma.playerDocument.delete({ where: { id: documentId } });

  return doc; // return the record (incl. fileUrl) so the route can delete the file
}

// ---------------------------------------------------------------------------
// Admin: view + verify
// ---------------------------------------------------------------------------

export async function listAllDocuments(filter?: {
  registrationId?: string;
  status?: "PENDING" | "VERIFIED" | "REJECTED" | "CHANGES_REQUESTED";
}) {
  return prisma.playerDocument.findMany({
    where: {
      ...(filter?.registrationId
        ? { player_registration_id: filter.registrationId }
        : {}),
      ...(filter?.status ? { verification_status: filter.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      player_registration: {
        include: {
          player: true,
          team: {
            select: {
              id: true,
              name: true,
              club: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

export async function getDocumentById(documentId: string) {
  const doc = await prisma.playerDocument.findUnique({
    where: { id: documentId },
    include: {
      player_registration: {
        include: {
          player: true,
          team: {
            select: {
              id: true,
              name: true,
              club: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!doc) {
    throw new NotFoundError("Document not found", "DOCUMENT_NOT_FOUND");
  }

  return doc;
}

export async function verifyDocument(documentId: string, reviewerId: string) {
  const doc = await getDocumentById(documentId);

  if (doc.verification_status === "VERIFIED") {
    throw new BusinessRuleError(
      "This document is already verified",
      "DOCUMENT_ALREADY_VERIFIED"
    );
  }

  return prisma.playerDocument.update({
    where: { id: documentId },
    data: {
      verification_status: "VERIFIED",
      verifiedBy: reviewerId,
      verifiedAt: new Date(),
    },
  });
}

export async function rejectDocument(
  documentId: string,
  reviewerId: string
) {
  const doc = await getDocumentById(documentId);

  if (doc.verification_status === "VERIFIED") {
    throw new BusinessRuleError(
      "A verified document cannot be rejected",
      "DOCUMENT_LOCKED"
    );
  }

  return prisma.playerDocument.update({
    where: { id: documentId },
    data: {
      verification_status: "REJECTED",
      verifiedBy: reviewerId,
      verifiedAt: new Date(),
    },
  });
}