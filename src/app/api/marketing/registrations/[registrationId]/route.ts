import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    registrationId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { registrationId } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      event_id?: string;
      athlete_id?: string;
      registration_status?: "pending" | "completed" | "waitlisted" | "canceled" | "refunded";
      attendance_status?: "unknown" | "attended" | "absent" | "no_show" | "canceled" | null;
      registered_at?: string | null;
    };

    const registration = await services.facts.updateRegistration({
      academy_id: academyId,
      registration_id: registrationId,
      ...body,
    });

    return NextResponse.json(registration);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { registrationId } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    await services.facts.deleteRegistration(academyId, registrationId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
