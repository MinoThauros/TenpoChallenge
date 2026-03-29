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
    const events = await services.facts.listEvents(academyId);

    return NextResponse.json(events);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      event_id: string;
      season_id?: string | null;
      name: string;
      event_type?: string | null;
      starts_at?: string | null;
      ends_at?: string | null;
      status?: string | null;
    };

    const [event] = await services.facts.upsertEvents([
      {
        academy_id: academyId,
        ...body,
      },
    ]);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
