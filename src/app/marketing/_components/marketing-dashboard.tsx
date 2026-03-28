"use client";

import { useDeferredValue, useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  MailPlus,
  Pencil,
  Save,
  Send,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  type AudienceMetadata,
  type AudienceSummary,
  type ContactEventSegmentFilters,
  type ContactEventSegmentQueryInput,
  type ContactSegmentFilters,
  type ContactSegmentQueryInput,
  type MarketingCampaign,
  type MarketingContactEventSegmentFact,
  type MarketingContactSegmentFact,
  type MarketingImportBatch,
  type MarketingSavedSegment,
  type Page,
  type SegmentPreset,
  CONTACT_EVENT_SEGMENT_PRESETS,
  CONTACT_SEGMENT_PRESETS,
} from "@/lib/marketing-services";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type MarketingDashboardProps = {
  initialTab: string;
};

type BootstrapResponse = {
  contactPresets: SegmentPreset<ContactSegmentFilters>[];
  eventPresets: SegmentPreset<ContactEventSegmentFilters>[];
  savedSegments: MarketingSavedSegment[];
  campaigns: Page<MarketingCampaign>;
  imports: Page<MarketingImportBatch>;
  metadata: AudienceMetadata;
};

type AudienceResponse = {
  eventScoped: boolean;
  results: Page<MarketingContactSegmentFact | MarketingContactEventSegmentFact>;
  summary: AudienceSummary;
};

type AudienceSelectionState = {
  presetId?: string;
  filters: ContactSegmentFilters & ContactEventSegmentFilters;
  page: number;
};

const saveSegmentSchema = z.object({
  name: z.string().min(2, "Segment name is required."),
  description: z.string().optional(),
});

const campaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required."),
  subject: z.string().min(3, "Subject is required."),
  preview_text: z.string().optional(),
  from_name: z.string().min(2, "From name is required."),
  from_email: z.email("Enter a valid from email."),
  reply_to_email: z.string().optional(),
  body_text: z.string().min(8, "Body text is required."),
  body_html: z.string().optional(),
  submit_mode: z.enum(["draft", "send", "schedule"]),
  scheduled_at: z.string().optional(),
});

const defaultAudienceSelection: AudienceSelectionState = {
  presetId: "all-marketable-contacts",
  filters: {
    isSuppressed: false,
  },
  page: 1,
};

