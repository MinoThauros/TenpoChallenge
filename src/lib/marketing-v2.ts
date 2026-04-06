import type { ContactEventSegmentFilters } from '@/lib/marketing-services';
import type { MarketingContactEventSegmentFact } from '@/lib/marketing-services';

export type MarketingV2RuleStatus =
  | 'registered'
  | 'attended'
  | 'waitlisted'
  | 'paid'
  | 'unpaid';

export type MarketingV2AudienceRule = {
  id: string;
  eventId: string;
  eventLabel: string;
  status: MarketingV2RuleStatus;
};

export const marketingV2StatusOptions: Array<{
  value: MarketingV2RuleStatus;
  label: string;
  description: string;
}> = [
  {
    value: 'registered',
    label: 'Registered',
    description: 'Families who registered for the event.',
  },
  {
    value: 'attended',
    label: 'Attended',
    description: 'Families tied to athletes who attended.',
  },
  {
    value: 'waitlisted',
    label: 'Waitlisted',
    description: 'Families still sitting on the waitlist.',
  },
  {
    value: 'paid',
    label: 'Paid',
    description: 'Families with a successful payment for the event.',
  },
  {
    value: 'unpaid',
    label: 'Unpaid',
    description: 'Families who registered but have not paid yet.',
  },
];

export function createEmptyMarketingV2Rule() {
  return {
    id: crypto.randomUUID(),
    eventId: '',
    eventLabel: '',
    status: 'registered' as MarketingV2RuleStatus,
  };
}

export function buildEventFiltersForRule(
  rule: MarketingV2AudienceRule,
): ContactEventSegmentFilters {
  return {
    eventIds: rule.eventId ? [rule.eventId] : undefined,
    isSuppressed: false,
    hasRegistration: rule.status === 'registered' ? true : undefined,
    attendedOnly: rule.status === 'attended' ? true : undefined,
    waitlistedOnly: rule.status === 'waitlisted' ? true : undefined,
    hasSuccessfulTransaction: rule.status === 'paid' ? true : undefined,
    registeredButUnpaid: rule.status === 'unpaid' ? true : undefined,
  };
}

export function buildLegacyEventFiltersFromRules(
  rules: MarketingV2AudienceRule[],
): ContactEventSegmentFilters | null {
  if (!rules.length) {
    return null;
  }

  const [firstRule] = rules;
  const allSameStatus = rules.every((rule) => rule.status === firstRule.status);

  if (!allSameStatus) {
    return null;
  }

  return {
    eventIds: rules.map((rule) => rule.eventId),
    isSuppressed: false,
    hasRegistration: firstRule.status === 'registered' ? true : undefined,
    attendedOnly: firstRule.status === 'attended' ? true : undefined,
    waitlistedOnly: firstRule.status === 'waitlisted' ? true : undefined,
    hasSuccessfulTransaction: firstRule.status === 'paid' ? true : undefined,
    registeredButUnpaid: firstRule.status === 'unpaid' ? true : undefined,
  };
}

export function buildMarketingV2AudienceDefinition(
  rules: MarketingV2AudienceRule[],
  excludedContactIds: string[] = [],
) {
  const legacyFilters = buildLegacyEventFiltersFromRules(rules);

  return {
    presetId: null,
    segment_scope: 'event',
    filters: legacyFilters ?? undefined,
    v2_event_rules: rules.map((rule) => ({
      event_id: rule.eventId,
      event_label: rule.eventLabel,
      status: rule.status,
    })),
    excluded_contact_ids: excludedContactIds,
    v2_legacy_compatible: Boolean(legacyFilters),
  };
}

export function formatMarketingV2MatchingActivity(
  eventName: string,
  status: MarketingV2RuleStatus,
) {
  switch (status) {
    case 'attended':
      return `Attended ${eventName}`;
    case 'paid':
      return `Paid for ${eventName}`;
    case 'registered':
      return `Registered for ${eventName}`;
    case 'unpaid':
      return `Unpaid for ${eventName}`;
    case 'waitlisted':
      return `Waitlisted for ${eventName}`;
    default:
      return eventName;
  }
}

export function getMarketingV2ActivityDate(
  row: MarketingContactEventSegmentFact,
  status: MarketingV2RuleStatus,
) {
  switch (status) {
    case 'attended':
      return row.ends_at ?? row.starts_at ?? row.last_registered_at ?? row.first_registered_at;
    case 'paid':
      return row.last_paid_at ?? row.last_registered_at ?? row.first_registered_at ?? row.starts_at;
    case 'registered':
      return row.last_registered_at ?? row.first_registered_at ?? row.starts_at;
    case 'unpaid':
      return row.last_registered_at ?? row.first_registered_at ?? row.starts_at;
    case 'waitlisted':
      return row.last_registered_at ?? row.first_registered_at ?? row.starts_at;
    default:
      return row.starts_at ?? row.last_registered_at ?? row.first_registered_at;
  }
}
