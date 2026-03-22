import axiosServices from "utils/axios";

// 🔥 Types
export interface CreateTemplatePayload {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: any[];
}

class TemplateService {
  // ✅ Get all templates
  async getTemplates(channelId: string) {
    const response = await axiosServices.get(`/templates/${channelId}`);
    return response.data;
  }

  // ✅ Get single template
  async getTemplateById(channelId: string, templateId: string) {
    const response = await axiosServices.get(
      `/templates/${channelId}/${templateId}`
    );
    return response.data;
  }

  // ✅ Create template (dynamic)
  async createTemplate(
    channelId: string,
    payload: CreateTemplatePayload
  ) {
    const response = await axiosServices.post(
      `/templates/${channelId}`,
      payload
    );
    return response.data;
  }

  // ✅ Update template (recreate)
  async updateTemplate(
    channelId: string,
    templateId: string,
    payload: CreateTemplatePayload
  ) {
    const response = await axiosServices.put(
      `/templates/${channelId}/${templateId}`,
      payload
    );
    return response.data;
  }

  // ✅ Delete template
  async deleteTemplate(channelId: string, templateId: string) {
    const response = await axiosServices.delete(
      `/templates/${channelId}/${templateId}`
    );
    return response.data;
  }
}

export const templateService = new TemplateService();