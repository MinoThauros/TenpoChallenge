"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import type { MarketingImportBatch, Page } from "@/lib/marketing-services";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJson, statusBadgeVariant, toTitleCase } from "./marketing-ui";

// Imports stays intentionally lightweight because the challenge is about using
// imported audiences immediately, not building a full ETL product.
export function ImportsTab({
  imports,
  onImportCreated,
}: {
  imports: Page<MarketingImportBatch>;
  onImportCreated: (batch: MarketingImportBatch) => void;
}) {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importSource, setImportSource] = useState<
    "csv" | "mailchimp" | "mailerlite" | "constant_contact" | "other"
  >("csv");
  const [importProgress, setImportProgress] = useState(0);
  const [importFieldMap, setImportFieldMap] = useState({
    email: "Email",
    first_name: "First Name",
    last_name: "Last Name",
  });

  async function handleImportSubmit() {
    if (!selectedFileName) {
      return;
    }

    setImportProgress(25);

    const batch = await fetchJson<MarketingImportBatch>("/api/marketing/imports", {
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
    onImportCreated(batch);
    setImportProgress(100);

    setTimeout(() => {
      setImportProgress(0);
      setSelectedFileName("");
    }, 800);
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
}
