import axiosServices from 'utils/axios';

class WalletService {
  async getWallet() {
    const response = await axiosServices.get('/wallet');
    return response.data.data;
  }

  async getLedger(params?: { cursor?: string; type?: string; status?: string; limit?: number }) {
    const response = await axiosServices.get('/wallet/ledger', { params });
    return response.data.data;
  }

  async topup(amount: number): Promise<{
    payment_url: string;
    base_amount: number;
    tax_amount: number;
    tax_rate: number;
    tax_label: string;
    total_amount: number;
  }> {
    const response = await axiosServices.post('/wallet/topup', { amount });
    return response.data;
  }

  async getTopupPreview(amount: number): Promise<{
    base_amount: number;
    tax_amount: number;
    tax_rate: number;
    tax_label: string;
    total_amount: number;
  }> {
    const response = await axiosServices.get('/wallet/topup-preview', { params: { amount } });
    return response.data;
  }

  async getMySubscription() {
    const response = await axiosServices.get('/auth/my-subscription');
    return response.data;
  }

  async createRenewalLink(plan_name: string): Promise<{ payment_url: string }> {
    const response = await axiosServices.post('/auth/renewal-payment-link', { plan_name });
    return response.data;
  }
}

export const walletService = new WalletService();
