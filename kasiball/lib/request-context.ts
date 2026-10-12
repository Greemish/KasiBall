import { headers } from "next/headers";

export type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function getRequestContext(): RequestContext {
  const h = headers();

  const forwardedFor = h.get("x-forwarded-for");
  const ipAddress = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : h.get("x-real-ip");

  return {
    ipAddress: ipAddress ?? null,
    userAgent: h.get("user-agent"),
  };
}