import { createMarketingServices } from "@/services/marketing";
import { DEMO_ACADEMY_ID, DEMO_USER_ID } from "./constants";
import { createMarketingMockClient } from "./mock-client";

// These Next route handlers already speak to the marketing service layer. The
// only temporary piece is the data adapter: until a real Supabase server client
// is installed, we back the routes with deterministic in-memory data so the UI
// can be exercised end to end.
export function createMarketingServerServices() {
  return createMarketingServices(createMarketingMockClient());
}

export function getMarketingServerContext() {
  return {
    academyId: DEMO_ACADEMY_ID,
    userId: DEMO_USER_ID,
  };
}
