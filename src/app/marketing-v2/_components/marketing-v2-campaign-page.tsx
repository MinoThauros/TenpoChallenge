'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  AudienceMetadata,
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  MarketingAthlete,
  MarketingCampaign,
  MarketingCampaignDispatchState,
  MarketingContactAthleteLink,
  MarketingDispatchRecipientActivity,
  Page,
  SegmentPreset,
} from '@/lib/marketing-services';
import {
  createEmptyMarketingV2Rule,
  buildMarketingV2AudienceDefinition,
  marketingV2StatusOptions,
  type MarketingV2AudienceRule,
  type MarketingV2RuleStatus,
} from '@/lib/marketing-v2';
import {
  ensureMarketingV2DemoSeedData,
  isMarketingV2DemoCampaign,
  readMarketingV2DemoCampaign,
  readMarketingV2DemoDispatchStatesForCampaign,
  readMarketingV2DemoRecipientActivityForCampaign,
  saveMarketingV2DemoCampaign,
} from '@/lib/marketing-v2-demo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TimePicker } from '@/components/ui/time-picker';
import { SimpleRichTextEditor, toPlainTextFromHtml } from './simple-rich-text-editor';

type MarketingV2BootstrapResponse = {
  contactPresets: SegmentPreset<ContactSegmentFilters>[];
  eventPresets: SegmentPreset<ContactEventSegmentFilters>[];
  metadata: AudienceMetadata;
};

type AudienceDefinition = {
  presetId?: string | null;
  segment_scope?: string | null;
  filters?: (ContactSegmentFilters & ContactEventSegmentFilters) | null;
  v2_event_rules?: Array<{
    event_id: string;
    event_label?: string | null;
    status: string;
  }>;
  excluded_contact_ids?: string[];
};

type AudiencePreviewFamily = {
  marketingContactId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  matchingActivities: Array<{
    eventId: string;
    eventName: string;
    label: string;
    at: string | null;
  }>;
};

type AudiencePreviewResponse = {
  summary: {
    matchingContacts: number;
  };
  results: {
    data: AudiencePreviewFamily[];
    count: number | null;
    page: number;
    pageSize: number;
  };
};

function chooseDispatchState(dispatchStates: MarketingCampaignDispatchState[]) {
  const activeDispatch = dispatchStates.find((dispatchState) => dispatchState.dispatch_status === 'sending');

  if (activeDispatch) {
    return activeDispatch;
  }

  return [...dispatchStates].sort((left, right) =>
    new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  )[0] ?? null;
}

function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  return fetch(input, init).then(async (response) => {
    if (!response.ok) {
      let message = `Request failed with status ${response.status}.`;

      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error) {
          message = payload.error;
        }
      } catch {
        // Keep the fallback message when JSON parsing fails.
      }

      throw new Error(message);
    }

    return response.json() as Promise<T>;
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toScheduleEditorState(value?: string | null) {
  if (!value) {
    return {
      date: undefined,
      time: '',
    };
  }

  const date = new Date(value);

  return {
    date,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  };
}

function formatSenderDisplay(name?: string | null, email?: string | null) {
  if (name && email) {
    return `${name} <${email}>`;
  }

  return name || email || '—';
}

function campaignHeaderCopy(
  campaign: MarketingCampaign,
  dispatchState: MarketingCampaignDispatchState | null,
) {
  if (campaign.status === 'failed') {
    const failedRecipients = dispatchState?.failed_recipients ?? 0;
    const delayedRecipients = dispatchState?.retry_scheduled_recipients ?? 0;

    if (delayedRecipients > 0) {
      return `Delivery is taking a little longer for ${delayedRecipients} ${delayedRecipients === 1 ? 'parent' : 'parents'}. We’ll keep trying automatically.`;
    }

    if (failedRecipients > 0) {
      return `${failedRecipients} ${failedRecipients === 1 ? 'parent did' : 'parents did'} not receive this message.`;
    }

    return 'This message could not be delivered to everyone.';
  }

  if (campaign.status === 'canceled') {
    return 'This message was stopped before it finished sending.';
  }

  switch (campaign.status) {
    case 'draft':
      return 'This message is not scheduled yet.';
    case 'sending':
      return 'This message is going out to parents now.';
    case 'sent':
      return `This message went out ${formatDateTime(campaign.sent_at)}.`;
    default:
      return `Scheduled for ${formatDateTime(campaign.scheduled_at)}.`;
  }
}

function isSameLocalDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isLockedForEditing(campaign: MarketingCampaign) {
  if (campaign.status === 'sending' || campaign.status === 'sent') {
    return true;
  }

  if (!campaign.scheduled_at) {
    return false;
  }

  return isSameLocalDay(new Date(campaign.scheduled_at), new Date());
}

function statusBadgeVariant(
  status: MarketingCampaign['status'],
  dispatchState: MarketingCampaignDispatchState | null,
) {
  if (status === 'sent') {
    return 'success' as const;
  }

  if (status === 'sending') {
    return 'warning' as const;
  }

  if (status === 'failed' || status === 'canceled') {
    return (dispatchState?.retry_scheduled_recipients ?? 0) > 0 ? 'warning' as const : 'error' as const;
  }

  return 'secondary' as const;
}

