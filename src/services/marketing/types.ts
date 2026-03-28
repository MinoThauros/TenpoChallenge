export type MarketingContactCreatedVia = "tenpo" | "import" | "manual";
export type MarketingRegistrationStatus =
  | "pending"
  | "completed"
  | "waitlisted"
  | "canceled"
  | "refunded";
export type MarketingAttendanceStatus =
  | "unknown"
  | "attended"
  | "absent"
  | "no_show"
  | "canceled";
export type MarketingSuppressionReason =
  | "unsubscribe"
  | "bounce"
  | "complaint"
  | "manual";
export type MarketingSuppressionSource = "user" | "system" | "provider" | "import";
export type MarketingCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "canceled";
export type MarketingImportBatchStatus = "processing" | "completed" | "failed";
export type MarketingImportSourceProvider =
  | "csv"
  | "mailchimp"
  | "mailerlite"
  | "constant_contact"
  | "other";
export type MarketingRelationshipType = "parent" | "guardian" | "other";
export type MarketingSegmentScope = "contact" | "event";

export interface MarketingContact {
  id: string;
  academy_id: string;
  email: string;
  normalized_email: string;
  first_name: string | null;
  last_name: string | null;
  created_via: MarketingContactCreatedVia;
  import_batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingContactAthleteLink {
  academy_id: string;
  marketing_contact_id: string;
  athlete_id: string;
  relationship_type: MarketingRelationshipType | null;
  created_at: string;
}

export interface MarketingEvent {
  academy_id: string;
  event_id: string;
  season_id: string | null;
  name: string;
  event_type: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingRegistration {
  academy_id: string;
  registration_id: string;
  event_id: string;
  athlete_id: string;
  registration_status: MarketingRegistrationStatus;
  attendance_status: MarketingAttendanceStatus | null;
  registered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingSuccessfulTransaction {
  academy_id: string;
  payment_id: string;
  registration_id: string | null;
  event_id: string;
  athlete_id: string;
  paid_at: string;
  created_at: string;
}

export interface MarketingSuppression {
  id: string;
  academy_id: string;
  email: string;
  normalized_email: string;
  reason: MarketingSuppressionReason;
  source: MarketingSuppressionSource;
  note: string | null;
  created_at: string;
}

export interface MarketingImportBatch {
  id: string;
  academy_id: string;
  uploaded_by_user_id: string | null;
  source_provider: MarketingImportSourceProvider;
  file_name: string;
  status: MarketingImportBatchStatus;
  total_rows: number;
  imported_rows: number;
  merged_rows: number;
  invalid_rows: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface MarketingCampaign {
  id: string;
  academy_id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  body_html: string;
  body_text: string | null;
  from_name: string | null;
  from_email: string;
  reply_to_email: string | null;
  status: MarketingCampaignStatus;
  audience_definition: Record<string, unknown>;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingSavedSegment {
  id: string;
  academy_id: string;
  name: string;
  description: string | null;
  segment_scope: MarketingSegmentScope;
  filter_definition: Record<string, unknown>;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingContactSegmentFact {
  academy_id: string;
  marketing_contact_id: string;
  email: string;
  normalized_email: string;
  first_name: string | null;
  last_name: string | null;
  created_via: MarketingContactCreatedVia;
  import_batch_id: string | null;
  created_at: string;
  updated_at: string;
  athlete_count: number;
  has_linked_athlete: boolean;
  has_multiple_athletes: boolean;
  total_registrations: number;
  total_successful_transactions: number;
  waitlisted_registrations_count: number;
  canceled_registrations_count: number;
  refunded_registrations_count: number;
  attended_registrations_count: number;
  registered_ever: boolean;
  paid_ever: boolean;
  registered_but_never_paid: boolean;
  first_registered_at: string | null;
  last_registered_at: string | null;
  last_paid_at: string | null;
  registered_in_last_30d: boolean;
  registered_in_last_60d: boolean;
  registered_in_last_90d: boolean;
  inactive_90d: boolean;
  inactive_180d: boolean;
  is_suppressed: boolean;
  suppression_reason: MarketingSuppressionReason | null;
}

export interface MarketingContactEventSegmentFact {
  academy_id: string;
  marketing_contact_id: string;
  email: string;
  normalized_email: string;
  first_name: string | null;
  last_name: string | null;
  event_id: string;
  season_id: string | null;
  event_name: string;
  event_type: string | null;
  starts_at: string | null;
  ends_at: string | null;
  total_registrations: number;
  total_successful_transactions: number;
  waitlisted_registrations_count: number;
  canceled_registrations_count: number;
  refunded_registrations_count: number;
  attended_registrations_count: number;
  has_registration: boolean;
  has_successful_transaction: boolean;
  registered_but_unpaid: boolean;
  first_registered_at: string | null;
  last_registered_at: string | null;
  last_paid_at: string | null;
  is_suppressed: boolean;
  suppression_reason: MarketingSuppressionReason | null;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  data: T[];
  count: number | null;
  page: number;
  pageSize: number;
}

export interface AudienceSummary {
  matchingContacts: number;
  suppressedContacts: number;
  paidContacts: number;
  importedContacts: number;
  eventScoped: boolean;
}

export interface AudienceMetadataOption {
  id: string;
  label: string;
}

export interface AudienceMetadata {
  events: AudienceMetadataOption[];
  seasons: AudienceMetadataOption[];
  eventTypes: AudienceMetadataOption[];
}

export interface ContactSegmentFilters {
  search?: string;
  createdVia?: MarketingContactCreatedVia[];
  importBatchIds?: string[];
  isSuppressed?: boolean;
  hasLinkedAthlete?: boolean;
  hasMultipleAthletes?: boolean;
  registeredEver?: boolean;
  paidEver?: boolean;
  registeredButNeverPaid?: boolean;
  registeredWithinDays?: number;
  inactiveForDays?: number;
}

export interface ContactEventSegmentFilters {
  search?: string;
  eventIds?: string[];
  seasonIds?: string[];
  eventTypes?: string[];
  isSuppressed?: boolean;
  hasRegistration?: boolean;
  hasSuccessfulTransaction?: boolean;
  registeredButUnpaid?: boolean;
  waitlistedOnly?: boolean;
  attendedOnly?: boolean;
}

export interface SegmentPreset<TFilters> {
  id: string;
  label: string;
  description: string;
  filters: TFilters;
}

export interface ContactSegmentQueryInput extends PaginationInput {
  presetId?: string;
  filters?: ContactSegmentFilters;
}

export interface ContactEventSegmentQueryInput extends PaginationInput {
  presetId?: string;
  filters?: ContactEventSegmentFilters;
}

export interface UpsertMarketingContactInput {
  academy_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  created_via?: MarketingContactCreatedVia;
  import_batch_id?: string | null;
}

export interface LinkMarketingContactAthleteInput {
  academy_id: string;
  marketing_contact_id: string;
  athlete_id: string;
  relationship_type?: MarketingRelationshipType | null;
}

export interface UpsertMarketingEventInput {
  academy_id: string;
  event_id: string;
  season_id?: string | null;
  name: string;
  event_type?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string | null;
}

export interface UpsertMarketingRegistrationInput {
  academy_id: string;
  registration_id: string;
  event_id: string;
  athlete_id: string;
  registration_status: MarketingRegistrationStatus;
  attendance_status?: MarketingAttendanceStatus | null;
  registered_at?: string | null;
}

export interface RecordSuccessfulTransactionInput {
  academy_id: string;
  payment_id: string;
  registration_id?: string | null;
  event_id: string;
  athlete_id: string;
  paid_at: string;
}

export interface CreateMarketingImportBatchInput {
  academy_id: string;
  uploaded_by_user_id?: string | null;
  source_provider?: MarketingImportSourceProvider;
  file_name: string;
  total_rows?: number;
}

export interface CompleteMarketingImportBatchInput {
  id: string;
  imported_rows: number;
  merged_rows?: number;
  invalid_rows?: number;
}

export interface FailMarketingImportBatchInput {
  id: string;
  error_message: string;
}

export interface CreateMarketingCampaignInput {
  academy_id: string;
  name: string;
  subject: string;
  preview_text?: string | null;
  body_html?: string;
  body_text?: string | null;
  from_name?: string | null;
  from_email: string;
  reply_to_email?: string | null;
  audience_definition?: Record<string, unknown>;
  scheduled_at?: string | null;
  created_by_user_id?: string | null;
}

export interface UpdateMarketingCampaignStatusInput {
  id: string;
  status: MarketingCampaignStatus;
  sent_at?: string | null;
  scheduled_at?: string | null;
}

export interface CreateMarketingSuppressionInput {
  academy_id: string;
  email: string;
  reason: MarketingSuppressionReason;
  source?: MarketingSuppressionSource;
  note?: string | null;
}

export interface ListMarketingCampaignsInput extends PaginationInput {
  academyId: string;
  search?: string;
}

export interface ListMarketingImportBatchesInput extends PaginationInput {
  academyId: string;
}

export interface CreateMarketingSavedSegmentInput {
  academy_id: string;
  name: string;
  description?: string | null;
  segment_scope: MarketingSegmentScope;
  filter_definition: Record<string, unknown>;
  created_by_user_id?: string | null;
}

export interface UpdateMarketingSavedSegmentInput {
  id: string;
  name?: string;
  description?: string | null;
  segment_scope?: MarketingSegmentScope;
  filter_definition?: Record<string, unknown>;
}
