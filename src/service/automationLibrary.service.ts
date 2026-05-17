import axios from "utils/axios";

export interface LibraryItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  preview_message?: string;
  trigger: string;
  trigger_config?: any;
  keywords: string[];
  is_active: boolean;
  import_count: number;
  createdAt: string;
  updatedAt: string;
  // nodes/edges only present when fetching single item or import
  nodes?: any[];
  edges?: any[];
}

export interface LibraryImportData {
  title: string;
  trigger: string;
  trigger_config?: any;
  keywords: string[];
  nodes: any[];
  edges: any[];
}

export interface CreateLibraryPayload {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  preview_message?: string;
  trigger: string;
  trigger_config?: any;
  keywords?: string[];
  nodes: any[];
  edges: any[];
  is_active?: boolean;
}

const BASE = "/automation-library";

const automationLibraryService = {
  /** List all library items (metadata only, no nodes/edges) */
  list(params?: { category?: string; search?: string; active_only?: boolean }): Promise<{ data: { success: boolean; data: LibraryItem[] } }> {
    return axios.get(BASE, { params });
  },

  /** Get full library item including nodes/edges */
  getById(id: string): Promise<{ data: { success: boolean; data: LibraryItem } }> {
    return axios.get(`${BASE}/${id}`);
  },

  /**
   * Get library item with ALL IDs remapped (safe to import).
   * Backend remaps on server side — no ID collisions possible.
   */
  getForImport(id: string): Promise<{ data: { success: boolean; data: LibraryImportData } }> {
    return axios.post(`${BASE}/${id}/import`);
  },

  /** Create library item (SuperAdmin only) */
  create(payload: CreateLibraryPayload): Promise<{ data: { success: boolean; data: LibraryItem } }> {
    return axios.post(BASE, payload);
  },

  /** Update library item (SuperAdmin only) */
  update(id: string, payload: Partial<CreateLibraryPayload>): Promise<{ data: { success: boolean; data: LibraryItem } }> {
    return axios.put(`${BASE}/${id}`, payload);
  },

  /** Delete library item (SuperAdmin only) */
  delete(id: string): Promise<{ data: { success: boolean; message: string } }> {
    return axios.delete(`${BASE}/${id}`);
  },

  /** Toggle active/inactive (SuperAdmin only) */
  toggle(id: string): Promise<{ data: { success: boolean; data: LibraryItem } }> {
    return axios.put(`${BASE}/${id}/toggle`);
  },
};

export default automationLibraryService;
