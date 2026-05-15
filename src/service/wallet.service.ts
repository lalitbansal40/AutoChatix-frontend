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

  async topup(amount: number): Promise<{ payment_url: string; amount: number }> {
    const response = await axiosServices.post('/wallet/topup', { amount });
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
