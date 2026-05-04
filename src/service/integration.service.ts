import axiosServices from "utils/axios";
import {
  IntegrationDefinition,
  IntegrationT,
  BuiltinTriggerDef,
} from "types/integration";

class IntegrationService {
  async getRegistry(): Promise<IntegrationDefinition[]> {
    const response = await axiosServices.get("integrations/registry");
    return response.data.registry;
  }

  /** Channel-aware catalog (catalog + builtinTriggers) */
  async getCatalog(channelId?: string): Promise<{
    catalog: IntegrationDefinition[];
    builtinTriggers: BuiltinTriggerDef[];
  }> {
    const params = channelId ? { channel_id: channelId } : {};
    const response = await axiosServices.get("integrations/catalog", { params });
    return {
      catalog: response.data.catalog || [],
      builtinTriggers: response.data.builtinTriggers || [],
    };
  }

  async getBuiltinTriggers(): Promise<BuiltinTriggerDef[]> {
    const response = await axiosServices.get("integrations/triggers/builtin");
    return response.data.triggers || [];
  }

  async getIntegrations(channelId?: string): Promise<IntegrationT[]> {
    const params = channelId ? { channel_id: channelId } : {};
    const response = await axiosServices.get("integrations", { params });
    return response.data.integrations ?? [];
  }

  async connectIntegration(payload: { slug: string; channel_id: string; [key: string]: any }) {
    const response = await axiosServices.post("integrations", payload);
    return response.data;
  }

  async updateIntegration(
    slug: string,
    channelId: string,
    data: { config?: Record<string, any>; secrets?: Record<string, any> }
  ) {
    const response = await axiosServices.put(`integrations/${slug}`, {
      channel_id: channelId,
      ...data,
    });
    return response.data;
  }

  async disconnectIntegration(slug: string, channelId: string) {
    const response = await axiosServices.delete(`integrations/${slug}`, {
      params: { channel_id: channelId },
    });
    return response.data;
  }

  async toggleIntegration(slug: string, channelId: string) {
    const response = await axiosServices.patch(`integrations/${slug}/toggle`, {
      channel_id: channelId,
    });
    return response.data;
  }
}

export const integrationService = new IntegrationService();
