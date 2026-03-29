import { NextRequest, NextResponse } from "next/server";
import type {
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  ContactEventSegmentQueryInput,
  ContactSegmentQueryInput,
} from "@/services/marketing";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

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
  try {
    const body = (await request.json()) as
      | ContactSegmentQueryInput
      | ContactEventSegmentQueryInput;

    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const eventScoped = isEventScoped(body.filters);
    const scopedInput = {
      ...body,
      academyId,
    };
    const results = eventScoped
      ? await services.segmentation.listContactEventSegmentFacts(
        scopedInput as ContactEventSegmentQueryInput,
      )
      : await services.segmentation.listContactSegmentFacts(
        scopedInput as ContactSegmentQueryInput,
      );
    const summary = await services.segmentation.getAudienceSummary(
      scopedInput as ContactSegmentQueryInput | ContactEventSegmentQueryInput,
    );

    return NextResponse.json({
      eventScoped,
      results,
      summary,
    });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
