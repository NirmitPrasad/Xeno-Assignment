import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalytics } from "@/lib/queries.functions";

export function useAnalytics(dateRange: "7d" | "30d" | "90d" | "all") {
  const fn = useServerFn(getAnalytics);
  return useQuery({
    queryKey: ["analytics", dateRange],
    queryFn: () => fn({ data: { dateRange } }),
  });
}
