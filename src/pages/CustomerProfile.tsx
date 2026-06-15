import React from "react";
import { useParams } from "@tanstack/react-router";
import { CustomerProfile } from "@/components/customers/CustomerProfile";

export default function CustomerProfilePage() {
  const { id } = useParams({ from: "/customers_/$id" });
  return <CustomerProfile id={id} />;
}
