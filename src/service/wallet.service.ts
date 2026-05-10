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
}

export const walletService = new WalletService();
