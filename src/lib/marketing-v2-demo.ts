import type {
  AudienceMetadata,
  MarketingCampaign,
  MarketingCampaignDispatchState,
  MarketingDispatchRecipientActivity,
} from '@/lib/marketing-services';

const MARKETING_V2_DEMO_CAMPAIGNS_KEY = 'marketing-v2-demo-campaigns';
const MARKETING_V2_DEMO_DISPATCHES_KEY = 'marketing-v2-demo-dispatches';
const MARKETING_V2_DEMO_RECIPIENT_ACTIVITY_KEY = 'marketing-v2-demo-recipient-activity';
const MARKETING_V2_DEMO_SEED_VERSION_KEY = 'marketing-v2-demo-seed-version';
const MARKETING_V2_DEMO_SEED_VERSION = '2026-04-05-v1';

function hasWindow() {
  return typeof window !== 'undefined';
}

function readStoredArray<T>(key: string, guard: (value: unknown) => value is T) {
  if (!hasWindow()) {
    return [] as T[];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [] as T[];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as T[];
    }

    return parsed.filter(guard);
  } catch {
    return [] as T[];
  }
}

function writeStoredArray<T>(key: string, values: T[]) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(values));
}

function isMarketingCampaign(value: unknown): value is MarketingCampaign {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MarketingCampaign>;

  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.subject === 'string'
    && typeof candidate.status === 'string'
    && typeof candidate.created_at === 'string'
    && typeof candidate.updated_at === 'string';
}

function isMarketingCampaignDispatchState(value: unknown): value is MarketingCampaignDispatchState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MarketingCampaignDispatchState>;

  return typeof candidate.dispatch_id === 'string'
    && typeof candidate.campaign_id === 'string'
    && typeof candidate.dispatch_status === 'string'
    && typeof candidate.inserted_at === 'string'
    && typeof candidate.updated_at === 'string';
}

function isMarketingDispatchRecipientActivity(value: unknown): value is MarketingDispatchRecipientActivity {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MarketingDispatchRecipientActivity>;

  return typeof candidate.dispatch_recipient_id === 'string'
    && typeof candidate.dispatch_id === 'string'
    && typeof candidate.campaign_id === 'string'
    && typeof candidate.recipient_email === 'string'
    && typeof candidate.recipient_status === 'string';
}

function isoShift(base: Date, days = 0, hours = 0, minutes = 0) {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  value.setHours(value.getHours() + hours);
  value.setMinutes(value.getMinutes() + minutes);
  return value.toISOString();
}

function atLocalTime(base: Date, days = 0, hours = 9, minutes = 0) {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
}

function buildAudienceDefinition(eventId: string, eventLabel: string, status: string) {
  return {
    v2_event_rules: [
      {
        event_id: eventId,
        event_label: eventLabel,
        status,
      },
    ],
    excluded_contact_ids: [],
  };
}

function buildSeedCampaign(params: {
  id: string;
  name: string;
  subject: string;
  status: MarketingCampaign['status'];
  scheduledAt: string | null;
  sentAt?: string | null;
  audienceDefinition: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  bodyHtml: string;
}) {
  return {
    id: params.id,
    academy_id: 'marketing-v2-demo-academy',
    name: params.name,
    subject: params.subject,
    preview_text: null,
    body_html: params.bodyHtml,
    body_text: params.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    from_name: 'Tenpo Academy',
    from_email: 'hello@tenpo.academy',
    reply_to_email: null,
    status: params.status,
    audience_definition: params.audienceDefinition,
    scheduled_at: params.scheduledAt,
    sent_at: params.sentAt ?? null,
    created_by_user_id: null,
    created_at: params.createdAt,
    updated_at: params.updatedAt,
  } satisfies MarketingCampaign;
}

