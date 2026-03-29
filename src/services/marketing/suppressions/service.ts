import { MarketingServiceError, unwrapRow, unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  CreateMarketingSuppressionInput,
  MarketingSuppression,
} from "../types";

export function createMarketingSuppressionsService(
  client: MarketingDatabaseClient,
) {
  return {
    async listSuppressions(academyId: string): Promise<MarketingSuppression[]> {
      const result = await client
        .from("marketing_suppressions")
        .select("*")
        .eq("academy_id", academyId)
        .order("created_at", { ascending: false });

      return unwrapRows(result, "Failed to load marketing suppressions.");
    },

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

    async deleteSuppression(id: string): Promise<void> {
      const result = await client
        .from("marketing_suppressions")
        .delete()
        .eq("id", id);

      if (result.error) {
        throw new MarketingServiceError(
          "Failed to delete marketing suppression.",
          result.error,
        );
      }
    },
  };
}
