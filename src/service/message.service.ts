import axiosServices from "utils/axios";

class MessageService {
  async getMessages(contactId: string, cursor?: string) {
    const res = await axiosServices.get(`/message/${contactId}`, {
      params: { cursor },
    });

    return res.data;
  }
  async sendMessage(data: {
    channelId: string;
    contactId: string;
    text: string;
  }) {
    const res = await axiosServices.post("/message/send-text", data);
    return res.data;
  }

  async sendMedia(formData: FormData) {
    const res = await axiosServices.post("/message/send-media", formData);
    return res.data;
  }
}

export const messageService = new MessageService();
