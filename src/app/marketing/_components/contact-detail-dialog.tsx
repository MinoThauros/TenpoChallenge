"use client";

import { useEffect, useState } from "react";
import { Trash2, Users } from "lucide-react";
import type {
  MarketingAthlete,
  MarketingContact,
  MarketingContactAthleteLink,
} from "@/lib/marketing-services";
import { fetchJson, toTitleCase } from "./marketing-ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Contact links live inside a contact-specific surface on purpose. Athlete
// linkage matters for segmentation, but it should not become its own admin grid.
export function ContactDetailDialog({
  open,
  contact,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  contact: MarketingContact | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [links, setLinks] = useState<MarketingContactAthleteLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athleteId, setAthleteId] = useState("");
  const [relationshipType, setRelationshipType] = useState<
    "parent" | "guardian" | "other"
  >("parent");
  const [newAthleteFirstName, setNewAthleteFirstName] = useState("");
  const [newAthleteLastName, setNewAthleteLastName] = useState("");
  const [newAthleteBirthDate, setNewAthleteBirthDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingLink, setDeletingLink] = useState<MarketingContactAthleteLink | null>(null);

  useEffect(() => {
    if (!open || !contact) {
      return;
    }

    setLoading(true);
    setError(null);
    void fetchJson<MarketingContactAthleteLink[]>(
      `/api/marketing/contact-athletes?marketingContactId=${contact.id}`,
    )
      .then((response) => setLinks(response))
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setLoading(false));
  }, [contact, open]);

  async function handleAddLink() {
    if (!contact || !athleteId.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const link = await fetchJson<MarketingContactAthleteLink>(
        "/api/marketing/contact-athletes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            marketing_contact_id: contact.id,
            athlete_id: athleteId.trim(),
            relationship_type: relationshipType,
          }),
        },
      );

      setLinks((current) => {
        const exists = current.some(
          (row) => row.athlete_id === link.athlete_id,
        );
        return exists ? current : [link, ...current];
      });
      setAthleteId("");
      setRelationshipType("parent");
      onChanged();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We couldn't link this athlete right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAthleteAndLink() {
    if (!contact || !newAthleteFirstName.trim() || !newAthleteLastName.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const athlete = await fetchJson<MarketingAthlete>("/api/marketing/athletes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: newAthleteFirstName.trim(),
          last_name: newAthleteLastName.trim(),
          birth_date: newAthleteBirthDate || null,
        }),
      });

      const link = await fetchJson<MarketingContactAthleteLink>(
        "/api/marketing/contact-athletes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            marketing_contact_id: contact.id,
            athlete_id: athlete.id,
            relationship_type: relationshipType,
          }),
        },
      );

      setLinks((current) => {
        const exists = current.some((row) => row.athlete_id === link.athlete_id);
        return exists ? current : [link, ...current];
      });
      setNewAthleteFirstName("");
      setNewAthleteLastName("");
      setNewAthleteBirthDate("");
      onChanged();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We couldn't create and link this athlete right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteLink() {
    if (!contact || !deletingLink) {
      return;
    }

    try {
      await fetchJson("/api/marketing/contact-athletes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketing_contact_id: contact.id,
          athlete_id: deletingLink.athlete_id,
        }),
      });

      setLinks((current) =>
        current.filter((row) => row.athlete_id !== deletingLink.athlete_id),
      );
      setDeletingLink(null);
      onChanged();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We couldn't remove this athlete link right now.",
      );
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage contact links</DialogTitle>
            <DialogDescription>
              Connect this contact to athlete records here so audience segments can use registration and payment history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="font-medium">
                {[contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || "Unknown contact"}
              </div>
              <div className="text-muted-foreground">{contact?.email}</div>
            </div>

            {error ? (
              <Alert variant="error">
                <AlertTitle>Unable to update athlete links</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Create athlete and link here</h3>
                <p className="text-sm text-muted-foreground">
                  Create a lightweight athlete record from this dialog, then link it to the contact in one step.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input
                    value={newAthleteFirstName}
                    onChange={(event) => setNewAthleteFirstName(event.target.value)}
                    placeholder="Avery"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input
                    value={newAthleteLastName}
                    onChange={(event) => setNewAthleteLastName(event.target.value)}
                    placeholder="Johnson"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Birth date</Label>
                  <Input
                    type="date"
                    value={newAthleteBirthDate}
                    onChange={(event) => setNewAthleteBirthDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select
                    value={relationshipType}
                    onValueChange={(value) =>
                      setRelationshipType(value as "parent" | "guardian" | "other")
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
              <div className="flex justify-end">
                <Button
                  onClick={() => void handleCreateAthleteAndLink()}
                  disabled={
                    submitting
                    || !newAthleteFirstName.trim()
                    || !newAthleteLastName.trim()
                  }
                >
                  <Users className="size-4" />
                  {submitting ? "Creating..." : "Create athlete and link"}
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Add athlete link here</h3>
                <p className="text-sm text-muted-foreground">
                  If the athlete already exists, paste the athlete UUID below, choose the relationship type, and save the link from this dialog.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px_auto]">
                <div className="space-y-2">
                  <Label>Athlete ID</Label>
                  <Input
                    value={athleteId}
                    onChange={(event) => setAthleteId(event.target.value)}
                    placeholder="f6b3885d-1f6d-4f5c-9e35-2b6c5fd9e1ba"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select
                    value={relationshipType}
                    onValueChange={(value) =>
                      setRelationshipType(value as "parent" | "guardian" | "other")
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
                <div className="flex items-end">
                  <Button onClick={() => void handleAddLink()} disabled={submitting || !athleteId.trim()}>
                    <Users className="size-4" />
                    {submitting ? "Linking..." : "Add link"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Linked athletes</h3>
                <p className="text-sm text-muted-foreground">
                  These relationships are what let segmentation roll athlete activity up to the contact level.
                </p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : !links.length ? (
                <Alert variant="info">
                  <AlertTitle>No athletes linked yet</AlertTitle>
                  <AlertDescription>
                    Add a first athlete link to unlock athlete-based segmentation for this contact.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Athlete ID</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Linked at</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.athlete_id}>
                        <TableCell className="font-mono text-xs">{link.athlete_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {toTitleCase(link.relationship_type ?? "other")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(link.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingLink(link)}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingLink)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeletingLink(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove athlete link?</AlertDialogTitle>
            <AlertDialogDescription>
              This contact will stop inheriting segmentation facts from that athlete until the link is added again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteLink()}>
              Remove link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
