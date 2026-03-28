import { NextRequest, NextResponse } from "next/server";
import type {
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  ContactEventSegmentQueryInput,
  ContactSegmentQueryInput,
} from "@/services/marketing";
import { createMarketingServerServices } from "@/server/marketing/service";

function isEventScoped(filters: ContactSegmentFilters | ContactEventSegmentFilters = {}) {
  const eventFilters = filters as ContactEventSegmentFilters;

  return Boolean(
    eventFilters.eventIds?.length
      || eventFilters.seasonIds?.length
      || eventFilters.eventTypes?.length
      || eventFilters.hasRegistration
      || eventFilters.hasSuccessfulTransaction
      || eventFilters.registeredButUnpaid
      || eventFilters.waitlistedOnly
      || eventFilters.attendedOnly,
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as
    | ContactSegmentQueryInput
    | ContactEventSegmentQueryInput;

  const services = createMarketingServerServices();
  const eventScoped = isEventScoped(body.filters);
  const results = eventScoped
    ? await services.segmentation.listContactEventSegmentFacts(
      body as ContactEventSegmentQueryInput,
    )
    : await services.segmentation.listContactSegmentFacts(
      body as ContactSegmentQueryInput,
    );
  const summary = await services.segmentation.getAudienceSummary(body);

  return NextResponse.json({
    eventScoped,
    results,
    summary,
  });
}
