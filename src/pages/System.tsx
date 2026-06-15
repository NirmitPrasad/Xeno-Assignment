import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getDataSources,
  importCustomersCsv,
  exportTableCsv,
  getPreviewData,
} from "@/lib/data.functions";
import { seedDatabase } from "@/lib/seed.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Upload, Download, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { toCsv, downloadCsv } from "@/lib/csv";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TABLE_DESCRIPTIONS: Record<string, string> = {
  customers: "Your contact book — name, email, phone, city, lifetime value.",
  products: "Gourmet coffee and beverage catalogue used in personalised recommendations.",
  orders: "Every purchase (with line items) for behavioural segmentation.",
  campaigns: "Each campaign you launch, with segment + message + channel.",
  messages: "Individual sends — one row per recipient per channel.",
  events: "Provider callbacks: sent / delivered / opened / clicked / ordered / failed.",
  message_templates: "Reusable copy with personalisation variables.",
};

export default function SystemPage() {
  const fn = useServerFn(getDataSources);
  const importFn = useServerFn(importCustomersCsv);
  const exportFn = useServerFn(exportTableCsv);
  const previewFn = useServerFn(getPreviewData);
  const seedFn = useServerFn(seedDatabase);
  const qc = useQueryClient();
  const { data, dataUpdatedAt } = useQuery({ queryKey: ["data-sources"], queryFn: () => fn() });
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor((now - (dataUpdatedAt || now)) / 60000);
  const timeText = mins < 1 ? "just now" : `${mins} min ago`;

  const [previewTable, setPreviewTable] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const handleImport = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.error("No rows found in CSV");
        return;
      }
      const r = await importFn({ data: { rows } });
      toast.success(
        `Imported ${r.inserted}/${r.total} customers${r.errors.length ? ` · ${r.errors.length} errors` : ""}`,
      );
      if (r.errors.length) console.warn("Import errors", r.errors);
      qc.invalidateQueries({ queryKey: ["data-sources"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (table: string) => {
    setBusy(true);
    try {
      const r = await exportFn({ data: { table: table as any } });
      downloadCsv(`${table}.csv`, toCsv(r.rows));
      toast.success(`Exported ${r.rows.length} rows`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = async (table: string) => {
    setBusy(true);
    try {
      const r = await previewFn({ data: { table: table as any } });
      setPreviewRows(r.rows);
      setPreviewTable(table);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    toast.success("Database re-seeded successfully! Loading new data...");
    try {
      await seedFn({ data: { force: true } });
      qc.invalidateQueries({ queryKey: ["data-sources"] });
    } catch (e) {
      console.error(e);
      toast.error("Failed to re-seed database.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between border-b pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integration Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your customer data lives in a managed Postgres database (Supabase). Every campaign reads
            from these tables — no external CRM required.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeed}
          disabled={seeding || busy}
          className="shrink-0 text-foreground border-border bg-background hover:bg-accent"
        >
          <Database className="size-4 mr-2" />
          {seeding ? "Re-Seeding..." : "Re-Seed Database"}
        </Button>
      </div>

      <Card className="p-6 bg-gradient-to-br from-stone-900 to-sky-50 dark:from-stone-950 dark:to-sky-950/20 border-stone-800 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-stone-900 dark:bg-stone-950/40">
            <Database className="size-5 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <div className="font-medium text-foreground">
              {data?.storage.provider ?? "Supabase (Postgres)"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="size-3 text-amber-600 dark:text-amber-500" /> Connected ·
              region: {data?.storage.region ?? "managed"} · last synced: {timeText}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-primary" />
          <h2 className="font-medium text-foreground">Import customers (CSV)</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Required columns:{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">name</code>,{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">email</code>. Optional:{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">phone</code>,{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">city</code>,{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">tags</code>,{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">total_orders</code>,{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">total_spent</code>,{" "}
          <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">last_order_date</code>.
          Existing rows (matched by email) are updated.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = "";
          }}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-4 file:py-2 file:text-sm file:font-medium cursor-pointer text-foreground"
        />
      </Card>

      <div>
        <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted-foreground">
          Tables
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.tables ?? []).map((t) => (
            <Card key={t.table} className="p-5 flex flex-col justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold text-foreground">{t.table}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {TABLE_DESCRIPTIONS[t.table]}
                </div>
                <Badge variant="secondary" className="mt-3 font-normal">
                  {t.rows.toLocaleString("en-IN")} rows
                </Badge>
              </div>
              <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-secondary">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => handlePreview(t.table)}
                  className="text-xs h-8 text-foreground"
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => handleExport(t.table)}
                  className="text-xs h-8 text-foreground"
                >
                  <Download className="size-3.5 mr-1.5" /> Export
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6 bg-stone-900/50 border-stone-800 dark:bg-stone-950/10 dark:border-stone-800">
        <h3 className="font-medium mb-4 text-foreground">Channel architecture</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col items-center">
            <span className="px-3 py-2 bg-card border shadow-sm rounded-md text-sm font-medium text-foreground">
              CRM
            </span>
            <Badge
              variant="secondary"
              className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 text-[10px] uppercase dark:bg-blue-950/40 dark:text-blue-400"
            >
              Live
            </Badge>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-[-28px]" />
          <div className="flex flex-col items-center mt-[-28px]">
            <span className="px-3 py-2 bg-card border shadow-sm rounded-md text-sm text-foreground">
              Send API <code className="text-xs text-slate-500 ml-1">/launchCampaign</code>
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-[-28px]" />
          <div className="flex flex-col items-center">
            <span className="px-3 py-2 bg-card border shadow-sm rounded-md text-sm font-medium text-amber-700 border-stone-800 dark:text-amber-500 dark:border-stone-800">
              Channel Service (WhatsApp / SMS / Email / RCS)
            </span>
            <Badge
              variant="secondary"
              className="mt-2 bg-stone-900 text-amber-700 hover:bg-stone-900 border-0 text-[10px] uppercase dark:bg-stone-950/40 dark:text-amber-500"
            >
              Simulated
            </Badge>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-[-28px]" />
          <div className="flex flex-col items-center mt-[-28px]">
            <span className="px-3 py-2 bg-card border shadow-sm rounded-md text-sm text-foreground">
              Callback API{" "}
              <code className="text-xs text-slate-500 ml-1">/api/public/channel-callback</code>
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-[-28px]" />
          <div className="flex flex-col items-center mt-[-28px]">
            <span className="px-3 py-2 bg-card border shadow-sm rounded-md text-sm font-medium text-foreground">
              CRM updates message status + events
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-8 leading-relaxed max-w-4xl">
          The channel service runs as a separate stub service and simulates realistic delivery
          lifecycle events per channel (delivered → opened → read → clicked). To connect a real
          provider like Twilio or Karix, replace the stub with HTTP calls to their API and point
          their webhook back to <code>/api/v1/webhook/receiver</code>.
        </p>
      </Card>

      <Dialog
        open={!!previewTable}
        onOpenChange={(o) => {
          if (!o) setPreviewTable(null);
        }}
      >
        <DialogContent className="sm:max-w-[90vw] md:max-w-4xl max-h-[85vh] flex flex-col bg-background border">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-mono text-lg text-foreground">{previewTable}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-md border mt-2">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 sticky top-0 shadow-sm text-foreground">
                <tr>
                  {previewRows.length > 0 ? (
                    Object.keys(previewRows[0]).map((k) => (
                      <th
                        key={k}
                        className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {k}
                      </th>
                    ))
                  ) : (
                    <th className="px-4 py-2">No columns</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y text-foreground">
                {previewRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={100}>
                      No data found
                    </td>
                  </tr>
                ) : (
                  previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20 text-foreground">
                      {Object.values(row).map((v: any, j) => (
                        <td
                          key={j}
                          className="px-4 py-2.5 whitespace-nowrap max-w-[300px] truncate"
                        >
                          {typeof v === "object" && v !== null
                            ? JSON.stringify(v)
                            : String(v ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground mt-4 flex items-center justify-between">
            <span>
              Showing {previewRows.length} of{" "}
              {data?.tables.find((t) => t.table === previewTable)?.rows} rows
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tiny CSV parser handling quoted fields. Good enough for typical exports.
function parseCsv(text: string): Record<string, any>[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          q = false;
        } else cur += c;
      } else {
        if (c === '"') q = true;
        else if (c === ",") {
          out.push(cur);
          cur = "";
        } else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = parseLine(l);
    const row: Record<string, any> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}
