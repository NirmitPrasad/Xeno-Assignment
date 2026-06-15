import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCustomers, getCustomer } from "@/lib/queries.functions";

export function useCustomers(search?: string, sort?: string) {
  const fn = useServerFn(listCustomers);
  const [sortBy, sortOrder] = sort ? sort.split("-") : ["total_spent", "desc"];

  return useQuery({
    queryKey: ["customers", search, sort],
    queryFn: () =>
      fn({
        data: {
          search: search || undefined,
          limit: 100,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any,
        },
      }),
  });
}

export function useCustomerDetail(id: string) {
  const fn = useServerFn(getCustomer);
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => fn({ data: { id } }),
  });
}
