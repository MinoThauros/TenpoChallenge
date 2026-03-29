import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        {
          error: "campaignId is required.",
        },
        { status: 400 },
      );
    }

    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);

    const activity = await services.dispatches.listRecipientActivity({
      academyId,
      campaignId,
      page: parsePositiveInt(request.nextUrl.searchParams.get("page"), 1),
      pageSize: parsePositiveInt(request.nextUrl.searchParams.get("pageSize"), 50),
    });

    return NextResponse.json(activity);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
