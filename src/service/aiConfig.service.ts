import axiosServices from "utils/axios";

export type AiToolType = "file_search" | "web_search_preview" | "code_interpreter" | "image_generation";
export type AiModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4.1" | "gpt-4.1-mini" | "gpt-4.1-nano";

export interface AiFile {
  openai_file_id: string;
  name: string;
  size: number;
  uploaded_at: string;
}

export interface AiFunction {
  name: string;
  description: string;
  parameters: string; // JSON schema string
}

export interface AiConfig {
  _id: string;
  account_id: string;
  name: string;
  description?: string;
  model: AiModel;
  system_message: string;
  tools: AiToolType[];
  functions: AiFunction[];
  vector_store_id?: string;
  files: AiFile[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiConfigPayload {
  name: string;
  description?: string;
  model: AiModel;
  system_message: string;
  tools: AiToolType[];
  functions: AiFunction[];
}

class AiConfigService {
  async list(): Promise<AiConfig[]> {
    const res = await axiosServices.get("ai-configs");
    return res.data.configs;
  }

  async get(id: string): Promise<AiConfig> {
    const res = await axiosServices.get(`ai-configs/${id}`);
    return res.data.config;
  }

  async create(payload: CreateAiConfigPayload): Promise<AiConfig> {
    const res = await axiosServices.post("ai-configs", payload);
    return res.data.config;
  }

  async update(id: string, payload: Partial<CreateAiConfigPayload> & { is_active?: boolean }): Promise<AiConfig> {
    const res = await axiosServices.put(`ai-configs/${id}`, payload);
    return res.data.config;
  }

  async remove(id: string): Promise<void> {
    await axiosServices.delete(`ai-configs/${id}`);
  }

  async uploadFile(id: string, file: File): Promise<AiConfig> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosServices.post(`ai-configs/${id}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.config;
  }

  async deleteFile(id: string, fileId: string): Promise<AiConfig> {
    const res = await axiosServices.delete(`ai-configs/${id}/files/${fileId}`);
    return res.data.config;
  }
}

export const aiConfigService = new AiConfigService();
