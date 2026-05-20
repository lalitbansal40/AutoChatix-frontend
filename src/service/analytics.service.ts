import axiosServices from "utils/axios";

export interface AnalyticsOverview {
  new_contacts: number;
  contacts_messaged: number;
  contacts_replied: number;
  messages_out: number;
  messages_in: number;
  session_messages: number;
  template_total: number;
  reply_rate: number;
  actual_cost: number;
  template_cost: number;
  commission_cost: number;
  charged_count: number;
  engagement_rate: number;
  template_read_rate: number;
  template_fail_rate: number;
  avg_msgs_per_contact: number;
}

export interface TemplateStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface CategoryStat {
  _id: string;
  total: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface LedgerCategoryStat {
  _id: string;
  count: number;
  amount: number;
}

export interface TopTemplate {
  _id: string;
  total: number;
  delivered: number;
  read: number;
  failed: number;
  replies: number;
  category: string;
}

export interface TrendPoint {
  date: string;
  out: number;
  in: number;
}

export interface ChannelOption {
  _id: string;
  name: string;
  phone_number: string;
}

export interface ContactGrowthPoint {
  date: string;
  count: number;
}

export interface DashboardData {
  overview: AnalyticsOverview;
  template_stats: TemplateStats;
  by_category: CategoryStat[];
  top_templates: TopTemplate[];
  trend: TrendPoint[];
  contact_growth: ContactGrowthPoint[];
  channels: ChannelOption[];
  ledger_by_category: LedgerCategoryStat[];
}

export const analyticsService = {
  getDashboard: async (params: {
    channel_id?: string;
    from?: string;
    to?: string;
  }): Promise<DashboardData> => {
    const res = await axiosServices.get("analytics/dashboard", { params });
    return res.data;
  },
};
