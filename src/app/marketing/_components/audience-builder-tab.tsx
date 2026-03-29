"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { Filter, Pencil, Save, Send, Trash2, Users } from "lucide-react";
import type {
  AudienceMetadata,
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  MarketingContactEventSegmentFact,
  MarketingContactSegmentFact,
  MarketingSavedSegment,
  SegmentPreset,
} from "@/lib/marketing-services";
import { RecipientPreviewTable } from "./recipient-preview-table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AudiencePagination,
  FiltersPanel,
  LinkAthleteDialog,
  ManualContactDialog,
  PresetCard,
  SaveSegmentDialog,
  SummaryCards,
} from "./audience-builder-shared";
import {
  AudienceResponse,
  AudienceSelectionState,
  toTitleCase,
} from "./marketing-ui";

// The audience tab is where segmentation becomes a reusable product surface.
// The table is intentionally framed as a trust-building preview, not the main
// interaction model.
export function AudienceBuilderTab({
  presets,
  metadata,
  audienceSelection,
  setAudienceSelection,
  audienceResponse,
  audienceLoading,
  savedSegments,
  onSaveSegment,
  onDeleteSegment,
  onManualContactCreate,
  onLinkAthlete,
  onUseInCampaign,
}: {
  presets: SegmentPreset<ContactSegmentFilters>[];
  metadata: AudienceMetadata;
  audienceSelection: AudienceSelectionState;
  setAudienceSelection: Dispatch<SetStateAction<AudienceSelectionState>>;
  audienceResponse: AudienceResponse | null;
  audienceLoading: boolean;
  savedSegments: MarketingSavedSegment[];
  onSaveSegment: (
    values: { name: string; description?: string },
    mode: "create" | "edit",
    currentSegment: MarketingSavedSegment | null,
  ) => Promise<void>;
  onDeleteSegment: (id: string) => Promise<void>;
  onManualContactCreate: (values: {
    email: string;
    first_name?: string;
    last_name?: string;
    athlete_id?: string;
    relationship_type?: "parent" | "guardian" | "other";
  }) => Promise<void>;
  onLinkAthlete: (
    recipient: MarketingContactSegmentFact | MarketingContactEventSegmentFact,
    values: {
      athlete_id: string;
      relationship_type: "parent" | "guardian" | "other";
    },
  ) => Promise<void>;
  onUseInCampaign: () => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saveSegmentOpen, setSaveSegmentOpen] = useState(false);
  const [saveSegmentMode, setSaveSegmentMode] = useState<"create" | "edit">("create");
  const [editingSegment, setEditingSegment] = useState<MarketingSavedSegment | null>(null);
  const [manualContactOpen, setManualContactOpen] = useState(false);
  const [linkAthleteOpen, setLinkAthleteOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<
    MarketingContactSegmentFact | MarketingContactEventSegmentFact | null
  >(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {presets.map((preset) => (
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
            onClick={() =>
              setAudienceSelection({
                presetId: "all-marketable-contacts",
                filters: { isSuppressed: false },
                page: 1,
              })
            }
          >
            Reset filters
          </Button>
          <Button variant="outline" onClick={() => setManualContactOpen(true)}>
            <Users className="size-4" />
            Add contact
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
            onClick={onUseInCampaign}
            disabled={audienceLoading || (audienceResponse?.summary.matchingContacts ?? 0) === 0}
          >
            <Send className="size-4" />
            Use in campaign
          </Button>
        </div>
      </div>

      {!audienceLoading && (audienceResponse?.summary.matchingContacts ?? 0) === 0 ? (
        <Alert variant="warning">
          <AlertTitle>No one matches this audience yet</AlertTitle>
          <AlertDescription>
            The preview is empty right now, so campaign creation is disabled until the segment has at least one matching contact.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        <div className="hidden xl:block">
          <FiltersPanel
            filters={audienceSelection.filters}
            metadata={metadata}
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

          <RecipientPreviewTable
            rows={audienceResponse?.results.data ?? []}
            eventScoped={Boolean(audienceResponse?.eventScoped)}
            loading={audienceLoading}
            onLinkAthlete={(row) => {
              setSelectedRecipient(row);
              setLinkAthleteOpen(true);
            }}
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
                      onClick={() => void onDeleteSegment(segment.id)}
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
              metadata={metadata}
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
        onSubmit={(values) => onSaveSegment(values, saveSegmentMode, editingSegment)}
      />

      <ManualContactDialog
        open={manualContactOpen}
        onOpenChange={setManualContactOpen}
        onSubmit={onManualContactCreate}
      />

      <LinkAthleteDialog
        open={linkAthleteOpen}
        contact={selectedRecipient}
        onOpenChange={setLinkAthleteOpen}
        onSubmit={(values) => {
          if (!selectedRecipient) {
            return Promise.resolve();
          }

          return onLinkAthlete(selectedRecipient, values);
        }}
      />
    </div>
  );
}