function buildDispatchState(params: {
  dispatchId: string;
  campaignId: string;
  status: MarketingCampaignDispatchState['dispatch_status'];
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  insertedAt: string;
  updatedAt: string;
  totalRecipients: number;
  pendingRecipients: number;
  sentRecipients: number;
  retryScheduledRecipients: number;
  failedRecipients: number;
  canceledRecipients?: number;
  sentPercent: number;
  lastSentAt?: string | null;
  lastAttemptedAt?: string | null;
}) {
  return {
    dispatch_id: params.dispatchId,
    academy_id: 'marketing-v2-demo-academy',
    campaign_id: params.campaignId,
    sender_mailbox_id: null,
    dispatch_status: params.status,
    scheduled_at: params.scheduledAt,
    started_at: params.startedAt,
    finished_at: params.finishedAt,
    inserted_at: params.insertedAt,
    updated_at: params.updatedAt,
    total_recipients: params.totalRecipients,
    pending_recipients: params.pendingRecipients,
    leased_recipients: 0,
    sent_recipients: params.sentRecipients,
    retry_scheduled_recipients: params.retryScheduledRecipients,
    failed_recipients: params.failedRecipients,
    suppressed_recipients: 0,
    canceled_recipients: params.canceledRecipients ?? 0,
    total_attempts: params.totalRecipients + params.retryScheduledRecipients + params.failedRecipients,
    last_attempted_at: params.lastAttemptedAt ?? params.updatedAt,
    last_sent_at: params.lastSentAt ?? params.updatedAt,
    sent_percent: params.sentPercent,
  } satisfies MarketingCampaignDispatchState;
}

function buildRecipientActivity(params: {
  dispatchId: string;
  campaignId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  recipientStatus: MarketingDispatchRecipientActivity['recipient_status'];
  dispatchStatus: MarketingDispatchRecipientActivity['dispatch_status'];
  insertedAt: string;
  updatedAt: string;
  sentAt?: string | null;
  lastErrorMessage?: string | null;
  attemptCount?: number;
  latestAttemptStatus?: MarketingDispatchRecipientActivity['latest_attempt_status'];
}) {
  return {
    dispatch_recipient_id: `${params.dispatchId}-${params.contactId}`,
    dispatch_id: params.dispatchId,
    campaign_id: params.campaignId,
    academy_id: 'marketing-v2-demo-academy',
    marketing_contact_id: params.contactId,
    first_name: params.firstName,
    last_name: params.lastName,
    contact_email: params.email,
    recipient_email: params.email,
    recipient_status: params.recipientStatus,
    sent_at: params.sentAt ?? null,
    attempt_count: params.attemptCount ?? 1,
    last_error_message: params.lastErrorMessage ?? null,
    provider_message_id: params.sentAt ? `provider-${params.contactId}` : null,
    inserted_at: params.insertedAt,
    updated_at: params.updatedAt,
    dispatch_status: params.dispatchStatus,
    latest_attempt_status: params.latestAttemptStatus ?? (params.recipientStatus === 'sent' ? 'sent' : null),
    latest_attempt_requested_at: params.updatedAt,
    latest_attempt_completed_at: params.updatedAt,
    latest_attempt_retry_after: params.recipientStatus === 'retry_scheduled' ? isoShift(new Date(params.updatedAt), 0, 1, 0) : null,
    latest_attempt_provider_message_id: params.sentAt ? `provider-${params.contactId}` : null,
    latest_attempt_error_message: params.lastErrorMessage ?? null,
  } satisfies MarketingDispatchRecipientActivity;
}

function buildSeedBody(title: string, lines: string[]) {
  return [
    '<p>Hi families,</p>',
    `<p>${title}</p>`,
    '<ul>',
    ...lines.map((line) => `<li>${line}</li>`),
    '</ul>',
    '<p>Thanks,<br/>Tenpo Academy</p>',
  ].join('');
}

function pickSeedEvents(metadata: AudienceMetadata) {
  const events = metadata.events.slice(0, 4);

  const fallbackEvents = [
    { id: 'demo-event-1', label: 'Spring Break Camp' },
    { id: 'demo-event-2', label: 'Summer Skills Clinic' },
    { id: 'demo-event-3', label: 'Winter Showcase' },
    { id: 'demo-event-4', label: 'Elite Tryout' },
  ];

  return fallbackEvents.map((fallbackEvent, index) => events[index] ?? fallbackEvent);
}

