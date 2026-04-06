'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MailPlus } from 'lucide-react';
import type {
  AudienceMetadata,
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  MarketingCampaign,
  MarketingCampaignDispatchState,
  Page,
  SegmentPreset,
} from '@/lib/marketing-services';
import {
  ensureMarketingV2DemoSeedData,
  isMarketingV2DemoCampaign,
  readMarketingV2DemoCampaigns,
  readMarketingV2DemoDispatchStates,
} from '@/lib/marketing-v2-demo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignDateFilter, type CampaignDateFilterValue } from './campaign-date-filter';
import { CampaignSearch } from './campaign-search';
import { CampaignSort, type CampaignSortOrder } from './campaign-sort';

type MarketingV2BootstrapResponse = {
  contactPresets: SegmentPreset<ContactSegmentFilters>[];
  eventPresets: SegmentPreset<ContactEventSegmentFilters>[];
  campaigns: Page<MarketingCampaign>;
  metadata: AudienceMetadata;
};

type CampaignSectionKey =
  | 'needs-attention'
  | 'sending'
  | 'scheduled'
  | 'sent';

type AudienceDefinition = {
  presetId?: string | null;
  segment_scope?: string | null;
  filters?: (ContactSegmentFilters & ContactEventSegmentFilters) | null;
  v2_event_rules?: Array<{
    event_id: string;
    event_label?: string | null;
    status: string;
  }>;
};

type CampaignCardModel = {
  campaign: MarketingCampaign;
  audienceCopy: string;
  stateCopy: string;
  progressCopy: string;
  noteCopy: string | null;
  progressValue: number | null;
  section: CampaignSectionKey;
  showProgress: boolean;
  statusLabel: string;
  statusVariant: 'secondary' | 'warning' | 'success' | 'error';
};

const sectionConfig: Record<
  CampaignSectionKey,
  {
    title: string;
  }
> = {
  'needs-attention': {
    title: 'Delivery updates',
  },
  sending: {
    title: 'Sending now',
  },
  scheduled: {
    title: 'Scheduled',
  },
  sent: {
    title: 'Sent',
  },
};

