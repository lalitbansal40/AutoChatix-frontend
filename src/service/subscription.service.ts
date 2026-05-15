import axios from 'utils/axios';

export interface PlanPrice {
  plan_name: string;
  display_name: string;
  base_price: number;
  tax_percent: number;
  tax_amount: number;
  total_price: number;
  duration_days: number;
}

export interface SubscriptionInfo {
  _id: string;
  account_id: string;
  plan_name: string;
  payment_status: 'pending' | 'paid' | 'expired' | 'cancelled';
  is_active: boolean;
  payment_start_date?: string;
  payment_end_date?: string;
  base_amount?: number;
  tax_amount?: number;
  amount_paid?: number;
  currency?: string;
}

/* Fetch active plan prices (no auth required) */
export const fetchPlanPrices = async (): Promise<PlanPrice[]> => {
  const { data } = await axios.get('/auth/plan-prices');
  return data.plans || [];
};

/* Get current user's subscription */
export const fetchMySubscription = async (): Promise<{ subscription: SubscriptionInfo | null; plan_config: any }> => {
  const { data } = await axios.get('/auth/my-subscription');
  return data;
};

/* Create renewal / upgrade payment link */
export const createRenewalLink = async (plan_name?: string): Promise<string> => {
  const { data } = await axios.post('/auth/renew-subscription', { plan_name });
  return data.payment_url;
};

/* Create wallet top-up payment link */
export const createWalletTopupLink = async (amount: number): Promise<string> => {
  const { data } = await axios.post('/wallet/topup', { amount });
  return data.payment_url;
};

export interface AddonStatus {
  plan_name: string;
  addon_channels: number;
  addon_users: number;
  effective_limits: { channels: number; users: number; automations: number };
  addon_prices: {
    channel: { base: number; tax_percent: number };
    user:    { base: number; tax_percent: number };
  };
}

/* Get current add-on status */
export const fetchAddonStatus = async (): Promise<AddonStatus> => {
  const { data } = await axios.get('/addon/status');
  return data;
};

/* Purchase channel add-on */
export const createChannelAddonLink = async (qty: number): Promise<string> => {
  const { data } = await axios.post('/addon/channel', { qty });
  return data.payment_url;
};

/* Purchase user add-on */
export const createUserAddonLink = async (qty: number): Promise<string> => {
  const { data } = await axios.post('/addon/user', { qty });
  return data.payment_url;
};
