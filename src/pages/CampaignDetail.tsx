import React from "react";
import { useParams } from "@tanstack/react-router";
import { CampaignDetail } from "@/components/campaigns/CampaignDetail";

export default function CampaignDetailPage() {
  const { id } = useParams({ from: "/campaigns_/$id" });
  return <CampaignDetail id={id} />;
}