function readAudienceDefinition(campaign: MarketingCampaign): AudienceDefinition {
  const raw = campaign.audience_definition as AudienceDefinition | null;

  return {
    presetId: raw?.presetId ?? null,
    segment_scope: raw?.segment_scope ?? null,
    filters: raw?.filters ?? {},
    v2_event_rules: raw?.v2_event_rules ?? [],
  };
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'soon';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getCampaignRelevantDate(campaign: MarketingCampaign) {
  return campaign.sent_at ?? campaign.scheduled_at ?? campaign.created_at;
}

function matchesDateFilter(campaign: MarketingCampaign, dateFilter: CampaignDateFilterValue) {
  if (dateFilter === 'all') {
    return true;
  }

  const relevantDate = getCampaignRelevantDate(campaign);
  if (!relevantDate) {
    return false;
  }

  const campaignDate = new Date(relevantDate);
  const now = new Date();

  if (dateFilter === 'last-7-days') {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return campaignDate >= cutoff;
  }

  if (dateFilter === 'last-30-days') {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return campaignDate >= cutoff;
  }

  return campaignDate.getFullYear() === now.getFullYear();
}

function buildAudienceCopy(
  campaign: MarketingCampaign,
  metadata: AudienceMetadata,
  presetLabelById: Map<string, string>,
) {
  const definition = readAudienceDefinition(campaign);
  const filters = definition.filters ?? {};
  const v2EventRules = definition.v2_event_rules ?? [];
  const eventNames = (filters.eventIds ?? [])
    .map((id) => metadata.events.find((event) => event.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  const seasonNames = (filters.seasonIds ?? [])
    .map((id) => metadata.seasons.find((season) => season.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  const eventStatuses = [
    filters.attendedOnly ? 'attended' : null,
    filters.waitlistedOnly ? 'waitlisted' : null,
    filters.registeredButUnpaid ? 'unpaid' : null,
    filters.hasSuccessfulTransaction ? 'paid' : null,
    filters.hasRegistration ? 'registered' : null,
  ].filter((status): status is string => Boolean(status));

  if (v2EventRules.length) {
    const statuses = Array.from(new Set(v2EventRules.map((rule) => rule.status)));
    const events = v2EventRules.map((rule) => rule.event_label).filter((label): label is string => Boolean(label));
    const statusLabel = statuses.length === 1 ? `${statuses[0]} parents` : 'parents';
    const eventLabel = events.length === 1 ? events[0] : `${v2EventRules.length} past events`;
    return `To ${statusLabel} from ${eventLabel}`;
  }

  if (eventNames.length) {
    const statusLabel = eventStatuses.length === 1 ? `${eventStatuses[0]} parents` : 'parents';
    const eventLabel = eventNames.length === 1
      ? eventNames[0]
      : `${eventNames.length} past events`;
    return `To ${statusLabel} from ${eventLabel}`;
  }

  if (seasonNames.length) {
    const seasonLabel = seasonNames.length === 1
      ? seasonNames[0]
      : `${seasonNames.length} seasons`;
    return `To parents from ${seasonLabel}`;
  }

  if (filters.createdVia?.length === 1 && filters.createdVia[0] === 'import') {
    return 'To imported parents';
  }

  if (filters.registeredButNeverPaid) {
    return 'To parents who registered but never paid';
  }

  if (filters.paidEver) {
    return 'To parents who have paid before';
  }

  if (filters.registeredWithinDays) {
    return `To parents who registered in the last ${filters.registeredWithinDays} days`;
  }

  if (filters.registeredEver) {
    return 'To parents who have registered before';
  }

  if (filters.hasLinkedAthlete) {
    return 'To parents linked to a player';
  }

  const presetLabel = definition.presetId
    ? presetLabelById.get(definition.presetId)
    : null;

  if (presetLabel) {
    return `To ${presetLabel.toLowerCase()}`;
  }

  return 'To all parents who can receive messages';
}

function chooseDispatchState(
  campaign: MarketingCampaign,
  dispatchStates: MarketingCampaignDispatchState[],
) {
  const matchingDispatches = dispatchStates.filter(
    (dispatchState) => dispatchState.campaign_id === campaign.id,
  );

  if (!matchingDispatches.length) {
    return null;
  }

  const activeDispatch = matchingDispatches.find(
    (dispatchState) => dispatchState.dispatch_status === 'sending',
  );

  if (activeDispatch) {
    return activeDispatch;
  }

  return [...matchingDispatches].sort((left, right) =>
    new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  )[0];
}

function getCampaignSection(
  campaign: MarketingCampaign,
  dispatchState: MarketingCampaignDispatchState | null,
): CampaignSectionKey {
  if (
    campaign.status === 'failed'
    || campaign.status === 'canceled'
    || dispatchState?.dispatch_status === 'failed'
    || dispatchState?.dispatch_status === 'canceled'
  ) {
    return 'needs-attention';
  }

  if (campaign.status === 'sending') {
    return 'sending';
  }

  if (campaign.status === 'scheduled') {
    return 'scheduled';
  }

  if (campaign.status === 'sent') {
    return 'sent';
  }

  return 'scheduled';
}

function buildCampaignCardModel(
  campaign: MarketingCampaign,
  dispatchState: MarketingCampaignDispatchState | null,
  metadata: AudienceMetadata,
  presetLabelById: Map<string, string>,
): CampaignCardModel {
  const section = getCampaignSection(campaign, dispatchState);

  if (section === 'needs-attention') {
    const failedRecipients = dispatchState?.failed_recipients ?? 0;
    const delayedRecipients = dispatchState?.retry_scheduled_recipients ?? 0;
    const canceledRecipients = dispatchState?.canceled_recipients ?? 0;
    const undeliveredRecipients = failedRecipients + canceledRecipients;
    const delayed = delayedRecipients > 0;

    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: delayed
        ? 'Delivery is delayed'
        : campaign.status === 'canceled'
          ? 'Sending was stopped early'
          : 'Some emails could not be delivered',
      progressCopy: delayed
        ? `${delayedRecipients} delayed ${delayedRecipients === 1 ? 'email' : 'emails'}`
        : undeliveredRecipients > 0
          ? `${undeliveredRecipients} ${undeliveredRecipients === 1 ? 'email could' : 'emails could'} not be delivered`
          : 'Open for details',
      noteCopy: delayed
        ? ''
        : campaign.status === 'canceled'
          ? 'Sending was stopped before it finished.'
          : 'Open this campaign to review delivery details.',
      progressValue: dispatchState?.sent_percent ?? null,
      section,
      showProgress: Boolean(dispatchState?.sent_percent),
      statusLabel: delayed ? 'Delayed' : campaign.status === 'canceled' ? 'Stopped' : 'Failed',
      statusVariant: delayed ? 'warning' : 'error',
    };
  }

  if (section === 'sending') {
    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: 'Sending now',
      progressCopy: dispatchState?.total_recipients
        ? `${dispatchState.sent_recipients} of ${dispatchState.total_recipients} sent`
        : 'Sending now',
      noteCopy: dispatchState && dispatchState.retry_scheduled_recipients > 0
        ? `${dispatchState.retry_scheduled_recipients} delayed`
        : null,
      progressValue: dispatchState?.sent_percent ?? 48,
      section,
      showProgress: true,
      statusLabel: 'Sending',
      statusVariant: 'warning',
    };
  }

  if (section === 'scheduled') {
    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: `Going out ${formatDateTime(campaign.scheduled_at)}`,
      progressCopy: 'Scheduled',
      noteCopy: null,
      progressValue: null,
      section,
      showProgress: false,
      statusLabel: 'Scheduled',
      statusVariant: 'secondary',
    };
  }

  if (section === 'sent') {
    const failureCount = dispatchState
      ? dispatchState.failed_recipients + dispatchState.retry_scheduled_recipients
      : 0;

    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: `Sent ${formatDateTime(campaign.sent_at)}`,
      progressCopy: 'Sent',
      noteCopy: failureCount > 0 ? `${failureCount} parents did not receive it` : null,
      progressValue: 100,
      section,
      showProgress: true,
      statusLabel: 'Sent',
      statusVariant: 'success',
    };
  }

  return {
    campaign,
    audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
    stateCopy: `Going out ${formatDateTime(campaign.scheduled_at)}`,
    progressCopy: 'Scheduled',
    noteCopy: null,
    progressValue: null,
    section,
    showProgress: false,
    statusLabel: 'Scheduled',
    statusVariant: 'secondary',
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

function CampaignSection({
  title,
  campaigns,
  hideHeader = false,
}: {
  title: string;
  campaigns: CampaignCardModel[];
  hideHeader?: boolean;
}) {
  const headerCells = [
    'Campaign',
    'Status',
    'Progress',
  ];

  return (
    <section className='space-y-3'>
      {!hideHeader ? (
        <div className='flex items-end justify-between gap-3'>
          <h2 className='text-h5'>{title}</h2>
          <div className='text-sm text-muted-foreground'>
            {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
          </div>
        </div>
      ) : null}

      <Card rounded='xl' className='overflow-hidden border-border/60 bg-card/95 shadow-sm shadow-black/5'>
        <CardContent className='px-0'>
          <div className='hidden border-b border-border/50 px-6 py-3 lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(220px,1.2fr)] lg:gap-6'>
            {headerCells.map((label) => (
              <div key={label} className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                {label}
              </div>
            ))}
          </div>

          <div>
            {campaigns.map((card, index) => {
              const rowToneClassName = card.section === 'sending'
                ? 'bg-warning-muted/18'
                : card.section === 'needs-attention'
                  ? 'bg-error-muted/18'
                  : '';
              const rowClassName = `block transition-colors hover:bg-muted/35 ${rowToneClassName}`;
              const rowContent = (
                <div
                  className={`grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(220px,1.2fr)] lg:gap-6 lg:items-center ${
                    index > 0 ? 'border-t border-border/45' : ''
                  }`}
                >
                  <div className='min-w-0 space-y-2'>
                    <div className='flex flex-wrap items-center gap-3'>
                      <h3 className='truncate text-lg font-medium'>{card.campaign.name}</h3>
                      <Badge variant={card.statusVariant}>{card.statusLabel}</Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>{card.audienceCopy}</p>
                  </div>

                  <div className='space-y-1'>
                    <div className='text-sm font-medium text-foreground/90'>{card.stateCopy}</div>
                    {card.noteCopy ? (
                      <div className='text-sm text-muted-foreground'>{card.noteCopy}</div>
                    ) : null}
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between gap-3 text-sm'>
                      <span className='font-medium text-foreground/90'>{card.progressCopy}</span>
                      {card.showProgress && card.progressValue !== null ? (
                        <span className='text-muted-foreground'>{Math.round(card.progressValue)}%</span>
                      ) : null}
                    </div>
                    {card.showProgress && card.progressValue !== null ? (
                      <Progress
                        value={card.progressValue}
                        className={`h-2.5 ${
                          card.section === 'sent'
                            ? 'bg-success-muted'
                            : card.section === 'needs-attention'
                              ? 'bg-error-muted'
                              : card.section === 'sending'
                                ? 'bg-warning-muted'
                                : ''
                        }`}
                      />
                    ) : null}
                  </div>
                </div>
              );

              return (
                <Link
                  key={card.campaign.id}
                  href={`/marketing-v2/campaigns/${card.campaign.id}`}
                  className={rowClassName}
                >
                  {rowContent}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function resetCampaignControls(
  setSearchQuery: (value: string) => void,
  setDateFilter: (value: CampaignDateFilterValue) => void,
  setSortOrder: (value: CampaignSortOrder) => void,
) {
  setSearchQuery('');
  setDateFilter('all');
  setSortOrder('latest');
}

export function MarketingV2Dashboard() {
  const [bootstrap, setBootstrap] = useState<MarketingV2BootstrapResponse | null>(null);
  const [dispatchStates, setDispatchStates] = useState<Page<MarketingCampaignDispatchState> | null>(
    null,
  );
  const [demoCampaigns, setDemoCampaigns] = useState<MarketingCampaign[]>([]);
  const [demoDispatchStates, setDemoDispatchStates] = useState<MarketingCampaignDispatchState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<CampaignSortOrder>('latest');
  const [dateFilter, setDateFilter] = useState<CampaignDateFilterValue>('all');

  useEffect(() => {
    let cancelled = false;

    async function loadData(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const [bootstrapResponse, dispatchResponse] = await Promise.all([
          fetchJson<MarketingV2BootstrapResponse>('/api/marketing/bootstrap'),
          fetchJson<Page<MarketingCampaignDispatchState>>(
            '/api/marketing/campaign-dispatches?page=1&pageSize=100',
          ),
        ]);

        if (!cancelled) {
          setBootstrap(bootstrapResponse);
          setDispatchStates(dispatchResponse);
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : 'We couldn’t load campaigns right now.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData(true);

    const intervalId = window.setInterval(() => {
      void loadData(false);
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function syncDemoCampaigns() {
      setDemoCampaigns(readMarketingV2DemoCampaigns());
      setDemoDispatchStates(readMarketingV2DemoDispatchStates());
    }

    if (bootstrap) {
      const seedData = ensureMarketingV2DemoSeedData(bootstrap.metadata);
      setDemoCampaigns(seedData.campaigns);
      setDemoDispatchStates(seedData.dispatchStates);
    } else {
      syncDemoCampaigns();
    }

    window.addEventListener('storage', syncDemoCampaigns);

    return () => {
      window.removeEventListener('storage', syncDemoCampaigns);
    };
  }, [bootstrap]);

  const cardsBySection = useMemo(() => {
    if (!bootstrap || !dispatchStates) {
      return null;
    }

    const presetLabelById = new Map(
      [...bootstrap.contactPresets, ...bootstrap.eventPresets].map((preset) => [
        preset.id,
        preset.label,
      ]),
    );

    const mergedCampaigns = [
      ...demoCampaigns,
      ...bootstrap.campaigns.data.filter(
        (campaign) => !demoCampaigns.some((demoCampaign) => demoCampaign.id === campaign.id),
      ),
    ].filter((campaign) => campaign.status !== 'draft');
    const mergedDispatchStates = [
      ...demoDispatchStates,
      ...dispatchStates.data.filter(
        (dispatchState) => !demoDispatchStates.some((demoDispatchState) => demoDispatchState.dispatch_id === dispatchState.dispatch_id),
      ),
    ];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const visibleCampaigns = normalizedQuery
      ? mergedCampaigns.filter((campaign) =>
        campaign.name.toLowerCase().includes(normalizedQuery)
      )
      : mergedCampaigns;
    const dateFilteredCampaigns = visibleCampaigns.filter((campaign) =>
      matchesDateFilter(campaign, dateFilter)
    );
    const orderedCampaigns = [...dateFilteredCampaigns].sort((left, right) => {
      const leftCreatedAt = new Date(left.created_at).getTime();
      const rightCreatedAt = new Date(right.created_at).getTime();

      return sortOrder === 'latest'
        ? rightCreatedAt - leftCreatedAt
        : leftCreatedAt - rightCreatedAt;
    });
    const cards = orderedCampaigns.map((campaign) =>
      buildCampaignCardModel(
        campaign,
        chooseDispatchState(campaign, mergedDispatchStates),
        bootstrap.metadata,
        presetLabelById,
      )
    );

    const sections: Record<CampaignSectionKey, CampaignCardModel[]> = {
      'needs-attention': [],
      sending: [],
      scheduled: [],
      sent: [],
    };

    for (const card of cards) {
      sections[card.section].push(card);
    }

    return sections;
  }, [bootstrap, dateFilter, demoCampaigns, demoDispatchStates, dispatchStates, searchQuery, sortOrder]);

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto max-w-6xl px-6 py-10'>
          <Skeleton className='h-8 w-32 rounded-full' />
          <Skeleton className='mt-4 h-14 w-72 rounded-lg' />
          <Skeleton className='mt-3 h-6 w-[28rem] rounded-lg' />
          <Skeleton className='mt-8 h-32 rounded-2xl' />
          <Skeleton className='mt-4 h-32 rounded-2xl' />
          <Skeleton className='mt-4 h-32 rounded-2xl' />
        </div>
      </div>
    );
  }

  if (error || !bootstrap || !dispatchStates || !cardsBySection) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12'>
          <Alert variant='error'>
            <AlertTitle>Couldn’t load campaigns</AlertTitle>
            <AlertDescription>
              {error ?? 'Campaigns could not be loaded right now.'}
            </AlertDescription>
          </Alert>
          <div className='flex gap-3'>
            <Button variant='outline' onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Button asChild>
              <Link href='/marketing?tab=campaigns'>Open current marketing</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentCampaigns = [
    ...cardsBySection['needs-attention'],
    ...cardsBySection.sending,
    ...cardsBySection.scheduled,
  ];
  const hasSentSection = cardsBySection.sent.length > 0;
  const totalCampaigns = demoCampaigns.filter((campaign) => campaign.status !== 'draft').length
    + bootstrap.campaigns.data.filter(
      (campaign) => !isMarketingV2DemoCampaign(campaign.id) && campaign.status !== 'draft',
    ).length;
  const visibleCampaignCount = currentCampaigns.length + cardsBySection.sent.length;

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-6xl px-6 py-10'>
        <div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl space-y-3'>
            <Badge variant='secondary'>Messages</Badge>
            <h1 className='text-h3'>Campaigns</h1>
            <p className='text-body1 text-muted-foreground'>
              See what is going out, what is scheduled next, and what already reached parents.
            </p>
          </div>
          <Button asChild size='lg'>
            <Link href='/marketing-v2/create'>
              <MailPlus className='size-4' />
              New message
            </Link>
          </Button>
        </div>

        {totalCampaigns ? (
          <div className='mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <CampaignSearch value={searchQuery} onChange={setSearchQuery} />
            <div className='flex flex-wrap items-center gap-3'>
              <CampaignDateFilter value={dateFilter} onChange={setDateFilter} />
              <CampaignSort value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>
        ) : null}

        {!totalCampaigns ? (
          <Card rounded='lg' className='border-dashed'>
            <CardHeader>
              <CardTitle>Start your first campaign</CardTitle>
              <CardDescription>
                Choose the right parents, write the message, and pick when it goes out.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href='/marketing-v2/create'>
                  <MailPlus className='size-4' />
                  Create campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : !visibleCampaignCount ? (
          <Card rounded='lg' className='border-dashed'>
            <CardHeader>
              <CardTitle>No campaigns match those filters</CardTitle>
              <CardDescription>
                Try a different campaign name or time range, or clear the filters to see everything again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant='outline'
                onClick={() => resetCampaignControls(setSearchQuery, setDateFilter, setSortOrder)}
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-8'>
            {currentCampaigns.length ? (
              <CampaignSection
                title='Current campaigns'
                campaigns={currentCampaigns}
              />
            ) : null}

            {hasSentSection ? (
              <Card rounded='xl' className='overflow-hidden border-border/60 bg-card/95 shadow-sm shadow-black/5'>
                <CardContent className='px-6 py-0'>
                  <Accordion type='single' collapsible>
                    <AccordionItem value='sent-campaigns' className='border-b-0'>
                      <AccordionTrigger className='py-5 hover:no-underline'>
                        <div className='text-h5'>{sectionConfig.sent.title}</div>
                        <div className='pr-2 text-sm text-muted-foreground'>
                          {cardsBySection.sent.length} {cardsBySection.sent.length === 1 ? 'campaign' : 'campaigns'}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className='pb-6'>
                        <CampaignSection
                          title={sectionConfig.sent.title}
                          campaigns={cardsBySection.sent}
                          hideHeader
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
