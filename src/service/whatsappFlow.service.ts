import axiosServices from "utils/axios";

export interface FlowApp {
  name: string;
  display_name: string;
  webhook_url: string;
  status: "active" | "inactive";
}

class WhatsappFlowService {
  async getFlowApps(): Promise<{ success: boolean; data: FlowApp[] }> {
    const res = await axiosServices.get("whatsapp-flow/apps");
    return res.data;
  }
}

export const whatsappFlowService = new WhatsappFlowService();