function statusLabel(
  status: MarketingCampaign['status'],
  dispatchState: MarketingCampaignDispatchState | null,
) {
  switch (status) {
    case 'canceled':
      return 'Stopped';
    case 'draft':
      return 'Draft';
    case 'failed':
      return (dispatchState?.retry_scheduled_recipients ?? 0) > 0 ? 'Delayed' : 'Failed';
    case 'scheduled':
      return 'Scheduled';
    case 'sending':
      return 'Sending';
    case 'sent':
      return 'Sent';
    default:
      return status;
  }
}

function deliveryStateLabel(status: MarketingDispatchRecipientActivity['recipient_status']) {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'retry_scheduled':
      return 'Delayed';
    case 'failed':
      return 'Failed';
    case 'canceled':
      return 'Stopped';
    case 'leased':
      return 'In progress';
    case 'suppressed':
      return 'Suppressed';
    default:
      return 'Pending';
  }
}

function deliveryStateVariant(status: MarketingDispatchRecipientActivity['recipient_status']) {
  if (status === 'sent') {
    return 'success' as const;
  }

  if (status === 'failed' || status === 'canceled') {
    return 'error' as const;
  }

  if (status === 'retry_scheduled') {
    return 'warning' as const;
  }

  return 'secondary' as const;
}

function humanizeFailureReason(errorMessage?: string | null) {
  const normalized = errorMessage?.trim().toLowerCase() ?? '';

  if (!normalized) {
    return 'could not be delivered';
  }

  if (
    normalized.includes('recipient server rejected')
    || normalized.includes('mailbox unavailable')
    || normalized.includes('rejected')
  ) {
    return 'was blocked by the recipient\'s mailbox';
  }

  if (normalized.includes('timeout') || normalized.includes('temporarily unavailable')) {
    return 'ran into a temporary delivery problem';
  }

  return 'could not be delivered';
}

function deliveryStateMessage(row: MarketingDispatchRecipientActivity) {
  switch (row.recipient_status) {
    case 'retry_scheduled':
      return 'Delivery is delayed. No action required.';
    case 'failed':
      return `This message ${humanizeFailureReason(row.last_error_message)}.`;
    case 'canceled':
      return 'Sending was stopped before this message went out.';
    case 'suppressed':
      return 'This parent is not available to receive messages.';
    default:
      return null;
  }
}

function readAudienceDefinition(campaign: MarketingCampaign): AudienceDefinition {
  const raw = campaign.audience_definition as AudienceDefinition | null;

  return {
    presetId: raw?.presetId ?? null,
    segment_scope: raw?.segment_scope ?? null,
    filters: raw?.filters ?? {},
    v2_event_rules: raw?.v2_event_rules ?? [],
    excluded_contact_ids: raw?.excluded_contact_ids ?? [],
  };
}

function inferRuleStatus(filters: AudienceDefinition['filters']): MarketingV2RuleStatus {
  if (filters?.attendedOnly) {
    return 'attended';
  }

  if (filters?.waitlistedOnly) {
    return 'waitlisted';
  }

  if (filters?.registeredButUnpaid) {
    return 'unpaid';
  }

  if (filters?.hasSuccessfulTransaction) {
    return 'paid';
  }

  return 'registered';
}

function buildRulesFromCampaign(
  campaign: MarketingCampaign,
  metadata: AudienceMetadata,
) {
  const definition = readAudienceDefinition(campaign);

  if (definition.v2_event_rules?.length) {
    return definition.v2_event_rules.map((rule) => ({
      id: `${rule.event_id}-${rule.status}-${crypto.randomUUID()}`,
      eventId: rule.event_id,
      eventLabel: rule.event_label ?? metadata.events.find((event) => event.id === rule.event_id)?.label ?? '',
      status: rule.status as MarketingV2RuleStatus,
    }));
  }

  const eventIds = definition.filters?.eventIds ?? [];
  if (eventIds.length) {
    const status = inferRuleStatus(definition.filters);

    return eventIds.map((eventId) => ({
      id: `${eventId}-${status}-${crypto.randomUUID()}`,
      eventId,
      eventLabel: metadata.events.find((event) => event.id === eventId)?.label ?? '',
      status,
    }));
  }

  return [createEmptyMarketingV2Rule()];
}

function buildAudienceCopy(
  rules: MarketingV2AudienceRule[],
  presetLabelById: Map<string, string>,
  campaign: MarketingCampaign | null,
) {
  const activeRules = rules.filter((rule) => rule.eventId && rule.status);

  if (activeRules.length) {
    const statuses = Array.from(new Set(activeRules.map((rule) => rule.status)));
    const statusCopy = statuses.length === 1 ? `${statuses[0]} parents` : 'parents';
    const eventCopy = activeRules.length === 1
      ? activeRules[0].eventLabel
      : `${activeRules.length} past events`;
    return `To ${statusCopy} from ${eventCopy}`;
  }

  const presetId = campaign ? readAudienceDefinition(campaign).presetId : null;
  const presetLabel = presetId ? presetLabelById.get(presetId) : null;

  if (presetLabel) {
    return `To ${presetLabel.toLowerCase()}`;
  }

  return 'To all parents who can receive messages';
}

