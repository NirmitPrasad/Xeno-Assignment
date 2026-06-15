import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Smartphone, Mail, Radio } from "lucide-react";
import { toast } from "sonner";

interface TemplateModalProps {
  onCreate: (input: {
    name: string;
    channel: "whatsapp" | "sms" | "email" | "rcs";
    body: string;
    description?: string | null;
  }) => Promise<void>;
}

export function TemplateModal({ onCreate }: TemplateModalProps) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email" | "rcs">("whatsapp");
  const [body, setBody] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const limit = channel === "sms" ? 160 : channel === "whatsapp" ? 1024 : null;

  const insertVar = (v: string) => {
    setBody((prev) => prev + v);
  };

  const previewText = body
    .replace(/\{name\}/g, "Priya")
    .replace(/\{full_name\}/g, "Priya Sharma")
    .replace(/\{city\}/g, "Mumbai");

  return (
    <DialogContent className="sm:max-w-4xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
      <div className="grid md:grid-cols-2">
        <div className="p-6 space-y-4 bg-background">
          <div>
            <DialogTitle className="text-xl text-foreground">New template</DialogTitle>
            <DialogDescription className="mt-1 text-muted-foreground">
              Create a reusable message template.
            </DialogDescription>
          </div>
          <div>
            <Label htmlFor="t-name">Name</Label>
            <Input
              id="t-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Win-back offer"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Channel</Label>
            <Select
              value={channel}
              onValueChange={(v) => {
                setChannel(v as any);
                setBody("");
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="rcs">RCS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="t-body">Message Body</Label>
              <span
                className={`text-[10px] ${limit && body.length > limit ? "text-destructive font-bold" : "text-muted-foreground"}`}
              >
                {body.length} {limit ? `/ ${limit}` : ""}
              </span>
            </div>
            <Textarea
              id="t-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className={
                limit && body.length > limit
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              placeholder="Hi {name}, here's 20% off your next order in {city}!"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 text-[10px]"
                onClick={() => insertVar("{name}")}
              >
                + {"{name}"}
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 text-[10px]"
                onClick={() => insertVar("{full_name}")}
              >
                + {"{full_name}"}
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 text-[10px]"
                onClick={() => insertVar("{city}")}
              >
                + {"{city}"}
              </Badge>
            </div>
          </div>
          <div>
            <Label htmlFor="t-desc">Description (optional)</Label>
            <Input
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              className="mt-1"
            />
          </div>
          <div className="pt-2 flex justify-end">
            <Button
              disabled={
                saving || !name.trim() || !body.trim() || (limit !== null && body.length > limit)
              }
              onClick={async () => {
                setSaving(true);
                try {
                  await onCreate({
                    name: name.trim(),
                    channel,
                    body: body.trim(),
                    description: description.trim() || null,
                  });
                  setName("");
                  setBody("");
                  setDescription("");
                } catch (e) {
                  toast.error((e as Error).message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Create template"}
            </Button>
          </div>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-900/50 border-l p-6 flex flex-col items-center justify-center">
          <div className="text-sm font-medium mb-4 text-muted-foreground w-full max-w-[300px] flex items-center gap-2">
            {channel === "whatsapp" ? (
              <MessageCircle className="size-4" />
            ) : channel === "sms" ? (
              <Smartphone className="size-4" />
            ) : channel === "email" ? (
              <Mail className="size-4" />
            ) : (
              <Radio className="size-4" />
            )}
            Live Preview
          </div>
          <div className="w-full max-w-[300px] min-h-[400px] border-[6px] border-slate-200 dark:border-slate-800 rounded-[2rem] bg-background relative overflow-hidden shadow-sm flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-200 dark:bg-slate-800 rounded-b-xl z-10" />
            <div className="h-14 border-b bg-muted/30 flex items-center px-4 pt-2 shrink-0">
              <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                {channel.charAt(0).toUpperCase()}
              </div>
              <div className="ml-2 font-medium text-xs capitalize text-foreground">
                {channel} Message
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 h-full flex-1 overflow-y-auto">
              {previewText ? (
                <div
                  className={`p-3 text-sm whitespace-pre-wrap relative shadow-sm ${
                    channel === "whatsapp"
                      ? "bg-stone-900 dark:bg-stone-950 text-amber-700 dark:text-amber-100 rounded-lg rounded-tl-none"
                      : channel === "sms"
                        ? "bg-blue-500 text-white rounded-2xl rounded-bl-none"
                        : channel === "email"
                          ? "bg-background border rounded text-foreground"
                          : "bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-50 rounded-lg rounded-tl-none"
                  }`}
                >
                  {previewText}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center mt-10">
                  Start typing to see preview...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
