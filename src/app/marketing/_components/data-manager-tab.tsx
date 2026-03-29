"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import type {
  MarketingCampaign,
  MarketingContact,
  MarketingContactAthleteLink,
  MarketingContactCreatedVia,
  MarketingEvent,
  MarketingImportBatch,
  MarketingImportBatchStatus,
  MarketingRegistration,
  MarketingRegistrationStatus,
  MarketingAttendanceStatus,
  MarketingSavedSegment,
  MarketingSegmentScope,
  MarketingSuccessfulTransaction,
  MarketingSuppression,
  MarketingSuppressionReason,
  MarketingSuppressionSource,
  Page,
  SegmentPreset,
  ContactSegmentFilters,
  ContactEventSegmentFilters,
} from "@/lib/marketing-services";
import { ContactDetailDialog } from "./contact-detail-dialog";
import { DataSectionCard } from "./data-section-card";
import { RecordFormDialog } from "./record-form-dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fetchJson, statusBadgeVariant, toTitleCase } from "./marketing-ui";

type DeletionState = {
  title: string;
  description: string;
  action: () => Promise<void>;
} | null;

const defaultContactDraft: {
  email: string;
  first_name: string;
  last_name: string;
  created_via: MarketingContactCreatedVia;
  athlete_id: string;
  relationship_type: "parent" | "guardian" | "other";
} = {
  email: "",
  first_name: "",
  last_name: "",
  created_via: "manual",
  athlete_id: "",
  relationship_type: "parent",
};

const defaultEventDraft = {
  event_id: "",
  name: "",
  season_id: "",
  event_type: "",
  starts_at: "",
  ends_at: "",
  status: "",
};

const defaultRegistrationDraft: {
  registration_id: string;
  event_id: string;
  athlete_id: string;
  registration_status: MarketingRegistrationStatus;
  attendance_status: MarketingAttendanceStatus;
  registered_at: string;
} = {
  registration_id: "",
  event_id: "",
  athlete_id: "",
  registration_status: "completed",
  attendance_status: "unknown",
  registered_at: "",
};

const defaultTransactionDraft = {
  payment_id: "",
  registration_id: "",
  event_id: "",
  athlete_id: "",
  paid_at: "",
};

const defaultSuppressionDraft: {
  email: string;
  reason: MarketingSuppressionReason;
  source: MarketingSuppressionSource;
  note: string;
} = {
  email: "",
  reason: "manual",
  source: "user",
  note: "",
};

const defaultCampaignDraft: {
  name: string;
  subject: string;
  preview_text: string;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  body_text: string;
  body_html: string;
  status: string;
  scheduled_at: string;
} = {
  name: "",
  subject: "",
  preview_text: "",
  from_name: "",
  from_email: "",
  reply_to_email: "",
  body_text: "",
  body_html: "",
  status: "draft",
  scheduled_at: "",
};

const defaultImportDraft: {
  file_name: string;
  source_provider: string;
  status: MarketingImportBatchStatus;
  total_rows: string;
  imported_rows: string;
  merged_rows: string;
  invalid_rows: string;
  error_message: string;
  completed_at: string;
} = {
  file_name: "",
  source_provider: "csv",
  status: "processing",
  total_rows: "0",
  imported_rows: "0",
  merged_rows: "0",
  invalid_rows: "0",
  error_message: "",
  completed_at: "",
};

const defaultSavedSegmentDraft: {
  name: string;
  description: string;
  segment_scope: MarketingSegmentScope;
  preset_id: string;
} = {
  name: "",
  description: "",
  segment_scope: "contact",
  preset_id: "all-marketable-contacts",
};

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Alert variant="info">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

