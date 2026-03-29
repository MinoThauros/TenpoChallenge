import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  MarketingContactEventSegmentFact,
  MarketingContactSegmentFact,
} from "@/lib/marketing-services";

type RecipientPreviewTableProps = {
  rows: Array<MarketingContactSegmentFact | MarketingContactEventSegmentFact>;
  eventScoped: boolean;
  loading: boolean;
  onLinkAthlete?: (
    row: MarketingContactSegmentFact | MarketingContactEventSegmentFact,
  ) => void;
};

function toTitleCase(input: string) {
  return input
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// This component is intentionally shared across the audience builder and the
// campaign composer so the admin sees one consistent "who will receive this?"
// preview everywhere in the product.
export function RecipientPreviewTable({
  rows,
  eventScoped,
  loading,
  onLinkAthlete,
}: RecipientPreviewTableProps) {
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
          Try loosening one of the filters, importing contacts, or adding a contact manually.
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
          {onLinkAthlete ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const isEventRow = "event_name" in row;

          return (
            <TableRow
              key={`${row.marketing_contact_id}-${isEventRow ? row.event_id : row.email}`}
            >
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
              {onLinkAthlete ? (
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLinkAthlete(row)}
                  >
                    Link athlete
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
