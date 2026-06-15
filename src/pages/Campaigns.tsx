import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
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
import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { CampaignEditDrawer } from "@/components/campaigns/CampaignEditDrawer";

export default function CampaignsPage() {
  const {
    campaigns,
    isLoading,
    refetch,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateCampaignStatus,
  } = useCampaigns();

  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);

  const handleSaveCampaign = async (formData: any) => {
    try {
      let calculatedStatus = "failed";
      if (!formData.startDate && !formData.endDate) {
        calculatedStatus = "draft";
      } else if (formData.startDate) {
        const today = new Date().toISOString().split("T")[0];
        if (formData.startDate > today) {
          calculatedStatus = "scheduled";
        } else if (formData.startDate === today) {
          calculatedStatus = "active";
        }
      }

      if (editingCampaign) {
        await updateCampaign({ ...formData, id: editingCampaign.id, status: calculatedStatus });
        toast.success("Campaign updated successfully");
      } else {
        await createCampaign({ ...formData, status: calculatedStatus });
        toast.success("Campaign added successfully");
      }
      setOpen(false);
      setEditingCampaign(null);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (deletingId) {
      try {
        await deleteCampaign(deletingId);
        toast.success("Campaign deleted");
        refetch();
      } catch (e: any) {
        toast.error(e.message);
      }
    }
    setDeletingId(null);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateCampaignStatus(id, status);
      toast.success("Campaign status updated");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Marketing Drops</h1>
          <p className="text-sm text-muted-foreground">
            All campaigns created by your AI assistant
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary text-foreground">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 w-4 h-4 bg-background"
            />
            Show archived
          </label>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditingCampaign(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCampaign(null);
                  setOpen(true);
                }}
              >
                + New campaign
              </Button>
            </DialogTrigger>
            <CampaignEditDrawer
              editingId={editingCampaign ? editingCampaign.id : null}
              campaignToEdit={editingCampaign}
              onSave={handleSaveCampaign}
              onCancel={() => setOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <CampaignTable
        campaigns={campaigns}
        showArchived={showArchived}
        onEdit={handleEditCampaign}
        onDelete={setDeletingId}
        onUpdateStatus={handleUpdateStatus}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign and remove all its messages from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCampaign}
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
