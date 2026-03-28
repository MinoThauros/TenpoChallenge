import type {
  MarketingCampaign,
  MarketingContact,
  MarketingContactAthleteLink,
  MarketingEvent,
  MarketingImportBatch,
  MarketingRegistration,
  MarketingSavedSegment,
  MarketingSuccessfulTransaction,
  MarketingSuppression,
} from "@/services/marketing";
import { DEMO_ACADEMY_ID, DEMO_USER_ID } from "./constants";

export interface MarketingMockState {
  marketing_contacts: MarketingContact[];
  marketing_contact_athletes: MarketingContactAthleteLink[];
  marketing_events: MarketingEvent[];
  marketing_registrations: MarketingRegistration[];
  marketing_successful_transactions: MarketingSuccessfulTransaction[];
  marketing_suppressions: MarketingSuppression[];
  marketing_campaigns: MarketingCampaign[];
  marketing_import_batches: MarketingImportBatch[];
  marketing_saved_segments: MarketingSavedSegment[];
}

function nowOffset(daysAgo: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - daysAgo);
  return value.toISOString();
}

function seededId(prefix: string, suffix: string) {
  return `${prefix}-${suffix}`;
}

function buildInitialState(): MarketingMockState {
  const contacts: MarketingContact[] = [
    {
      id: seededId("contact", "1"),
      academy_id: DEMO_ACADEMY_ID,
      email: "mia.alvarez@example.com",
      normalized_email: "mia.alvarez@example.com",
      first_name: "Mia",
      last_name: "Alvarez",
      created_via: "tenpo",
      import_batch_id: null,
      created_at: nowOffset(240),
      updated_at: nowOffset(4),
    },
    {
      id: seededId("contact", "2"),
      academy_id: DEMO_ACADEMY_ID,
      email: "noah.bennett@example.com",
      normalized_email: "noah.bennett@example.com",
      first_name: "Noah",
      last_name: "Bennett",
      created_via: "import",
      import_batch_id: seededId("import", "1"),
      created_at: nowOffset(190),
      updated_at: nowOffset(12),
    },
    {
      id: seededId("contact", "3"),
      academy_id: DEMO_ACADEMY_ID,
      email: "olivia.chen@example.com",
      normalized_email: "olivia.chen@example.com",
      first_name: "Olivia",
      last_name: "Chen",
      created_via: "tenpo",
      import_batch_id: null,
      created_at: nowOffset(120),
      updated_at: nowOffset(18),
    },
    {
      id: seededId("contact", "4"),
      academy_id: DEMO_ACADEMY_ID,
      email: "liam.davis@example.com",
      normalized_email: "liam.davis@example.com",
      first_name: "Liam",
      last_name: "Davis",
      created_via: "import",
      import_batch_id: seededId("import", "2"),
      created_at: nowOffset(80),
      updated_at: nowOffset(28),
    },
    {
      id: seededId("contact", "5"),
      academy_id: DEMO_ACADEMY_ID,
      email: "ava.evans@example.com",
      normalized_email: "ava.evans@example.com",
      first_name: "Ava",
      last_name: "Evans",
      created_via: "tenpo",
      import_batch_id: null,
      created_at: nowOffset(60),
      updated_at: nowOffset(6),
    },
    {
      id: seededId("contact", "6"),
      academy_id: DEMO_ACADEMY_ID,
      email: "ethan.foster@example.com",
      normalized_email: "ethan.foster@example.com",
      first_name: "Ethan",
      last_name: "Foster",
      created_via: "manual",
      import_batch_id: null,
      created_at: nowOffset(40),
      updated_at: nowOffset(8),
    },
    {
      id: seededId("contact", "7"),
      academy_id: DEMO_ACADEMY_ID,
      email: "sophia.green@example.com",
      normalized_email: "sophia.green@example.com",
      first_name: "Sophia",
      last_name: "Green",
      created_via: "import",
      import_batch_id: seededId("import", "2"),
      created_at: nowOffset(22),
      updated_at: nowOffset(10),
    },
    {
      id: seededId("contact", "8"),
      academy_id: DEMO_ACADEMY_ID,
      email: "jack.harris@example.com",
      normalized_email: "jack.harris@example.com",
      first_name: "Jack",
      last_name: "Harris",
      created_via: "tenpo",
      import_batch_id: null,
      created_at: nowOffset(12),
      updated_at: nowOffset(2),
    },
  ];

  const contactAthletes: MarketingContactAthleteLink[] = [
    {
      academy_id: DEMO_ACADEMY_ID,
      marketing_contact_id: seededId("contact", "1"),
      athlete_id: seededId("athlete", "1"),
      relationship_type: "parent",
      created_at: nowOffset(240),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      marketing_contact_id: seededId("contact", "1"),
      athlete_id: seededId("athlete", "2"),
      relationship_type: "parent",
      created_at: nowOffset(240),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      marketing_contact_id: seededId("contact", "2"),
      athlete_id: seededId("athlete", "3"),
      relationship_type: "guardian",
      created_at: nowOffset(190),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      marketing_contact_id: seededId("contact", "3"),
      athlete_id: seededId("athlete", "4"),
      relationship_type: "parent",
      created_at: nowOffset(120),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      marketing_contact_id: seededId("contact", "4"),
      athlete_id: seededId("athlete", "5"),
      relationship_type: "parent",
      created_at: nowOffset(80),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      marketing_contact_id: seededId("contact", "5"),
      athlete_id: seededId("athlete", "6"),
      relationship_type: "parent",
      created_at: nowOffset(60),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      marketing_contact_id: seededId("contact", "8"),
      athlete_id: seededId("athlete", "7"),
      relationship_type: "parent",
      created_at: nowOffset(12),
    },
  ];

  const events: MarketingEvent[] = [
    {
      academy_id: DEMO_ACADEMY_ID,
      event_id: seededId("event", "summer-elite-camp"),
      season_id: "summer-2025",
      name: "Summer Elite Camp 2025",
      event_type: "camp",
      starts_at: nowOffset(220),
      ends_at: nowOffset(215),
      status: "completed",
      created_at: nowOffset(260),
      updated_at: nowOffset(215),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      event_id: seededId("event", "spring-skills-clinic"),
      season_id: "spring-2026",
      name: "Spring Skills Clinic",
      event_type: "clinic",
      starts_at: nowOffset(18),
      ends_at: nowOffset(17),
      status: "completed",
      created_at: nowOffset(45),
      updated_at: nowOffset(17),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      event_id: seededId("event", "fall-season-registration"),
      season_id: "fall-2026",
      name: "Fall Season Registration",
      event_type: "season_registration",
      starts_at: nowOffset(-15),
      ends_at: nowOffset(-75),
      status: "open",
      created_at: nowOffset(4),
      updated_at: nowOffset(1),
    },
  ];

  const registrations: MarketingRegistration[] = [
    {
      academy_id: DEMO_ACADEMY_ID,
      registration_id: seededId("registration", "1"),
      event_id: seededId("event", "summer-elite-camp"),
      athlete_id: seededId("athlete", "1"),
      registration_status: "completed",
      attendance_status: "attended",
      registered_at: nowOffset(230),
      created_at: nowOffset(230),
      updated_at: nowOffset(215),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      registration_id: seededId("registration", "2"),
      event_id: seededId("event", "summer-elite-camp"),
      athlete_id: seededId("athlete", "2"),
      registration_status: "completed",
      attendance_status: "attended",
      registered_at: nowOffset(228),
      created_at: nowOffset(228),
      updated_at: nowOffset(215),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      registration_id: seededId("registration", "3"),
      event_id: seededId("event", "spring-skills-clinic"),
      athlete_id: seededId("athlete", "3"),
      registration_status: "waitlisted",
      attendance_status: "unknown",
      registered_at: nowOffset(24),
      created_at: nowOffset(24),
      updated_at: nowOffset(20),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      registration_id: seededId("registration", "4"),
      event_id: seededId("event", "spring-skills-clinic"),
      athlete_id: seededId("athlete", "4"),
      registration_status: "completed",
      attendance_status: "attended",
      registered_at: nowOffset(21),
      created_at: nowOffset(21),
      updated_at: nowOffset(17),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      registration_id: seededId("registration", "5"),
      event_id: seededId("event", "spring-skills-clinic"),
      athlete_id: seededId("athlete", "5"),
      registration_status: "completed",
      attendance_status: "absent",
      registered_at: nowOffset(20),
      created_at: nowOffset(20),
      updated_at: nowOffset(17),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      registration_id: seededId("registration", "6"),
      event_id: seededId("event", "fall-season-registration"),
      athlete_id: seededId("athlete", "6"),
      registration_status: "pending",
      attendance_status: "unknown",
      registered_at: nowOffset(3),
      created_at: nowOffset(3),
      updated_at: nowOffset(2),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      registration_id: seededId("registration", "7"),
      event_id: seededId("event", "fall-season-registration"),
      athlete_id: seededId("athlete", "7"),
      registration_status: "completed",
      attendance_status: "unknown",
      registered_at: nowOffset(2),
      created_at: nowOffset(2),
      updated_at: nowOffset(1),
    },
  ];

  const transactions: MarketingSuccessfulTransaction[] = [
    {
      academy_id: DEMO_ACADEMY_ID,
      payment_id: seededId("payment", "1"),
      registration_id: seededId("registration", "1"),
      event_id: seededId("event", "summer-elite-camp"),
      athlete_id: seededId("athlete", "1"),
      paid_at: nowOffset(229),
      created_at: nowOffset(229),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      payment_id: seededId("payment", "2"),
      registration_id: seededId("registration", "2"),
      event_id: seededId("event", "summer-elite-camp"),
      athlete_id: seededId("athlete", "2"),
      paid_at: nowOffset(227),
      created_at: nowOffset(227),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      payment_id: seededId("payment", "3"),
      registration_id: seededId("registration", "4"),
      event_id: seededId("event", "spring-skills-clinic"),
      athlete_id: seededId("athlete", "4"),
      paid_at: nowOffset(20),
      created_at: nowOffset(20),
    },
    {
      academy_id: DEMO_ACADEMY_ID,
      payment_id: seededId("payment", "4"),
      registration_id: seededId("registration", "7"),
      event_id: seededId("event", "fall-season-registration"),
      athlete_id: seededId("athlete", "7"),
      paid_at: nowOffset(1),
      created_at: nowOffset(1),
    },
  ];

  const suppressions: MarketingSuppression[] = [
    {
      id: seededId("suppression", "1"),
      academy_id: DEMO_ACADEMY_ID,
      email: "sophia.green@example.com",
      normalized_email: "sophia.green@example.com",
      reason: "unsubscribe",
      source: "user",
      note: "Opted out from previous newsletter.",
      created_at: nowOffset(9),
    },
  ];

  const campaigns: MarketingCampaign[] = [
    {
      id: seededId("campaign", "1"),
      academy_id: DEMO_ACADEMY_ID,
      name: "Summer alumni reactivation",
      subject: "Camp families, we saved you a spot for this season",
      preview_text: "A fast way back into this season's lineup.",
      body_html: "<p>We'd love to have your family back this season.</p>",
      body_text: "We'd love to have your family back this season.",
      from_name: "Tenpo Academy",
      from_email: "hello@tenpo.academy",
      reply_to_email: "coaches@tenpo.academy",
      status: "sent",
      audience_definition: { presetId: "lapsed-families" },
      scheduled_at: null,
      sent_at: nowOffset(14),
      created_by_user_id: DEMO_USER_ID,
      created_at: nowOffset(16),
      updated_at: nowOffset(14),
    },
    {
      id: seededId("campaign", "2"),
      academy_id: DEMO_ACADEMY_ID,
      name: "Waitlist conversion push",
      subject: "Extra clinic spots opened up",
      preview_text: "Waitlisted families can book now.",
      body_html: "<p>Spots just opened up for the Spring Skills Clinic.</p>",
      body_text: "Spots just opened up for the Spring Skills Clinic.",
      from_name: "Tenpo Academy",
      from_email: "hello@tenpo.academy",
      reply_to_email: "coaches@tenpo.academy",
      status: "draft",
      audience_definition: { presetId: "event-waitlist" },
      scheduled_at: null,
      sent_at: null,
      created_by_user_id: DEMO_USER_ID,
      created_at: nowOffset(6),
      updated_at: nowOffset(4),
    },
    {
      id: seededId("campaign", "3"),
      academy_id: DEMO_ACADEMY_ID,
      name: "Fall season early access",
      subject: "Registration is open for fall",
      preview_text: "Returning families get first access.",
      body_html: "<p>Fall season registration is officially open.</p>",
      body_text: "Fall season registration is officially open.",
      from_name: "Tenpo Academy",
      from_email: "hello@tenpo.academy",
      reply_to_email: "coaches@tenpo.academy",
      status: "scheduled",
      audience_definition: { presetId: "paid-families" },
      scheduled_at: nowOffset(-2),
      sent_at: null,
      created_by_user_id: DEMO_USER_ID,
      created_at: nowOffset(1),
      updated_at: nowOffset(1),
    },
  ];

  const imports: MarketingImportBatch[] = [
    {
      id: seededId("import", "1"),
      academy_id: DEMO_ACADEMY_ID,
      uploaded_by_user_id: DEMO_USER_ID,
      source_provider: "mailchimp",
      file_name: "spring-newsletter.csv",
      status: "completed",
      total_rows: 482,
      imported_rows: 430,
      merged_rows: 52,
      invalid_rows: 0,
      error_message: null,
      created_at: nowOffset(190),
      completed_at: nowOffset(189),
      updated_at: nowOffset(189),
    },
    {
      id: seededId("import", "2"),
      academy_id: DEMO_ACADEMY_ID,
      uploaded_by_user_id: DEMO_USER_ID,
      source_provider: "csv",
      file_name: "winter-alumni.csv",
      status: "completed",
      total_rows: 112,
      imported_rows: 75,
      merged_rows: 32,
      invalid_rows: 5,
      error_message: null,
      created_at: nowOffset(80),
      completed_at: nowOffset(79),
      updated_at: nowOffset(79),
    },
  ];

  const savedSegments: MarketingSavedSegment[] = [
    {
      id: seededId("segment", "1"),
      academy_id: DEMO_ACADEMY_ID,
      name: "Lapsed paid families",
      description: "Families who have paid before but have not registered recently.",
      segment_scope: "contact",
      filter_definition: {
        presetId: "lapsed-families",
        filters: { paidEver: true, inactiveForDays: 180, isSuppressed: false },
      },
      created_by_user_id: DEMO_USER_ID,
      created_at: nowOffset(7),
      updated_at: nowOffset(7),
    },
    {
      id: seededId("segment", "2"),
      academy_id: DEMO_ACADEMY_ID,
      name: "Spring clinic waitlist",
      description: "Waitlisted families for the most recent clinic.",
      segment_scope: "event",
      filter_definition: {
        presetId: "event-waitlist",
        filters: {
          eventIds: [seededId("event", "spring-skills-clinic")],
          waitlistedOnly: true,
          isSuppressed: false,
        },
      },
      created_by_user_id: DEMO_USER_ID,
      created_at: nowOffset(5),
      updated_at: nowOffset(5),
    },
  ];

  return {
    marketing_contacts: contacts,
    marketing_contact_athletes: contactAthletes,
    marketing_events: events,
    marketing_registrations: registrations,
    marketing_successful_transactions: transactions,
    marketing_suppressions: suppressions,
    marketing_campaigns: campaigns,
    marketing_import_batches: imports,
    marketing_saved_segments: savedSegments,
  };
}

const globalForMarketing = globalThis as typeof globalThis & {
  __marketingMockState?: MarketingMockState;
};

export function getMarketingMockState() {
  if (!globalForMarketing.__marketingMockState) {
    globalForMarketing.__marketingMockState = buildInitialState();
  }

  return globalForMarketing.__marketingMockState;
}