function buildSeedDataset(metadata: AudienceMetadata) {
  const now = new Date();
  const [springCamp, summerClinic, winterShowcase, eliteTryout] = pickSeedEvents(metadata);

  const campaigns = [
    buildSeedCampaign({
      id: 'marketing-v2-demo-seeded-scheduled-future',
      name: 'Waitlist follow-up',
      subject: 'A few spots just opened up',
      status: 'scheduled',
      scheduledAt: atLocalTime(now, 2, 9, 0),
      audienceDefinition: buildAudienceDefinition(springCamp.id, springCamp.label, 'waitlisted'),
      createdAt: isoShift(now, -4, -2, 0),
      updatedAt: isoShift(now, -1, -1, 0),
      bodyHtml: buildSeedBody(
        'We opened a few spots for next week.',
        [
          'Reply if you want us to hold one for your family.',
          'Registration will stay open until tomorrow at noon.',
          'We can help if you have any questions.',
        ],
      ),
    }),
    buildSeedCampaign({
      id: 'marketing-v2-demo-seeded-scheduled-today',
      name: 'Today’s camp reminder',
      subject: 'A quick reminder before check-in',
      status: 'scheduled',
      scheduledAt: atLocalTime(now, 0, 17, 30),
      audienceDefinition: buildAudienceDefinition(summerClinic.id, summerClinic.label, 'registered'),
      createdAt: isoShift(now, -2, -4, 0),
      updatedAt: isoShift(now, -1, -5, 0),
      bodyHtml: buildSeedBody(
        'Here is everything families need before tonight.',
        [
          'Please arrive 10 minutes early for check-in.',
          'Bring indoor shoes and a water bottle.',
          'Reply if your family will be late.',
        ],
      ),
    }),
    buildSeedCampaign({
      id: 'marketing-v2-demo-seeded-sending',
      name: 'Tryout waitlist release',
      subject: 'We have a few openings in tryouts',
      status: 'sending',
      scheduledAt: isoShift(now, 0, -1, -15),
      audienceDefinition: {
        v2_event_rules: [
          {
            event_id: eliteTryout.id,
            event_label: eliteTryout.label,
            status: 'waitlisted',
          },
          {
            event_id: winterShowcase.id,
            event_label: winterShowcase.label,
            status: 'unpaid',
          },
        ],
        excluded_contact_ids: [],
      },
      createdAt: isoShift(now, -3, -3, 0),
      updatedAt: isoShift(now, 0, -1, -5),
      bodyHtml: buildSeedBody(
        'A few more places opened up for this round.',
        [
          'Confirm your spot before 6 PM.',
          'We will release any remaining spots after that.',
          'Reply if you want help finishing registration.',
        ],
      ),
    }),
    buildSeedCampaign({
      id: 'marketing-v2-demo-seeded-sent',
      name: 'Showcase thank you',
      subject: 'Thanks for joining us this weekend',
      status: 'sent',
      scheduledAt: atLocalTime(now, -2, 10, 0),
      sentAt: atLocalTime(now, -2, 10, 12),
      audienceDefinition: buildAudienceDefinition(winterShowcase.id, winterShowcase.label, 'attended'),
      createdAt: isoShift(now, -7, -3, 0),
      updatedAt: isoShift(now, -2, 11, 0),
      bodyHtml: buildSeedBody(
        'We loved having your family with us this weekend.',
        [
          'Photo highlights will go out later this week.',
          'Reply if you want the early registration link for next season.',
          'Thank you again for being part of the academy.',
        ],
      ),
    }),
    buildSeedCampaign({
      id: 'marketing-v2-demo-seeded-needs-attention',
      name: 'Payment reminder',
      subject: 'A quick note about unfinished registration',
      status: 'failed',
      scheduledAt: atLocalTime(now, -1, 16, 0),
      audienceDefinition: buildAudienceDefinition(summerClinic.id, summerClinic.label, 'unpaid'),
      createdAt: isoShift(now, -5, -2, 0),
      updatedAt: isoShift(now, -1, 17, 30),
      bodyHtml: buildSeedBody(
        'Some registrations were left unfinished.',
        [
          'You can reply if you want us to help complete payment.',
          'We will keep spots open through tomorrow afternoon.',
          'Please ignore this note if you already finished checkout.',
        ],
      ),
    }),
    buildSeedCampaign({
      id: 'marketing-v2-demo-seeded-draft',
      name: 'Early fall interest check',
      subject: 'Would your family like early access?',
      status: 'draft',
      scheduledAt: null,
      audienceDefinition: buildAudienceDefinition(springCamp.id, springCamp.label, 'paid'),
      createdAt: isoShift(now, -1, -8, 0),
      updatedAt: isoShift(now, -1, -1, 30),
      bodyHtml: buildSeedBody(
        'We are planning the next season and wanted to ask first.',
        [
          'Reply if your family wants early access to registration.',
          'We will use responses to shape the next schedule.',
          'No action needed if you are not interested right now.',
        ],
      ),
    }),
  ];

  const dispatchStates = [
    buildDispatchState({
      dispatchId: 'marketing-v2-demo-dispatch-sending',
      campaignId: 'marketing-v2-demo-seeded-sending',
      status: 'sending',
      scheduledAt: isoShift(now, 0, -1, -15),
      startedAt: isoShift(now, 0, -1, -10),
      finishedAt: null,
      insertedAt: isoShift(now, 0, -1, -15),
      updatedAt: isoShift(now, 0, -1, -2),
      totalRecipients: 18,
      pendingRecipients: 6,
      sentRecipients: 11,
      retryScheduledRecipients: 1,
      failedRecipients: 0,
      sentPercent: 61.1,
      lastSentAt: isoShift(now, 0, -1, -2),
      lastAttemptedAt: isoShift(now, 0, -1, -1),
    }),
    buildDispatchState({
      dispatchId: 'marketing-v2-demo-dispatch-sent',
      campaignId: 'marketing-v2-demo-seeded-sent',
      status: 'completed',
      scheduledAt: atLocalTime(now, -2, 10, 0),
      startedAt: atLocalTime(now, -2, 10, 0),
      finishedAt: atLocalTime(now, -2, 10, 12),
      insertedAt: atLocalTime(now, -2, 9, 55),
      updatedAt: atLocalTime(now, -2, 10, 12),
      totalRecipients: 24,
      pendingRecipients: 0,
      sentRecipients: 22,
      retryScheduledRecipients: 0,
      failedRecipients: 2,
      sentPercent: 100,
      lastSentAt: atLocalTime(now, -2, 10, 12),
      lastAttemptedAt: atLocalTime(now, -2, 10, 12),
    }),
    buildDispatchState({
      dispatchId: 'marketing-v2-demo-dispatch-failed',
      campaignId: 'marketing-v2-demo-seeded-needs-attention',
      status: 'failed',
      scheduledAt: atLocalTime(now, -1, 16, 0),
      startedAt: atLocalTime(now, -1, 16, 0),
      finishedAt: atLocalTime(now, -1, 16, 21),
      insertedAt: atLocalTime(now, -1, 15, 55),
      updatedAt: atLocalTime(now, -1, 16, 21),
      totalRecipients: 16,
      pendingRecipients: 0,
      sentRecipients: 9,
      retryScheduledRecipients: 3,
      failedRecipients: 4,
      sentPercent: 56.25,
      lastSentAt: atLocalTime(now, -1, 16, 14),
      lastAttemptedAt: atLocalTime(now, -1, 16, 21),
    }),
  ];

  const recipientActivity = [
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sending',
      campaignId: 'marketing-v2-demo-seeded-sending',
      contactId: 'contact-alvarez',
      firstName: 'Mia',
      lastName: 'Alvarez',
      email: 'mia.alvarez@example.com',
      recipientStatus: 'sent',
      dispatchStatus: 'sending',
      insertedAt: isoShift(now, 0, -1, -10),
      updatedAt: isoShift(now, 0, -1, -5),
      sentAt: isoShift(now, 0, -1, -5),
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sending',
      campaignId: 'marketing-v2-demo-seeded-sending',
      contactId: 'contact-bennett',
      firstName: 'Jordan',
      lastName: 'Bennett',
      email: 'jordan.bennett@example.com',
      recipientStatus: 'sent',
      dispatchStatus: 'sending',
      insertedAt: isoShift(now, 0, -1, -9),
      updatedAt: isoShift(now, 0, -1, -4),
      sentAt: isoShift(now, 0, -1, -4),
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sending',
      campaignId: 'marketing-v2-demo-seeded-sending',
      contactId: 'contact-chen',
      firstName: 'Lina',
      lastName: 'Chen',
      email: 'lina.chen@example.com',
      recipientStatus: 'retry_scheduled',
      dispatchStatus: 'sending',
      insertedAt: isoShift(now, 0, -1, -8),
      updatedAt: isoShift(now, 0, -1, -1),
      lastErrorMessage: 'Mailbox temporarily unavailable.',
      attemptCount: 2,
      latestAttemptStatus: 'retry_scheduled',
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sending',
      campaignId: 'marketing-v2-demo-seeded-sending',
      contactId: 'contact-davis',
      firstName: 'Avery',
      lastName: 'Davis',
      email: 'avery.davis@example.com',
      recipientStatus: 'pending',
      dispatchStatus: 'sending',
      insertedAt: isoShift(now, 0, -1, -7),
      updatedAt: isoShift(now, 0, -1, -1),
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sending',
      campaignId: 'marketing-v2-demo-seeded-sending',
      contactId: 'contact-ellis',
      firstName: 'Nora',
      lastName: 'Ellis',
      email: 'nora.ellis@example.com',
      recipientStatus: 'pending',
      dispatchStatus: 'sending',
      insertedAt: isoShift(now, 0, -1, -6),
      updatedAt: isoShift(now, 0, -1, -1),
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sent',
      campaignId: 'marketing-v2-demo-seeded-sent',
      contactId: 'contact-foster',
      firstName: 'Harper',
      lastName: 'Foster',
      email: 'harper.foster@example.com',
      recipientStatus: 'sent',
      dispatchStatus: 'completed',
      insertedAt: atLocalTime(now, -2, 10, 0),
      updatedAt: atLocalTime(now, -2, 10, 3),
      sentAt: atLocalTime(now, -2, 10, 3),
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sent',
      campaignId: 'marketing-v2-demo-seeded-sent',
      contactId: 'contact-garcia',
      firstName: 'Mateo',
      lastName: 'Garcia',
      email: 'mateo.garcia@example.com',
      recipientStatus: 'sent',
      dispatchStatus: 'completed',
      insertedAt: atLocalTime(now, -2, 10, 0),
      updatedAt: atLocalTime(now, -2, 10, 4),
      sentAt: atLocalTime(now, -2, 10, 4),
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sent',
      campaignId: 'marketing-v2-demo-seeded-sent',
      contactId: 'contact-hughes',
      firstName: 'Sofia',
      lastName: 'Hughes',
      email: 'sofia.hughes@example.com',
      recipientStatus: 'failed',
      dispatchStatus: 'completed',
      insertedAt: atLocalTime(now, -2, 10, 0),
      updatedAt: atLocalTime(now, -2, 10, 10),
      lastErrorMessage: 'Mailbox unavailable.',
      attemptCount: 2,
      latestAttemptStatus: 'failed',
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-sent',
      campaignId: 'marketing-v2-demo-seeded-sent',
      contactId: 'contact-irwin',
      firstName: 'Owen',
      lastName: 'Irwin',
      email: 'owen.irwin@example.com',
      recipientStatus: 'sent',
      dispatchStatus: 'completed',
      insertedAt: atLocalTime(now, -2, 10, 0),
      updatedAt: atLocalTime(now, -2, 10, 5),
      sentAt: atLocalTime(now, -2, 10, 5),
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-failed',
      campaignId: 'marketing-v2-demo-seeded-needs-attention',
      contactId: 'contact-johnson',
      firstName: 'Chloe',
      lastName: 'Johnson',
      email: 'chloe.johnson@example.com',
      recipientStatus: 'failed',
      dispatchStatus: 'failed',
      insertedAt: atLocalTime(now, -1, 16, 0),
      updatedAt: atLocalTime(now, -1, 16, 19),
      lastErrorMessage: 'Recipient server rejected the message.',
      attemptCount: 2,
      latestAttemptStatus: 'failed',
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-failed',
      campaignId: 'marketing-v2-demo-seeded-needs-attention',
      contactId: 'contact-kim',
      firstName: 'Ethan',
      lastName: 'Kim',
      email: 'ethan.kim@example.com',
      recipientStatus: 'retry_scheduled',
      dispatchStatus: 'failed',
      insertedAt: atLocalTime(now, -1, 16, 0),
      updatedAt: atLocalTime(now, -1, 16, 20),
      lastErrorMessage: 'Temporary provider timeout.',
      attemptCount: 2,
      latestAttemptStatus: 'retry_scheduled',
    }),
    buildRecipientActivity({
      dispatchId: 'marketing-v2-demo-dispatch-failed',
      campaignId: 'marketing-v2-demo-seeded-needs-attention',
      contactId: 'contact-lopez',
      firstName: 'Layla',
      lastName: 'Lopez',
      email: 'layla.lopez@example.com',
      recipientStatus: 'sent',
      dispatchStatus: 'failed',
      insertedAt: atLocalTime(now, -1, 16, 0),
      updatedAt: atLocalTime(now, -1, 16, 14),
      sentAt: atLocalTime(now, -1, 16, 14),
    }),
  ];

  return {
    campaigns,
    dispatchStates,
    recipientActivity,
  };
}

