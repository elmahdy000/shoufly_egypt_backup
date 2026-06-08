import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireUser, requireRole } from "@/lib/auth";
import { CreateRequestSchema } from "@/lib/validations/request";
import { createRequest, listClientRequests } from "@/lib/services/requests";
import { createErrorResponse, logError } from "@/lib/utils/error-handler";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "CLIENT");

    // 🛡️ APPLY HYBRID RATE LIMIT: 5 Requests per 60 Seconds
    const { allowed, limit, remaining, resetTime } = await checkRateLimit(`create_req:${user.id}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "لقد تجاوزت الحد المسموح من الطلبات لدقيقة واحدة. يرجى المحاولة لاحقاً." },
        { 
          status: 429, 
          headers: { 
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(resetTime),
          } 
        }
      );
    }

    const body = await req.json();
    const validated = CreateRequestSchema.parse(body);

    const request = await createRequest(user.id, validated, req.headers);
    return NextResponse.json(request, { status: 201 });
  } catch (error: unknown) {
    logError('REQUEST_POST', error);
    const { response, status } = createErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req.headers);
    requireUser(user);
    requireRole(user, "CLIENT");

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const requests = await listClientRequests(user.id, limit, offset);
    return NextResponse.json(requests);
  } catch (error: unknown) {
    logError('REQUEST_GET', error);
    const { response, status } = createErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}
