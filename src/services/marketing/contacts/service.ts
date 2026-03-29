import {
  buildPage,
  ensureSuccess,
  unwrapRow,
  unwrapRows,
} from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  LinkMarketingContactAthleteInput,
  MarketingContact,
  MarketingContactAthleteLink,
  Page,
  UpsertMarketingContactInput,
} from "../types";

export function createMarketingContactsService(client: MarketingDatabaseClient) {
  return {
    async listContacts(input: {
      academyId: string;
      page?: number;
      pageSize?: number;
      search?: string;
    }): Promise<Page<MarketingContact>> {
      const page = buildPage(input.page, input.pageSize);
      let query = client
        .from("marketing_contacts")
        .select("*", { count: "exact" })
        .eq("academy_id", input.academyId);

      if (input.search?.trim()) {
        const pattern = `%${input.search.trim()}%`;
        query = query.or(
          `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
        );
      }

      const result = await query
        .order("created_at", { ascending: false })
        .range(page.from, page.to);

      return {
        data: unwrapRows<MarketingContact>(result, "Failed to load marketing contacts."),
        count: result.count ?? null,
        page: page.page,
        pageSize: page.pageSize,
      };
    },

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

    async updateContact(input: {
      id: string;
      email?: string;
      first_name?: string | null;
      last_name?: string | null;
      created_via?: "tenpo" | "import" | "manual";
      import_batch_id?: string | null;
    }): Promise<MarketingContact> {
      const result = await client
        .from("marketing_contacts")
        .update({
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
          created_via: input.created_via,
          import_batch_id: input.import_batch_id,
        })
        .eq("id", input.id)
        .select("*")
        .single();

      return unwrapRow(result, "Failed to update marketing contact.");
    },

    async deleteContact(id: string): Promise<void> {
      const result = await client
        .from("marketing_contacts")
        .delete()
        .eq("id", id);

      ensureSuccess(result, "Failed to delete marketing contact.");
    },

    async listAthleteLinks(input: {
      academyId: string;
      marketingContactId?: string;
    }): Promise<MarketingContactAthleteLink[]> {
      let query = client
        .from("marketing_contact_athletes")
        .select("*")
        .eq("academy_id", input.academyId);

      if (input.marketingContactId) {
        query = query.eq("marketing_contact_id", input.marketingContactId);
      }

      const result = await query.order("created_at", { ascending: false });

      return unwrapRows(
        result,
        "Failed to load marketing contact-athlete links.",
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

    async unlinkAthlete(input: {
      academyId: string;
      marketingContactId: string;
      athleteId: string;
    }): Promise<void> {
      const result = await client
        .from("marketing_contact_athletes")
        .delete()
        .eq("academy_id", input.academyId)
        .eq("marketing_contact_id", input.marketingContactId)
        .eq("athlete_id", input.athleteId);

      ensureSuccess(result, "Failed to unlink athlete from contact.");
    },
  };
}
