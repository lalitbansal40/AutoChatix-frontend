import axiosServices from "utils/axios";

// 🔥 Types
export interface CreateTemplatePayload {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: any[];
}

class TemplateService {
  //   Get all templates
  async getTemplates(
    channelId: string,
    params?: {
      category?: string;
      status?: string;
      search?: string;
      limit?: number;
      after?: string;
      before?: string;
      page?: number; // 🔥 ADD THIS
    },
  ) {
    const response = await axiosServices.get(`/templates/${channelId}`, {
      params,
    });

    return response.data;
  }

  //   Get single template
  async getTemplateById(channelId: string, templateId: string) {
    const response = await axiosServices.get(
      `/templates/${channelId}/${templateId}`,
    );
    return response.data;
  }

  //   Create template (dynamic)
  async createTemplate(channelId: string, payload: CreateTemplatePayload) {
    const response = await axiosServices.post(
      `/templates/${channelId}`,
      payload,
    );
    return response.data;
  }

  //   Update template (recreate)
  async updateTemplate(
    channelId: string,
    templateId: string,
    payload: CreateTemplatePayload,
  ) {
    const response = await axiosServices.put(
      `/templates/${channelId}/${templateId}`,
      payload,
    );
    return response.data;
  }

  //   Delete template
  async deleteTemplate(channelId: string, templateName: string) {
    const response = await axiosServices.delete(
      `/templates/${channelId}/${templateName}`,
    );
    return response.data;
  }

  async sendTemplate(
    channelId: string,
    payload: {
      templateName: string;
      to: string;
      bodyParams: string[];
    },
  ) {
    const response = await axiosServices.post(
      `/templates/send-template/${channelId}`,
      payload,
    );
    return response.data;
  }

  async sendBulkTemplate(channelId: string, data: FormData) {
    console.log("SENDING BULK TEMPLATE WITH DATA", data); // 🔥 debug
    const response = await axiosServices.post(
      `/templates/send-bulk/${channelId}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  }

  async syncTemplates(channelId: string) {
    const response = await axiosServices.post(`/templates/sync/${channelId}`);
    return response.data;
  }
}

export const templateService = new TemplateService();
