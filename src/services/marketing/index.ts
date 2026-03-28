import type { MarketingDatabaseClient } from "./client";
import { createMarketingCampaignsService } from "./campaigns/service";
import { createMarketingContactsService } from "./contacts/service";
import { createMarketingFactsService } from "./facts/service";
import { createMarketingImportsService } from "./imports/service";
import {
  CONTACT_EVENT_SEGMENT_PRESETS,
  CONTACT_SEGMENT_PRESETS,
} from "./segmentation/presets";
import { createMarketingSegmentationService } from "./segmentation/service";
import { createMarketingSavedSegmentsService } from "./saved-segments/service";
import { createMarketingSuppressionsService } from "./suppressions/service";

export { MarketingServiceError } from "./client";
export type {
  MarketingDatabaseClient,
  MarketingDatabaseError,
  MarketingDatabaseResult,
} from "./client";
export * from "./types";
export { CONTACT_EVENT_SEGMENT_PRESETS, CONTACT_SEGMENT_PRESETS };
export { createMarketingSegmentationService } from "./segmentation/service";
export { createMarketingSavedSegmentsService } from "./saved-segments/service";
export { createMarketingContactsService } from "./contacts/service";
export { createMarketingFactsService } from "./facts/service";
export { createMarketingImportsService } from "./imports/service";
export { createMarketingSuppressionsService } from "./suppressions/service";
export { createMarketingCampaignsService } from "./campaigns/service";

// Segmentation is the star of the challenge, but the app should still have one
// simple domain entry point for the surrounding marketing workflows.
export function createMarketingServices(client: MarketingDatabaseClient) {
  return {
    segmentation: createMarketingSegmentationService(client),
    contacts: createMarketingContactsService(client),
    facts: createMarketingFactsService(client),
    imports: createMarketingImportsService(client),
    savedSegments: createMarketingSavedSegmentsService(client),
    suppressions: createMarketingSuppressionsService(client),
    campaigns: createMarketingCampaignsService(client),
  };
}
