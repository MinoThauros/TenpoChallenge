import { unwrapRow, unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  CreateMarketingSavedSegmentInput,
  MarketingSavedSegment,
  UpdateMarketingSavedSegmentInput,
} from "../types";

export function createMarketingSavedSegmentsService(
  client: MarketingDatabaseClient,
) {
  return {
    async listSavedSegments(academyId: string): Promise<MarketingSavedSegment[]> {
      const result = await client
        .from("marketing_saved_segments")
        .select("*")
        .eq("academy_id", academyId)
        .order("updated_at", { ascending: false });

      return unwrapRows<MarketingSavedSegment>(
        result,
        "Failed to load marketing saved segments.",
      );
    },

    async createSavedSegment(
      input: CreateMarketingSavedSegmentInput,
    ): Promise<MarketingSavedSegment> {
      const result = await client
        .from("marketing_saved_segments")
        .insert({
          academy_id: input.academy_id,
          name: input.name,
          description: input.description ?? null,
          segment_scope: input.segment_scope,
          filter_definition: input.filter_definition,
          created_by_user_id: input.created_by_user_id ?? null,
        })
        .select("*")
        .single();

      return unwrapRow<MarketingSavedSegment>(
        result,
        "Failed to create marketing saved segment.",
      );
    },

    async updateSavedSegment(
      input: UpdateMarketingSavedSegmentInput,
    ): Promise<MarketingSavedSegment> {
      const result = await client
        .from("marketing_saved_segments")
        .update({
          name: input.name,
          description: input.description,
          segment_scope: input.segment_scope,
          filter_definition: input.filter_definition,
        })
        .eq("id", input.id)
        .select("*")
        .single();

      return unwrapRow<MarketingSavedSegment>(
        result,
        "Failed to update marketing saved segment.",
      );
    },

    async deleteSavedSegment(id: string): Promise<void> {
      const result = await client
        .from("marketing_saved_segments")
        .delete()
        .eq("id", id);

      if (result.error) {
        throw result.error;
      }
    },
  };
}
