import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTemplates, createTemplate, deleteTemplate } from "@/lib/templates.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateModal } from "@/components/templates/TemplateModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TemplatesPage() {
  const listFn = useServerFn(listTemplates);
  const createFn = useServerFn(createTemplate);
  const deleteFn = useServerFn(deleteTemplate);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: ["templates"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleCreate = async (input: {
    name: string;
    channel: "whatsapp" | "sms" | "email" | "rcs";
    body: string;
    description?: string | null;
  }) => {
    await createFn({ data: input });
    toast.success("Template created");
    qc.invalidateQueries({ queryKey: ["templates"] });
    setOpen(false);
  };

  const filteredData = (data ?? []).filter((t) => {
    if (channelFilter !== "all" && t.channel !== channelFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Offer Drafts</h1>
          <p className="text-sm text-muted-foreground">
            Reusable copy with <code className="text-xs bg-secondary px-1 rounded">{"{name}"}</code>
            , <code className="text-xs bg-secondary px-1 rounded">{"{full_name}"}</code>, and{" "}
            <code className="text-xs bg-secondary px-1 rounded">{"{city}"}</code> variables.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" /> New template
            </Button>
          </DialogTrigger>
          <TemplateModal onCreate={handleCreate} />
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-background text-foreground"
        />
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[180px] bg-background text-foreground">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="rcs">RCS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.map((t) => (
          <TemplateCard key={t.id} template={t} onDelete={handleDelete} />
        ))}
        {data && filteredData.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground py-12 text-center">
            No templates match your search.
          </div>
        )}
      </div>
    </div>
  );
}
