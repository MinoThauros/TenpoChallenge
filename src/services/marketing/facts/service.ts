import { unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  MarketingEvent,
  MarketingRegistration,
  MarketingSuccessfulTransaction,
  RecordSuccessfulTransactionInput,
  UpsertMarketingEventInput,
  UpsertMarketingRegistrationInput,
} from "../types";

export function createMarketingFactsService(client: MarketingDatabaseClient) {
  return {
    async upsertEvents(events: UpsertMarketingEventInput[]): Promise<MarketingEvent[]> {
      if (!events.length) {
        return [];
      }

      const result = await client
        .from("marketing_events")
        .upsert(events, {
          onConflict: "academy_id,event_id",
        })
        .select("*");

      return unwrapRows<MarketingEvent>(result, "Failed to upsert marketing events.");
    },

    async upsertRegistrations(
      registrations: UpsertMarketingRegistrationInput[],
    ): Promise<MarketingRegistration[]> {
      if (!registrations.length) {
        return [];
      }

      const result = await client
        .from("marketing_registrations")
        .upsert(registrations, {
          onConflict: "academy_id,registration_id",
        })
        .select("*");

      return unwrapRows<MarketingRegistration>(
        result,
        "Failed to upsert marketing registrations.",
      );
    },

    async recordSuccessfulTransactions(
      transactions: RecordSuccessfulTransactionInput[],
    ): Promise<MarketingSuccessfulTransaction[]> {
      if (!transactions.length) {
        return [];
      }

      const result = await client
        .from("marketing_successful_transactions")
        .upsert(transactions, {
          onConflict: "academy_id,payment_id",
        })
        .select("*");

      return unwrapRows<MarketingSuccessfulTransaction>(
        result,
        "Failed to record successful marketing transactions.",
      );
    },
  };
}
