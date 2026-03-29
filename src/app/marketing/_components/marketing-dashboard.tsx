"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailPlus } from "lucide-react";
import type {
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  MarketingCampaign,
  MarketingCampaignDispatchState,
  MarketingContactEventSegmentFact,
  MarketingContactSegmentFact,
  MarketingImportBatch,
  MarketingSavedSegment,
  Page,
} from "@/lib/marketing-services";
import { AudienceBuilderTab } from "./audience-builder-tab";
import { CampaignComposerSheet } from "./campaign-composer-sheet";
import { DataManagerTab } from "./data-manager-tab";
import { ImportsTab } from "./imports-tab";
import {
  AudienceResponse,
  AudienceSelectionState,
  BootstrapResponse,
  buildAudienceDefinition,
  buildAudienceRequest,
  defaultAudienceSelection,
  fetchJson,
  isEventScopedFilter,
  statusBadgeVariant,
  toTitleCase,
} from "./marketing-ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MarketingDashboardProps = {
  initialTab: string;
};

export function MarketingDashboard({ initialTab }: MarketingDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [campaignSearch, setCampaignSearch] = useState("");
  const deferredCampaignSearch = useDeferredValue(campaignSearch);
  const [campaigns, setCampaigns] = useState<Page<MarketingCampaign> | null>(null);
  const [dispatchStates, setDispatchStates] = useState<Page<MarketingCampaignDispatchState> | null>(
    null,
  );
  const [dispatchStatesLoading, setDispatchStatesLoading] = useState(true);
  const [dispatchStatesError, setDispatchStatesError] = useState<string | null>(null);
  const [imports, setImports] = useState<Page<MarketingImportBatch> | null>(null);
  const [savedSegments, setSavedSegments] = useState<MarketingSavedSegment[]>([]);
  const [audienceSelection, setAudienceSelection] = useState<AudienceSelectionState>(
    defaultAudienceSelection,
  );
  const [audienceResponse, setAudienceResponse] = useState<AudienceResponse | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(true);
  const [audienceRefreshNonce, setAudienceRefreshNonce] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSeed, setComposerSeed] = useState<AudienceSelectionState>(
    defaultAudienceSelection,
  );

  useEffect(() => {
    setLoadingBootstrap(true);
    setBootstrapError(null);

    void fetchJson<BootstrapResponse>("/api/marketing/bootstrap")
      .then((response) => {
        setBootstrap(response);
        setCampaigns(response.campaigns);
        setImports(response.imports);
        setSavedSegments(response.savedSegments);
      })
      .catch((error: Error) => {
        setBootstrapError(error.message);
      })
      .finally(() => setLoadingBootstrap(false));
  }, []);

  useEffect(() => {
    startTransition(() => {
      router.replace(`/marketing?tab=${activeTab}`);
    });
  }, [activeTab, router]);

  useEffect(() => {
    setAudienceLoading(true);

    void fetchJson<AudienceResponse>("/api/marketing/audiences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildAudienceRequest({
          ...audienceSelection,
          filters: {
            ...audienceSelection.filters,
            search: audienceSelection.filters.search || undefined,
          },
        }),
      ),
    })
      .then((response) => {
        setAudienceResponse(response);
      })
      .finally(() => setAudienceLoading(false));
  }, [
    audienceRefreshNonce,
    audienceSelection.filters.attendedOnly,
    audienceSelection.filters.createdVia,
    audienceSelection.filters.eventIds,
    audienceSelection.filters.hasLinkedAthlete,
    audienceSelection.filters.paidEver,
    audienceSelection.filters.registeredButNeverPaid,
    audienceSelection.filters.registeredEver,
    audienceSelection.filters.registeredWithinDays,
    audienceSelection.filters.search,
    audienceSelection.filters.seasonIds,
    audienceSelection.filters.waitlistedOnly,
    audienceSelection.page,
    audienceSelection.presetId,
  ]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    void fetchJson<Page<MarketingCampaign>>(
      `/api/marketing/campaigns?search=${encodeURIComponent(deferredCampaignSearch)}`,
    ).then((response) => {
      setCampaigns(response);
    });
  }, [bootstrap, deferredCampaignSearch]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    let cancelled = false;

    async function loadDispatchStates(showLoading: boolean) {
      if (showLoading) {
        setDispatchStatesLoading(true);
      }

      try {
        const response = await fetchJson<Page<MarketingCampaignDispatchState>>(
          "/api/marketing/campaign-dispatches?page=1&pageSize=25",
        );

        if (!cancelled) {
          setDispatchStates(response);
          setDispatchStatesError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setDispatchStatesError(
            error instanceof Error
              ? error.message
              : "Failed to load campaign dispatch activity.",
          );
        }
      } finally {
        if (!cancelled) {
          setDispatchStatesLoading(false);
        }
      }
    }

    void loadDispatchStates(true);

    const intervalId = window.setInterval(() => {
      void loadDispatchStates(false);
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [bootstrap]);

  function formatDateTime(value?: string | null) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString();
  }

  const campaignNameById = new Map(
    campaigns?.data.map((campaign) => [campaign.id, campaign.name]) ?? [],
  );

  async function handleSaveSegment(
    values: { name: string; description?: string },
    mode: "create" | "edit",
    currentSegment: MarketingSavedSegment | null,
  ) {
    const payload = {
      name: values.name,
      description: values.description ?? null,
      segment_scope: audienceResponse?.eventScoped ? "event" : "contact",
      filter_definition: buildAudienceDefinition(
        audienceSelection,
        Boolean(audienceResponse?.eventScoped),
      ),
    };

    if (mode === "edit" && currentSegment) {
      const updated = await fetchJson<MarketingSavedSegment>(
        `/api/marketing/saved-segments/${currentSegment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      setSavedSegments((current) =>
        current.map((segment) => (segment.id === updated.id ? updated : segment)),
      );
      return;
    }

    const created = await fetchJson<MarketingSavedSegment>("/api/marketing/saved-segments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setSavedSegments((current) => [created, ...current]);
  }

  async function handleDeleteSegment(id: string) {
    await fetchJson(`/api/marketing/saved-segments/${id}`, {
      method: "DELETE",
    });

    setSavedSegments((current) => current.filter((segment) => segment.id !== id));
  }

  async function handleManualContactSubmit(values: {
    email: string;
    first_name?: string;
    last_name?: string;
    athlete_id?: string;
    relationship_type?: "parent" | "guardian" | "other";
  }) {
    const contact = await fetchJson<{ id: string }>("/api/marketing/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (values.athlete_id?.trim()) {
      await fetchJson("/api/marketing/contact-athletes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketing_contact_id: contact.id,
          athlete_id: values.athlete_id.trim(),
          relationship_type: values.relationship_type ?? "parent",
        }),
      });
    }

    setAudienceRefreshNonce((current) => current + 1);
  }

  async function handleLinkAthleteSubmit(
    recipient: MarketingContactSegmentFact | MarketingContactEventSegmentFact,
    values: {
      athlete_id: string;
      relationship_type: "parent" | "guardian" | "other";
    },
  ) {
    await fetchJson("/api/marketing/contact-athletes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketing_contact_id: recipient.marketing_contact_id,
        athlete_id: values.athlete_id,
        relationship_type: values.relationship_type,
      }),
    });

    setAudienceRefreshNonce((current) => current + 1);
  }

  if (loadingBootstrap) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Skeleton className="h-10 w-56 rounded-lg" />
          <Skeleton className="mt-4 h-32 rounded-xl" />
          <Skeleton className="mt-6 h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (bootstrapError || !bootstrap || !campaigns || !imports) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
          <Alert variant="error">
            <AlertTitle>Unable to load marketing data</AlertTitle>
            <AlertDescription>
              {bootstrapError ?? "The marketing bootstrap request did not complete successfully."}
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
            <form action="/auth/sign-out" method="post">
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="secondary">Marketing communications</Badge>
            <h1 className="text-h3">Reach the right families without leaving Tenpo</h1>
            <p className="text-body1 text-muted-foreground">
              Build audiences from registrations, payments, and imports, then launch campaigns faster than the export-to-Mailchimp workaround.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <form action="/auth/sign-out" method="post">
              <Button variant="outline" size="lg" type="submit">
                Sign out
              </Button>
            </form>
            <Button
              size="lg"
              onClick={() => {
                setComposerSeed(defaultAudienceSelection);
                setComposerOpen(true);
                setActiveTab("campaigns");
              }}
            >
              <MailPlus className="size-4" />
              New campaign
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="audiences">Audiences</TabsTrigger>
            <TabsTrigger value="imports">Imports</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Campaigns</CardTitle>
                  <CardDescription>
                    Create a targeted outreach flow in three steps: audience, message, review.
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                  <SearchInput
                    className="md:w-80"
                    value={campaignSearch}
                    onChange={(event) => setCampaignSearch(event.target.value)}
                    onClear={() => setCampaignSearch("")}
                    placeholder="Search campaigns"
                  />
                  <Button
                    onClick={() => {
                      setComposerSeed(defaultAudienceSelection);
                      setComposerOpen(true);
                    }}
                  >
                    <MailPlus className="size-4" />
                    New campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Last updated</TableHead>
                      <TableHead>Audience</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.data.map((campaign) => (
                      <TableRow
                        key={campaign.id}
                        className="cursor-pointer"
                        onClick={() => {
                          router.push(`/marketing/campaigns/${campaign.id}`);
                        }}
                      >
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(campaign.status)}>
                            {toTitleCase(campaign.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.subject}</TableCell>
                        <TableCell>
                          {new Date(campaign.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {String(campaign.audience_definition.presetId ?? "Custom audience")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Dispatch activity</CardTitle>
                  <CardDescription>
                    Live campaign run state from the dispatch views. This table refreshes automatically every 5 seconds.
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {dispatchStates?.count ?? dispatchStates?.data.length ?? 0} runs
                </Badge>
              </CardHeader>
              <CardContent>
                {dispatchStatesError ? (
                  <Alert variant="error">
                    <AlertTitle>Unable to load dispatch activity</AlertTitle>
                    <AlertDescription>{dispatchStatesError}</AlertDescription>
                  </Alert>
                ) : dispatchStatesLoading && !dispatchStates ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                ) : !dispatchStates?.data.length ? (
                  <Alert variant="info">
                    <AlertTitle>No dispatch runs yet</AlertTitle>
                    <AlertDescription>
                      The dispatch worker has not created any campaign runs yet. Once it does, progress will show up here automatically.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Last activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatchStates.data.map((dispatchState) => (
                        <TableRow key={dispatchState.dispatch_id}>
                          <TableCell className="font-medium">
                            {campaignNameById.get(dispatchState.campaign_id) ?? dispatchState.campaign_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(dispatchState.dispatch_status)}>
                              {toTitleCase(dispatchState.dispatch_status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{dispatchState.sent_percent}% sent</TableCell>
                          <TableCell>
                            {dispatchState.sent_recipients}/{dispatchState.total_recipients} sent
                          </TableCell>
                          <TableCell>{dispatchState.total_attempts}</TableCell>
                          <TableCell>
                            {formatDateTime(
                              dispatchState.last_attempted_at
                                ?? dispatchState.last_sent_at
                                ?? dispatchState.updated_at,
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audiences" className="mt-6">
            <AudienceBuilderTab
              presets={bootstrap.contactPresets}
              metadata={bootstrap.metadata}
              audienceSelection={audienceSelection}
              setAudienceSelection={setAudienceSelection}
              audienceResponse={audienceResponse}
              audienceLoading={audienceLoading}
              savedSegments={savedSegments}
              onSaveSegment={handleSaveSegment}
              onDeleteSegment={handleDeleteSegment}
              onManualContactCreate={handleManualContactSubmit}
              onLinkAthlete={handleLinkAthleteSubmit}
              onUseInCampaign={() => {
                if ((audienceResponse?.summary.matchingContacts ?? 0) === 0) {
                  return;
                }

                setComposerSeed(audienceSelection);
                setComposerOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="imports" className="mt-6">
            <ImportsTab
              imports={imports}
              onImportCreated={(batch) => {
                setImports((current) =>
                  current
                    ? {
                        ...current,
                        data: [batch, ...current.data],
                        count: (current.count ?? 0) + 1,
                      }
                    : {
                        data: [batch],
                        count: 1,
                        page: 1,
                        pageSize: 20,
                      },
                );
              }}
            />
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <DataManagerTab
              active={activeTab === "data"}
              campaigns={campaigns}
              imports={imports}
              savedSegments={savedSegments}
              contactPresets={bootstrap.contactPresets}
              eventPresets={bootstrap.eventPresets}
              onCampaignsChange={setCampaigns}
              onImportsChange={setImports}
              onSavedSegmentsChange={setSavedSegments}
              onAudienceRefresh={() =>
                setAudienceRefreshNonce((current) => current + 1)
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      <CampaignComposerSheet
        open={composerOpen}
        onOpenChange={setComposerOpen}
        presets={bootstrap.contactPresets}
        eventPresets={bootstrap.eventPresets}
        savedSegments={savedSegments}
        metadata={bootstrap.metadata}
        seedSelection={composerSeed}
        onCampaignCreated={(campaign) => {
          setCampaigns((current) =>
            current
              ? {
                  ...current,
                  data: [campaign, ...current.data],
                  count: (current.count ?? 0) + 1,
                }
              : {
                  data: [campaign],
                  count: 1,
                  page: 1,
                  pageSize: 20,
                },
          );
          setActiveTab("campaigns");
        }}
      />
    </div>
  );
}