export function readMarketingV2DemoCampaigns() {
  return readStoredArray(MARKETING_V2_DEMO_CAMPAIGNS_KEY, isMarketingCampaign);
}

export function writeMarketingV2DemoCampaigns(campaigns: MarketingCampaign[]) {
  writeStoredArray(MARKETING_V2_DEMO_CAMPAIGNS_KEY, campaigns);
}

export function readMarketingV2DemoDispatchStates() {
  return readStoredArray(MARKETING_V2_DEMO_DISPATCHES_KEY, isMarketingCampaignDispatchState);
}

export function writeMarketingV2DemoDispatchStates(dispatchStates: MarketingCampaignDispatchState[]) {
  writeStoredArray(MARKETING_V2_DEMO_DISPATCHES_KEY, dispatchStates);
}

export function readMarketingV2DemoRecipientActivity() {
  return readStoredArray(
    MARKETING_V2_DEMO_RECIPIENT_ACTIVITY_KEY,
    isMarketingDispatchRecipientActivity,
  );
}

export function writeMarketingV2DemoRecipientActivity(recipientActivity: MarketingDispatchRecipientActivity[]) {
  writeStoredArray(MARKETING_V2_DEMO_RECIPIENT_ACTIVITY_KEY, recipientActivity);
}

export function ensureMarketingV2DemoSeedData(metadata: AudienceMetadata) {
  if (!hasWindow()) {
    return {
      campaigns: [] as MarketingCampaign[],
      dispatchStates: [] as MarketingCampaignDispatchState[],
      recipientActivity: [] as MarketingDispatchRecipientActivity[],
    };
  }

  const seedVersion = window.localStorage.getItem(MARKETING_V2_DEMO_SEED_VERSION_KEY);
  const existingCampaigns = readMarketingV2DemoCampaigns();
  const existingDispatchStates = readMarketingV2DemoDispatchStates();
  const existingRecipientActivity = readMarketingV2DemoRecipientActivity();

  if (
    seedVersion === MARKETING_V2_DEMO_SEED_VERSION
    && existingCampaigns.length
  ) {
    return {
      campaigns: existingCampaigns,
      dispatchStates: existingDispatchStates,
      recipientActivity: existingRecipientActivity,
    };
  }

  const seedData = buildSeedDataset(metadata);

  const userCampaigns = existingCampaigns.filter(
    (campaign) => !campaign.id.startsWith('marketing-v2-demo-seeded-'),
  );
  const userDispatchStates = existingDispatchStates.filter(
    (dispatchState) => !dispatchState.campaign_id.startsWith('marketing-v2-demo-seeded-'),
  );
  const userRecipientActivity = existingRecipientActivity.filter(
    (activity) => !activity.campaign_id.startsWith('marketing-v2-demo-seeded-'),
  );

  const nextCampaigns = [...userCampaigns, ...seedData.campaigns];
  const nextDispatchStates = [...userDispatchStates, ...seedData.dispatchStates];
  const nextRecipientActivity = [...userRecipientActivity, ...seedData.recipientActivity];

  writeMarketingV2DemoCampaigns(nextCampaigns);
  writeMarketingV2DemoDispatchStates(nextDispatchStates);
  writeMarketingV2DemoRecipientActivity(nextRecipientActivity);
  window.localStorage.setItem(MARKETING_V2_DEMO_SEED_VERSION_KEY, MARKETING_V2_DEMO_SEED_VERSION);

  return {
    campaigns: nextCampaigns,
    dispatchStates: nextDispatchStates,
    recipientActivity: nextRecipientActivity,
  };
}

