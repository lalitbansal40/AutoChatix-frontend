import axiosServices from "utils/axios";

class IntegrationService {
  async getIntegrations() {
    const response = await axiosServices.get(`integrations`);
    return response.data;
  }

  async connectIntegration(type: string, config: Record<string, any>) {
    const response = await axiosServices.post(`integrations`, { type, config });
    return response.data;
  }

  async disconnectIntegration(id: string) {
    const response = await axiosServices.delete(`integrations/${id}`);
    return response.data;
  }

  async updateIntegration(id: string, data: Partial<{ is_active: boolean; config: Record<string, any> }>) {
    const response = await axiosServices.patch(`integrations/${id}`, data);
    return response.data;
  }
}

export const integrationService = new IntegrationService();
