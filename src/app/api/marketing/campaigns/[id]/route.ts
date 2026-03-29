import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const existingCampaign = await services.campaigns.getCampaign({
      id,
      academyId,
    });
    const dispatchStates = await services.dispatches.listDispatchStates({
      academyId,
      campaignId: id,
      page: 1,
      pageSize: 25,
    });
    const campaignLocked = existingCampaign.status === "sending"
      || existingCampaign.status === "sent"
      || dispatchStates.data.some((dispatchState) =>
        dispatchState.dispatch_status === "sending"
        || dispatchState.dispatch_status === "completed"
      );

    if (campaignLocked) {
      return NextResponse.json(
        {
          error:
            "This campaign can no longer be edited because delivery has started or already completed.",
        },
        { status: 409 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      subject?: string;
      preview_text?: string | null;
      body_html?: string;
      body_text?: string | null;
      from_name?: string | null;
      from_email?: string;
      reply_to_email?: string | null;
      audience_definition?: Record<string, unknown>;
      scheduled_at?: string | null;
      sent_at?: string | null;
      status?: string;
    };

    const campaign = await services.campaigns.updateCampaign({
      id,
      ...body,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const campaign = await services.campaigns.getCampaign({
      id,
      academyId,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    await services.campaigns.deleteCampaign(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