function toTitleCase(input: string) {
  return input
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusBadgeVariant(status: string) {
  if (status === "sent" || status === "completed") {
    return "success";
  }
  if (status === "scheduled" || status === "processing") {
    return "warning";
  }
  if (status === "failed") {
    return "error";
  }
  return "secondary";
}

function isEventScopedFilter(filters: ContactSegmentFilters & ContactEventSegmentFilters) {
  return Boolean(
    filters.eventIds?.length
      || filters.seasonIds?.length
      || filters.eventTypes?.length
      || filters.hasRegistration
      || filters.hasSuccessfulTransaction
      || filters.registeredButUnpaid
      || filters.waitlistedOnly
      || filters.attendedOnly,
  );
}

function buildAudienceRequest(selection: AudienceSelectionState) {
  return {
    presetId: selection.presetId,
    filters: selection.filters,
    page: selection.page,
    pageSize: 8,
  } satisfies ContactSegmentQueryInput | ContactEventSegmentQueryInput;
}

function buildAudienceDefinition(selection: AudienceSelectionState, eventScoped: boolean) {
  return {
    presetId: selection.presetId ?? null,
    filters: selection.filters,
    segment_scope: eventScoped ? "event" : "contact",
  };
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function PresetCard({
  label,
  description,
  active,
  onSelect,
}: {
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      interactive
      className={active ? "border-primary ring-primary/20 ring-2" : ""}
    >
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
        >
          {active ? "Selected" : "Use segment"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SummaryCards({
  summary,
  eventScoped,
}: {
  summary: AudienceSummary | null;
  eventScoped: boolean;
}) {
  if (!summary) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Matching contacts</CardDescription>
          <CardTitle>{summary.matchingContacts}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Suppressed excluded</CardDescription>
          <CardTitle>{summary.suppressedContacts}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>
            {eventScoped ? "Paid event matches" : "Paid families"}
          </CardDescription>
          <CardTitle>{summary.paidContacts}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

function AudiencePreviewTable({
  rows,
  eventScoped,
  loading,
}: {
  rows: Array<MarketingContactSegmentFact | MarketingContactEventSegmentFact>;
  eventScoped: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <Alert variant="info">
        <AlertTitle>No matching contacts yet</AlertTitle>
        <AlertDescription>
          Try loosening one of the filters or starting from a broader default segment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Athletes</TableHead>
          <TableHead>Last registration</TableHead>
          <TableHead>Last payment</TableHead>
          {eventScoped ? <TableHead>Event / Season</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const isEventRow = "event_name" in row;

          return (
            <TableRow key={`${row.marketing_contact_id}-${isEventRow ? row.event_id : row.email}`}>
              <TableCell className="font-medium">
                {[row.first_name, row.last_name].filter(Boolean).join(" ") || "Unknown contact"}
              </TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                {"created_via" in row ? (
                  <Badge variant="outline">{toTitleCase(row.created_via)}</Badge>
                ) : (
                  <Badge variant="outline">Event match</Badge>
                )}
              </TableCell>
              <TableCell>{"athlete_count" in row ? row.athlete_count : "—"}</TableCell>
              <TableCell>
                {"last_registered_at" in row && row.last_registered_at
                  ? new Date(row.last_registered_at).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell>
                {"last_paid_at" in row && row.last_paid_at
                  ? new Date(row.last_paid_at).toLocaleDateString()
                  : "—"}
              </TableCell>
              {eventScoped ? (
                <TableCell>
                  {isEventRow ? (
                    <div className="space-y-1">
                      <div className="font-medium">{row.event_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.season_id ? toTitleCase(row.season_id) : "No season"}
                      </div>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function AudiencePagination({
  page,
  count,
  pageSize,
  onChange,
}: {
  page: number;
  count: number | null;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (!count || count <= pageSize) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onChange(Math.max(1, page - 1));
            }}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
          const nextPage = index + 1;
          return (
            <PaginationItem key={nextPage}>
              <PaginationLink
                href="#"
                isActive={page === nextPage}
                onClick={(event) => {
                  event.preventDefault();
                  onChange(nextPage);
                }}
              >
                {nextPage}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onChange(Math.min(totalPages, page + 1));
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function FiltersPanel({
  filters,
  metadata,
  onFiltersChange,
  compact = false,
}: {
  filters: ContactSegmentFilters & ContactEventSegmentFilters;
  metadata: AudienceMetadata | null;
  onFiltersChange: (next: ContactSegmentFilters & ContactEventSegmentFilters) => void;
  compact?: boolean;
}) {
  return (
    <div className={`space-y-4 ${compact ? "" : "rounded-lg border bg-card p-4"}`}>
      <div className="space-y-2">
        <Label>Search</Label>
        <SearchInput
          value={filters.search ?? ""}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              search: event.target.value || undefined,
            })
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Contact source</Label>
          <Select
            value={filters.createdVia?.[0] ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                createdVia: value === "all" ? undefined : [value as "tenpo" | "import" | "manual"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any source</SelectItem>
              <SelectItem value="tenpo">Tenpo</SelectItem>
              <SelectItem value="import">Imported</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Registered within</Label>
          <Select
            value={String(filters.registeredWithinDays ?? "any")}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                registeredWithinDays: value === "any" ? undefined : Number(value),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any time</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Event</Label>
          <Select
            value={filters.eventIds?.[0] ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                eventIds: value === "all" ? undefined : [value],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any event</SelectItem>
              {metadata?.events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Season</Label>
          <Select
            value={filters.seasonIds?.[0] ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                seasonIds: value === "all" ? undefined : [value],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any season</SelectItem>
              {metadata?.seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {[
          {
            key: "hasLinkedAthlete",
            label: "Has linked athlete",
            value: Boolean(filters.hasLinkedAthlete),
          },
          {
            key: "registeredEver",
            label: "Registered ever",
            value: Boolean(filters.registeredEver),
          },
          {
            key: "paidEver",
            label: "Paid ever",
            value: Boolean(filters.paidEver),
          },
          {
            key: "registeredButNeverPaid",
            label: "Registered but never paid",
            value: Boolean(filters.registeredButNeverPaid),
          },
          {
            key: "waitlistedOnly",
            label: "Waitlisted only",
            value: Boolean(filters.waitlistedOnly),
          },
          {
            key: "attendedOnly",
            label: "Attended only",
            value: Boolean(filters.attendedOnly),
          },
        ].map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">{toggle.label}</div>
              <div className="text-xs text-muted-foreground">
                Add this condition to the current audience.
              </div>
            </div>
            <Switch
              checked={toggle.value}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  [toggle.key]: checked ? true : undefined,
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SaveSegmentDialog({
  open,
  mode,
  currentSegment,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  currentSegment: MarketingSavedSegment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; description?: string }) => Promise<void>;
}) {
  const form = useForm<z.infer<typeof saveSegmentSchema>>({
    resolver: zodResolver(saveSegmentSchema),
    defaultValues: {
      name: currentSegment?.name ?? "",
      description: currentSegment?.description ?? "",
    },
    values: {
      name: currentSegment?.name ?? "",
      description: currentSegment?.description ?? "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Save this audience" : "Edit saved segment"}
          </DialogTitle>
          <DialogDescription>
            Saved segments keep the filter definition only. Membership always refreshes from current data.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segment name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Spring clinic waitlist" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Who this audience is for and when to use it."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="size-4" />
                {mode === "create" ? "Save segment" : "Update segment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CampaignComposerSheet({
  open,
  onOpenChange,
  presets,
  eventPresets,
  savedSegments,
  metadata,
  onCampaignCreated,
  seedSelection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: SegmentPreset<ContactSegmentFilters>[];
  eventPresets: SegmentPreset<ContactEventSegmentFilters>[];
  savedSegments: MarketingSavedSegment[];
  metadata: AudienceMetadata | null;
  onCampaignCreated: (campaign: MarketingCampaign) => void;
  seedSelection: AudienceSelectionState;
}) {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState<AudienceSelectionState>(seedSelection);
  const [summary, setSummary] = useState<AudienceSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const deferredSearch = useDeferredValue(selection.filters.search ?? "");

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      preview_text: "",
      from_name: "Tenpo Academy",
      from_email: "hello@tenpo.academy",
      reply_to_email: "coaches@tenpo.academy",
      body_text: "",
      body_html: "",
      submit_mode: "draft",
      scheduled_at: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelection(seedSelection);
    setStep(1);
  }, [open, seedSelection]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextSelection = {
      ...selection,
      filters: {
        ...selection.filters,
        search: deferredSearch || undefined,
      },
    };

    setLoadingSummary(true);
    void fetchJson<AudienceResponse>("/api/marketing/audiences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildAudienceRequest(nextSelection)),
    })
      .then((response) => {
        setSummary(response.summary);
      })
      .finally(() => setLoadingSummary(false));
  }, [
    open,
    selection.presetId,
    selection.filters.createdVia,
    selection.filters.hasLinkedAthlete,
    selection.filters.registeredEver,
    selection.filters.paidEver,
    selection.filters.registeredButNeverPaid,
    selection.filters.eventIds,
    selection.filters.seasonIds,
    selection.filters.waitlistedOnly,
    selection.filters.attendedOnly,
    selection.filters.search,
    deferredSearch,
  ]);

  async function handleSubmit(values: z.infer<typeof campaignSchema>) {
    const response = await fetchJson<MarketingCampaign>("/api/marketing/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...values,
        audience_definition: buildAudienceDefinition(
          selection,
          isEventScopedFilter(selection.filters),
        ),
      }),
    });

    onCampaignCreated(response);
    onOpenChange(false);
    form.reset();
  }

  function hydrateSavedSegment(segment: MarketingSavedSegment) {
    const filterDefinition = segment.filter_definition as {
      presetId?: string;
      filters?: ContactSegmentFilters & ContactEventSegmentFilters;
    };

    setSelection({
      presetId: filterDefinition.presetId,
      filters: (filterDefinition.filters ?? {}) as ContactSegmentFilters &
        ContactEventSegmentFilters,
      page: 1,
    });
  }

  const allPresets = [
    ...presets.map((preset) => ({ ...preset, scope: "contact" as const })),
    ...eventPresets.map((preset) => ({ ...preset, scope: "event" as const })),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="3xl" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New campaign</SheetTitle>
          <SheetDescription>
            Choose an audience, draft the message, and review before launch.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          <div className="mb-6 flex items-center gap-3">
            {[1, 2, 3].map((currentStep) => (
              <div key={currentStep} className="flex items-center gap-3">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                    step >= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep}
                </div>
                {currentStep < 3 ? <div className="h-px w-8 bg-border" /> : null}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {allPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    label={preset.label}
                    description={preset.description}
                    active={selection.presetId === preset.id}
                    onSelect={() =>
                      setSelection({
                        presetId: preset.id,
                        filters: {
                          ...(preset.filters as ContactSegmentFilters &
                            ContactEventSegmentFilters),
                        },
                        page: 1,
                      })
                    }
                  />
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saved segments</CardTitle>
                  <CardDescription>
                    Start from a reusable audience and refine it if needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedSegments.length ? (
                    savedSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div>
                          <div className="font-medium">{segment.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {segment.description || "Reusable saved audience"}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => hydrateSavedSegment(segment)}
                        >
                          Use segment
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Save an audience in the Audiences tab to reuse it here.
                    </div>
                  )}
                </CardContent>
              </Card>

              <FiltersPanel
                filters={selection.filters}
                metadata={metadata}
                onFiltersChange={(filters) =>
                  setSelection((current) => ({
                    ...current,
                    filters,
                    page: 1,
                  }))
                }
                compact
              />

              <Alert variant="info">
                <AlertTitle>Audience summary</AlertTitle>
                <AlertDescription>
                  {loadingSummary || !summary
                    ? "Calculating your audience..."
                    : `${summary.matchingContacts} contacts match. ${summary.suppressedContacts} suppressed contacts will be excluded at send time.`}
                </AlertDescription>
              </Alert>
            </div>
          ) : null}

          {step === 2 ? (
            <Form {...form}>
              <form className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Spring clinic waitlist outreach" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Extra clinic spots just opened up" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preview_text"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Preview text</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="A short line that appears after the subject." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="from_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="from_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reply_to_email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Reply-to email</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body_text"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Body text</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          className="min-h-40"
                          placeholder="Write the plain-text version of the email."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body_html"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Body HTML</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          className="min-h-32 font-mono text-xs"
                          placeholder="<p>Optional HTML body for richer formatting.</p>"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <SummaryCards
                summary={summary}
                eventScoped={isEventScopedFilter(selection.filters)}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Audience review</CardTitle>
                  <CardDescription>
                    This campaign will use your current audience definition at send time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Preset:</span>{" "}
                    {selection.presetId
                      ? allPresets.find((preset) => preset.id === selection.presetId)?.label
                      : "Custom audience"}
                  </div>
                  <div>
                    <span className="font-medium">Scope:</span>{" "}
                    {isEventScopedFilter(selection.filters) ? "Event-specific" : "Contact-wide"}
                  </div>
                  <div>
                    <span className="font-medium">Filters applied:</span>{" "}
                    {Object.entries(selection.filters).filter(([, value]) => {
                      if (Array.isArray(value)) {
                        return value.length > 0;
                      }

                      return value !== undefined && value !== "";
                    }).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Send mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Form {...form}>
                    <FormField
                      control={form.control}
                      name="submit_mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="gap-3"
                            >
                              <label className="flex items-center gap-3 rounded-lg border p-3">
                                <RadioGroupItem value="draft" />
                                <div>
                                  <div className="font-medium">Save draft</div>
                                  <div className="text-sm text-muted-foreground">
                                    Keep refining the audience and message later.
                                  </div>
                                </div>
                              </label>
                              <label className="flex items-center gap-3 rounded-lg border p-3">
                                <RadioGroupItem value="send" />
                                <div>
                                  <div className="font-medium">Mark as sent</div>
                                  <div className="text-sm text-muted-foreground">
                                    Useful for this prototype when you want to simulate launch.
                                  </div>
                                </div>
                              </label>
                              <label className="flex items-center gap-3 rounded-lg border p-3">
                                <RadioGroupItem value="schedule" />
                                <div>
                                  <div className="font-medium">Schedule</div>
                                  <div className="text-sm text-muted-foreground">
                                    Save the send time and keep the audience definition attached.
                                  </div>
                                </div>
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch("submit_mode") === "schedule" ? (
                      <FormField
                        control={form.control}
                        name="scheduled_at"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Scheduled send time</FormLabel>
                            <FormControl>
                              <Input {...field} type="datetime-local" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                  </Form>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        <SheetFooter>
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
          ) : null}
          {step < 3 ? (
            <Button onClick={() => setStep((current) => current + 1)}>
              Continue
            </Button>
          ) : (
            <Button onClick={form.handleSubmit(handleSubmit)}>
              <Send className="size-4" />
              Finish campaign
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function MarketingDashboard({ initialTab }: MarketingDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [campaignSearch, setCampaignSearch] = useState("");
  const deferredCampaignSearch = useDeferredValue(campaignSearch);
  const [campaigns, setCampaigns] = useState<Page<MarketingCampaign> | null>(null);
  const [imports, setImports] = useState<Page<MarketingImportBatch> | null>(null);
  const [savedSegments, setSavedSegments] = useState<MarketingSavedSegment[]>([]);
  const [audienceSelection, setAudienceSelection] = useState<AudienceSelectionState>(
    defaultAudienceSelection,
  );
  const [audienceResponse, setAudienceResponse] = useState<AudienceResponse | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(true);
  const [saveSegmentOpen, setSaveSegmentOpen] = useState(false);
  const [saveSegmentMode, setSaveSegmentMode] = useState<"create" | "edit">("create");
  const [editingSegment, setEditingSegment] = useState<MarketingSavedSegment | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSeed, setComposerSeed] = useState<AudienceSelectionState>(defaultAudienceSelection);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importSource, setImportSource] = useState<"csv" | "mailchimp" | "mailerlite" | "constant_contact" | "other">("csv");
  const [importProgress, setImportProgress] = useState(0);
  const [importFieldMap, setImportFieldMap] = useState({
    email: "Email",
    first_name: "First Name",
    last_name: "Last Name",
  });

  useEffect(() => {
    setLoadingBootstrap(true);
    void fetchJson<BootstrapResponse>("/api/marketing/bootstrap")
      .then((response) => {
        setBootstrap(response);
        setCampaigns(response.campaigns);
        setImports(response.imports);
        setSavedSegments(response.savedSegments);
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
    audienceSelection.presetId,
    audienceSelection.page,
    audienceSelection.filters.search,
    audienceSelection.filters.createdVia,
    audienceSelection.filters.registeredWithinDays,
    audienceSelection.filters.seasonIds,
    audienceSelection.filters.eventIds,
    audienceSelection.filters.hasLinkedAthlete,
    audienceSelection.filters.registeredEver,
    audienceSelection.filters.paidEver,
    audienceSelection.filters.registeredButNeverPaid,
    audienceSelection.filters.waitlistedOnly,
    audienceSelection.filters.attendedOnly,
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

  async function handleSaveSegment(values: { name: string; description?: string }) {
    const payload = {
      name: values.name,
      description: values.description ?? null,
      segment_scope: audienceResponse?.eventScoped ? "event" : "contact",
      filter_definition: buildAudienceDefinition(
        audienceSelection,
        Boolean(audienceResponse?.eventScoped),
      ),
    };

    if (saveSegmentMode === "edit" && editingSegment) {
      const updated = await fetchJson<MarketingSavedSegment>(
        `/api/marketing/saved-segments/${editingSegment.id}`,
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

  async function handleImportSubmit() {
    if (!selectedFileName) {
      return;
    }

    setImportProgress(25);
    const created = await fetchJson<MarketingImportBatch>("/api/marketing/imports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_name: selectedFileName,
        source_provider: importSource,
        total_rows: 137,
        mapping: importFieldMap,
      }),
    });

    setImportProgress(100);
    setImports((current) =>
      current
        ? { ...current, data: [created, ...current.data], count: (current.count ?? 0) + 1 }
        : {
          data: [created],
          count: 1,
          page: 1,
          pageSize: 20,
        },
    );
    setTimeout(() => {
      setImportProgress(0);
      setSelectedFileName("");
    }, 800);
  }

  if (loadingBootstrap || !bootstrap || !campaigns || !imports) {
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="audiences">Audiences</TabsTrigger>
            <TabsTrigger value="imports">Imports</TabsTrigger>
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
                      <TableRow key={campaign.id}>
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
          </TabsContent>

          <TabsContent value="audiences" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {bootstrap.contactPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  label={preset.label}
                  description={preset.description}
                  active={audienceSelection.presetId === preset.id}
                  onSelect={() =>
                    setAudienceSelection({
                      presetId: preset.id,
                      filters: {
                        ...(preset.filters as ContactSegmentFilters &
                          ContactEventSegmentFilters),
                      },
                      page: 1,
                    })
                  }
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-h5">Audience builder</h2>
                <p className="text-sm text-muted-foreground">
                  Use a default segment for speed, then layer in filters to get precise.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="md:hidden"
                  onClick={() => setFiltersOpen(true)}
                >
                  <Filter className="size-4" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAudienceSelection(defaultAudienceSelection);
                  }}
                >
                  Reset filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSaveSegmentMode("create");
                    setEditingSegment(null);
                    setSaveSegmentOpen(true);
                  }}
                >
                  <Save className="size-4" />
                  Save segment
                </Button>
                <Button
                  onClick={() => {
                    setComposerSeed(audienceSelection);
                    setComposerOpen(true);
                  }}
                >
                  <Send className="size-4" />
                  Use in campaign
                </Button>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
              <div className="hidden xl:block">
                <FiltersPanel
                  filters={audienceSelection.filters}
                  metadata={bootstrap.metadata}
                  onFiltersChange={(filters) =>
                    setAudienceSelection((current) => ({
                      ...current,
                      filters,
                      page: 1,
                    }))
                  }
                />
              </div>

              <div className="space-y-4">
                <Alert variant="info">
                  <AlertTitle>Preview-first audience building</AlertTitle>
                  <AlertDescription>
                    This table is here to help you trust the segment before you send, not to force you into CSV thinking.
                  </AlertDescription>
                </Alert>

                <AudiencePreviewTable
                  rows={audienceResponse?.results.data ?? []}
                  eventScoped={Boolean(audienceResponse?.eventScoped)}
                  loading={audienceLoading}
                />
                <AudiencePagination
                  page={audienceSelection.page}
                  count={audienceResponse?.results.count ?? null}
                  pageSize={audienceResponse?.results.pageSize ?? 8}
                  onChange={(page) =>
                    setAudienceSelection((current) => ({
                      ...current,
                      page,
                    }))
                  }
                />
              </div>

              <div className="space-y-4">
                <SummaryCards
                  summary={audienceResponse?.summary ?? null}
                  eventScoped={Boolean(audienceResponse?.eventScoped)}
                />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Saved segments</CardTitle>
                    <CardDescription>
                      Reusable audience definitions that stay fresh at query time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {savedSegments.map((segment) => (
                      <div key={segment.id} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium">{segment.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {segment.description || "Saved audience"}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {toTitleCase(segment.segment_scope)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const definition = segment.filter_definition as {
                                presetId?: string;
                                filters?: ContactSegmentFilters &
                                  ContactEventSegmentFilters;
                              };

                              setAudienceSelection({
                                presetId: definition.presetId,
                                filters: definition.filters ?? {},
                                page: 1,
                              });
                            }}
                          >
                            <Users className="size-4" />
                            Use
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSaveSegmentMode("edit");
                              setEditingSegment(segment);
                              setSaveSegmentOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleDeleteSegment(segment.id)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="imports" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bring your existing list into Tenpo</CardTitle>
                <CardDescription>
                  Existing contacts will be merged by normalized email, and imported contacts can immediately be used in audiences and campaigns.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="warning">
                  <AlertTitle>Dedupe is automatic</AlertTitle>
                  <AlertDescription>
                    If a contact already exists in Tenpo, we merge by normalized email rather than creating a duplicate.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CSV file</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(event) =>
                        setSelectedFileName(event.target.files?.[0]?.name ?? "")
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedFileName || "Select a CSV export from your current email tool."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Source provider</Label>
                    <Select
                      value={importSource}
                      onValueChange={(value) =>
                        setImportSource(
                          value as
                            | "csv"
                            | "mailchimp"
                            | "mailerlite"
                            | "constant_contact"
                            | "other",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="mailchimp">Mailchimp</SelectItem>
                        <SelectItem value="mailerlite">Mailerlite</SelectItem>
                        <SelectItem value="constant_contact">Constant Contact</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedFileName ? (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">Field mapping</CardTitle>
                      <CardDescription>
                        Use the closest matching headers from your CSV file.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                      {[
                        { key: "email", label: "Email" },
                        { key: "first_name", label: "First name" },
                        { key: "last_name", label: "Last name" },
                      ].map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label>{field.label}</Label>
                          <Select
                            value={importFieldMap[field.key as keyof typeof importFieldMap]}
                            onValueChange={(value) =>
                              setImportFieldMap((current) => ({
                                ...current,
                                [field.key]: value,
                              }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="First Name">First Name</SelectItem>
                              <SelectItem value="Last Name">Last Name</SelectItem>
                              <SelectItem value="Subscriber Email">Subscriber Email</SelectItem>
                              <SelectItem value="Contact Email">Contact Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <Progress value={importProgress} />
                      </div>
                      <Button onClick={() => void handleImportSubmit()}>
                        <Upload className="size-4" />
                        Start import
                      </Button>
                    </CardFooter>
                  </Card>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent imports</CardTitle>
                <CardDescription>
                  Track the batches you have already brought in from external tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Total rows</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead>Merged</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.data.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.file_name}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(batch.status)}>
                            {toTitleCase(batch.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{toTitleCase(batch.source_provider)}</TableCell>
                        <TableCell>{batch.total_rows}</TableCell>
                        <TableCell>{batch.imported_rows}</TableCell>
                        <TableCell>{batch.merged_rows}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" size="md">
          <SheetHeader>
            <SheetTitle>Audience filters</SheetTitle>
            <SheetDescription>
              Refine the current audience with a simple set of friendly filters.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <FiltersPanel
              filters={audienceSelection.filters}
              metadata={bootstrap.metadata}
              onFiltersChange={(filters) =>
                setAudienceSelection((current) => ({
                  ...current,
                  filters,
                  page: 1,
                }))
              }
              compact
            />
          </div>
          <SheetFooter>
            <Button onClick={() => setFiltersOpen(false)}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <SaveSegmentDialog
        open={saveSegmentOpen}
        mode={saveSegmentMode}
        currentSegment={editingSegment}
        onOpenChange={setSaveSegmentOpen}
        onSubmit={handleSaveSegment}
      />

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
