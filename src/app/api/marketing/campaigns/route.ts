import { NextRequest, NextResponse } from "next/server";
import type { MarketingCampaignStatus } from "@/services/marketing";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

export async function GET(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const search = request.nextUrl.searchParams.get("search") ?? undefined;

    const campaigns = await services.campaigns.listCampaigns({
      academyId,
      search,
      page: 1,
      pageSize: 20,
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId, userId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      name: string;
      subject: string;
      preview_text?: string | null;
      body_html?: string;
      body_text?: string | null;
      from_name?: string | null;
      from_email: string;
      reply_to_email?: string | null;
      audience_definition: Record<string, unknown>;
      submit_mode: "draft" | "send" | "schedule";
      scheduled_at?: string | null;
    };

    const created = await services.campaigns.createCampaign({
      academy_id: academyId,
      name: body.name,
      subject: body.subject,
      preview_text: body.preview_text,
      body_html: body.body_html,
      body_text: body.body_text,
      from_name: body.from_name,
      from_email: body.from_email,
      reply_to_email: body.reply_to_email,
      audience_definition: body.audience_definition,
      scheduled_at: body.submit_mode === "schedule" ? body.scheduled_at ?? null : null,
      created_by_user_id: userId,
    });

    let status: MarketingCampaignStatus = "draft";
    if (body.submit_mode === "send") {
      status = "sent";
    }
    if (body.submit_mode === "schedule") {
      status = "scheduled";
    }

    const campaign = status === "draft"
      ? created
      : await services.campaigns.updateStatus({
        id: created.id,
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        scheduled_at: status === "scheduled" ? body.scheduled_at ?? null : null,
      });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
