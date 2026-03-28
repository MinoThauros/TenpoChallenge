import { unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  LinkMarketingContactAthleteInput,
  MarketingContact,
  MarketingContactAthleteLink,
  UpsertMarketingContactInput,
} from "../types";

export function createMarketingContactsService(client: MarketingDatabaseClient) {
  return {
    async upsertContacts(
      contacts: UpsertMarketingContactInput[],
    ): Promise<MarketingContact[]> {
      if (!contacts.length) {
        return [];
      }

      const result = await client
        .from("marketing_contacts")
        .upsert(contacts, {
          onConflict: "academy_id,normalized_email",
        })
        .select("*");

      return unwrapRows<MarketingContact>(
        result,
        "Failed to upsert marketing contacts.",
      );
    },

    async linkAthletes(
      links: LinkMarketingContactAthleteInput[],
    ): Promise<MarketingContactAthleteLink[]> {
      if (!links.length) {
        return [];
      }

      const result = await client
        .from("marketing_contact_athletes")
        .upsert(links, {
          onConflict: "academy_id,marketing_contact_id,athlete_id",
        })
        .select("*");

      return unwrapRows<MarketingContactAthleteLink>(
        result,
        "Failed to link contacts to athletes.",
      );
    },
  };
}
