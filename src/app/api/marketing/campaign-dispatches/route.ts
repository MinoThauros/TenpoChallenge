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
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const searchParams = request.nextUrl.searchParams;

    const states = await services.dispatches.listDispatchStates({
      academyId,
      campaignId: searchParams.get("campaignId") ?? undefined,
      activeOnly: searchParams.get("activeOnly") === "true",
      page: parsePositiveInt(searchParams.get("page"), 1),
      pageSize: parsePositiveInt(searchParams.get("pageSize"), 25),
    });

    return NextResponse.json(states);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
