import type {
  AudienceMetadata,
  AudienceSummary,
  ContactEventSegmentFilters,
  ContactEventSegmentQueryInput,
  ContactSegmentFilters,
  ContactSegmentQueryInput,
  MarketingCampaign,
  MarketingContactEventSegmentFact,
  MarketingContactSegmentFact,
  MarketingImportBatch,
  MarketingSavedSegment,
  Page,
  SegmentPreset,
} from "@/lib/marketing-services";

export type BootstrapResponse = {
  contactPresets: SegmentPreset<ContactSegmentFilters>[];
  eventPresets: SegmentPreset<ContactEventSegmentFilters>[];
  savedSegments: MarketingSavedSegment[];
  campaigns: Page<MarketingCampaign>;
  imports: Page<MarketingImportBatch>;
  metadata: AudienceMetadata;
};

export type AudienceResponse = {
  eventScoped: boolean;
  results: Page<MarketingContactSegmentFact | MarketingContactEventSegmentFact>;
  summary: AudienceSummary;
};

export type AudienceSelectionState = {
  presetId?: string;
  filters: ContactSegmentFilters & ContactEventSegmentFilters;
  page: number;
};

export const defaultAudienceSelection: AudienceSelectionState = {
  presetId: "all-marketable-contacts",
  filters: {
    isSuppressed: false,
  },
  page: 1,
};

export function toTitleCase(input: string) {
  return input
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function statusBadgeVariant(status: string) {
  if (status === "sent" || status === "completed") {
    return "success";
  }
  if (status === "scheduled" || status === "processing" || status === "sending") {
    return "warning";
  }
  if (status === "failed" || status === "canceled") {
    return "error";
  }
  return "secondary";
}

export function isEventScopedFilter(
  filters: ContactSegmentFilters & ContactEventSegmentFilters,
) {
  return Boolean(
    filters.eventIds?.length
      || filters.seasonIds?.length
      || filters.eventTypes?.length
      || filters.hasRegistration
      || filters.hasSuccessfulTransaction
      || filters.registeredButUnpaid
      || filters.waitlistedOnly
      || filters.attendedOnly,
  );
}

export function buildAudienceRequest(selection: AudienceSelectionState) {
  return {
    presetId: selection.presetId,
    filters: selection.filters,
    page: selection.page,
    pageSize: 8,
  } satisfies ContactSegmentQueryInput | ContactEventSegmentQueryInput;
}

export function buildAudienceDefinition(
  selection: AudienceSelectionState,
  eventScoped: boolean,
) {
  return {
    presetId: selection.presetId ?? null,
    filters: selection.filters,
    segment_scope: eventScoped ? "event" : "contact",
  };
}

export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const payload = (await response.json()) as {
        error?: string;
        code?: string | null;
        details?: string | null;
        hint?: string | null;
      };
      if (payload.error) {
        message = payload.error;
      }
      if (payload.code) {
        message = `${message} [${payload.code}]`;
      }
      if (payload.details) {
        message = `${message} ${payload.details}`;
      }
      if (payload.hint) {
        message = `${message} Hint: ${payload.hint}`;
      }
    } catch {
      // Fall back to the generic status message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
