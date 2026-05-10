import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { walletService } from 'service/wallet.service';
import useAuth from 'hooks/useAuth';

const formatMoney = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(Number(amount || 0) / 1000000);

const describeCharge = (row: any) => {
  if (row.type === 'AI_CONVERSATION') return `AI reply (${row.ai_model || 'model'})`;
  return `Template ${row.template_name || ''}`.trim();
};

const Wallet = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-ledger', type, status],
    queryFn: () => walletService.getLedger({ type, status, limit: 100 })
  });

  const totals = useMemo(() => data?.totals || [], [data]);
  const rows = data?.ledger || [];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress sx={{ color: '#25D366' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111827', mb: 0.5 }}>
            Wallet Usage
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: '#6b7280' }}>
            Every AI and template deduction, grouped by wallet currency.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Select size="small" value={type} onChange={(e) => setType(e.target.value)}>
            <MenuItem value="ALL">All types</MenuItem>
            <MenuItem value="AI_CONVERSATION">AI</MenuItem>
            <MenuItem value="TEMPLATE_MESSAGE">Templates</MenuItem>
          </Select>
          <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="ALL">All status</MenuItem>
            <MenuItem value="CAPTURED">Captured</MenuItem>
            <MenuItem value="HELD">Held</MenuItem>
            <MenuItem value="RELEASED">Released</MenuItem>
          </Select>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
        {totals.map((total: any) => (
          <Paper key={total._id} variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 220 }}>
            <Typography fontSize={12} color="text.secondary">{total._id}</Typography>
            <Typography fontSize={20} fontWeight={800}>{formatMoney(total.charged_amount, total._id)}</Typography>
            {isSuperAdmin && (
              <Typography fontSize={12} color="text.secondary">
                Cost {formatMoney(total.provider_cost, total._id)} · Profit {formatMoney(total.platform_profit, total._id)}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Deducted</TableCell>
              {isSuperAdmin && <TableCell align="right">My Cost</TableCell>}
              {isSuperAdmin && <TableCell align="right">Taken</TableCell>}
              {isSuperAdmin && <TableCell align="right">Profit</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: any) => {
              const currency = row.currency || 'INR';
              const providerCost = Number(row.ai_amount || 0) + Number(row.template_amount || 0);
              const contact = row.contact_id;
              return (
                <TableRow key={row._id} hover>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography fontSize={13} fontWeight={600}>{describeCharge(row)}</Typography>
                    {row.input_tokens || row.output_tokens ? (
                      <Typography fontSize={11.5} color="text.secondary">
                        {row.input_tokens || 0} in / {row.output_tokens || 0} out tokens
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{contact?.name || contact?.phone || '-'}</TableCell>
                  <TableCell><Chip size="small" label={row.status} /></TableCell>
                  <TableCell align="right">{formatMoney(row.amount, currency)}</TableCell>
                  {isSuperAdmin && <TableCell align="right">{formatMoney(providerCost, currency)}</TableCell>}
                  {isSuperAdmin && <TableCell align="right">{formatMoney(row.amount, currency)}</TableCell>}
                  {isSuperAdmin && <TableCell align="right">{formatMoney(row.commission_amount, currency)}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Wallet;
