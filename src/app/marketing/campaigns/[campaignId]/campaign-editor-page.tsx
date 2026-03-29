"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  MarketingCampaign,
  MarketingCampaignDispatchState,
  MarketingDispatchRecipientActivity,
  Page,
} from "@/lib/marketing-services";
import { fetchJson, statusBadgeVariant, toTitleCase } from "../../_components/marketing-ui";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type CampaignEditorPageProps = {
  initialCampaign: MarketingCampaign;
  initialDispatchStates: Page<MarketingCampaignDispatchState>;
  initialRecipientActivity: Page<MarketingDispatchRecipientActivity>;
};

type CampaignFormState = {
  name: string;
  subject: string;
  preview_text: string;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  body_text: string;
  body_html: string;
  scheduled_at: string;
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - timezoneOffset * 60_000);
  return local.toISOString().slice(0, 16);
}

function buildFormState(campaign: MarketingCampaign): CampaignFormState {
  return {
    name: campaign.name,
    subject: campaign.subject,
    preview_text: campaign.preview_text ?? "",
    from_name: campaign.from_name ?? "",
    from_email: campaign.from_email,
    reply_to_email: campaign.reply_to_email ?? "",
    body_text: campaign.body_text ?? "",
    body_html: campaign.body_html ?? "",
    scheduled_at: toDateTimeLocalValue(campaign.scheduled_at),
  };
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function isCampaignLocked(
  campaign: MarketingCampaign,
  dispatchStates: MarketingCampaignDispatchState[],
) {
  return campaign.status === "sending"
    || campaign.status === "sent"
    || dispatchStates.some((dispatchState) =>
      dispatchState.dispatch_status === "sending"
      || dispatchState.dispatch_status === "completed"
    );
}

export function CampaignEditorPage({
  initialCampaign,
  initialDispatchStates,
  initialRecipientActivity,
}: CampaignEditorPageProps) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [formState, setFormState] = useState(() => buildFormState(initialCampaign));
  const [dispatchStates, setDispatchStates] = useState(initialDispatchStates);
  const [recipientActivity, setRecipientActivity] = useState(initialRecipientActivity);
  const [loadingDispatchStates, setLoadingDispatchStates] = useState(false);
  const [dispatchStatesError, setDispatchStatesError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshCampaignState(showLoading: boolean) {
      if (showLoading) {
        setLoadingDispatchStates(true);
      }

      try {
        const [nextCampaign, nextDispatchStates, nextRecipientActivity] = await Promise.all([
          fetchJson<MarketingCampaign>(`/api/marketing/campaigns/${campaign.id}`),
          fetchJson<Page<MarketingCampaignDispatchState>>(
            `/api/marketing/campaign-dispatches?campaignId=${encodeURIComponent(campaign.id)}&page=1&pageSize=25`,
          ),
          fetchJson<Page<MarketingDispatchRecipientActivity>>(
            `/api/marketing/campaign-dispatch-recipients?campaignId=${encodeURIComponent(campaign.id)}&page=1&pageSize=100`,
          ),
        ]);

        if (!cancelled) {
          setCampaign(nextCampaign);
          setDispatchStates(nextDispatchStates);
          setRecipientActivity(nextRecipientActivity);
          setDispatchStatesError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setDispatchStatesError(
            error instanceof Error ? error.message : "Failed to refresh campaign dispatch state.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDispatchStates(false);
        }
      }
    }

    const intervalId = window.setInterval(() => {
      void refreshCampaignState(false);
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [campaign.id]);

  const campaignLocked = useMemo(
    () => isCampaignLocked(campaign, dispatchStates.data),
    [campaign, dispatchStates.data],
  );
  const activeDispatch = useMemo(
    () => dispatchStates.data.find((dispatchState) => dispatchState.dispatch_status === "sending"),
    [dispatchStates.data],
  );
  const deliveredRecipients = recipientActivity.data.filter((recipient) => recipient.recipient_status === "sent");
  const failedRecipients = recipientActivity.data.filter((recipient) =>
    recipient.recipient_status === "failed" || recipient.recipient_status === "retry_scheduled"
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await fetchJson<MarketingCampaign>(`/api/marketing/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name,
          subject: formState.subject,
          preview_text: formState.preview_text || null,
          from_name: formState.from_name || null,
          from_email: formState.from_email,
          reply_to_email: formState.reply_to_email || null,
          body_text: formState.body_text || null,
          body_html: formState.body_html || "",
          scheduled_at: formState.scheduled_at
            ? new Date(formState.scheduled_at).toISOString()
            : null,
          status: formState.scheduled_at ? "scheduled" : "draft",
        }),
      });

      setCampaign(updated);
      setFormState(buildFormState(updated));
      setSaveSuccess("Campaign changes saved.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save campaign changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Button asChild variant="ghost" className="px-0">
              <Link href="/marketing?tab=campaigns">Back to campaigns</Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusBadgeVariant(campaign.status)}>
                {toTitleCase(campaign.status)}
              </Badge>
              <h1 className="text-h3">{campaign.name}</h1>
            </div>
            <p className="max-w-2xl text-body1 text-muted-foreground">
              Update the message content and planned start time while the campaign is still editable. Once delivery starts or completes, this page becomes read-only.
            </p>
          </div>
        </div>

        {campaignLocked ? (
          <Alert variant="warning" className="mb-6">
            <AlertTitle>Campaign editing is locked</AlertTitle>
            <AlertDescription>
              This campaign is currently sending or has already completed delivery, so its content and start time can no longer be changed.
            </AlertDescription>
          </Alert>
        ) : null}

        {saveError ? (
          <Alert variant="error" className="mb-6">
            <AlertTitle>Unable to save campaign</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        {saveSuccess ? (
          <Alert variant="success" className="mb-6">
            <AlertTitle>Campaign updated</AlertTitle>
            <AlertDescription>{saveSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {activeDispatch ? (
          <Card className="mb-6 border-warning bg-warning-muted/35">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-lg">Campaign is actively sending</CardTitle>
                <CardDescription>
                  This dispatch is live right now, so delivery activity takes priority and editing stays locked until the run finishes.
                </CardDescription>
              </div>
              <Badge variant="warning">
                {activeDispatch.sent_recipients}/{activeDispatch.total_recipients} sent
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-4">
              <div>
                <span className="font-medium">Dispatch status:</span>{" "}
                {toTitleCase(activeDispatch.dispatch_status)}
              </div>
              <div>
                <span className="font-medium">Delivered:</span>{" "}
                {activeDispatch.sent_recipients}
              </div>
              <div>
                <span className="font-medium">Failed / retrying:</span>{" "}
                {activeDispatch.failed_recipients + activeDispatch.retry_scheduled_recipients}
              </div>
              <div>
                <span className="font-medium">Last activity:</span>{" "}
                {formatDateTime(
                  activeDispatch.last_attempted_at
                    ?? activeDispatch.last_sent_at
                    ?? activeDispatch.updated_at,
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mb-6">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Recipient outcomes</CardTitle>
              <CardDescription>
                Detailed send results from the recipient activity view. Delivered and failed contacts are visible here while the campaign runs.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{deliveredRecipients.length} delivered</Badge>
              <Badge variant="error">{failedRecipients.length} failed / retry</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {recipientActivity.data.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last error</TableHead>
                    <TableHead>Last activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipientActivity.data.map((recipient) => (
                    <TableRow key={recipient.dispatch_recipient_id}>
                      <TableCell>
                        <div className="font-medium">
                          {[recipient.first_name, recipient.last_name].filter(Boolean).join(" ") || "Unnamed contact"}
                        </div>
                        <div className="text-xs text-muted-foreground">{recipient.recipient_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(recipient.recipient_status)}>
                          {toTitleCase(recipient.recipient_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{recipient.attempt_count}</TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground">
                        {recipient.last_error_message ?? recipient.latest_attempt_error_message ?? "—"}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(
                          recipient.sent_at
                            ?? recipient.latest_attempt_completed_at
                            ?? recipient.latest_attempt_requested_at
                            ?? recipient.updated_at,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert variant="info">
                <AlertTitle>No recipient activity yet</AlertTitle>
                <AlertDescription>
                  Recipient-level delivery results will appear here as soon as a dispatch begins processing contacts.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Edit campaign</CardTitle>
              <CardDescription>
                Manage the sender details, message content, and when this campaign should begin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign name</Label>
                    <Input
                      id="campaign-name"
                      value={formState.name}
                      disabled={campaignLocked || saving}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-scheduled-at">Starts at</Label>
                    <Input
                      id="campaign-scheduled-at"
                      type="datetime-local"
                      value={formState.scheduled_at}
                      disabled={campaignLocked || saving}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          scheduled_at: event.target.value,
                        }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Subject</Label>
                  <Input
                    id="campaign-subject"
                    value={formState.subject}
                    disabled={campaignLocked || saving}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, subject: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-preview-text">Preview text</Label>
                  <Input
                    id="campaign-preview-text"
                    value={formState.preview_text}
                    disabled={campaignLocked || saving}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        preview_text: event.target.value,
                      }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-from-name">From name</Label>
                    <Input
                      id="campaign-from-name"
                      value={formState.from_name}
                      disabled={campaignLocked || saving}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          from_name: event.target.value,
                        }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-from-email">From email</Label>
                    <Input
                      id="campaign-from-email"
                      type="email"
                      value={formState.from_email}
                      disabled={campaignLocked || saving}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          from_email: event.target.value,
                        }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-reply-to-email">Reply-to email</Label>
                    <Input
                      id="campaign-reply-to-email"
                      type="email"
                      value={formState.reply_to_email}
                      disabled={campaignLocked || saving}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          reply_to_email: event.target.value,
                        }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-body-text">Body text</Label>
                  <Textarea
                    id="campaign-body-text"
                    className="min-h-48"
                    value={formState.body_text}
                    disabled={campaignLocked || saving}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        body_text: event.target.value,
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-body-html">Body HTML</Label>
                  <Textarea
                    id="campaign-body-html"
                    className="min-h-48 font-mono text-xs"
                    value={formState.body_html}
                    disabled={campaignLocked || saving}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        body_html: event.target.value,
                      }))}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={campaignLocked || saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={campaignLocked || saving}
                    onClick={() => setFormState(buildFormState(campaign))}
                  >
                    Reset form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign timeline</CardTitle>
                <CardDescription>
                  Snapshot of the current campaign lifecycle and delivery milestones.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Created:</span> {formatDateTime(campaign.created_at)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {formatDateTime(campaign.updated_at)}
                </div>
                <div>
                  <span className="font-medium">Scheduled:</span> {formatDateTime(campaign.scheduled_at)}
                </div>
                <div>
                  <span className="font-medium">Sent:</span> {formatDateTime(campaign.sent_at)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Dispatch runs</CardTitle>
                  <CardDescription>
                    Live send progress for this campaign. The table below refreshes automatically every 5 seconds.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{dispatchStates.data.length} runs</Badge>
              </CardHeader>
              <CardContent>
                {dispatchStatesError ? (
                  <Alert variant="error">
                    <AlertTitle>Unable to refresh dispatch state</AlertTitle>
                    <AlertDescription>{dispatchStatesError}</AlertDescription>
                  </Alert>
                ) : loadingDispatchStates && !dispatchStates.data.length ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                ) : !dispatchStates.data.length ? (
                  <Alert variant="info">
                    <AlertTitle>No dispatch runs yet</AlertTitle>
                    <AlertDescription>
                      Delivery has not started for this campaign. Once the worker creates a dispatch run, it will appear here.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Last activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatchStates.data.map((dispatchState) => (
                        <TableRow key={dispatchState.dispatch_id}>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(dispatchState.dispatch_status)}>
                              {toTitleCase(dispatchState.dispatch_status)}
                            </Badge>
                          </TableCell>
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
          </div>
        </div>
      </div>
    </div>
  );
}
