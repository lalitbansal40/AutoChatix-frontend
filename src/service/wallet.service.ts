import axiosServices from 'utils/axios';

class WalletService {
  async getWallet() {
    const response = await axiosServices.get('/wallet');
    return response.data.data;
  }
}

export const walletService = new WalletService();
