import { unwrapRow, unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  CreateMarketingAthleteInput,
  MarketingAthlete,
} from "../types";

export function createMarketingAthletesService(client: MarketingDatabaseClient) {
  return {
    async listAthletes(academyId: string): Promise<MarketingAthlete[]> {
      const result = await client
        .from("marketing_athletes")
        .select("*")
        .eq("academy_id", academyId)
        .order("created_at", { ascending: false });

      return unwrapRows(result, "Failed to load marketing athletes.");
    },

    async createAthlete(
      input: CreateMarketingAthleteInput,
    ): Promise<MarketingAthlete> {
      const result = await client
        .from("marketing_athletes")
        .insert({
          academy_id: input.academy_id,
          first_name: input.first_name,
          last_name: input.last_name,
          birth_date: input.birth_date ?? null,
        })
        .select("*")
        .single();

      return unwrapRow(result, "Failed to create marketing athlete.");
    },
  };
}
