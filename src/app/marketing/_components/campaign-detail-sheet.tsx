"use client";

import type { MarketingCampaign } from "@/lib/marketing-services";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { statusBadgeVariant, toTitleCase } from "./marketing-ui";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function readableAudience(campaign: MarketingCampaign) {
  const definition = campaign.audience_definition as {
    presetId?: string | null;
    segment_scope?: string | null;
    filters?: Record<string, unknown>;
  };

  return {
    preset: definition.presetId ?? "Custom audience",
    scope: definition.segment_scope ?? "contact",
    filters: definition.filters ?? {},
  };
}

// Campaign details live in a read-only sheet so admins can inspect what was
// actually stored without leaving the main campaigns list.
export function CampaignDetailSheet({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: MarketingCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const audience = campaign ? readableAudience(campaign) : null;
  const filterEntries = audience
    ? Object.entries(audience.filters).filter(([, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }

        return value !== undefined && value !== null && value !== "";
      })
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="2xl" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{campaign?.name ?? "Campaign details"}</SheetTitle>
          <SheetDescription>
            Review the stored campaign metadata, audience definition, and message content.
          </SheetDescription>
        </SheetHeader>

        {campaign ? (
          <div className="space-y-6 px-4 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusBadgeVariant(campaign.status)}>
                {toTitleCase(campaign.status)}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Updated {formatDateTime(campaign.updated_at)}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audience</CardTitle>
                <CardDescription>
                  This is the audience definition currently attached to the campaign.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Preset:</span> {audience?.preset}
                </div>
                <div>
                  <span className="font-medium">Scope:</span> {toTitleCase(audience?.scope ?? "contact")}
                </div>
                <div>
                  <span className="font-medium">Filters:</span>{" "}
                  {filterEntries.length ? `${filterEntries.length} applied` : "No additional filters"}
                </div>
                {filterEntries.length ? (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Applied filters
                    </div>
                    <div className="space-y-2 text-sm">
                      {filterEntries.map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{toTitleCase(key)}:</span>{" "}
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Message</CardTitle>
                <CardDescription>
                  The subject line, sender details, and stored body content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Subject:</span> {campaign.subject}
                </div>
                <div>
                  <span className="font-medium">Preview text:</span>{" "}
                  {campaign.preview_text || "—"}
                </div>
                <div>
                  <span className="font-medium">From:</span>{" "}
                  {[campaign.from_name, campaign.from_email].filter(Boolean).join(" · ")}
                </div>
                <div>
                  <span className="font-medium">Reply-to:</span>{" "}
                  {campaign.reply_to_email || "—"}
                </div>
                <div className="rounded-lg border p-3">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Body text
                  </div>
                  <div className="whitespace-pre-wrap">
                    {campaign.body_text || "No plain-text body saved."}
                  </div>
                </div>
                {campaign.body_html ? (
                  <div className="rounded-lg border p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Body HTML
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                      {campaign.body_html}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {formatDateTime(campaign.created_at)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {formatDateTime(campaign.updated_at)}
                </div>
                <div>
                  <span className="font-medium">Scheduled:</span>{" "}
                  {formatDateTime(campaign.scheduled_at)}
                </div>
                <div>
                  <span className="font-medium">Sent:</span>{" "}
                  {formatDateTime(campaign.sent_at)}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
