import { Chip, Tooltip } from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { useQuery } from '@tanstack/react-query';
import { walletService } from 'service/wallet.service';

const formatMoney = (amount: number, currency = 'INR') => {
  const value = Number(amount || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const WalletBalanceBadge = () => {
  const { data } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.getWallet(),
    staleTime: 30_000,
  });

  const wallet = data?.wallet;
  const available = Number(data?.available_balance || 0);
  const remainingCredit = Number(data?.remaining_credit || 0);
  const hold = Number(wallet?.hold_balance || 0);
  const currency = wallet?.currency || 'INR';

  return (
    <Tooltip title={`Balance: ${formatMoney(available, currency)} | Hold: ${formatMoney(hold, currency)} | Remaining credit: ${formatMoney(remainingCredit, currency)}`}>
      <Chip
        icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: '16px !important' }} />}
        label={formatMoney(available, currency)}
        size="small"
        sx={{
          height: 28,
          borderRadius: '8px',
          bgcolor: available < 0 ? '#fef2f2' : '#f0fdf4',
          color: available < 0 ? '#dc2626' : '#15803d',
          fontWeight: 700,
          '& .MuiChip-icon': { color: 'inherit' },
        }}
      />
    </Tooltip>
  );
};

export default WalletBalanceBadge;
