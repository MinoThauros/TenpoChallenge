"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Users } from "lucide-react";
import type {
  AudienceMetadata,
  AudienceSummary,
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  MarketingContactEventSegmentFact,
  MarketingContactSegmentFact,
  MarketingSavedSegment,
} from "@/lib/marketing-services";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const saveSegmentSchema = z.object({
  name: z.string().min(2, "Segment name is required."),
  description: z.string().optional(),
});

const manualContactSchema = z.object({
  email: z.email("Enter a valid email address."),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  athlete_id: z.union([z.literal(""), z.uuid("Enter a valid athlete UUID.")]).optional(),
  relationship_type: z.enum(["parent", "guardian", "other"]).optional(),
});

const linkAthleteSchema = z.object({
  athlete_id: z.uuid("Enter a valid athlete UUID."),
  relationship_type: z.enum(["parent", "guardian", "other"]),
});

export function PresetCard({
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

export function SummaryCards({
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

export function AudiencePagination({
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

export function FiltersPanel({
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

export function ManualContactDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    email: string;
    first_name?: string;
    last_name?: string;
    athlete_id?: string;
    relationship_type?: "parent" | "guardian" | "other";
  }) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof manualContactSchema>>({
    resolver: zodResolver(manualContactSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      athlete_id: "",
      relationship_type: "parent",
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset();
          setSubmitError(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a contact manually</DialogTitle>
          <DialogDescription>
            Create a marketable contact directly in Tenpo without going through CSV import.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              setSubmitting(true);
              setSubmitError(null);

              try {
                await onSubmit(values);
                form.reset();
                onOpenChange(false);
              } catch (error) {
                setSubmitError(
                  error instanceof Error
                    ? error.message
                    : "We couldn't create the contact right now.",
                );
              } finally {
                setSubmitting(false);
              }
            })}
          >
            {submitError ? (
              <Alert variant="error">
                <AlertTitle>Contact not created</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="parent@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Mia" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Alvarez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <div className="font-medium">Initial athlete link</div>
                <div className="text-sm text-muted-foreground">
                  Optional. Add a first athlete now so this contact can immediately participate in athlete-based segments.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="athlete_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Athlete ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="f6b3885d-1f6d-4f5c-9e35-2b6c5fd9e1ba"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relationship_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <Select
                        value={field.value ?? "parent"}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Users className="size-4" />
                {submitting ? "Creating..." : "Create contact"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function LinkAthleteDialog({
  open,
  contact,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  contact: MarketingContactSegmentFact | MarketingContactEventSegmentFact | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    athlete_id: string;
    relationship_type: "parent" | "guardian" | "other";
  }) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof linkAthleteSchema>>({
    resolver: zodResolver(linkAthleteSchema),
    defaultValues: {
      athlete_id: "",
      relationship_type: "parent",
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset();
          setSubmitError(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link athlete to contact</DialogTitle>
          <DialogDescription>
            Attach an athlete record to this contact so they can participate in athlete-based audience segments.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              setSubmitting(true);
              setSubmitError(null);

              try {
                await onSubmit(values);
                form.reset();
                onOpenChange(false);
              } catch (error) {
                setSubmitError(
                  error instanceof Error
                    ? error.message
                    : "We couldn't link the athlete right now.",
                );
              } finally {
                setSubmitting(false);
              }
            })}
          >
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="font-medium">
                {[contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || "Unknown contact"}
              </div>
              <div className="text-muted-foreground">{contact?.email}</div>
            </div>

            {submitError ? (
              <Alert variant="error">
                <AlertTitle>Athlete not linked</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="athlete_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Athlete ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="f6b3885d-1f6d-4f5c-9e35-2b6c5fd9e1ba" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !contact}>
                <Users className="size-4" />
                {submitting ? "Linking..." : "Link athlete"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function SaveSegmentDialog({
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
