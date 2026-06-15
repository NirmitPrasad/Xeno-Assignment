import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCampaigns, getCampaign } from "@/lib/queries.functions";
import {
  createManualCampaign,
  updateManualCampaign,
  deleteCampaign,
  updateCampaignStatus,
  getCampaignRoi,
} from "@/lib/crm.functions";

export function useCampaigns() {
  const qc = useQueryClient();
  const listCampaignsFn = useServerFn(listCampaigns);
  const createCampaignFn = useServerFn(createManualCampaign);
  const updateCampaignFn = useServerFn(updateManualCampaign);
  const deleteCampaignFn = useServerFn(deleteCampaign);
  const updateStatusFn = useServerFn(updateCampaignStatus);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => listCampaignsFn(),
    refetchInterval: 5000,
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    refetch: campaignsQuery.refetch,
    createCampaign: async (data: any) => {
      const res = await createCampaignFn({ data });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      return res;
    },
    updateCampaign: async (data: any) => {
      const res = await updateCampaignFn({ data });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign", data.id] });
      return res;
    },
    deleteCampaign: async (campaign_id: string) => {
      const res = await deleteCampaignFn({ data: { campaign_id } });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      return res;
    },
    updateCampaignStatus: async (campaign_id: string, status: string) => {
      const res = await updateStatusFn({ data: { campaign_id, status } });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign", campaign_id] });
      return res;
    },
  };
}

export function useCampaignDetail(id: string) {
  const getCampaignFn = useServerFn(getCampaign);
  const roiFn = useServerFn(getCampaignRoi);

  const campaignQuery = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaignFn({ data: { id } }),
    refetchInterval: 3000,
  });

  const roiQuery = useQuery({
    queryKey: ["campaign-roi", id],
    queryFn: () => roiFn({ data: { campaign_id: id } }),
    refetchInterval: 5000,
  });

  return {
    campaignData: campaignQuery.data,
    isLoading: campaignQuery.isLoading,
    refetch: campaignQuery.refetch,
    roi: roiQuery.data,
  };
}
