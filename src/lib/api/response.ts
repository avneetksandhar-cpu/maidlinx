import { NextResponse } from "next/server";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types";

export function jsonSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status });
}

export function jsonError(error: string, status = 400, code?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error, code }, { status });
}
