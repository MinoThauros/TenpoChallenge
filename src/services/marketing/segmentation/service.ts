import { buildPage, unwrapRows } from "../client";
import type { MarketingDatabaseClient } from "../client";
import {
  CONTACT_EVENT_SEGMENT_PRESETS,
  CONTACT_SEGMENT_PRESETS,
} from "./presets";
import type {
  AudienceMetadata,
  AudienceSummary,
  ContactEventSegmentFilters,
  ContactEventSegmentQueryInput,
  ContactSegmentFilters,
  ContactSegmentQueryInput,
  MarketingEvent,
  MarketingContactEventSegmentFact,
  MarketingContactSegmentFact,
  Page,
  SegmentPreset,
} from "../types";

function applySearch(query: any, search?: string) {
  const trimmed = search?.trim();

  if (!trimmed) {
    return query;
  }

  const pattern = `%${trimmed}%`;
  return query.or(
    `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
  );
}

function applyBooleanFilter(query: any, column: string, value: boolean | undefined) {
  if (typeof value === "undefined") {
    return query;
  }

  return query.eq(column, value);
}

function applyArrayFilter(query: any, column: string, values?: string[]) {
  if (!values?.length) {
    return query;
  }

  return query.in(column, values);
}

function applyContactFilters(query: any, filters: ContactSegmentFilters = {}) {
  let nextQuery = query;

  nextQuery = applySearch(nextQuery, filters.search);
  nextQuery = applyArrayFilter(nextQuery, "created_via", filters.createdVia);
  nextQuery = applyArrayFilter(nextQuery, "import_batch_id", filters.importBatchIds);
  nextQuery = applyBooleanFilter(nextQuery, "is_suppressed", filters.isSuppressed);
  nextQuery = applyBooleanFilter(nextQuery, "has_linked_athlete", filters.hasLinkedAthlete);
  nextQuery = applyBooleanFilter(
    nextQuery,
    "has_multiple_athletes",
    filters.hasMultipleAthletes,
  );
  nextQuery = applyBooleanFilter(nextQuery, "registered_ever", filters.registeredEver);
  nextQuery = applyBooleanFilter(nextQuery, "paid_ever", filters.paidEver);
  nextQuery = applyBooleanFilter(
    nextQuery,
    "registered_but_never_paid",
    filters.registeredButNeverPaid,
  );

  if (filters.registeredWithinDays) {
    const registeredAfter = new Date();
    registeredAfter.setUTCDate(
      registeredAfter.getUTCDate() - filters.registeredWithinDays,
    );
    nextQuery = nextQuery.gte("last_registered_at", registeredAfter.toISOString());
  }

  if (filters.inactiveForDays) {
    const inactiveBefore = new Date();
    inactiveBefore.setUTCDate(inactiveBefore.getUTCDate() - filters.inactiveForDays);
    nextQuery = nextQuery.eq("registered_ever", true);
    nextQuery = nextQuery.lt("last_registered_at", inactiveBefore.toISOString());
  }

  return nextQuery;
}

function applyContactEventFilters(
  query: any,
  filters: ContactEventSegmentFilters = {},
) {
  let nextQuery = query;

  nextQuery = applySearch(nextQuery, filters.search);
  nextQuery = applyArrayFilter(nextQuery, "event_id", filters.eventIds);
  nextQuery = applyArrayFilter(nextQuery, "season_id", filters.seasonIds);
  nextQuery = applyArrayFilter(nextQuery, "event_type", filters.eventTypes);
  nextQuery = applyBooleanFilter(nextQuery, "is_suppressed", filters.isSuppressed);
  nextQuery = applyBooleanFilter(nextQuery, "has_registration", filters.hasRegistration);
  nextQuery = applyBooleanFilter(
    nextQuery,
    "has_successful_transaction",
    filters.hasSuccessfulTransaction,
  );
  nextQuery = applyBooleanFilter(
    nextQuery,
    "registered_but_unpaid",
    filters.registeredButUnpaid,
  );

  if (filters.waitlistedOnly) {
    nextQuery = nextQuery.gt("waitlisted_registrations_count", 0);
  }

  if (filters.attendedOnly) {
    nextQuery = nextQuery.gt("attended_registrations_count", 0);
  }

  return nextQuery;
}

function mergeFilters<T>(baseFilters: T, overrideFilters?: Partial<T>): T {
  return {
    ...baseFilters,
    ...overrideFilters,
  };
}

function findPreset<TFilters>(
  presets: SegmentPreset<TFilters>[],
  presetId?: string,
): SegmentPreset<TFilters> | undefined {
  if (!presetId) {
    return undefined;
  }

  return presets.find((preset) => preset.id === presetId);
}

function isEventScopedFilter(filters: ContactSegmentFilters | ContactEventSegmentFilters) {
  const eventFilters = filters as ContactEventSegmentFilters;

  return Boolean(
    eventFilters.eventIds?.length
      || eventFilters.seasonIds?.length
      || eventFilters.eventTypes?.length
      || eventFilters.hasRegistration
      || eventFilters.hasSuccessfulTransaction
      || eventFilters.registeredButUnpaid
      || eventFilters.waitlistedOnly
      || eventFilters.attendedOnly,
  );
}

export function createMarketingSegmentationService(client: MarketingDatabaseClient) {
  return {
    listContactPresets() {
      return CONTACT_SEGMENT_PRESETS;
    },

    listContactEventPresets() {
      return CONTACT_EVENT_SEGMENT_PRESETS;
    },

    async listContactSegmentFacts(
      input: ContactSegmentQueryInput = {},
    ): Promise<Page<MarketingContactSegmentFact>> {
      const page = buildPage(input.page, input.pageSize);
      const preset = findPreset(CONTACT_SEGMENT_PRESETS, input.presetId);
      const filters = mergeFilters(preset?.filters ?? {}, input.filters);

      let query = client
        .from("v_marketing_contact_segment_facts")
        .select("*", { count: "exact" });

      query = applyContactFilters(query, filters);
      query = query
        .order("last_registered_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(page.from, page.to);

      const result = await query;

      return {
        data: unwrapRows<MarketingContactSegmentFact>(
          result,
          "Failed to load contact segment facts.",
        ),
        count: result.count ?? null,
        page: page.page,
        pageSize: page.pageSize,
      };
    },

    async listContactEventSegmentFacts(
      input: ContactEventSegmentQueryInput = {},
    ): Promise<Page<MarketingContactEventSegmentFact>> {
      const page = buildPage(input.page, input.pageSize);
      const preset = findPreset(CONTACT_EVENT_SEGMENT_PRESETS, input.presetId);
      const filters = mergeFilters(preset?.filters ?? {}, input.filters);

      let query = client
        .from("v_marketing_contact_event_segment_facts")
        .select("*", { count: "exact" });

      query = applyContactEventFilters(query, filters);
      query = query
        .order("starts_at", { ascending: false, nullsFirst: false })
        .order("last_registered_at", { ascending: false, nullsFirst: false })
        .range(page.from, page.to);

      const result = await query;

      return {
        data: unwrapRows<MarketingContactEventSegmentFact>(
          result,
          "Failed to load contact event segment facts.",
        ),
        count: result.count ?? null,
        page: page.page,
        pageSize: page.pageSize,
      };
    },

    async getAudienceSummary(
      input:
        | ContactSegmentQueryInput
        | ContactEventSegmentQueryInput = {},
    ): Promise<AudienceSummary> {
      if (isEventScopedFilter(input.filters ?? {})) {
        const result = await this.listContactEventSegmentFacts({
          ...input,
          page: 1,
          pageSize: 500,
        } as ContactEventSegmentQueryInput);

        return {
          matchingContacts: result.count ?? result.data.length,
          suppressedContacts: result.data.filter((row) => row.is_suppressed).length,
          paidContacts: result.data.filter((row) => row.has_successful_transaction).length,
          importedContacts: 0,
          eventScoped: true,
        };
      }

      const result = await this.listContactSegmentFacts({
        ...input,
        page: 1,
        pageSize: 500,
      } as ContactSegmentQueryInput);

      return {
        matchingContacts: result.count ?? result.data.length,
        suppressedContacts: result.data.filter((row) => row.is_suppressed).length,
        paidContacts: result.data.filter((row) => row.paid_ever).length,
        importedContacts: result.data.filter((row) => row.created_via === "import").length,
        eventScoped: false,
      };
    },

    async getAudienceMetadata(academyId: string): Promise<AudienceMetadata> {
      const result = await client
        .from("marketing_events")
        .select("*")
        .eq("academy_id", academyId)
        .order("starts_at", { ascending: false });

      const events = unwrapRows<MarketingEvent>(
        result,
        "Failed to load marketing audience metadata.",
      );

      const seasons = new Map<string, string>();
      const eventTypes = new Map<string, string>();

      for (const event of events) {
        if (event.season_id) {
          seasons.set(
            event.season_id,
            event.season_id
              .split("-")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" "),
          );
        }

        if (event.event_type) {
          eventTypes.set(
            event.event_type,
            event.event_type
              .split("_")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" "),
          );
        }
      }

      return {
        events: events.map((event) => ({
          id: event.event_id,
          label: event.name,
        })),
        seasons: Array.from(seasons.entries()).map(([id, label]) => ({
          id,
          label,
        })),
        eventTypes: Array.from(eventTypes.entries()).map(([id, label]) => ({
          id,
          label,
        })),
      };
    },
  };
}
