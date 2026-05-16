import axiosServices from "utils/axios";

export interface FlowComponent {
  type: string;
  [key: string]: any;
}

export interface FlowScreen {
  id: string;
  title: string;
  terminal: boolean;
  data: Record<string, any>;
  children: FlowComponent[];
}

export interface WhatsappFlow {
  _id: string;
  account_id: string;
  channel_id?: string;
  name: string;
  type: "static" | "dynamic";
  status: "draft" | "published";
  meta_flow_id?: string;
  screens: FlowScreen[];
  endpoint_responses: Record<string, any>;
  categories: string[];
  use_custom_code?: boolean;
  custom_handler_code?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishResult {
  success: boolean;
  meta_flow_id: string;
  message: string;
  endpoint_url?: string;
}

class FlowBuilderService {
  async list(): Promise<{ success: boolean; data: WhatsappFlow[] }> {
    const res = await axiosServices.get("flow-builder");
    return res.data;
  }

  async get(id: string): Promise<{ success: boolean; data: WhatsappFlow }> {
    const res = await axiosServices.get(`flow-builder/${id}`);
    return res.data;
  }

  async create(
    payload: Pick<WhatsappFlow, "name" | "type"> & { channel_id?: string }
  ): Promise<{ success: boolean; data: WhatsappFlow }> {
    const res = await axiosServices.post("flow-builder", payload);
    return res.data;
  }

  async update(
    id: string,
    payload: Partial<WhatsappFlow>
  ): Promise<{ success: boolean; data: WhatsappFlow }> {
    const res = await axiosServices.put(`flow-builder/${id}`, payload);
    return res.data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const res = await axiosServices.delete(`flow-builder/${id}`);
    return res.data;
  }

  async getFlowJSON(id: string): Promise<{ success: boolean; flow_json: any }> {
    const res = await axiosServices.get(`flow-builder/${id}/json`);
    return res.data;
  }

  async publish(id: string): Promise<PublishResult> {
    const res = await axiosServices.post(`flow-builder/${id}/publish`);
    return res.data;
  }

  async syncFromMeta(channelId: string): Promise<{
    success: boolean;
    message: string;
    created: number;
    updated: number;
    total: number;
  }> {
    const res = await axiosServices.post("flow-builder/sync-from-meta", { channel_id: channelId });
    return res.data;
  }

  async getPreviewUrl(id: string): Promise<{ success: boolean; preview_url: string; expires_at: string }> {
    const res = await axiosServices.get(`flow-builder/${id}/preview-url`);
    return res.data;
  }
}

export const flowBuilderService = new FlowBuilderService();
