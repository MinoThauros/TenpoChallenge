'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  AudienceMetadata,
  MarketingAthlete,
  MarketingContactAthleteLink,
} from '@/lib/marketing-services';
import {
  buildMarketingV2AudienceDefinition,
  createEmptyMarketingV2Rule,
  marketingV2StatusOptions,
  type MarketingV2AudienceRule,
} from '@/lib/marketing-v2';
import {
  createMarketingV2DemoCampaign,
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
import { TimePicker } from '@/components/ui/time-picker';
import { SimpleRichTextEditor, toPlainTextFromHtml } from './simple-rich-text-editor';

type AudiencePreviewFamily = {
  marketingContactId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  lastMatchingActivity: string;
  lastMatchingAt: string | null;
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

function EventRuleRow({
  rule,
  metadata,
  onChange,
  onRemove,
  removable,
}: {
  rule: MarketingV2AudienceRule;
  metadata: AudienceMetadata;
  onChange: (rule: MarketingV2AudienceRule) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className='grid gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm shadow-black/5 md:grid-cols-[minmax(0,1.6fr)_minmax(200px,0.9fr)_auto]'>
      <div className='space-y-2'>
        <Label>Event</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type='button' variant='outline' className='w-full justify-start'>
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
          disabled={!removable}
          onClick={onRemove}
        >
          <Trash2 className='size-4' />
        </Button>
      </div>
    </div>
  );
}

function PreviewFamilyRow({
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
        <div className='min-w-0'>
          <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
            Details
          </div>
          <Button
            type='button'
            variant='ghost'
            className='mt-1 h-auto px-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground'
            onClick={onToggle}
          >
            {expanded ? (
              <>
                Hide
                <ChevronUp className='size-4' />
              </>
            ) : (
              <>
                View
                <ChevronDown className='size-4' />
              </>
            )}
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

            <div>
              <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                Players
              </div>
              <div className='mt-2'>
                {loadingAthletes ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-6 w-32 rounded-full' />
                    <Skeleton className='h-6 w-24 rounded-full' />
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
                  <div className='text-sm text-muted-foreground'>
                    No player names available.
                  </div>
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
  preview,
  previewLoading,
  excludedRecipients,
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
}: {
  preview: AudiencePreviewResponse | null;
  previewLoading: boolean;
  excludedRecipients: Record<string, AudiencePreviewFamily>;
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
}) {
  const trimmedQuery = reviewQuery.trim().toLowerCase();
  const activeRows = preview?.results.data ?? [];
  const removedRows = Object.values(excludedRecipients);
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
        <SheetTitle>Review recipients</SheetTitle>
        <SheetDescription>
          Search for a parent, and remove anyone who should not get this message.
        </SheetDescription>
      </SheetHeader>

      <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-6 py-4'>
        <div className='text-sm text-muted-foreground'>
          {previewLoading ? 'Loading recipients…' : `${preview?.summary.matchingContacts ?? 0} matching parents`}
        </div>
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
        {previewLoading && reviewMode === 'active' ? (
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
                : 'Choose an event first to review recipients here.'}
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredRows.map((row) => (
              <PreviewFamilyRow
                key={`${reviewMode}-${row.marketingContactId}`}
                row={row}
                athleteNames={athleteLinksByContact[row.marketingContactId] ?? null}
                loadingAthletes={Boolean(loadingAthletesByContact[row.marketingContactId])}
                expanded={Boolean(expandedContacts[row.marketingContactId])}
                onToggle={() => onToggleExpanded(row.marketingContactId)}
                onRemove={reviewMode === 'active' ? () => onRemove(row) : undefined}
                onUndo={reviewMode === 'removed' ? () => onUndo(row.marketingContactId) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Use the fallback message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function MarketingV2Creator({ metadata }: { metadata: AudienceMetadata }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [rules, setRules] = useState<MarketingV2AudienceRule[]>([
    createEmptyMarketingV2Rule(),
  ]);
  const [preview, setPreview] = useState<AudiencePreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [excludedContactIds, setExcludedContactIds] = useState<string[]>([]);
  const [excludedRecipients, setExcludedRecipients] = useState<Record<string, AudiencePreviewFamily>>({});
  const [athleteDirectory, setAthleteDirectory] = useState<Record<string, string> | null>(null);
  const [athleteLinksByContact, setAthleteLinksByContact] = useState<Record<string, string[]>>({});
  const [loadingAthletesByContact, setLoadingAthletesByContact] = useState<Record<string, boolean>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewQuery, setReviewQuery] = useState('');
  const [reviewMode, setReviewMode] = useState<'active' | 'removed'>('active');
  const [expandedContacts, setExpandedContacts] = useState<Record<string, boolean>>({});

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.eventId && rule.status),
    [rules],
  );

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
            excludedContactIds,
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
  }, [activeRules, excludedContactIds]);

  const canContinue = activeRules.length > 0 && (preview?.summary.matchingContacts ?? 0) > 0;
  const canSubmit = Boolean(
    subject.trim()
    && toPlainTextFromHtml(bodyHtml).trim()
    && scheduleDate
    && scheduleTime,
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

  async function handlePreviewToggle(marketingContactId: string) {
    if (athleteLinksByContact[marketingContactId]) {
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

  function handleExcludeRecipient(row: AudiencePreviewFamily) {
    setExcludedRecipients((current) => ({
      ...current,
      [row.marketingContactId]: row,
    }));
    setExcludedContactIds((current) => (
      current.includes(row.marketingContactId)
        ? current
        : [...current, row.marketingContactId]
    ));
  }

  function handleUndoExcludeRecipient(marketingContactId: string) {
    setExcludedRecipients((current) => {
      const next = { ...current };
      delete next[marketingContactId];
      return next;
    });
    setExcludedContactIds((current) =>
      current.filter((contactId) => contactId !== marketingContactId)
    );
  }

  function toggleExpandedRecipient(marketingContactId: string) {
    setExpandedContacts((current) => {
      const nextExpanded = !current[marketingContactId];

      if (nextExpanded) {
        void handlePreviewToggle(marketingContactId);
      }

      return {
        ...current,
        [marketingContactId]: nextExpanded,
      };
    });
  }

  async function handleSubmit() {
    if (!canSubmit) {
      setSubmitError('Add a subject, message, send date, and send time before continuing.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const scheduledAt = buildScheduledAt();

      if (!scheduledAt) {
        setSubmitError('Add a send date and time before continuing.');
        return;
      }

      saveMarketingV2DemoCampaign(
        createMarketingV2DemoCampaign({
          name: subject.trim(),
          subject,
          previewText: '',
          fromName: 'Tenpo Academy',
          fromEmail: 'hello@tenpo.academy',
          replyToEmail: 'coaches@tenpo.academy',
          bodyText: toPlainTextFromHtml(bodyHtml),
          bodyHtml,
          scheduledAt,
          audienceDefinition: buildMarketingV2AudienceDefinition(activeRules, excludedContactIds),
        }),
      );

      toast.success('Campaign scheduled.');
      router.push('/marketing-v2');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'We could not create the campaign right now.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-6xl px-6 py-10'>
        <div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl space-y-3'>
            <Badge variant='secondary'>Messages</Badge>
            <h1 className='text-h3'>New campaign</h1>
            <p className='text-body1 text-muted-foreground'>
              Choose the right parents, write the message, and schedule it in a few minutes.
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/marketing-v2'>
              <ArrowLeft className='size-4' />
              Back to campaigns
            </Link>
          </Button>
        </div>

        {step === 1 ? (
          <Card rounded='xl' className='border-border/60 shadow-sm shadow-black/5'>
            <CardHeader>
              <CardTitle>Who should get this message?</CardTitle>
              <CardDescription>
                Add one or more event filters.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {rules.map((rule) => (
                <EventRuleRow
                  key={rule.id}
                  rule={rule}
                  metadata={metadata}
                  removable={rules.length > 1}
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
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setRules((current) => [...current, createEmptyMarketingV2Rule()]);
                  }}
                >
                  <Plus className='size-4' />
                  Add filter
                </Button>

                <Sheet
                  open={reviewOpen}
                  onOpenChange={(open) => {
                    setReviewOpen(open);
                    if (open) {
                      setReviewMode('active');
                      setReviewQuery('');
                    }
                  }}
                >
                  <SheetTrigger asChild>
                    <Button type='button' variant='secondary' disabled={!preview?.summary.matchingContacts}>
                      Review recipients
                      <Badge variant='outline' className='ml-1'>
                        {previewLoading ? '...' : preview?.summary.matchingContacts ?? 0}
                      </Badge>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='right' size='full' className='w-full md:max-w-3xl xl:max-w-[50vw]'>
                    <AudienceReviewSheet
                      preview={preview}
                      previewLoading={previewLoading}
                      excludedRecipients={excludedRecipients}
                      athleteLinksByContact={athleteLinksByContact}
                      loadingAthletesByContact={loadingAthletesByContact}
                      expandedContacts={expandedContacts}
                      reviewQuery={reviewQuery}
                      reviewMode={reviewMode}
                      onReviewQueryChange={setReviewQuery}
                      onReviewModeChange={setReviewMode}
                      onToggleExpanded={toggleExpandedRecipient}
                      onRemove={handleExcludeRecipient}
                      onUndo={handleUndoExcludeRecipient}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-6'>
            <Card rounded='xl' className='border-border/60 shadow-sm shadow-black/5'>
              <CardHeader>
                <CardTitle>Message</CardTitle>
                <CardDescription>
                  Keep it simple: a clear subject and a warm, easy-to-read message.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='space-y-2'>
                  <Label htmlFor='campaign-subject'>Subject</Label>
                  <Input
                    id='campaign-subject'
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder='A few spots just opened up'
                  />
                </div>

                <div className='space-y-3'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <Label>Body</Label>
                      <div className='text-sm text-muted-foreground'>
                        Keep it short, clear, and easy to scan.
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
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
                  <SimpleRichTextEditor value={bodyHtml} onChange={setBodyHtml} />
                </div>
              </CardContent>
            </Card>

            <Card rounded='xl' className='border-border/60 shadow-sm shadow-black/5'>
              <CardHeader>
                <CardTitle>Scheduling</CardTitle>
                <CardDescription>
                  Pick when parents should receive this message.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Send date</Label>
                  <DatePicker value={scheduleDate} onChange={setScheduleDate} />
                </div>
                <div className='space-y-2'>
                  <Label>Send time</Label>
                  <TimePicker value={scheduleTime} onChange={setScheduleTime} />
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {submitError ? (
          <Alert variant='error' className='mt-6'>
            <AlertTitle>Couldn’t schedule campaign</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <div className='mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-6'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setStep((current) => (current === 2 ? 1 : 1))}
            disabled={step === 1}
          >
            <ArrowLeft className='size-4' />
            Back
          </Button>

          {step === 1 ? (
            <Button type='button' onClick={() => setStep(2)} disabled={!canContinue}>
              Continue
              <ArrowRight className='size-4' />
            </Button>
          ) : (
            <div className='flex flex-wrap gap-3'>
              <Button type='button' variant='outline' onClick={() => setStep(1)}>
                Back to recipients
              </Button>
              <Button type='button' onClick={handleSubmit} disabled={submitting || !canSubmit}>
                <CalendarClock className='size-4' />
                {submitting ? 'Scheduling…' : 'Schedule campaign'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