// This tab is intentionally the lower-level record manager. It exposes CRUD for
// the marketing tables without replacing the workflow-first Campaigns,
// Audiences, and Imports tabs.
export function DataManagerTab({
  active,
  campaigns,
  imports,
  savedSegments,
  contactPresets,
  eventPresets,
  onCampaignsChange,
  onImportsChange,
  onSavedSegmentsChange,
  onAudienceRefresh,
}: {
  active: boolean;
  campaigns: Page<MarketingCampaign>;
  imports: Page<MarketingImportBatch>;
  savedSegments: MarketingSavedSegment[];
  contactPresets: SegmentPreset<ContactSegmentFilters>[];
  eventPresets: SegmentPreset<ContactEventSegmentFilters>[];
  onCampaignsChange: (next: Page<MarketingCampaign>) => void;
  onImportsChange: (next: Page<MarketingImportBatch>) => void;
  onSavedSegmentsChange: (next: MarketingSavedSegment[]) => void;
  onAudienceRefresh: () => void;
}) {
  const [contactSearch, setContactSearch] = useState("");
  const deferredContactSearch = useDeferredValue(contactSearch);
  const [contacts, setContacts] = useState<Page<MarketingContact> | null>(null);
  const [athleteLinks, setAthleteLinks] = useState<MarketingContactAthleteLink[]>([]);
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [registrations, setRegistrations] = useState<MarketingRegistration[]>([]);
  const [transactions, setTransactions] = useState<MarketingSuccessfulTransaction[]>([]);
  const [suppressions, setSuppressions] = useState<MarketingSuppression[]>([]);
  const [loadingStatic, setLoadingStatic] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactDialogError, setContactDialogError] = useState<string | null>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [editingContact, setEditingContact] = useState<MarketingContact | null>(null);
  const [contactDraft, setContactDraft] = useState(defaultContactDraft);

  const [contactDetailOpen, setContactDetailOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<MarketingContact | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventDialogError, setEventDialogError] = useState<string | null>(null);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarketingEvent | null>(null);
  const [eventDraft, setEventDraft] = useState(defaultEventDraft);

  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [registrationDialogError, setRegistrationDialogError] = useState<string | null>(null);
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<MarketingRegistration | null>(null);
  const [registrationDraft, setRegistrationDraft] = useState(defaultRegistrationDraft);

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionDialogError, setTransactionDialogError] = useState<string | null>(null);
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<MarketingSuccessfulTransaction | null>(null);
  const [transactionDraft, setTransactionDraft] = useState(defaultTransactionDraft);

  const [suppressionDialogOpen, setSuppressionDialogOpen] = useState(false);
  const [suppressionDialogError, setSuppressionDialogError] = useState<string | null>(null);
  const [suppressionSubmitting, setSuppressionSubmitting] = useState(false);
  const [editingSuppression, setEditingSuppression] = useState<MarketingSuppression | null>(null);
  const [suppressionDraft, setSuppressionDraft] = useState(defaultSuppressionDraft);

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignDialogError, setCampaignDialogError] = useState<string | null>(null);
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [campaignDraft, setCampaignDraft] = useState(defaultCampaignDraft);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importDialogError, setImportDialogError] = useState<string | null>(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [editingImport, setEditingImport] = useState<MarketingImportBatch | null>(null);
  const [importDraft, setImportDraft] = useState(defaultImportDraft);

  const [savedSegmentDialogOpen, setSavedSegmentDialogOpen] = useState(false);
  const [savedSegmentDialogError, setSavedSegmentDialogError] = useState<string | null>(null);
  const [savedSegmentSubmitting, setSavedSegmentSubmitting] = useState(false);
  const [editingSavedSegment, setEditingSavedSegment] = useState<MarketingSavedSegment | null>(null);
  const [savedSegmentDraft, setSavedSegmentDraft] = useState(defaultSavedSegmentDraft);

  const [deletionState, setDeletionState] = useState<DeletionState>(null);

  const allPresetOptions = useMemo(
    () => [
      ...contactPresets.map((preset) => ({
        id: preset.id,
        label: preset.label,
        description: preset.description,
        scope: "contact" as const,
        filters: preset.filters,
      })),
      ...eventPresets.map((preset) => ({
        id: preset.id,
        label: preset.label,
        description: preset.description,
        scope: "event" as const,
        filters: preset.filters,
      })),
    ],
    [contactPresets, eventPresets],
  );

  useEffect(() => {
    if (!active || hasLoaded) {
      return;
    }

    setLoadingStatic(true);
    setSectionError(null);

    void Promise.all([
      fetchJson<MarketingContactAthleteLink[]>("/api/marketing/contact-athletes"),
      fetchJson<MarketingEvent[]>("/api/marketing/events"),
      fetchJson<MarketingRegistration[]>("/api/marketing/registrations"),
      fetchJson<MarketingSuccessfulTransaction[]>("/api/marketing/transactions"),
      fetchJson<MarketingSuppression[]>("/api/marketing/suppressions"),
    ])
      .then(([linksResponse, eventsResponse, registrationsResponse, transactionsResponse, suppressionsResponse]) => {
        setAthleteLinks(linksResponse);
        setEvents(eventsResponse);
        setRegistrations(registrationsResponse);
        setTransactions(transactionsResponse);
        setSuppressions(suppressionsResponse);
        setHasLoaded(true);
      })
      .catch((error: Error) => {
        setSectionError(error.message);
      })
      .finally(() => setLoadingStatic(false));
  }, [active, hasLoaded]);

  useEffect(() => {
    if (!active) {
      return;
    }

    setLoadingContacts(true);
    void fetchJson<Page<MarketingContact>>(
      `/api/marketing/contacts?search=${encodeURIComponent(deferredContactSearch)}`,
    )
      .then((response) => setContacts(response))
      .catch((error: Error) => setSectionError(error.message))
      .finally(() => setLoadingContacts(false));
  }, [active, deferredContactSearch]);

  async function reloadContacts() {
    const response = await fetchJson<Page<MarketingContact>>(
      `/api/marketing/contacts?search=${encodeURIComponent(deferredContactSearch)}`,
    );
    setContacts(response);
  }

  async function reloadAthleteLinks() {
    const response = await fetchJson<MarketingContactAthleteLink[]>("/api/marketing/contact-athletes");
    setAthleteLinks(response);
  }

  function contactLinkCount(contactId: string) {
    return athleteLinks.filter((link) => link.marketing_contact_id === contactId).length;
  }

  function openCreateContactDialog() {
    setEditingContact(null);
    setContactDraft(defaultContactDraft);
    setContactDialogError(null);
    setContactDialogOpen(true);
  }

  function openEditContactDialog(contact: MarketingContact) {
    setEditingContact(contact);
    setContactDraft({
      email: contact.email,
      first_name: contact.first_name ?? "",
      last_name: contact.last_name ?? "",
      created_via: contact.created_via,
      athlete_id: "",
      relationship_type: "parent",
    });
    setContactDialogError(null);
    setContactDialogOpen(true);
  }

  function openCreateEventDialog() {
    setEditingEvent(null);
    setEventDraft(defaultEventDraft);
    setEventDialogError(null);
    setEventDialogOpen(true);
  }

  function openEditEventDialog(event: MarketingEvent) {
    setEditingEvent(event);
    setEventDraft({
      event_id: event.event_id,
      name: event.name,
      season_id: event.season_id ?? "",
      event_type: event.event_type ?? "",
      starts_at: event.starts_at ? event.starts_at.slice(0, 16) : "",
      ends_at: event.ends_at ? event.ends_at.slice(0, 16) : "",
      status: event.status ?? "",
    });
    setEventDialogError(null);
    setEventDialogOpen(true);
  }

  function openCreateRegistrationDialog() {
    setEditingRegistration(null);
    setRegistrationDraft(defaultRegistrationDraft);
    setRegistrationDialogError(null);
    setRegistrationDialogOpen(true);
  }

  function openEditRegistrationDialog(registration: MarketingRegistration) {
    setEditingRegistration(registration);
    setRegistrationDraft({
      registration_id: registration.registration_id,
      event_id: registration.event_id,
      athlete_id: registration.athlete_id,
      registration_status: registration.registration_status,
      attendance_status: registration.attendance_status ?? "unknown",
      registered_at: registration.registered_at
        ? registration.registered_at.slice(0, 16)
        : "",
    });
    setRegistrationDialogError(null);
    setRegistrationDialogOpen(true);
  }

  function openCreateTransactionDialog() {
    setEditingTransaction(null);
    setTransactionDraft(defaultTransactionDraft);
    setTransactionDialogError(null);
    setTransactionDialogOpen(true);
  }

  function openEditTransactionDialog(transaction: MarketingSuccessfulTransaction) {
    setEditingTransaction(transaction);
    setTransactionDraft({
      payment_id: transaction.payment_id,
      registration_id: transaction.registration_id ?? "",
      event_id: transaction.event_id,
      athlete_id: transaction.athlete_id,
      paid_at: transaction.paid_at.slice(0, 16),
    });
    setTransactionDialogError(null);
    setTransactionDialogOpen(true);
  }

  function openCreateSuppressionDialog() {
    setEditingSuppression(null);
    setSuppressionDraft(defaultSuppressionDraft);
    setSuppressionDialogError(null);
    setSuppressionDialogOpen(true);
  }

  function openEditSuppressionDialog(suppression: MarketingSuppression) {
    setEditingSuppression(suppression);
    setSuppressionDraft({
      email: suppression.email,
      reason: suppression.reason,
      source: suppression.source,
      note: suppression.note ?? "",
    });
    setSuppressionDialogError(null);
    setSuppressionDialogOpen(true);
  }

  function openEditCampaignDialog(campaign: MarketingCampaign) {
    setEditingCampaign(campaign);
    setCampaignDraft({
      name: campaign.name,
      subject: campaign.subject,
      preview_text: campaign.preview_text ?? "",
      from_name: campaign.from_name ?? "",
      from_email: campaign.from_email,
      reply_to_email: campaign.reply_to_email ?? "",
      body_text: campaign.body_text ?? "",
      body_html: campaign.body_html ?? "",
      status: campaign.status,
      scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.slice(0, 16) : "",
    });
    setCampaignDialogError(null);
    setCampaignDialogOpen(true);
  }

  function openEditImportDialog(batch: MarketingImportBatch) {
    setEditingImport(batch);
    setImportDraft({
      file_name: batch.file_name,
      source_provider: batch.source_provider,
      status: batch.status,
      total_rows: String(batch.total_rows),
      imported_rows: String(batch.imported_rows),
      merged_rows: String(batch.merged_rows),
      invalid_rows: String(batch.invalid_rows),
      error_message: batch.error_message ?? "",
      completed_at: batch.completed_at ? batch.completed_at.slice(0, 16) : "",
    });
    setImportDialogError(null);
    setImportDialogOpen(true);
  }

  function openCreateSavedSegmentDialog() {
    setEditingSavedSegment(null);
    setSavedSegmentDraft(defaultSavedSegmentDraft);
    setSavedSegmentDialogError(null);
    setSavedSegmentDialogOpen(true);
  }

  function openEditSavedSegmentDialog(segment: MarketingSavedSegment) {
    const definition = segment.filter_definition as { presetId?: string };
    setEditingSavedSegment(segment);
    setSavedSegmentDraft({
      name: segment.name,
      description: segment.description ?? "",
      segment_scope: segment.segment_scope,
      preset_id: definition.presetId ?? "all-marketable-contacts",
    });
    setSavedSegmentDialogError(null);
    setSavedSegmentDialogOpen(true);
  }

  async function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactSubmitting(true);
    setContactDialogError(null);

    try {
      if (editingContact) {
        const updatedContact = await fetchJson<MarketingContact>(`/api/marketing/contacts/${editingContact.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: contactDraft.email,
            first_name: contactDraft.first_name || null,
            last_name: contactDraft.last_name || null,
            created_via: contactDraft.created_via,
          }),
        });

        if (contactDraft.athlete_id.trim()) {
          await fetchJson("/api/marketing/contact-athletes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              marketing_contact_id: updatedContact.id,
              athlete_id: contactDraft.athlete_id.trim(),
              relationship_type: contactDraft.relationship_type,
            }),
          });
          await reloadAthleteLinks();
        }
      } else {
        const createdContact = await fetchJson<MarketingContact>("/api/marketing/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: contactDraft.email,
            first_name: contactDraft.first_name || null,
            last_name: contactDraft.last_name || null,
          }),
        });

        if (contactDraft.athlete_id.trim()) {
          await fetchJson("/api/marketing/contact-athletes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              marketing_contact_id: createdContact.id,
              athlete_id: contactDraft.athlete_id.trim(),
              relationship_type: contactDraft.relationship_type,
            }),
          });
          await reloadAthleteLinks();
        }
      }

      await reloadContacts();
      onAudienceRefresh();
      setContactDialogOpen(false);
    } catch (nextError) {
      setContactDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save contact.",
      );
    } finally {
      setContactSubmitting(false);
    }
  }

  async function submitEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEventSubmitting(true);
    setEventDialogError(null);

    try {
      if (editingEvent) {
        const updated = await fetchJson<MarketingEvent>(`/api/marketing/events/${editingEvent.event_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: eventDraft.name,
            season_id: eventDraft.season_id || null,
            event_type: eventDraft.event_type || null,
            starts_at: eventDraft.starts_at ? new Date(eventDraft.starts_at).toISOString() : null,
            ends_at: eventDraft.ends_at ? new Date(eventDraft.ends_at).toISOString() : null,
            status: eventDraft.status || null,
          }),
        });
        setEvents((current) =>
          current.map((row) => (row.event_id === updated.event_id ? updated : row)),
        );
      } else {
        const created = await fetchJson<MarketingEvent>("/api/marketing/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: eventDraft.event_id,
            name: eventDraft.name,
            season_id: eventDraft.season_id || null,
            event_type: eventDraft.event_type || null,
            starts_at: eventDraft.starts_at ? new Date(eventDraft.starts_at).toISOString() : null,
            ends_at: eventDraft.ends_at ? new Date(eventDraft.ends_at).toISOString() : null,
            status: eventDraft.status || null,
          }),
        });
        setEvents((current) => [created, ...current]);
      }

      setEventDialogOpen(false);
      onAudienceRefresh();
    } catch (nextError) {
      setEventDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save event.",
      );
    } finally {
      setEventSubmitting(false);
    }
  }

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegistrationSubmitting(true);
    setRegistrationDialogError(null);

    try {
      if (editingRegistration) {
        const updated = await fetchJson<MarketingRegistration>(
          `/api/marketing/registrations/${editingRegistration.registration_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event_id: registrationDraft.event_id,
              athlete_id: registrationDraft.athlete_id,
              registration_status: registrationDraft.registration_status,
              attendance_status: registrationDraft.attendance_status || null,
              registered_at: registrationDraft.registered_at
                ? new Date(registrationDraft.registered_at).toISOString()
                : null,
            }),
          },
        );
        setRegistrations((current) =>
          current.map((row) =>
            row.registration_id === updated.registration_id ? updated : row),
        );
      } else {
        const created = await fetchJson<MarketingRegistration>(
          "/api/marketing/registrations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              registration_id: registrationDraft.registration_id,
              event_id: registrationDraft.event_id,
              athlete_id: registrationDraft.athlete_id,
              registration_status: registrationDraft.registration_status,
              attendance_status: registrationDraft.attendance_status || null,
              registered_at: registrationDraft.registered_at
                ? new Date(registrationDraft.registered_at).toISOString()
                : null,
            }),
          },
        );
        setRegistrations((current) => [created, ...current]);
      }

      setRegistrationDialogOpen(false);
      onAudienceRefresh();
    } catch (nextError) {
      setRegistrationDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save registration.",
      );
    } finally {
      setRegistrationSubmitting(false);
    }
  }

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTransactionSubmitting(true);
    setTransactionDialogError(null);

    try {
      if (editingTransaction) {
        const updated = await fetchJson<MarketingSuccessfulTransaction>(
          `/api/marketing/transactions/${editingTransaction.payment_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              registration_id: transactionDraft.registration_id || null,
              event_id: transactionDraft.event_id,
              athlete_id: transactionDraft.athlete_id,
              paid_at: new Date(transactionDraft.paid_at).toISOString(),
            }),
          },
        );
        setTransactions((current) =>
          current.map((row) => (row.payment_id === updated.payment_id ? updated : row)),
        );
      } else {
        const created = await fetchJson<MarketingSuccessfulTransaction>(
          "/api/marketing/transactions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              payment_id: transactionDraft.payment_id,
              registration_id: transactionDraft.registration_id || null,
              event_id: transactionDraft.event_id,
              athlete_id: transactionDraft.athlete_id,
              paid_at: new Date(transactionDraft.paid_at).toISOString(),
            }),
          },
        );
        setTransactions((current) => [created, ...current]);
      }

      setTransactionDialogOpen(false);
      onAudienceRefresh();
    } catch (nextError) {
      setTransactionDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save transaction.",
      );
    } finally {
      setTransactionSubmitting(false);
    }
  }

  async function submitSuppression(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuppressionSubmitting(true);
    setSuppressionDialogError(null);

    try {
      const saved = await fetchJson<MarketingSuppression>("/api/marketing/suppressions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: suppressionDraft.email,
          reason: suppressionDraft.reason,
          source: suppressionDraft.source,
          note: suppressionDraft.note || null,
        }),
      });

      setSuppressions((current) => {
        const withoutSame = current.filter((row) => row.id !== saved.id);
        return [saved, ...withoutSame];
      });
      setSuppressionDialogOpen(false);
      onAudienceRefresh();
    } catch (nextError) {
      setSuppressionDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save suppression.",
      );
    } finally {
      setSuppressionSubmitting(false);
    }
  }

  async function submitCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCampaign) {
      return;
    }

    setCampaignSubmitting(true);
    setCampaignDialogError(null);

    try {
      const updated = await fetchJson<MarketingCampaign>(
        `/api/marketing/campaigns/${editingCampaign.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: campaignDraft.name,
            subject: campaignDraft.subject,
            preview_text: campaignDraft.preview_text || null,
            from_name: campaignDraft.from_name || null,
            from_email: campaignDraft.from_email,
            reply_to_email: campaignDraft.reply_to_email || null,
            body_text: campaignDraft.body_text || null,
            body_html: campaignDraft.body_html || "",
            status: campaignDraft.status,
            scheduled_at: campaignDraft.scheduled_at
              ? new Date(campaignDraft.scheduled_at).toISOString()
              : null,
          }),
        },
      );

      onCampaignsChange({
        ...campaigns,
        data: campaigns.data.map((row) => (row.id === updated.id ? updated : row)),
      });
      setCampaignDialogOpen(false);
    } catch (nextError) {
      setCampaignDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save campaign.",
      );
    } finally {
      setCampaignSubmitting(false);
    }
  }

  async function submitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingImport) {
      return;
    }

    setImportSubmitting(true);
    setImportDialogError(null);

    try {
      const updated = await fetchJson<MarketingImportBatch>(
        `/api/marketing/imports/${editingImport.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: importDraft.file_name,
            source_provider: importDraft.source_provider,
            status: importDraft.status,
            total_rows: Number(importDraft.total_rows),
            imported_rows: Number(importDraft.imported_rows),
            merged_rows: Number(importDraft.merged_rows),
            invalid_rows: Number(importDraft.invalid_rows),
            error_message: importDraft.error_message || null,
            completed_at: importDraft.completed_at
              ? new Date(importDraft.completed_at).toISOString()
              : null,
          }),
        },
      );

      onImportsChange({
        ...imports,
        data: imports.data.map((row) => (row.id === updated.id ? updated : row)),
      });
      setImportDialogOpen(false);
    } catch (nextError) {
      setImportDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save import batch.",
      );
    } finally {
      setImportSubmitting(false);
    }
  }

  async function submitSavedSegment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedSegmentSubmitting(true);
    setSavedSegmentDialogError(null);

    const preset = allPresetOptions.find((option) => option.id === savedSegmentDraft.preset_id);

    if (!preset) {
      setSavedSegmentDialogError("Choose a preset to seed the saved segment.");
      setSavedSegmentSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: savedSegmentDraft.name,
        description: savedSegmentDraft.description || null,
        segment_scope: savedSegmentDraft.segment_scope,
        filter_definition: {
          presetId: preset.id,
          filters: preset.filters,
          segment_scope: preset.scope,
        },
      };

      if (editingSavedSegment) {
        const updated = await fetchJson<MarketingSavedSegment>(
          `/api/marketing/saved-segments/${editingSavedSegment.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        onSavedSegmentsChange(
          savedSegments.map((row) => (row.id === updated.id ? updated : row)),
        );
      } else {
        const created = await fetchJson<MarketingSavedSegment>(
          "/api/marketing/saved-segments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        onSavedSegmentsChange([created, ...savedSegments]);
      }

      setSavedSegmentDialogOpen(false);
    } catch (nextError) {
      setSavedSegmentDialogError(
        nextError instanceof Error ? nextError.message : "Unable to save segment.",
      );
    } finally {
      setSavedSegmentSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <AlertTitle>Lower-level record manager</AlertTitle>
        <AlertDescription>
          Use this tab when you need to create, inspect, or repair the underlying marketing records. Campaigns, Audiences, and Imports remain the preferred workflow surfaces.
        </AlertDescription>
      </Alert>

      {sectionError ? (
        <Alert variant="error">
          <AlertTitle>Some marketing data could not be loaded</AlertTitle>
          <AlertDescription>{sectionError}</AlertDescription>
        </Alert>
      ) : null}

      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value="contacts" className="rounded-lg border px-4">
          <AccordionTrigger>Contacts</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Contacts"
              description="Create and manage the emailable people that sit at the heart of segmentation."
              actionLabel="Add contact"
              onAction={openCreateContactDialog}
            >
              <div className="space-y-4">
                <div className="max-w-sm">
                  <SearchInput
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                    onClear={() => setContactSearch("")}
                    placeholder="Search contacts"
                  />
                </div>

                {loadingContacts || !contacts ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                ) : !contacts.data.length ? (
                  <EmptyState
                    title="No contacts yet"
                    description="Add a manual contact here, import a list, or create contacts through real academy activity."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created via</TableHead>
                        <TableHead>Linked athletes</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.data.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">
                            {[contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unknown contact"}
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{toTitleCase(contact.created_via)}</Badge>
                          </TableCell>
                          <TableCell>{contactLinkCount(contact.id)}</TableCell>
                          <TableCell>{formatDate(contact.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setContactDetailOpen(true);
                                }}
                              >
                                <Users className="size-4" />
                                Manage links
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditContactDialog(contact)}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDeletionState({
                                    title: "Delete contact?",
                                    description:
                                      "This removes the contact from the marketing layer. Athlete links for this contact will also stop being usable for segmentation.",
                                    action: async () => {
                                      await fetchJson(`/api/marketing/contacts/${contact.id}`, {
                                        method: "DELETE",
                                      });
                                      await reloadContacts();
                                      onAudienceRefresh();
                                    },
                                  })
                                }
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="events" className="rounded-lg border px-4">
          <AccordionTrigger>Events</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Events"
              description="Manage the event snapshots that power event-level segmentation."
              actionLabel="Add event"
              onAction={openCreateEventDialog}
            >
              {loadingStatic ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : !events.length ? (
                <EmptyState
                  title="No events yet"
                  description="Add an event snapshot so segments can target specific camps, clinics, or seasons."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Event ID</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Starts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.event_id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell className="font-mono text-xs">{event.event_id}</TableCell>
                        <TableCell>{event.season_id || "—"}</TableCell>
                        <TableCell>{event.event_type || "—"}</TableCell>
                        <TableCell>{formatDate(event.starts_at)}</TableCell>
                        <TableCell>{event.status || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditEventDialog(event)}>
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletionState({
                                  title: "Delete event?",
                                  description:
                                    "This removes the event snapshot from the marketing layer.",
                                  action: async () => {
                                    await fetchJson(`/api/marketing/events/${event.event_id}`, {
                                      method: "DELETE",
                                    });
                                    setEvents((current) =>
                                      current.filter((row) => row.event_id !== event.event_id),
                                    );
                                    onAudienceRefresh();
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="registrations" className="rounded-lg border px-4">
          <AccordionTrigger>Registrations</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Registrations"
              description="Manage athlete-to-event registration facts used for lifecycle and attendance segmentation."
              actionLabel="Add registration"
              onAction={openCreateRegistrationDialog}
            >
              {loadingStatic ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : !registrations.length ? (
                <EmptyState
                  title="No registrations yet"
                  description="Create a registration record to test segments like waitlisted, attended, or registered but unpaid."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration ID</TableHead>
                      <TableHead>Event ID</TableHead>
                      <TableHead>Athlete ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={registration.registration_id}>
                        <TableCell className="font-mono text-xs">{registration.registration_id}</TableCell>
                        <TableCell className="font-mono text-xs">{registration.event_id}</TableCell>
                        <TableCell className="font-mono text-xs">{registration.athlete_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {toTitleCase(registration.registration_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {registration.attendance_status
                            ? toTitleCase(registration.attendance_status)
                            : "—"}
                        </TableCell>
                        <TableCell>{formatDate(registration.registered_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditRegistrationDialog(registration)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletionState({
                                  title: "Delete registration?",
                                  description:
                                    "This removes the registration fact from the marketing layer.",
                                  action: async () => {
                                    await fetchJson(
                                      `/api/marketing/registrations/${registration.registration_id}`,
                                      {
                                        method: "DELETE",
                                      },
                                    );
                                    setRegistrations((current) =>
                                      current.filter(
                                        (row) => row.registration_id !== registration.registration_id,
                                      ),
                                    );
                                    onAudienceRefresh();
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="transactions" className="rounded-lg border px-4">
          <AccordionTrigger>Successful Transactions</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Successful transactions"
              description="Manage the payment-side facts that power paid, unpaid, and value-oriented targeting."
              actionLabel="Add transaction"
              onAction={openCreateTransactionDialog}
            >
              {loadingStatic ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : !transactions.length ? (
                <EmptyState
                  title="No successful transactions yet"
                  description="Add a payment fact to test paid-family targeting and registration-vs-payment flows."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Registration ID</TableHead>
                      <TableHead>Event ID</TableHead>
                      <TableHead>Athlete ID</TableHead>
                      <TableHead>Paid at</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.payment_id}>
                        <TableCell className="font-mono text-xs">{transaction.payment_id}</TableCell>
                        <TableCell className="font-mono text-xs">{transaction.registration_id || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{transaction.event_id}</TableCell>
                        <TableCell className="font-mono text-xs">{transaction.athlete_id}</TableCell>
                        <TableCell>{formatDate(transaction.paid_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditTransactionDialog(transaction)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletionState({
                                  title: "Delete successful transaction?",
                                  description:
                                    "This removes the payment-side fact from the marketing layer.",
                                  action: async () => {
                                    await fetchJson(
                                      `/api/marketing/transactions/${transaction.payment_id}`,
                                      {
                                        method: "DELETE",
                                      },
                                    );
                                    setTransactions((current) =>
                                      current.filter((row) => row.payment_id !== transaction.payment_id),
                                    );
                                    onAudienceRefresh();
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="suppressions" className="rounded-lg border px-4">
          <AccordionTrigger>Suppressions</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Suppressions"
              description="Control unsubscribe, bounce, complaint, and manual do-not-send records."
              actionLabel="Add suppression"
              onAction={openCreateSuppressionDialog}
            >
              {loadingStatic ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : !suppressions.length ? (
                <EmptyState
                  title="No suppressions yet"
                  description="Create a suppression when a contact unsubscribes, bounces, complains, or must be blocked manually."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppressions.map((suppression) => (
                      <TableRow key={suppression.id}>
                        <TableCell className="font-medium">{suppression.email}</TableCell>
                        <TableCell>{toTitleCase(suppression.reason)}</TableCell>
                        <TableCell>{toTitleCase(suppression.source)}</TableCell>
                        <TableCell>{suppression.note || "—"}</TableCell>
                        <TableCell>{formatDate(suppression.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditSuppressionDialog(suppression)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletionState({
                                  title: "Delete suppression?",
                                  description:
                                    "This address will become marketable again unless another suppression exists for it.",
                                  action: async () => {
                                    await fetchJson(`/api/marketing/suppressions/${suppression.id}`, {
                                      method: "DELETE",
                                    });
                                    setSuppressions((current) =>
                                      current.filter((row) => row.id !== suppression.id),
                                    );
                                    onAudienceRefresh();
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="campaigns" className="rounded-lg border px-4">
          <AccordionTrigger>Campaigns</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Campaign records"
              description="Inspect and update the stored campaign objects behind the workflow tab."
            >
              {!campaigns.data.length ? (
                <EmptyState
                  title="No campaigns yet"
                  description="Create your first campaign from the Campaigns tab, then use this section for lower-level record management."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell>{formatDate(campaign.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditCampaignDialog(campaign)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletionState({
                                  title: "Delete campaign?",
                                  description:
                                    "This removes the campaign record from the marketing layer.",
                                  action: async () => {
                                    await fetchJson(`/api/marketing/campaigns/${campaign.id}`, {
                                      method: "DELETE",
                                    });
                                    onCampaignsChange({
                                      ...campaigns,
                                      data: campaigns.data.filter((row) => row.id !== campaign.id),
                                      count: Math.max((campaigns.count ?? 1) - 1, 0),
                                    });
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="imports" className="rounded-lg border px-4">
          <AccordionTrigger>Imports</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Import batches"
              description="Review and repair the lower-level batch records behind the import workflow."
            >
              {!imports.data.length ? (
                <EmptyState
                  title="No import batches yet"
                  description="Use the Imports tab to create a batch, then come here when you need to inspect or edit the stored record."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Total rows</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditImportDialog(batch)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletionState({
                                  title: "Delete import batch?",
                                  description:
                                    "This removes the import batch record from the marketing layer.",
                                  action: async () => {
                                    await fetchJson(`/api/marketing/imports/${batch.id}`, {
                                      method: "DELETE",
                                    });
                                    onImportsChange({
                                      ...imports,
                                      data: imports.data.filter((row) => row.id !== batch.id),
                                      count: Math.max((imports.count ?? 1) - 1, 0),
                                    });
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="saved-segments" className="rounded-lg border px-4">
          <AccordionTrigger>Saved Segments</AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSectionCard
              title="Saved segment records"
              description="Manage reusable audience definitions without storing static membership."
              actionLabel="Add saved segment"
              onAction={openCreateSavedSegmentDialog}
            >
              {!savedSegments.length ? (
                <EmptyState
                  title="No saved segments yet"
                  description="Save a segment from the Audiences tab or create one here from a supported preset."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedSegments.map((segment) => (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">{segment.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{toTitleCase(segment.segment_scope)}</Badge>
                        </TableCell>
                        <TableCell>{segment.description || "—"}</TableCell>
                        <TableCell>{formatDate(segment.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditSavedSegmentDialog(segment)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletionState({
                                  title: "Delete saved segment?",
                                  description:
                                    "This removes the reusable filter definition, not any underlying marketing contacts.",
                                  action: async () => {
                                    await fetchJson(`/api/marketing/saved-segments/${segment.id}`, {
                                      method: "DELETE",
                                    });
                                    onSavedSegmentsChange(
                                      savedSegments.filter((row) => row.id !== segment.id),
                                    );
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataSectionCard>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <RecordFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        title={editingContact ? "Edit contact" : "Add contact"}
        description="Keep manual contact management simple: email first, then optional name fields."
        error={contactDialogError}
        submitting={contactSubmitting}
        submitLabel={editingContact ? "Save contact" : "Create contact"}
        onSubmit={submitContact}
      >
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={contactDraft.email}
            onChange={(event) =>
              setContactDraft((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="parent@example.com"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input
              value={contactDraft.first_name}
              onChange={(event) =>
                setContactDraft((current) => ({ ...current, first_name: event.target.value }))
              }
              placeholder="Mia"
            />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input
              value={contactDraft.last_name}
              onChange={(event) =>
                setContactDraft((current) => ({ ...current, last_name: event.target.value }))
              }
              placeholder="Alvarez"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Created via</Label>
          <Select
            value={contactDraft.created_via}
            onValueChange={(value) =>
              setContactDraft((current) => ({
                ...current,
                created_via: value as "tenpo" | "import" | "manual",
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="import">Import</SelectItem>
              <SelectItem value="tenpo">Tenpo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <div className="font-medium">Initial athlete link</div>
            <div className="text-sm text-muted-foreground">
              Optional. Add a first athlete now so this contact immediately participates in athlete-based segments.
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Athlete ID</Label>
              <Input
                value={contactDraft.athlete_id}
                onChange={(event) =>
                  setContactDraft((current) => ({
                    ...current,
                    athlete_id: event.target.value,
                  }))
                }
                placeholder="f6b3885d-1f6d-4f5c-9e35-2b6c5fd9e1ba"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={contactDraft.relationship_type}
                onValueChange={(value) =>
                  setContactDraft((current) => ({
                    ...current,
                    relationship_type: value as "parent" | "guardian" | "other",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </RecordFormDialog>

      <ContactDetailDialog
        open={contactDetailOpen}
        contact={selectedContact}
        onOpenChange={setContactDetailOpen}
        onChanged={async () => {
          await reloadAthleteLinks();
          onAudienceRefresh();
        }}
      />

      <RecordFormDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        title={editingEvent ? "Edit event" : "Add event"}
        description="Store only the event details segmentation actually needs."
        error={eventDialogError}
        submitting={eventSubmitting}
        submitLabel={editingEvent ? "Save event" : "Create event"}
        onSubmit={submitEvent}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Event ID</Label>
            <Input
              value={eventDraft.event_id}
              onChange={(event) =>
                setEventDraft((current) => ({ ...current, event_id: event.target.value }))
              }
              disabled={Boolean(editingEvent)}
            />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={eventDraft.name}
              onChange={(event) =>
                setEventDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Season ID</Label>
            <Input
              value={eventDraft.season_id}
              onChange={(event) =>
                setEventDraft((current) => ({ ...current, season_id: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Event type</Label>
            <Input
              value={eventDraft.event_type}
              onChange={(event) =>
                setEventDraft((current) => ({ ...current, event_type: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Starts at</Label>
            <Input
              type="datetime-local"
              value={eventDraft.starts_at}
              onChange={(event) =>
                setEventDraft((current) => ({ ...current, starts_at: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Ends at</Label>
            <Input
              type="datetime-local"
              value={eventDraft.ends_at}
              onChange={(event) =>
                setEventDraft((current) => ({ ...current, ends_at: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Input
            value={eventDraft.status}
            onChange={(event) =>
              setEventDraft((current) => ({ ...current, status: event.target.value }))
            }
            placeholder="published"
          />
        </div>
      </RecordFormDialog>

      <RecordFormDialog
        open={registrationDialogOpen}
        onOpenChange={setRegistrationDialogOpen}
        title={editingRegistration ? "Edit registration" : "Add registration"}
        description="This table holds athlete-to-event participation state for segmentation."
        error={registrationDialogError}
        submitting={registrationSubmitting}
        submitLabel={editingRegistration ? "Save registration" : "Create registration"}
        onSubmit={submitRegistration}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Registration ID</Label>
            <Input
              value={registrationDraft.registration_id}
              onChange={(event) =>
                setRegistrationDraft((current) => ({
                  ...current,
                  registration_id: event.target.value,
                }))
              }
              disabled={Boolean(editingRegistration)}
            />
          </div>
          <div className="space-y-2">
            <Label>Event ID</Label>
            <Input
              value={registrationDraft.event_id}
              onChange={(event) =>
                setRegistrationDraft((current) => ({ ...current, event_id: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Athlete ID</Label>
            <Input
              value={registrationDraft.athlete_id}
              onChange={(event) =>
                setRegistrationDraft((current) => ({ ...current, athlete_id: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Registered at</Label>
            <Input
              type="datetime-local"
              value={registrationDraft.registered_at}
              onChange={(event) =>
                setRegistrationDraft((current) => ({
                  ...current,
                  registered_at: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Registration status</Label>
            <Select
              value={registrationDraft.registration_status}
              onValueChange={(value) =>
                setRegistrationDraft((current) => ({
                  ...current,
                  registration_status: value as typeof current.registration_status,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Attendance status</Label>
            <Select
              value={registrationDraft.attendance_status}
              onValueChange={(value) =>
                setRegistrationDraft((current) => ({
                  ...current,
                  attendance_status: value as typeof current.attendance_status,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="no_show">No show</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </RecordFormDialog>

      <RecordFormDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        title={editingTransaction ? "Edit successful transaction" : "Add successful transaction"}
        description="Keep payment-side facts separate from registration state."
        error={transactionDialogError}
        submitting={transactionSubmitting}
        submitLabel={editingTransaction ? "Save transaction" : "Create transaction"}
        onSubmit={submitTransaction}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Payment ID</Label>
            <Input
              value={transactionDraft.payment_id}
              onChange={(event) =>
                setTransactionDraft((current) => ({ ...current, payment_id: event.target.value }))
              }
              disabled={Boolean(editingTransaction)}
            />
          </div>
          <div className="space-y-2">
            <Label>Registration ID</Label>
            <Input
              value={transactionDraft.registration_id}
              onChange={(event) =>
                setTransactionDraft((current) => ({
                  ...current,
                  registration_id: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Event ID</Label>
            <Input
              value={transactionDraft.event_id}
              onChange={(event) =>
                setTransactionDraft((current) => ({ ...current, event_id: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Athlete ID</Label>
            <Input
              value={transactionDraft.athlete_id}
              onChange={(event) =>
                setTransactionDraft((current) => ({ ...current, athlete_id: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Paid at</Label>
          <Input
            type="datetime-local"
            value={transactionDraft.paid_at}
            onChange={(event) =>
              setTransactionDraft((current) => ({ ...current, paid_at: event.target.value }))
            }
          />
        </div>
      </RecordFormDialog>

      <RecordFormDialog
        open={suppressionDialogOpen}
        onOpenChange={setSuppressionDialogOpen}
        title={editingSuppression ? "Edit suppression" : "Add suppression"}
        description="Suppressions are reusable safety rails for unsubscribe, bounce, complaint, and manual block cases."
        error={suppressionDialogError}
        submitting={suppressionSubmitting}
        submitLabel={editingSuppression ? "Save suppression" : "Create suppression"}
        onSubmit={submitSuppression}
      >
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={suppressionDraft.email}
            onChange={(event) =>
              setSuppressionDraft((current) => ({ ...current, email: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select
              value={suppressionDraft.reason}
              onValueChange={(value) =>
                setSuppressionDraft((current) => ({
                  ...current,
                  reason: value as typeof current.reason,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={suppressionDraft.source}
              onValueChange={(value) =>
                setSuppressionDraft((current) => ({
                  ...current,
                  source: value as typeof current.source,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Note</Label>
          <Textarea
            value={suppressionDraft.note}
            onChange={(event) =>
              setSuppressionDraft((current) => ({ ...current, note: event.target.value }))
            }
            placeholder="Optional internal note"
          />
        </div>
      </RecordFormDialog>

      <RecordFormDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        title="Edit campaign"
        description="This is the lower-level record editor. The guided composer remains the preferred creation flow."
        error={campaignDialogError}
        submitting={campaignSubmitting}
        submitLabel="Save campaign"
        onSubmit={submitCampaign}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={campaignDraft.name}
              onChange={(event) =>
                setCampaignDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={campaignDraft.subject}
              onChange={(event) =>
                setCampaignDraft((current) => ({ ...current, subject: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Preview text</Label>
            <Input
              value={campaignDraft.preview_text}
              onChange={(event) =>
                setCampaignDraft((current) => ({ ...current, preview_text: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>From name</Label>
            <Input
              value={campaignDraft.from_name}
              onChange={(event) =>
                setCampaignDraft((current) => ({ ...current, from_name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>From email</Label>
            <Input
              value={campaignDraft.from_email}
              onChange={(event) =>
                setCampaignDraft((current) => ({ ...current, from_email: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Reply-to email</Label>
            <Input
              value={campaignDraft.reply_to_email}
              onChange={(event) =>
                setCampaignDraft((current) => ({
                  ...current,
                  reply_to_email: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={campaignDraft.status}
              onValueChange={(value) =>
                setCampaignDraft((current) => ({ ...current, status: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scheduled at</Label>
            <Input
              type="datetime-local"
              value={campaignDraft.scheduled_at}
              onChange={(event) =>
                setCampaignDraft((current) => ({
                  ...current,
                  scheduled_at: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Body text</Label>
          <Textarea
            className="min-h-32"
            value={campaignDraft.body_text}
            onChange={(event) =>
              setCampaignDraft((current) => ({ ...current, body_text: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Body HTML</Label>
          <Textarea
            className="min-h-32 font-mono text-xs"
            value={campaignDraft.body_html}
            onChange={(event) =>
              setCampaignDraft((current) => ({ ...current, body_html: event.target.value }))
            }
          />
        </div>
      </RecordFormDialog>

      <RecordFormDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Edit import batch"
        description="This is for lower-level batch repair, not the primary import flow."
        error={importDialogError}
        submitting={importSubmitting}
        submitLabel="Save import batch"
        onSubmit={submitImport}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>File name</Label>
            <Input
              value={importDraft.file_name}
              onChange={(event) =>
                setImportDraft((current) => ({ ...current, file_name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Source provider</Label>
            <Select
              value={importDraft.source_provider}
              onValueChange={(value) =>
                setImportDraft((current) => ({ ...current, source_provider: value }))
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
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={importDraft.status}
              onValueChange={(value) =>
                setImportDraft((current) => ({
                  ...current,
                  status: value as MarketingImportBatchStatus,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Completed at</Label>
            <Input
              type="datetime-local"
              value={importDraft.completed_at}
              onChange={(event) =>
                setImportDraft((current) => ({
                  ...current,
                  completed_at: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Total rows</Label>
            <Input
              value={importDraft.total_rows}
              onChange={(event) =>
                setImportDraft((current) => ({ ...current, total_rows: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Imported rows</Label>
            <Input
              value={importDraft.imported_rows}
              onChange={(event) =>
                setImportDraft((current) => ({
                  ...current,
                  imported_rows: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Merged rows</Label>
            <Input
              value={importDraft.merged_rows}
              onChange={(event) =>
                setImportDraft((current) => ({ ...current, merged_rows: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Invalid rows</Label>
            <Input
              value={importDraft.invalid_rows}
              onChange={(event) =>
                setImportDraft((current) => ({ ...current, invalid_rows: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Error message</Label>
          <Textarea
            value={importDraft.error_message}
            onChange={(event) =>
              setImportDraft((current) => ({
                ...current,
                error_message: event.target.value,
              }))
            }
          />
        </div>
      </RecordFormDialog>

      <RecordFormDialog
        open={savedSegmentDialogOpen}
        onOpenChange={setSavedSegmentDialogOpen}
        title={editingSavedSegment ? "Edit saved segment" : "Add saved segment"}
        description="Saved segments store reusable filter definitions, not static contact membership."
        error={savedSegmentDialogError}
        submitting={savedSegmentSubmitting}
        submitLabel={editingSavedSegment ? "Save segment" : "Create segment"}
        onSubmit={submitSavedSegment}
      >
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={savedSegmentDraft.name}
            onChange={(event) =>
              setSavedSegmentDraft((current) => ({ ...current, name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={savedSegmentDraft.description}
            onChange={(event) =>
              setSavedSegmentDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select
              value={savedSegmentDraft.segment_scope}
              onValueChange={(value) =>
                setSavedSegmentDraft((current) => ({
                  ...current,
                  segment_scope: value as "contact" | "event",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Seed from preset</Label>
            <Select
              value={savedSegmentDraft.preset_id}
              onValueChange={(value) =>
                setSavedSegmentDraft((current) => ({ ...current, preset_id: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allPresetOptions
                  .filter((preset) => preset.scope === savedSegmentDraft.segment_scope)
                  .map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </RecordFormDialog>

      <AlertDialog
        open={Boolean(deletionState)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeletionState(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deletionState?.title ?? "Delete record?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletionState?.description ?? "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = deletionState?.action;
                if (action) {
                  void action();
                }
                setDeletionState(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
