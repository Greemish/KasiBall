import { NextResponse } from "next/server";

export function successResponse<T>(
  data: T,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  status = 400,
  errors?: unknown,
  code?: string
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code !== undefined ? { code } : {}),
      ...(errors !== undefined ? { errors } : {}),
    },
    { status }
  );
}