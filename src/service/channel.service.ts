import axiosServices from "utils/axios";

class ChannelService {
  async getChannels() {
    const response = await axiosServices.get(`channel`);
    return response.data;
  }

  async connectViaEmbeddedSignup(payload: {
    code: string;
    waba_id?: string;
    phone_number_id?: string;
    display_phone_number?: string;
  }) {
    const response = await axiosServices.post(`channel/embedded-signup`, payload);
    return response.data;
  }

  async generateFlowKeyPair(channelId: string) {
    const response = await axiosServices.post(`channel/${channelId}/generate-flow-key`);
    return response.data;
  }

  async publishFlowKeyToMeta(channelId: string) {
    const response = await axiosServices.post(`channel/${channelId}/publish-flow-key`);
    return response.data;
  }

  async getFlowKeyStatus(channelId: string) {
    const response = await axiosServices.get(`channel/${channelId}/flow-public-key`);
    return response.data;
  }
}

export const channelService = new ChannelService();
