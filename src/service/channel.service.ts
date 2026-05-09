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
}

export const channelService = new ChannelService();
