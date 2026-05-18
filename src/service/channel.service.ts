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

  async getOnboardingLink() {
    const response = await axiosServices.get(`channel/onboarding-link`);
    return response.data;
  }

  async oauthCallback(payload: {
    code: string;
    state: string;
    waba_id?: string;
    phone_number_id?: string;
    display_phone_number?: string;
  }) {
    const response = await axiosServices.post(`channel/oauth-callback`, payload);
    return response.data;
  }

  async updateChannelName(channelId: string, channel_name: string) {
    const response = await axiosServices.patch(`channel/${channelId}`, { channel_name });
    return response.data;
  }

  async syncHistory(channelId: string) {
    const response = await axiosServices.post(`channel/${channelId}/sync-history`);
    return response.data;
  }

  async getAllChannels(accountId?: string) {
    const params = accountId ? { account_id: accountId } : {};
    const response = await axiosServices.get(`superadmin/channels`, { params });
    return response.data;
  }
}

export const channelService = new ChannelService();