export function saveMarketingV2DemoCampaign(campaign: MarketingCampaign) {
  const campaigns = readMarketingV2DemoCampaigns();
  const withoutCurrent = campaigns.filter((current) => current.id !== campaign.id);
  const nextCampaigns = [campaign, ...withoutCurrent];
  writeMarketingV2DemoCampaigns(nextCampaigns);
  return campaign;
}

export function readMarketingV2DemoCampaign(campaignId: string) {
  return readMarketingV2DemoCampaigns().find((campaign) => campaign.id === campaignId) ?? null;
}

export function readMarketingV2DemoDispatchStatesForCampaign(campaignId: string) {
  return readMarketingV2DemoDispatchStates().filter((dispatchState) => dispatchState.campaign_id === campaignId);
}

export function readMarketingV2DemoRecipientActivityForCampaign(campaignId: string) {
  return readMarketingV2DemoRecipientActivity().filter((activity) => activity.campaign_id === campaignId);
}

export function isMarketingV2DemoCampaign(campaignId: string) {
  return campaignId.startsWith('marketing-v2-demo-');
}

export function createMarketingV2DemoCampaign(input: {
  academyId?: string | null;
  createdByUserId?: string | null;
  name: string;
  subject: string;
  previewText?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
  fromName?: string | null;
  fromEmail: string;
  replyToEmail?: string | null;
  audienceDefinition: Record<string, unknown>;
  scheduledAt: string;
}) {
  const now = new Date().toISOString();

  return {
    id: `marketing-v2-demo-${crypto.randomUUID()}`,
    academy_id: input.academyId ?? 'marketing-v2-demo-academy',
    name: input.name,
    subject: input.subject,
    preview_text: input.previewText ?? null,
    body_html: input.bodyHtml,
    body_text: input.bodyText ?? null,
    from_name: input.fromName ?? 'Tenpo Academy',
    from_email: input.fromEmail,
    reply_to_email: input.replyToEmail ?? null,
    status: 'scheduled' as const,
    audience_definition: input.audienceDefinition,
    scheduled_at: input.scheduledAt,
    sent_at: null,
    created_by_user_id: input.createdByUserId ?? null,
    created_at: now,
    updated_at: now,
  } satisfies MarketingCampaign;
}
