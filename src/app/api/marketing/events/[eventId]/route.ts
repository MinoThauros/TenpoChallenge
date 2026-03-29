import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      season_id?: string | null;
      name?: string;
      event_type?: string | null;
      starts_at?: string | null;
      ends_at?: string | null;
      status?: string | null;
    };

    const event = await services.facts.updateEvent({
      academy_id: academyId,
      event_id: eventId,
      ...body,
    });

    return NextResponse.json(event);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    await services.facts.deleteEvent(academyId, eventId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
