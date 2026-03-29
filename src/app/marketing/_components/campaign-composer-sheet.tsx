"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Send } from "lucide-react";
import type {
  AudienceMetadata,
  AudienceSummary,
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  MarketingCampaign,
  MarketingSavedSegment,
  SegmentPreset,
} from "@/lib/marketing-services";
import { RecipientPreviewTable } from "./recipient-preview-table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  AudienceSelectionState,
  AudienceResponse,
  buildAudienceDefinition,
  buildAudienceRequest,
  fetchJson,
  isEventScopedFilter,
} from "./marketing-ui";
import {
  FiltersPanel,
  PresetCard,
  SummaryCards,
} from "./audience-builder-shared";

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

// The campaign composer intentionally reuses the exact same segmentation
// primitives as the Audiences tab so the admin never has to rebuild trust in
// a separate "sending-only" audience model.
export function CampaignComposerSheet({
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
  const [previewResponse, setPreviewResponse] = useState<AudienceResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
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
    setPreviewResponse(null);
    setSubmitError(null);
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
      body: JSON.stringify({
        ...buildAudienceRequest(nextSelection),
        pageSize: 5,
      }),
    })
      .then((response) => {
        setSummary(response.summary);
        setPreviewResponse(response);
      })
      .finally(() => setLoadingSummary(false));
  }, [
    deferredSearch,
    open,
    selection.filters.attendedOnly,
    selection.filters.createdVia,
    selection.filters.eventIds,
    selection.filters.hasLinkedAthlete,
    selection.filters.paidEver,
    selection.filters.registeredButNeverPaid,
    selection.filters.registeredEver,
    selection.filters.search,
    selection.filters.seasonIds,
    selection.filters.waitlistedOnly,
    selection.presetId,
  ]);

  async function handleSubmit(values: z.infer<typeof campaignSchema>) {
    if ((summary?.matchingContacts ?? 0) === 0) {
      setSubmitError(
        "This audience has no matching contacts yet. Broaden the segment or import contacts before creating the campaign.",
      );
      setStep(1);
      return;
    }

    setSubmittingCampaign(true);
    setSubmitError(null);

    try {
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
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't create the campaign right now.",
      );
    } finally {
      setSubmittingCampaign(false);
    }
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

  const validationErrors = form.formState.errors;
  const hasMessageValidationErrors = Boolean(
    validationErrors.name
      || validationErrors.subject
      || validationErrors.from_name
      || validationErrors.from_email
      || validationErrors.body_text
      || validationErrors.scheduled_at,
  );

  async function handleContinue() {
    if (step === 1) {
      if ((summary?.matchingContacts ?? 0) === 0) {
        setSubmitError(
          "This audience has no matching contacts yet. Broaden the segment or import contacts before moving on.",
        );
        return;
      }

      setSubmitError(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      const valid = await form.trigger([
        "name",
        "subject",
        "preview_text",
        "from_name",
        "from_email",
        "reply_to_email",
        "body_text",
        "body_html",
      ]);

      if (!valid) {
        setSubmitError(
          "Finish the required message fields before moving to review.",
        );
        return;
      }

      setSubmitError(null);
      setStep(3);
    }
  }

  async function handleFinish() {
    const valid = await form.trigger();

    if (!valid) {
      setSubmitError(
        "The campaign message is still missing required fields. Review the message step and try again.",
      );
      setStep(2);
      return;
    }

    await form.handleSubmit(handleSubmit)();
  }

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
              {submitError ? (
                <Alert variant="error">
                  <AlertTitle>Campaign not created</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}

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

              {!loadingSummary && summary && summary.matchingContacts === 0 ? (
                <Alert variant="warning">
                  <AlertTitle>No recipients yet</AlertTitle>
                  <AlertDescription>
                    This segment is currently empty, so there is nobody to preview or send to. Adjust the filters or import contacts first.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recipient preview</CardTitle>
                  <CardDescription>
                    Preview the first few contacts that match this audience before you move on to the message.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecipientPreviewTable
                    rows={previewResponse?.results.data ?? []}
                    eventScoped={Boolean(previewResponse?.eventScoped)}
                    loading={loadingSummary}
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}

          {step === 2 ? (
            <Form {...form}>
              <form className="space-y-4">
                {submitError ? (
                  <Alert variant="error">
                    <AlertTitle>Complete the message</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                {hasMessageValidationErrors ? (
                  <Alert variant="warning">
                    <AlertTitle>Some required fields are still missing</AlertTitle>
                    <AlertDescription>
                      Fill in the campaign name, subject, sender details, and body text before continuing.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>
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
                  <CardTitle className="text-base">Recipients</CardTitle>
                  <CardDescription>
                    A final preview of the first few matching contacts before this campaign is created.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecipientPreviewTable
                    rows={previewResponse?.results.data ?? []}
                    eventScoped={Boolean(previewResponse?.eventScoped)}
                    loading={loadingSummary}
                  />
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
            <Button
              onClick={() => void handleContinue()}
              disabled={step === 1 && !loadingSummary && (summary?.matchingContacts ?? 0) === 0}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={() => void handleFinish()}
              disabled={submittingCampaign || (summary?.matchingContacts ?? 0) === 0}
            >
              <Send className="size-4" />
              {submittingCampaign ? "Creating..." : "Finish campaign"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
