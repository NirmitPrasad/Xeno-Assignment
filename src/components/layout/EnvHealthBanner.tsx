import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { checkEnvHealth } from "@/lib/health.functions";

export function EnvHealthBanner() {
  const fn = useServerFn(checkEnvHealth);
  const { data } = useQuery({
    queryKey: ["env-health"],
    queryFn: () => fn(),
    staleTime: 60_000,
    retry: false,
  });

  if (!data || data.ok) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertTriangle className="size-4 mt-0.5 shrink-0" />
      <div className="space-y-1">
        <div className="font-semibold">Backend not fully configured</div>
        <div className="text-destructive/90">
          Missing server environment variable{data.missing.length > 1 ? "s" : ""}:{" "}
          <code className="font-mono">{data.missing.join(", ")}</code>. Connect Supabase in the
          environment configuration to enable database and admin features.
        </div>
      </div>
    </div>
  );
}
