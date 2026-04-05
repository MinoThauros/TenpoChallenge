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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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
  | 'draft'
  | 'sent';

type AudienceDefinition = {
  presetId?: string | null;
  segment_scope?: string | null;
  filters?: (ContactSegmentFilters & ContactEventSegmentFilters) | null;
};

type CampaignCardModel = {
  campaign: MarketingCampaign;
  audienceCopy: string;
  stateCopy: string;
  progressCopy: string;
  noteCopy: string | null;
  progressValue: number;
  section: CampaignSectionKey;
  statusLabel: string;
  statusVariant: 'secondary' | 'warning' | 'success' | 'error';
};

const sectionConfig: Record<
  CampaignSectionKey,
  {
    title: string;
    description: string;
  }
> = {
  'needs-attention': {
    title: 'Needs attention',
    description: 'Only the campaigns that need a closer look.',
  },
  sending: {
    title: 'Sending now',
    description: 'The campaigns currently going out to families.',
  },
  scheduled: {
    title: 'Scheduled',
    description: 'Ready to go out at the planned time.',
  },
  draft: {
    title: 'Drafts',
    description: 'Still being prepared before they go out.',
  },
  sent: {
    title: 'Sent',
    description: 'Already delivered or completed.',
  },
};

function readAudienceDefinition(campaign: MarketingCampaign): AudienceDefinition {
  const raw = campaign.audience_definition as AudienceDefinition | null;

  return {
    presetId: raw?.presetId ?? null,
    segment_scope: raw?.segment_scope ?? null,
    filters: raw?.filters ?? {},
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

function buildAudienceCopy(
  campaign: MarketingCampaign,
  metadata: AudienceMetadata,
  presetLabelById: Map<string, string>,
) {
  const definition = readAudienceDefinition(campaign);
  const filters = definition.filters ?? {};
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

  if (eventNames.length) {
    const statusLabel = eventStatuses.length === 1 ? `${eventStatuses[0]} families` : 'families';
    const eventLabel = eventNames.length === 1
      ? eventNames[0]
      : `${eventNames.length} past events`;
    return `To ${statusLabel} from ${eventLabel}`;
  }

  if (seasonNames.length) {
    const seasonLabel = seasonNames.length === 1
      ? seasonNames[0]
      : `${seasonNames.length} seasons`;
    return `To families from ${seasonLabel}`;
  }

  if (filters.createdVia?.length === 1 && filters.createdVia[0] === 'import') {
    return 'To imported contacts';
  }

  if (filters.registeredButNeverPaid) {
    return 'To families who registered but never paid';
  }

  if (filters.paidEver) {
    return 'To paid families';
  }

  if (filters.registeredWithinDays) {
    return `To families who registered in the last ${filters.registeredWithinDays} days`;
  }

  if (filters.registeredEver) {
    return 'To families who have registered before';
  }

  if (filters.hasLinkedAthlete) {
    return 'To contacts linked to an athlete';
  }

  const presetLabel = definition.presetId
    ? presetLabelById.get(definition.presetId)
    : null;

  if (presetLabel) {
    return `To ${presetLabel.toLowerCase()}`;
  }

  return 'To all marketable contacts';
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

  return 'draft';
}

function buildCampaignCardModel(
  campaign: MarketingCampaign,
  dispatchState: MarketingCampaignDispatchState | null,
  metadata: AudienceMetadata,
  presetLabelById: Map<string, string>,
): CampaignCardModel {
  const section = getCampaignSection(campaign, dispatchState);

  if (section === 'needs-attention') {
    const affectedRecipients = dispatchState
      ? dispatchState.failed_recipients + dispatchState.retry_scheduled_recipients
      : 0;

    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: campaign.status === 'canceled'
        ? 'Stopped before it finished'
        : 'Needs a closer look',
      progressCopy: affectedRecipients > 0
        ? `${affectedRecipients} emails need attention`
        : 'Review this campaign',
      noteCopy: campaign.status === 'canceled'
        ? 'The campaign was canceled before it fully finished.'
        : null,
      progressValue: dispatchState?.sent_percent ?? 12,
      section,
      statusLabel: 'Needs attention',
      statusVariant: 'error',
    };
  }

  if (section === 'sending') {
    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: 'Sending now',
      progressCopy: dispatchState?.total_recipients
        ? `${dispatchState.sent_recipients} of ${dispatchState.total_recipients} sent`
        : 'In progress',
      noteCopy: dispatchState && dispatchState.retry_scheduled_recipients > 0
        ? `${dispatchState.retry_scheduled_recipients} still retrying`
        : null,
      progressValue: dispatchState?.sent_percent ?? 48,
      section,
      statusLabel: 'Sending',
      statusVariant: 'warning',
    };
  }

  if (section === 'scheduled') {
    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: `Going out ${formatDateTime(campaign.scheduled_at)}`,
      progressCopy: 'Ready to send',
      noteCopy: null,
      progressValue: 62,
      section,
      statusLabel: 'Scheduled',
      statusVariant: 'secondary',
    };
  }

  if (section === 'sent') {
    const sentSummary = dispatchState?.total_recipients
      ? `Sent to ${dispatchState.sent_recipients} of ${dispatchState.total_recipients} families`
      : `Sent ${formatDateTime(campaign.sent_at)}`;
    const failureCount = dispatchState
      ? dispatchState.failed_recipients + dispatchState.retry_scheduled_recipients
      : 0;

    return {
      campaign,
      audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
      stateCopy: `Sent ${formatDateTime(campaign.sent_at)}`,
      progressCopy: sentSummary,
      noteCopy: failureCount > 0 ? `${failureCount} emails did not go through` : null,
      progressValue: 100,
      section,
      statusLabel: 'Sent',
      statusVariant: 'success',
    };
  }

  return {
    campaign,
    audienceCopy: buildAudienceCopy(campaign, metadata, presetLabelById),
    stateCopy: 'Still in draft',
    progressCopy: 'Not scheduled yet',
    noteCopy: campaign.scheduled_at
      ? `Planned for ${formatDateTime(campaign.scheduled_at)} once ready`
      : null,
    progressValue: 18,
    section,
    statusLabel: 'Draft',
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
  description,
  campaigns,
}: {
  title: string;
  description: string;
  campaigns: CampaignCardModel[];
}) {
  const headerCells = [
    'Campaign',
    'Status',
    'Progress',
  ];

  return (
    <section className='space-y-3'>
      <div className='flex items-end justify-between gap-3'>
        <div>
          <h2 className='text-h5'>{title}</h2>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='text-sm text-muted-foreground'>
          {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
        </div>
      </div>

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

              return (
                <Link
                  key={card.campaign.id}
                  href={`/marketing/campaigns/${card.campaign.id}`}
                  className={`block transition-colors hover:bg-muted/35 ${rowToneClassName}`}
                >
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
                      ) : (
                        <div className='text-sm text-muted-foreground'>Open campaign</div>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <div className='flex items-center justify-between gap-3 text-sm'>
                        <span className='font-medium text-foreground/90'>{card.progressCopy}</span>
                        <span className='text-muted-foreground'>{Math.round(card.progressValue)}%</span>
                      </div>
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
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function MarketingV2Dashboard() {
  const [bootstrap, setBootstrap] = useState<MarketingV2BootstrapResponse | null>(null);
  const [dispatchStates, setDispatchStates] = useState<Page<MarketingCampaignDispatchState> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              : 'Unable to load campaigns right now.',
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

    const cards = bootstrap.campaigns.data.map((campaign) =>
      buildCampaignCardModel(
        campaign,
        chooseDispatchState(campaign, dispatchStates.data),
        bootstrap.metadata,
        presetLabelById,
      )
    );

    const sections: Record<CampaignSectionKey, CampaignCardModel[]> = {
      'needs-attention': [],
      sending: [],
      scheduled: [],
      draft: [],
      sent: [],
    };

    for (const card of cards) {
      sections[card.section].push(card);
    }

    return sections;
  }, [bootstrap, dispatchStates]);

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
            <AlertTitle>Unable to load campaigns</AlertTitle>
            <AlertDescription>
              {error ?? 'The Marketing V2 campaigns page could not load right now.'}
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

  const orderedSections: CampaignSectionKey[] = [
    'needs-attention',
    'sending',
    'scheduled',
    'draft',
    'sent',
  ];

  const visibleSections = orderedSections.filter(
    (section) => cardsBySection[section].length > 0,
  );
  const totalCampaigns = bootstrap.campaigns.data.length;

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-6xl px-6 py-10'>
        <div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl space-y-3'>
            <Badge variant='secondary'>Marketing V2</Badge>
            <h1 className='text-h3'>Campaigns</h1>
            <p className='text-body1 text-muted-foreground'>
              See what is sending, what is scheduled next, and what has already gone out.
            </p>
          </div>
          <Button asChild size='lg'>
            <Link href='/marketing?tab=campaigns'>
              <MailPlus className='size-4' />
              New campaign
            </Link>
          </Button>
        </div>

        {totalCampaigns ? (
          <Card rounded='xl' className='mb-8 border-border/60 bg-gradient-to-r from-card via-card to-secondary/25 shadow-sm shadow-black/5'>
            <CardContent className='grid gap-4 px-6 py-5 md:grid-cols-3'>
              <div>
                <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                  Sending now
                </div>
                <div className='mt-2 text-3xl font-medium'>{cardsBySection.sending.length}</div>
              </div>
              <div>
                <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                  Scheduled next
                </div>
                <div className='mt-2 text-3xl font-medium'>{cardsBySection.scheduled.length}</div>
              </div>
              <div>
                <div className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                  Sent already
                </div>
                <div className='mt-2 text-3xl font-medium'>{cardsBySection.sent.length}</div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!totalCampaigns ? (
          <Card rounded='lg' className='border-dashed'>
            <CardHeader>
              <CardTitle>Start your first campaign</CardTitle>
              <CardDescription>
                Build an audience, write the message, and send it from one calm place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href='/marketing?tab=campaigns'>
                  <MailPlus className='size-4' />
                  Create a campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-8'>
            {visibleSections.map((section) => (
              <CampaignSection
                key={section}
                title={sectionConfig[section].title}
                description={sectionConfig[section].description}
                campaigns={cardsBySection[section]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