function improveDraft(subject: string, bodyHtml: string) {
  const plainText = toPlainTextFromHtml(bodyHtml)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const messageLines = plainText.length ? plainText : ['We would love to see you there.'];
  const opening = messageLines[0];
  const supportingLines = messageLines.slice(1, 4);

  const improvedSubject = subject.trim()
    ? `${subject.trim().replace(/\.+$/, '')}`
    : 'Quick update from the academy';

  const paragraphs = [
    '<p>Hi parents,</p>',
    `<p>${opening.charAt(0).toUpperCase()}${opening.slice(1)}</p>`,
  ];

  if (supportingLines.length) {
    paragraphs.push('<ul>');
    for (const line of supportingLines) {
      paragraphs.push(`<li>${line}</li>`);
    }
    paragraphs.push('</ul>');
  }

  paragraphs.push('<p>If you have any questions, just reply and we will help.</p>');
  paragraphs.push('<p>Thanks,<br/>Your academy team</p>');

  return {
    subject: improvedSubject,
    bodyHtml: paragraphs.join(''),
  };
}

function EventRuleRow({
  rule,
  metadata,
  onChange,
  onRemove,
  removable,
  disabled,
}: {
  rule: MarketingV2AudienceRule;
  metadata: AudienceMetadata;
  onChange: (rule: MarketingV2AudienceRule) => void;
  onRemove: () => void;
  removable: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className='grid gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm shadow-black/5 md:grid-cols-[minmax(0,1.6fr)_minmax(200px,0.9fr)_auto]'>
      <div className='space-y-2'>
        <Label>Event</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type='button' variant='outline' className='w-full justify-start' disabled={disabled}>
              {rule.eventLabel || 'Choose an event'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[360px] p-0' align='start'>
            <Command>
              <CommandInput placeholder='Search events' />
              <CommandList>
                <CommandEmpty>No events found.</CommandEmpty>
                <CommandGroup>
                  {metadata.events.map((event) => (
                    <CommandItem
                      key={event.id}
                      value={`${event.label} ${event.id}`}
                      onSelect={() => {
                        onChange({
                          ...rule,
                          eventId: event.id,
                          eventLabel: event.label,
                        });
                        setOpen(false);
                      }}
                    >
                      {event.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className='space-y-2'>
        <Label>Parent status</Label>
        <Select
          value={rule.status}
          onValueChange={(value) =>
            onChange({
              ...rule,
              status: value as MarketingV2AudienceRule['status'],
            })}
          disabled={disabled}
        >
          <SelectTrigger className='bg-card'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {marketingV2StatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-end'>
        <Button
          type='button'
          variant='outline'
          size='icon'
          disabled={!removable || disabled}
          onClick={onRemove}
        >
          <Trash2 className='size-4' />
        </Button>
      </div>
    </div>
  );
}

function RecipientRow({
  row,
  athleteNames,
  loadingAthletes,
  onToggle,
  onRemove,
  onUndo,
  expanded = false,
}: {
  row: AudiencePreviewFamily;
  athleteNames: string[] | null;
  loadingAthletes: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  onUndo?: () => void;
  expanded?: boolean;
}) {
  const displayName = [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email;

  return (
    <div className='rounded-2xl border border-border/60 bg-card'>
      <div className='grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] md:items-center'>
        <div className='min-w-0'>
          <div className='truncate font-medium'>{displayName}</div>
          <div className='truncate text-sm text-muted-foreground'>{row.email}</div>
        </div>
        <div className='flex justify-start md:justify-end'>
          <Button
            type='button'
            variant='ghost'
            className='h-auto px-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground'
            onClick={onToggle}
          >
            {expanded ? 'Hide' : 'View'}
            {expanded ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
          </Button>
        </div>
        <div className='flex justify-start md:justify-end'>
          {onUndo ? (
            <Button type='button' variant='outline' size='sm' onClick={onUndo}>
              Undo
            </Button>
          ) : onRemove ? (
            <Button type='button' variant='outline' size='sm' onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className='border-t border-border/50 px-4 py-4'>
          <div className='space-y-4'>
            {row.matchingActivities.length ? (
              <div>
                <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                  Included because
                </div>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {row.matchingActivities.map((activity) => (
                    <Badge key={`${row.marketingContactId}-${activity.eventId}-${activity.label}`} variant='outline'>
                      {activity.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                Players
              </div>
              <div className='mt-2'>
                {loadingAthletes ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-6 w-24 rounded-full' />
                    <Skeleton className='h-6 w-32 rounded-full' />
                  </div>
                ) : athleteNames?.length ? (
                  <div className='flex flex-wrap gap-2'>
                    {athleteNames.map((athleteName) => (
                      <Badge key={athleteName} variant='outline'>
                        {athleteName}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground'>No player names available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AudienceReviewSheet({
  title,
  preview,
  previewLoading,
  excludedContactIds,
  athleteLinksByContact,
  loadingAthletesByContact,
  expandedContacts,
  reviewQuery,
  reviewMode,
  onReviewQueryChange,
  onReviewModeChange,
  onToggleExpanded,
  onRemove,
  onUndo,
  editable,
}: {
  title: string;
  preview: AudiencePreviewResponse | null;
  previewLoading: boolean;
  excludedContactIds: string[];
  athleteLinksByContact: Record<string, string[]>;
  loadingAthletesByContact: Record<string, boolean>;
  expandedContacts: Record<string, boolean>;
  reviewQuery: string;
  reviewMode: 'active' | 'removed';
  onReviewQueryChange: (value: string) => void;
  onReviewModeChange: (value: 'active' | 'removed') => void;
  onToggleExpanded: (marketingContactId: string) => void;
  onRemove: (row: AudiencePreviewFamily) => void;
  onUndo: (marketingContactId: string) => void;
  editable: boolean;
}) {
  const trimmedQuery = reviewQuery.trim().toLowerCase();
  const allRows = preview?.results.data ?? [];
  const activeRows = allRows.filter((row) => !excludedContactIds.includes(row.marketingContactId));
  const removedRows = allRows.filter((row) => excludedContactIds.includes(row.marketingContactId));
  const rows = reviewMode === 'active' ? activeRows : removedRows;
  const filteredRows = rows.filter((row) => {
    if (!trimmedQuery) {
      return true;
    }

    return [row.firstName, row.lastName, row.email]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(trimmedQuery));
  });

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <SheetHeader className='border-b border-border/50 px-6 py-5'>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>
          {editable
            ? 'Search for a parent, and remove anyone who should not get this message.'
            : 'Search parents and open details only when you need them.'}
        </SheetDescription>
      </SheetHeader>

      <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-6 py-4'>
        <div className='text-sm text-muted-foreground'>
          {previewLoading ? 'Loading recipients…' : `${activeRows.length} matching parents`}
        </div>
        {editable ? (
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant={reviewMode === 'active' ? 'secondary' : 'outline'}
              size='sm'
              onClick={() => onReviewModeChange('active')}
            >
              Included
            </Button>
            <Button
              type='button'
              variant={reviewMode === 'removed' ? 'secondary' : 'outline'}
              size='sm'
              onClick={() => onReviewModeChange('removed')}
            >
              Removed ({removedRows.length})
            </Button>
          </div>
        ) : null}
      </div>

      <div className='border-b border-border/50 px-6 py-4'>
        <div className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={reviewQuery}
            onChange={(event) => onReviewQueryChange(event.target.value)}
            placeholder='Search parent name or email'
            className='pl-9'
          />
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
        {previewLoading ? (
          <div className='space-y-3'>
            <Skeleton className='h-20 rounded-2xl' />
            <Skeleton className='h-20 rounded-2xl' />
            <Skeleton className='h-20 rounded-2xl' />
          </div>
        ) : !filteredRows.length ? (
          <div className='rounded-2xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground'>
            {reviewMode === 'removed'
              ? 'No removed parents.'
              : trimmedQuery
                ? 'No parents match that search.'
                : 'No parents to show yet.'}
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredRows.map((row) => (
              <RecipientRow
                key={row.marketingContactId}
                row={row}
                athleteNames={athleteLinksByContact[row.marketingContactId] ?? null}
                loadingAthletes={Boolean(loadingAthletesByContact[row.marketingContactId])}
                expanded={Boolean(expandedContacts[row.marketingContactId])}
                onToggle={() => onToggleExpanded(row.marketingContactId)}
                onRemove={editable && reviewMode === 'active' ? () => onRemove(row) : undefined}
                onUndo={editable && reviewMode === 'removed' ? () => onUndo(row.marketingContactId) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressReviewSheet({
  rows,
  dispatchState,
  reviewQuery,
  onReviewQueryChange,
}: {
  rows: MarketingDispatchRecipientActivity[];
  dispatchState: MarketingCampaignDispatchState | null;
  reviewQuery: string;
  onReviewQueryChange: (value: string) => void;
}) {
  const trimmedQuery = reviewQuery.trim().toLowerCase();
  const failedRows = rows.filter((row) => row.recipient_status === 'failed');
  const retryingRows = rows.filter((row) => row.recipient_status === 'retry_scheduled');
  const sentRows = rows.filter((row) => row.recipient_status === 'sent');
  const filteredRows = rows.filter((row) => {
    if (!trimmedQuery) {
      return true;
    }

    return [row.first_name, row.last_name, row.recipient_email, row.recipient_status]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(trimmedQuery));
  });

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <SheetHeader className='border-b border-border/50 px-6 py-5'>
        <SheetTitle>Delivery details</SheetTitle>
        <SheetDescription>
          A simple delivery view for each parent in this campaign.
        </SheetDescription>
      </SheetHeader>

      {(dispatchState || rows.length) ? (
        <div className='border-b border-border/50 px-6 py-4'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>
              {dispatchState?.total_recipients ?? rows.length} parents
            </Badge>
            <Badge variant='success'>{sentRows.length} sent</Badge>
            {retryingRows.length ? <Badge variant='warning'>{retryingRows.length} delayed</Badge> : null}
            {failedRows.length ? <Badge variant='error'>{failedRows.length} failed</Badge> : null}
          </div>
        </div>
      ) : null}

      <div className='border-b border-border/50 px-6 py-4'>
        <div className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={reviewQuery}
            onChange={(event) => onReviewQueryChange(event.target.value)}
            placeholder='Search parent name or email'
            className='pl-9'
          />
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
        {!filteredRows.length ? (
          <div className='rounded-2xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground'>
            {trimmedQuery ? 'No parents match that search.' : 'No delivery updates yet.'}
          </div>
        ) : (
          <div className='overflow-hidden rounded-2xl border border-border/60 bg-card'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Delivery status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.dispatch_recipient_id}>
                    <TableCell className='font-medium'>
                      {[row.first_name, row.last_name].filter(Boolean).join(' ') || row.recipient_email}
                    </TableCell>
                    <TableCell>
                      {row.recipient_email}
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <Badge variant={deliveryStateVariant(row.recipient_status)}>
                          {deliveryStateLabel(row.recipient_status)}
                        </Badge>
                        {deliveryStateMessage(row) ? (
                          <div className='max-w-[22rem] text-xs text-muted-foreground'>
                            {deliveryStateMessage(row)}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export function MarketingV2CampaignPage({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
  const [bootstrap, setBootstrap] = useState<MarketingV2BootstrapResponse | null>(null);
  const [dispatchStates, setDispatchStates] = useState<Page<MarketingCampaignDispatchState> | null>(null);
  const [recipientActivity, setRecipientActivity] = useState<Page<MarketingDispatchRecipientActivity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState('');
  const [rules, setRules] = useState<MarketingV2AudienceRule[]>([]);
  const [excludedContactIds, setExcludedContactIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<AudiencePreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewQuery, setReviewQuery] = useState('');
  const [reviewMode, setReviewMode] = useState<'active' | 'removed'>('active');
  const [expandedContacts, setExpandedContacts] = useState<Record<string, boolean>>({});
  const [athleteDirectory, setAthleteDirectory] = useState<Record<string, string> | null>(null);
  const [athleteLinksByContact, setAthleteLinksByContact] = useState<Record<string, string[]>>({});
  const [loadingAthletesByContact, setLoadingAthletesByContact] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [messageEditMode, setMessageEditMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaign() {
      setLoading(true);

      try {
        const isDemoCampaign = isMarketingV2DemoCampaign(campaignId);
        const bootstrapResponse = await fetchJson<MarketingV2BootstrapResponse>('/api/marketing/bootstrap');

        if (isDemoCampaign) {
          ensureMarketingV2DemoSeedData(bootstrapResponse.metadata);
        }

        const [nextCampaign, nextDispatchStates, nextRecipientActivity] = await Promise.all([
          isDemoCampaign
            ? Promise.resolve(readMarketingV2DemoCampaign(campaignId))
            : fetchJson<MarketingCampaign>(`/api/marketing/campaigns/${campaignId}`),
          isDemoCampaign
            ? Promise.resolve<Page<MarketingCampaignDispatchState>>({
              data: readMarketingV2DemoDispatchStatesForCampaign(campaignId),
              count: readMarketingV2DemoDispatchStatesForCampaign(campaignId).length,
              page: 1,
              pageSize: 25,
            })
            : fetchJson<Page<MarketingCampaignDispatchState>>(
              `/api/marketing/campaign-dispatches?campaignId=${encodeURIComponent(campaignId)}&page=1&pageSize=25`,
            ),
          isDemoCampaign
            ? Promise.resolve<Page<MarketingDispatchRecipientActivity>>({
              data: readMarketingV2DemoRecipientActivityForCampaign(campaignId),
              count: readMarketingV2DemoRecipientActivityForCampaign(campaignId).length,
              page: 1,
              pageSize: 100,
            })
            : fetchJson<Page<MarketingDispatchRecipientActivity>>(
              `/api/marketing/campaign-dispatch-recipients?campaignId=${encodeURIComponent(campaignId)}&page=1&pageSize=100`,
            ),
        ]);

        if (!nextCampaign) {
          throw new Error('Campaign not found.');
        }

        if (!cancelled) {
          setBootstrap(bootstrapResponse);
          setDispatchStates(nextDispatchStates);
          setRecipientActivity(nextRecipientActivity);
          setCampaign(nextCampaign);
          setName(nextCampaign.name);
          setSubject(nextCampaign.subject);
          setBodyHtml(nextCampaign.body_html);
          const scheduleEditorState = toScheduleEditorState(nextCampaign.scheduled_at);
          setScheduleDate(scheduleEditorState.date);
          setScheduleTime(scheduleEditorState.time);
          setExcludedContactIds(readAudienceDefinition(nextCampaign).excluded_contact_ids ?? []);
          setRules(buildRulesFromCampaign(nextCampaign, bootstrapResponse.metadata));
          setMessageEditMode(false);
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : 'We couldn’t load this campaign right now.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCampaign();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.eventId && rule.status),
    [rules],
  );
  const presetLabelById = useMemo(
    () => new Map(
      bootstrap
        ? [...bootstrap.contactPresets, ...bootstrap.eventPresets].map((preset) => [preset.id, preset.label])
        : [],
    ),
    [bootstrap],
  );
  const audienceCopy = useMemo(
    () => buildAudienceCopy(rules, presetLabelById, campaign),
    [campaign, presetLabelById, rules],
  );
  const activePreviewRows = useMemo(
    () => (preview?.results.data ?? []).filter((row) => !excludedContactIds.includes(row.marketingContactId)),
    [excludedContactIds, preview?.results.data],
  );
  const effectiveMatchingCount = activePreviewRows.length;
  const campaignLocked = useMemo(
    () => (campaign ? isLockedForEditing(campaign) : false),
    [campaign],
  );
  const activeDispatchState = useMemo(
    () => chooseDispatchState(dispatchStates?.data ?? []),
    [dispatchStates],
  );
  const showProgressSheet = Boolean(
    campaign && (
      campaign.status === 'sending'
      || campaign.status === 'sent'
      || campaign.status === 'failed'
      || campaign.status === 'canceled'
    )
  );
  const progressValue = useMemo(() => {
    if (!campaign) {
      return null;
    }

    if (campaign.status === 'sent') {
      return activeDispatchState?.sent_percent ?? 100;
    }

    if (campaign.status === 'sending') {
      return activeDispatchState?.sent_percent ?? 0;
    }

    if (campaign.status === 'failed' || campaign.status === 'canceled') {
      return activeDispatchState?.sent_percent ?? null;
    }

    return null;
  }, [activeDispatchState, campaign]);
  const progressCopy = useMemo(() => {
    if (!campaign || !showProgressSheet) {
      return null;
    }

    if (activeDispatchState?.total_recipients) {
      if (campaign.status === 'failed' || campaign.status === 'canceled') {
        const parts = [
          `${activeDispatchState.sent_recipients} sent`,
          activeDispatchState.failed_recipients ? `${activeDispatchState.failed_recipients} not delivered` : null,
          activeDispatchState.retry_scheduled_recipients ? `${activeDispatchState.retry_scheduled_recipients} delayed` : null,
        ].filter(Boolean);
        return parts.join(' · ');
      }

      return `${activeDispatchState.sent_recipients} of ${activeDispatchState.total_recipients} sent`;
    }

    if (campaign.status === 'sent') {
      return 'Campaign finished sending';
    }

    if (campaign.status === 'failed' || campaign.status === 'canceled') {
      return 'Delivery is still in progress';
    }

    return 'Campaign sending in progress';
  }, [activeDispatchState, campaign, showProgressSheet]);
  const issueSummary = useMemo(() => {
    if (!campaign || (campaign.status !== 'failed' && campaign.status !== 'canceled')) {
      return null;
    }

    if (activeDispatchState) {
      const delayedCount = activeDispatchState.retry_scheduled_recipients;
      const failedCount = activeDispatchState.failed_recipients;
      const canceledCount = activeDispatchState.canceled_recipients;
      const failedRow = recipientActivity?.data.find((row) => row.recipient_status === 'failed');
      const summaryParts = [
        delayedCount
          ? `${delayedCount} delayed ${delayedCount === 1 ? 'email' : 'emails'}`
          : null,
        failedCount
          ? failedCount === 1
            ? `1 ${humanizeFailureReason(failedRow?.last_error_message)}`
            : `${failedCount} emails could not be delivered`
          : null,
        canceledCount
          ? `${canceledCount} ${canceledCount === 1 ? 'email was' : 'emails were'} stopped`
          : null,
      ].filter(Boolean);

      if (summaryParts.length) {
        return summaryParts.join(', ');
      }
    }

    return 'A few deliveries still need more time.';
  }, [activeDispatchState, campaign, recipientActivity?.data]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!activeRules.length) {
        setPreview(null);
        return;
      }

      setPreviewLoading(true);

      try {
        const response = await fetchJson<AudiencePreviewResponse>('/api/marketing/audiences-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rules: activeRules,
            pageSize: 500,
          }),
        });

        if (!cancelled) {
          setPreview(response);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [activeRules]);

  const canSave = Boolean(
    campaign
    && !campaignLocked
    && name.trim()
    && subject.trim()
    && toPlainTextFromHtml(bodyHtml).trim()
    && scheduleDate
    && scheduleTime
    && activeRules.length
    && effectiveMatchingCount > 0,
  );

  function buildScheduledAt() {
    if (!scheduleDate || !scheduleTime) {
      return null;
    }

    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const nextDate = new Date(scheduleDate);
    nextDate.setHours(hours, minutes, 0, 0);
    return nextDate.toISOString();
  }

  async function handleToggleRecipient(marketingContactId: string) {
    const nextExpanded = !expandedContacts[marketingContactId];

    setExpandedContacts((current) => ({
      ...current,
      [marketingContactId]: nextExpanded,
    }));

    if (!nextExpanded || athleteLinksByContact[marketingContactId]) {
      return;
    }

    setLoadingAthletesByContact((current) => ({
      ...current,
      [marketingContactId]: true,
    }));

    try {
      const [links, athletes] = await Promise.all([
        fetchJson<MarketingContactAthleteLink[]>(
          `/api/marketing/contact-athletes?marketingContactId=${marketingContactId}`,
        ),
        athleteDirectory
          ? Promise.resolve(null)
          : fetchJson<MarketingAthlete[]>('/api/marketing/athletes'),
      ]);

      const nextDirectory = athleteDirectory ?? Object.fromEntries(
        (athletes ?? []).map((athlete) => [
          athlete.id,
          `${athlete.first_name} ${athlete.last_name}`.trim(),
        ]),
      );

      if (!athleteDirectory) {
        setAthleteDirectory(nextDirectory);
      }

      setAthleteLinksByContact((current) => ({
        ...current,
        [marketingContactId]: links
          .map((link) => nextDirectory[link.athlete_id])
          .filter((athleteName): athleteName is string => Boolean(athleteName)),
      }));
    } finally {
      setLoadingAthletesByContact((current) => ({
        ...current,
        [marketingContactId]: false,
      }));
    }
  }

  async function handleSave() {
    if (!campaign || !canSave) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const audienceDefinition = buildMarketingV2AudienceDefinition(activeRules, excludedContactIds);
      const scheduledAt = buildScheduledAt();

      if (!scheduledAt) {
        setSaveError('Add a send date and send time before saving.');
        return;
      }

      if (isMarketingV2DemoCampaign(campaign.id)) {
        const updated = saveMarketingV2DemoCampaign({
          ...campaign,
          name,
          subject,
          body_html: bodyHtml,
          body_text: toPlainTextFromHtml(bodyHtml),
          audience_definition: audienceDefinition,
          scheduled_at: scheduledAt,
          updated_at: new Date().toISOString(),
        });

        setCampaign(updated);
      } else {
        const updated = await fetchJson<MarketingCampaign>(`/api/marketing/campaigns/${campaign.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            subject,
            body_html: bodyHtml,
            body_text: toPlainTextFromHtml(bodyHtml),
            audience_definition: audienceDefinition,
            scheduled_at: scheduledAt,
          }),
        });

        setCampaign(updated);
      }

      toast.success('Campaign changes saved.');
    } catch (nextError) {
      setSaveError(
        nextError instanceof Error ? nextError.message : 'We couldn’t save your changes right now.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleExcludeRecipient(row: AudiencePreviewFamily) {
    setExcludedContactIds((current) =>
      current.includes(row.marketingContactId)
        ? current
        : [...current, row.marketingContactId]
    );
  }

  function handleUndoExcludeRecipient(marketingContactId: string) {
    setExcludedContactIds((current) =>
      current.filter((contactId) => contactId !== marketingContactId)
    );
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto max-w-5xl px-6 py-10'>
          <Skeleton className='h-8 w-32 rounded-full' />
          <Skeleton className='mt-4 h-12 w-72 rounded-lg' />
          <Skeleton className='mt-3 h-6 w-[28rem] rounded-lg' />
          <Skeleton className='mt-8 h-64 rounded-2xl' />
          <Skeleton className='mt-6 h-64 rounded-2xl' />
        </div>
      </div>
    );
  }

  if (error || !campaign || !bootstrap) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12'>
          <Alert variant='error'>
            <AlertTitle>Couldn’t load campaign</AlertTitle>
            <AlertDescription>
              {error ?? 'This campaign could not be loaded right now.'}
            </AlertDescription>
          </Alert>
          <Button asChild variant='outline'>
            <Link href='/marketing-v2'>Back to campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-5xl px-6 py-10'>
        <div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl space-y-3'>
            <Button asChild variant='ghost' className='px-0'>
              <Link href='/marketing-v2'>
                <ArrowLeft className='size-4' />
                Back to campaigns
              </Link>
            </Button>
            <div className='flex flex-wrap items-center gap-3'>
              <Badge variant={statusBadgeVariant(campaign.status, activeDispatchState)}>
                {statusLabel(campaign.status, activeDispatchState)}
              </Badge>
            </div>
            <h1 className='text-h3'>{campaign.name}</h1>
            <p className='text-body1 text-muted-foreground'>
              {campaignHeaderCopy(campaign, activeDispatchState)}
            </p>
          </div>

          <Button type='button' onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>

        {campaignLocked ? (
          <Alert variant='warning' className='mb-6'>
            <AlertTitle>Editing is locked for today</AlertTitle>
            <AlertDescription>
              This message is scheduled for today or already on its way, so editing is turned off.
            </AlertDescription>
          </Alert>
        ) : null}

        {issueSummary ? (
          <Alert
            variant={campaign.status === 'failed' && (activeDispatchState?.retry_scheduled_recipients ?? 0) > 0 ? 'warning' : 'error'}
            className='mb-6'
          >
            <AlertTitle>Delivery update</AlertTitle>
            <AlertDescription>{issueSummary}</AlertDescription>
          </Alert>
        ) : null}

        {saveError ? (
          <Alert variant='error' className='mb-6'>
            <AlertTitle>Couldn’t save changes</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <div className='space-y-6'>
          <Card rounded='xl' className='border-border/60 shadow-sm shadow-black/5'>
            <CardHeader>
              <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                <div>
                  <CardTitle>Message</CardTitle>
                  <CardDescription>
                    {messageEditMode
                      ? 'Make changes only when you need to.'
                      : 'Email preview'}
                  </CardDescription>
                </div>
                {!campaignLocked ? (
                  <Button
                    type='button'
                    variant={messageEditMode ? 'secondary' : 'outline'}
                    onClick={() => setMessageEditMode((current) => !current)}
                  >
                    {messageEditMode ? 'Done editing' : 'Edit message'}
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className='space-y-5'>
              {messageEditMode ? (
                <>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='campaign-name'>Campaign name</Label>
                      <Input
                        id='campaign-name'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder='Spring waitlist follow-up'
                        disabled={campaignLocked}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='campaign-subject'>Subject</Label>
                      <Input
                        id='campaign-subject'
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder='A few spots just opened up'
                        disabled={campaignLocked}
                      />
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div>
                        <Label>Body</Label>
                        <div className='text-sm text-muted-foreground'>
                          Keep it short, warm, and easy to scan.
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        disabled={campaignLocked}
                        onClick={() => {
                          const improved = improveDraft(subject, bodyHtml);
                          setSubject(improved.subject);
                          setBodyHtml(improved.bodyHtml);
                          toast.success('Message polished.');
                        }}
                      >
                        <Sparkles className='size-4' />
                        Polish with AI
                      </Button>
                    </div>
                    <div className={campaignLocked ? 'pointer-events-none opacity-70' : ''}>
                      <SimpleRichTextEditor value={bodyHtml} onChange={setBodyHtml} />
                    </div>
                  </div>

                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label>Send date</Label>
                      <DatePicker value={scheduleDate} onChange={setScheduleDate} disabled={campaignLocked} />
                    </div>
                    <div className='space-y-2'>
                      <Label>Send time</Label>
                      <TimePicker value={scheduleTime} onChange={setScheduleTime} disabled={campaignLocked} />
                    </div>
                  </div>
                </>
              ) : (
                <div className='rounded-2xl border border-border/60 bg-background shadow-sm shadow-black/5'>
                  <div className='border-b border-border/50 px-5 py-4'>
                    <div className='flex flex-wrap gap-4 text-sm'>
                      <div>
                        <span className='font-medium'>From:</span>{' '}
                        {formatSenderDisplay(campaign.from_name, campaign.from_email)}
                      </div>
                    </div>
                    <div className='mt-4'>
                      <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                        Subject
                      </div>
                      <div className='mt-2 text-xl font-medium'>{subject}</div>
                    </div>
                  </div>

                  <div className='px-5 py-5'>
                    {bodyHtml ? (
                      <div
                        className='prose prose-neutral max-w-none text-foreground [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6'
                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                      />
                    ) : (
                      <div className='whitespace-pre-wrap text-sm text-foreground/90'>
                        {toPlainTextFromHtml(bodyHtml) || 'No message body saved.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card rounded='xl' className='border-border/60 shadow-sm shadow-black/5'>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>
                {audienceCopy}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-2xl border border-border/60 bg-secondary/35 px-4 py-4'>
                <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                  Matching parents
                </div>
                <div className='mt-2 text-3xl font-medium'>
                  {previewLoading ? '...' : effectiveMatchingCount}
                </div>
              </div>

              {showProgressSheet && progressValue !== null ? (
                <div className='rounded-2xl border border-border/60 bg-card px-4 py-4'>
                  <div className='flex items-center justify-between gap-3 text-sm'>
                    <span className='font-medium text-foreground/90'>Delivery progress</span>
                    <span className='text-muted-foreground'>{Math.round(progressValue)}%</span>
                  </div>
                  <div className='mt-3'>
                    <Progress
                      value={progressValue}
                      className={campaign.status === 'sent' ? 'bg-success-muted' : 'bg-warning-muted'}
                    />
                  </div>
                  <div className='mt-3 text-sm text-muted-foreground'>
                    {progressCopy}
                  </div>
                </div>
              ) : null}

              {rules.map((rule) => (
                <EventRuleRow
                  key={rule.id}
                  rule={rule}
                  metadata={bootstrap.metadata}
                  removable={rules.length > 1}
                  disabled={campaignLocked}
                  onRemove={() => {
                    setRules((current) =>
                      current.filter((currentRule) => currentRule.id !== rule.id)
                    );
                  }}
                  onChange={(nextRule) =>
                    setRules((current) =>
                      current.map((currentRule) =>
                        currentRule.id === nextRule.id ? nextRule : currentRule
                      )
                    )}
                />
              ))}

              <div className='flex flex-wrap items-center gap-3'>
                {!showProgressSheet ? (
                  <Button
                    type='button'
                    variant='outline'
                    disabled={campaignLocked}
                    onClick={() => {
                      setRules((current) => [...current, createEmptyMarketingV2Rule()]);
                    }}
                  >
                    <Plus className='size-4' />
                    Add another group
                  </Button>
                ) : null}

                <Sheet
                  open={reviewOpen}
                  onOpenChange={(open) => {
                    setReviewOpen(open);
                    if (open) {
                      setReviewQuery('');
                    }
                  }}
                >
                  <SheetTrigger asChild>
                    <Button
                      type='button'
                      variant='secondary'
                      disabled={!showProgressSheet && !effectiveMatchingCount}
                    >
                      {showProgressSheet
                        ? 'See delivery details'
                        : campaignLocked
                          ? 'Review recipients'
                          : 'Review recipients'}
                      <Badge variant='outline' className='ml-1'>
                        {showProgressSheet
                          ? recipientActivity?.data.length ?? 0
                          : previewLoading ? '...' : effectiveMatchingCount}
                      </Badge>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='right' size='full' className='w-full md:max-w-3xl xl:max-w-[50vw]'>
                    {showProgressSheet ? (
                      <ProgressReviewSheet
                        rows={recipientActivity?.data ?? []}
                        dispatchState={activeDispatchState}
                        reviewQuery={reviewQuery}
                        onReviewQueryChange={setReviewQuery}
                      />
                    ) : (
                      <AudienceReviewSheet
                        title='Review recipients'
                        preview={preview}
                        previewLoading={previewLoading}
                        excludedContactIds={excludedContactIds}
                        athleteLinksByContact={athleteLinksByContact}
                        loadingAthletesByContact={loadingAthletesByContact}
                        expandedContacts={expandedContacts}
                        reviewQuery={reviewQuery}
                        reviewMode={reviewMode}
                        onReviewQueryChange={setReviewQuery}
                        onReviewModeChange={setReviewMode}
                        onToggleExpanded={handleToggleRecipient}
                        onRemove={handleExcludeRecipient}
                        onUndo={handleUndoExcludeRecipient}
                        editable={!campaignLocked}
                      />
                    )}
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
