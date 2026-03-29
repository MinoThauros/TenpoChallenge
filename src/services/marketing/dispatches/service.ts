import { buildPage, unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  ListMarketingCampaignDispatchStatesInput,
  ListMarketingDispatchRecipientActivityInput,
  MarketingCampaignDispatchState,
  MarketingDispatchRecipientActivity,
  Page,
} from "../types";

export function createMarketingDispatchesService(client: MarketingDatabaseClient) {
  return {
    async listDispatchStates(
      input: ListMarketingCampaignDispatchStatesInput,
    ): Promise<Page<MarketingCampaignDispatchState>> {
      const page = buildPage(input.page, input.pageSize);
      let query = client
        .from("v_marketing_campaign_dispatch_state")
        .select("*", { count: "exact" })
        .eq("academy_id", input.academyId);

      if (input.campaignId) {
        query = query.eq("campaign_id", input.campaignId);
      }

      if (input.activeOnly) {
        query = query.in("dispatch_status", ["queued", "sending"]);
      }

      const result = await query
        .order("scheduled_at", { ascending: false, nullsFirst: false })
        .order("inserted_at", { ascending: false })
        .range(page.from, page.to);

      return {
        data: unwrapRows<MarketingCampaignDispatchState>(
          result,
          "Failed to load marketing campaign dispatch state.",
        ),
        count: result.count ?? null,
        page: page.page,
        pageSize: page.pageSize,
      };
    },

    async listRecipientActivity(
      input: ListMarketingDispatchRecipientActivityInput,
    ): Promise<Page<MarketingDispatchRecipientActivity>> {
      const page = buildPage(input.page, input.pageSize);
      const result = await client
        .from("v_marketing_dispatch_recipient_activity")
        .select("*", { count: "exact" })
        .eq("academy_id", input.academyId)
        .eq("campaign_id", input.campaignId)
        .order("sent_at", { ascending: false, nullsFirst: false })
        .order("latest_attempt_requested_at", {
          ascending: false,
          nullsFirst: false,
        })
        .order("inserted_at", { ascending: false })
        .range(page.from, page.to);

      return {
        data: unwrapRows<MarketingDispatchRecipientActivity>(
          result,
          "Failed to load marketing dispatch recipient activity.",
        ),
        count: result.count ?? null,
        page: page.page,
        pageSize: page.pageSize,
      };
    },
  };
}
