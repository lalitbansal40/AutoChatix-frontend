import axiosServices from "utils/axios";

class MediaService {
  /* =========================
     UPLOAD MEDIA (S3)
  ========================= */
  async uploadMedia(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosServices.post(
        "/media/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ✅ backend returns { success, url }
      return response.data.url;
    } catch (error) {
      console.error("❌ uploadMedia error:", error);
      throw error;
    }
  }
}

const mediaService = new MediaService();
export default mediaService;