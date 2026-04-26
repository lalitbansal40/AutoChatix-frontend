import axiosServices from "utils/axios";

/* =========================
   TYPES
========================= */

export interface GetAutomationsParams {
  channel_id?: string;
}

export interface NodeData {
  id: string;
  type: string;
  message?: string;
  buttons?: { id: string; title: string }[];
  media?: {
    type: "image" | "video" | "document";
    url: string;
  };
  [key: string]: any;
}

export interface EdgeData {
  from: string;
  to: string;
  condition?: string;
}

export interface AutomationPayload {
  name: string;
  trigger: string;
  nodes?: NodeData[];
  edges?: EdgeData[]; // ✅ IMPORTANT ADD
  channel_id?: string;
  channel_name?: string;
  status?: "active" | "paused";
}

/* =========================
   SERVICE
========================= */

class AutomationService {
  /* =========================
     GET ALL
  ========================= */
  async getAutomations(params?: GetAutomationsParams) {
    try {
      const response = await axiosServices.get("/automations", {
        params,
      });

      return response.data.data; // ✅ FIXED
    } catch (error) {
      console.error("❌ getAutomations error:", error);
      throw error;
    }
  }

  /* =========================
     GET ONE
  ========================= */
  async getAutomationById(id: string) {
    try {
      const response = await axiosServices.get(`/automations/${id}`);

      return response.data.data; // ✅ FIXED
    } catch (error) {
      console.error("❌ getAutomationById error:", error);
      throw error;
    }
  }

  /* =========================
     CREATE
  ========================= */
  async createAutomation(data: AutomationPayload) {
    try {
      const response = await axiosServices.post("/automations", data);

      return response.data.data;
    } catch (error) {
      console.error("❌ createAutomation error:", error);
      throw error;
    }
  }

  /* =========================
     UPDATE
  ========================= */
  async updateAutomation(id: string, data: Partial<AutomationPayload>) {
    try {
      const response = await axiosServices.put(
        `/automations/${id}`,
        data
      );

      return response.data.data;
    } catch (error) {
      console.error("❌ updateAutomation error:", error);
      throw error;
    }
  }

  /* =========================
     TOGGLE
  ========================= */
  async toggleAutomation(id: string) {
    try {
      const response = await axiosServices.patch(
        `/automations/${id}/toggle`
      );

      return response.data.data;
    } catch (error) {
      console.error("❌ toggleAutomation error:", error);
      throw error;
    }
  }

  /* =========================
     DELETE
  ========================= */
  async deleteAutomation(id: string) {
    try {
      const response = await axiosServices.delete(
        `/automations/${id}`
      );

      return response.data.data;
    } catch (error) {
      console.error("❌ deleteAutomation error:", error);
      throw error;
    }
  }
}

const automationService = new AutomationService();
export default automationService;