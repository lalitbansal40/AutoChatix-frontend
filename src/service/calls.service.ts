import axiosServices from "utils/axios";

class CallsService {
  async initiateCall(channelId: string, to: string, type: "audio" | "video" = "audio") {
    const res = await axiosServices.post("/calls/initiate", { channel_id: channelId, to, type });
    return res.data;
  }
}

export const callsService = new CallsService();
