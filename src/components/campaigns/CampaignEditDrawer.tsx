import React, { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateTemplateAi } from "@/lib/ai.functions";

interface CampaignEditDrawerProps {
  editingId: string | null;
  campaignToEdit: any;
  onSave: (formData: any) => Promise<void>;
  onCancel: () => void;
}

export function CampaignEditDrawer({
  editingId,
  campaignToEdit,
  onSave,
  onCancel,
}: CampaignEditDrawerProps) {
  const generateAiFn = useServerFn(generateTemplateAi);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    channel: "whatsapp",
    startDate: "",
    endDate: "",
    segment_description: "",
    message_template: "",
    total_recipients: 5000,
  });

  useEffect(() => {
    if (campaignToEdit) {
      setFormData({
        name: campaignToEdit.name,
        channel: campaignToEdit.channel.split(",")[0],
        startDate: "",
        endDate: "",
        segment_description: campaignToEdit.segment_description || "All Customers",
        message_template: campaignToEdit.message_template || "",
        total_recipients: campaignToEdit.total_recipients,
      });
    } else {
      setFormData({
        name: "",
        channel: "whatsapp",
        startDate: "",
        endDate: "",
        segment_description: "",
        message_template: "",
        total_recipients: 5000,
      });
    }
  }, [campaignToEdit]);

  const handleGenerateAi = async () => {
    if (!formData.name || !formData.segment_description) {
      toast.error("Please enter Campaign Name and Target Segment first for AI to work.");
      return;
    }
    setGeneratingAi(true);
    try {
      const msg = await generateAiFn({
        data: {
          name: formData.name,
          segment: formData.segment_description,
          channel: formData.channel,
        },
      });
      setFormData((f) => ({ ...f, message_template: msg }));
      toast.success("AI generated a message!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.segment_description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{editingId ? "Edit campaign" : "Create new campaign"}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Campaign Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="Summer Sale"
            />
          </div>
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select
              value={formData.channel}
              onValueChange={(v) => setFormData((f) => ({ ...f, channel: v }))}
            >
              <SelectTrigger>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="segment">
              Target Segment (Choose basis) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.segment_description}
              onValueChange={(v) => {
                let recs = 50;
                if (v === "All Customers") recs = 5000;
                else if (v === "VIP Customers") recs = 1250;
                else if (v === "Customers from Mumbai") recs = 800;
                else if (v === "Inactive Customers (>90 days)") recs = 2100;
                setFormData((f) => ({
                  ...f,
                  segment_description: v,
                  total_recipients: recs,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select audience..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Customers">All Customers</SelectItem>
                <SelectItem value="VIP Customers">VIP Customers</SelectItem>
                <SelectItem value="Customers from Mumbai">Customers from Mumbai</SelectItem>
                <SelectItem value="Inactive Customers (>90 days)">
                  Inactive Customers (&gt;90 days)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipients">Total Recipients</Label>
            <Input
              id="recipients"
              type="number"
              value={formData.total_recipients}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  total_recipients: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <Label htmlFor="message">Message Template</Label>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateAi}
              disabled={generatingAi}
              className="h-7 text-xs"
            >
              <Sparkles className="size-3 mr-1.5 text-purple-600" />
              {generatingAi ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
          <Textarea
            id="message"
            value={formData.message_template}
            onChange={(e) => setFormData((f) => ({ ...f, message_template: e.target.value }))}
            placeholder="Hi {name}, we have a special offer..."
            className="flex-1 resize-none min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use {"{name}"} for customer's first name, {"{full_name}"} for full name.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={loading} onClick={handleSubmit}>
          {loading ? "Saving..." : "Save Campaign"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
