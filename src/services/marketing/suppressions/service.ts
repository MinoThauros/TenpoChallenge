import { MarketingServiceError, unwrapRow } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  CreateMarketingSuppressionInput,
  MarketingSuppression,
} from "../types";

export function createMarketingSuppressionsService(
  client: MarketingDatabaseClient,
) {
  return {
    async suppress(
      input: CreateMarketingSuppressionInput,
    ): Promise<MarketingSuppression> {
      const result = await client
        .from("marketing_suppressions")
        .upsert(
          {
            academy_id: input.academy_id,
            email: input.email,
            reason: input.reason,
            source: input.source ?? "system",
            note: input.note ?? null,
          },
          {
            onConflict: "academy_id,normalized_email",
          },
        )
        .select("*")
        .single();

      return unwrapRow<MarketingSuppression>(
        result,
        "Failed to create or update a marketing suppression.",
      );
    },

    async unsuppress(academyId: string, normalizedEmail: string): Promise<void> {
      const result = await client
        .from("marketing_suppressions")
        .delete()
        .eq("academy_id", academyId)
        .eq("normalized_email", normalizedEmail);

      if (result.error) {
        throw new MarketingServiceError(
          "Failed to remove a marketing suppression.",
          result.error,
        );
      }
    },
  };
}
