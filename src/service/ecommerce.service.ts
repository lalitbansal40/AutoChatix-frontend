import axiosServices from "utils/axios";

class ECommerceService {
  async getOrders(params?: { channel_id?: string; cursor?: string; limit?: number }) {
    const res = await axiosServices.get("/message/orders", { params });
    return res.data;
  }

  async getCatalogs(channelId: string) {
    const res = await axiosServices.get(`/catalog/${channelId}`);
    return res.data;
  }

  async createCatalog(channelId: string, name: string, businessId?: string) {
    const res = await axiosServices.post(`/catalog/${channelId}/create`, { name, business_id: businessId });
    return res.data;
  }

  async linkCatalog(channelId: string, catalogId: string) {
    const res = await axiosServices.post(`/catalog/${channelId}/link`, { catalog_id: catalogId });
    return res.data;
  }

  async unlinkCatalog(channelId: string, catalogId: string) {
    const res = await axiosServices.delete(`/catalog/${channelId}/unlink`, { data: { catalog_id: catalogId } });
    return res.data;
  }

  async getProducts(channelId: string, catalogId: string, params?: { limit?: number; after?: string }) {
    const res = await axiosServices.get(`/catalog/${channelId}/products/${catalogId}`, { params });
    return res.data;
  }

  async syncProducts(channelId: string, catalogId: string) {
    const res = await axiosServices.post(`/catalog/${channelId}/products/${catalogId}/sync`);
    return res.data;
  }

  async addProduct(channelId: string, catalogId: string, data: Record<string, any>) {
    const res = await axiosServices.post(`/catalog/${channelId}/products/${catalogId}`, data);
    return res.data;
  }

  async updateProduct(channelId: string, catalogId: string, productId: string, data: Record<string, any>) {
    const res = await axiosServices.patch(`/catalog/${channelId}/products/${catalogId}/${productId}`, data);
    return res.data;
  }

  async deleteProduct(channelId: string, catalogId: string, productId: string) {
    const res = await axiosServices.delete(`/catalog/${channelId}/products/${catalogId}/${productId}`);
    return res.data;
  }

  async uploadProductImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await axiosServices.post("/catalog/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
}

export const ecommerceService = new ECommerceService();
