import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

export async function GET(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const suppressions = await services.suppressions.listSuppressions(academyId);

    return NextResponse.json(suppressions);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      email: string;
      reason: "unsubscribe" | "bounce" | "complaint" | "manual";
      source?: "user" | "system" | "provider" | "import";
      note?: string | null;
    };

    const suppression = await services.suppressions.suppress({
      academy_id: academyId,
      email: body.email,
      reason: body.reason,
      source: body.source,
      note: body.note,
    });

    return NextResponse.json(suppression, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
