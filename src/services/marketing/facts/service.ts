import {
  ensureSuccess,
  unwrapRow,
  unwrapRows,
} from "../client";
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
    async listEvents(academyId: string): Promise<MarketingEvent[]> {
      const result = await client
        .from("marketing_events")
        .select("*")
        .eq("academy_id", academyId)
        .order("starts_at", { ascending: false, nullsFirst: false });

      return unwrapRows(result, "Failed to load marketing events.");
    },

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

    async updateEvent(
      input: Partial<UpsertMarketingEventInput> & {
        academy_id: string;
        event_id: string;
      },
    ): Promise<MarketingEvent> {
      const result = await client
        .from("marketing_events")
        .update({
          season_id: input.season_id,
          name: input.name,
          event_type: input.event_type,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          status: input.status,
        })
        .eq("academy_id", input.academy_id)
        .eq("event_id", input.event_id)
        .select("*")
        .single();

      return unwrapRow(result, "Failed to update marketing event.");
    },

    async deleteEvent(academyId: string, eventId: string): Promise<void> {
      const result = await client
        .from("marketing_events")
        .delete()
        .eq("academy_id", academyId)
        .eq("event_id", eventId);

      ensureSuccess(result, "Failed to delete marketing event.");
    },

    async listRegistrations(academyId: string): Promise<MarketingRegistration[]> {
      const result = await client
        .from("marketing_registrations")
        .select("*")
        .eq("academy_id", academyId)
        .order("registered_at", { ascending: false, nullsFirst: false });

      return unwrapRows(result, "Failed to load marketing registrations.");
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

    async updateRegistration(
      input: Partial<UpsertMarketingRegistrationInput> & {
        academy_id: string;
        registration_id: string;
      },
    ): Promise<MarketingRegistration> {
      const result = await client
        .from("marketing_registrations")
        .update({
          event_id: input.event_id,
          athlete_id: input.athlete_id,
          registration_status: input.registration_status,
          attendance_status: input.attendance_status,
          registered_at: input.registered_at,
        })
        .eq("academy_id", input.academy_id)
        .eq("registration_id", input.registration_id)
        .select("*")
        .single();

      return unwrapRow(result, "Failed to update marketing registration.");
    },

    async deleteRegistration(
      academyId: string,
      registrationId: string,
    ): Promise<void> {
      const result = await client
        .from("marketing_registrations")
        .delete()
        .eq("academy_id", academyId)
        .eq("registration_id", registrationId);

      ensureSuccess(result, "Failed to delete marketing registration.");
    },

    async listSuccessfulTransactions(
      academyId: string,
    ): Promise<MarketingSuccessfulTransaction[]> {
      const result = await client
        .from("marketing_successful_transactions")
        .select("*")
        .eq("academy_id", academyId)
        .order("paid_at", { ascending: false });

      return unwrapRows(
        result,
        "Failed to load marketing successful transactions.",
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

    async updateSuccessfulTransaction(
      input: Partial<RecordSuccessfulTransactionInput> & {
        academy_id: string;
        payment_id: string;
      },
    ): Promise<MarketingSuccessfulTransaction> {
      const result = await client
        .from("marketing_successful_transactions")
        .update({
          registration_id: input.registration_id,
          event_id: input.event_id,
          athlete_id: input.athlete_id,
          paid_at: input.paid_at,
        })
        .eq("academy_id", input.academy_id)
        .eq("payment_id", input.payment_id)
        .select("*")
        .single();

      return unwrapRow(
        result,
        "Failed to update marketing successful transaction.",
      );
    },

    async deleteSuccessfulTransaction(
      academyId: string,
      paymentId: string,
    ): Promise<void> {
      const result = await client
        .from("marketing_successful_transactions")
        .delete()
        .eq("academy_id", academyId)
        .eq("payment_id", paymentId);

      ensureSuccess(result, "Failed to delete marketing successful transaction.");
    },
  };
}
