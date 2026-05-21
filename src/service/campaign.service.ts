import axiosServices from "utils/axios";

export interface CampaignFilter {
  type: "selected_ids" | "channel" | "all_channels" | "phone_list";
  ids?: string[];
  channel_ids?: string[];
  phones?: string[];
}

export interface CampaignStatus {
  _id: string;
  status: "queued" | "running" | "completed" | "stopped" | "failed";
  template_name: string;
  total: number;
  sent: number;
  failed: number;
  started_at?: string;
  completed_at?: string;
  stopped_at?: string;
  channel_id: string;
}

class CampaignService {
  async create(
    channelId: string,
    payload: {
      templateName: string;
      bodyParams: string[];
      language?: string;
      filter: CampaignFilter;
      headerImageUrl?: string;
    }
  ): Promise<{ campaignId: string }> {
    const res = await axiosServices.post(`campaigns/${channelId}`, payload);
    return res.data;
  }

  async get(campaignId: string): Promise<CampaignStatus> {
    const res = await axiosServices.get(`campaigns/${campaignId}`);
    return res.data.campaign;
  }

  async stop(campaignId: string): Promise<void> {
    await axiosServices.delete(`campaigns/${campaignId}`);
  }

  async list(): Promise<CampaignStatus[]> {
    const res = await axiosServices.get("campaigns");
    return res.data.campaigns || [];
  }

  async getContactCount(channelId: string): Promise<number> {
    const res = await axiosServices.get(`contact/count/${channelId}`);
    return res.data.count ?? 0;
  }
}

export const campaignService = new CampaignService();
