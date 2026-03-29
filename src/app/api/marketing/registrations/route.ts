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
    const registrations = await services.facts.listRegistrations(academyId);

    return NextResponse.json(registrations);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      registration_id: string;
      event_id: string;
      athlete_id: string;
      registration_status: "pending" | "completed" | "waitlisted" | "canceled" | "refunded";
      attendance_status?: "unknown" | "attended" | "absent" | "no_show" | "canceled" | null;
      registered_at?: string | null;
    };

    const [registration] = await services.facts.upsertRegistrations([
      {
        academy_id: academyId,
        ...body,
      },
    ]);

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
