import { unwrapRow } from "../client";
import { buildPage, unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  CreateMarketingCampaignInput,
  ListMarketingCampaignsInput,
  MarketingCampaign,
  Page,
  UpdateMarketingCampaignStatusInput,
} from "../types";

export function createMarketingCampaignsService(client: MarketingDatabaseClient) {
  return {
    async listCampaigns(
      input: ListMarketingCampaignsInput,
    ): Promise<Page<MarketingCampaign>> {
      const page = buildPage(input.page, input.pageSize);
      let query = client
        .from("marketing_campaigns")
        .select("*", { count: "exact" })
        .eq("academy_id", input.academyId);

      if (input.search?.trim()) {
        const pattern = `%${input.search.trim()}%`;
        query = query.or(`name.ilike.${pattern},subject.ilike.${pattern}`);
      }

      const result = await query
        .order("created_at", { ascending: false })
        .range(page.from, page.to);

      return {
        data: unwrapRows<MarketingCampaign>(
          result,
          "Failed to load marketing campaigns.",
        ),
        count: result.count ?? null,
        page: page.page,
        pageSize: page.pageSize,
      };
    },

    async createCampaign(
      input: CreateMarketingCampaignInput,
    ): Promise<MarketingCampaign> {
      const result = await client
        .from("marketing_campaigns")
        .insert({
          academy_id: input.academy_id,
          name: input.name,
          subject: input.subject,
          preview_text: input.preview_text ?? null,
          body_html: input.body_html ?? "",
          body_text: input.body_text ?? null,
          from_name: input.from_name ?? null,
          from_email: input.from_email,
          reply_to_email: input.reply_to_email ?? null,
          audience_definition: input.audience_definition ?? {},
          scheduled_at: input.scheduled_at ?? null,
          created_by_user_id: input.created_by_user_id ?? null,
        })
        .select("*")
        .single();

      return unwrapRow<MarketingCampaign>(
        result,
        "Failed to create a marketing campaign.",
      );
    },

    async updateStatus(
      input: UpdateMarketingCampaignStatusInput,
    ): Promise<MarketingCampaign> {
      const result = await client
        .from("marketing_campaigns")
        .update({
          status: input.status,
          sent_at: input.sent_at,
          scheduled_at: input.scheduled_at,
        })
        .eq("id", input.id)
        .select("*")
        .single();

      return unwrapRow<MarketingCampaign>(
        result,
        "Failed to update marketing campaign status.",
      );
    },
  };
}
