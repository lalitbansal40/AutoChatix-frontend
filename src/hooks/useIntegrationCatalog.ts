import { useQuery } from "@tanstack/react-query";
import { integrationService } from "service/integration.service";

/**
 * Returns the per-channel integration catalog + builtin triggers.
 * Used by the AutomationBuilder palette and the trigger picker.
 */
export const useIntegrationCatalog = (channelId?: string) => {
  return useQuery({
    queryKey: ["integration-catalog", channelId || "_global"],
    queryFn: () => integrationService.getCatalog(channelId),
    staleTime: 60_000,
    enabled: true,
  });
};
