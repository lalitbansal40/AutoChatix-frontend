import axiosServices from "utils/axios";

class LeadsService {
  async getLeads(params?: {
    channel_id?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  }) {
    const response = await axiosServices.get("leads", { params });
    return response.data as { leads: Lead[]; total: number; cursor: string | null };
  }

  async getChannels() {
    const response = await axiosServices.get("leads/channels");
    return response.data as LeadChannel[];
  }
}

export interface LeadChannel {
  _id: string;
  name: string;
  phone: string;
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  channel: LeadChannel | null;
  data: Record<string, string>;
  updatedAt: string;
  createdAt: string;
}

export const leadsService = new LeadsService();
