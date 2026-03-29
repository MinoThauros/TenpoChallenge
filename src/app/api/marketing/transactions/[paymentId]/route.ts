import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { paymentId } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      registration_id?: string | null;
      event_id?: string;
      athlete_id?: string;
      paid_at?: string;
    };

    const transaction = await services.facts.updateSuccessfulTransaction({
      academy_id: academyId,
      payment_id: paymentId,
      ...body,
    });

    return NextResponse.json(transaction);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { paymentId } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    await services.facts.deleteSuccessfulTransaction(academyId, paymentId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
