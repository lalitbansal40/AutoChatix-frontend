import { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, MenuItem, Pagination, Paper,
  Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { walletService } from 'service/wallet.service';
import useAuth from 'hooks/useAuth';

const MONEY_SCALE = 1_000_000;
const PAGE_SIZE = 20;

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', GBP: '£', AED: 'AED ', SGD: 'S$', AUD: 'A$', EUR: '€',
};

const formatMoney = (amount: number, currency = 'INR') => {
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
  const val = Number(amount || 0) / MONEY_SCALE;
  return sym + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

interface TaxPreview {
  base_amount: number;
  tax_amount: number;
  tax_rate: number;
  tax_label: string;
  total_amount: number;
}

const TopupModal = ({ open, onClose, currency }: { open: boolean; onClose: () => void; currency: string }) => {
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taxPreview, setTaxPreview] = useState<TaxPreview | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const amt = Number(amount);
    if (!amt || amt < 100) { setTaxPreview(null); return; }
    debounceRef.current = setTimeout(async () => {
      setTaxLoading(true);
      try {
        const preview = await walletService.getTopupPreview(amt);
        setTaxPreview(preview);
      } catch {
        setTaxPreview(null);
      } finally {
        setTaxLoading(false);
      }
    }, 500);
  }, [amount]);

  useEffect(() => {
    if (!open) { setAmount(''); setTaxPreview(null); setError(''); }
  }, [open]);

  const handleTopup = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { setError(`Minimum top-up is ${sym}100`); return; }
    setLoading(true);
    setError('');
    try {
      const { payment_url } = await walletService.topup(amt);
      window.location.href = payment_url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create payment link');
      setLoading(false);
    }
  };

  const hasTax = taxPreview && taxPreview.tax_amount > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Money to Wallet</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose a preset amount or enter a custom amount. Payment via Razorpay.
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {PRESET_AMOUNTS.map((p) => (
            <Chip
              key={p}
              label={`${sym}${p}`}
              onClick={() => setAmount(p)}
              variant={amount === p ? 'filled' : 'outlined'}
              color={amount === p ? 'primary' : 'default'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
        <TextField
          fullWidth
          label="Wallet amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
          inputProps={{ min: 100 }}
          placeholder="Enter amount"
        />
        {taxLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
            <CircularProgress size={12} />
            <Typography variant="caption" color="text.secondary">Calculating tax...</Typography>
          </Box>
        )}
        {taxPreview && !taxLoading && (
          <Box sx={{ mt: 1.5, bgcolor: '#f9fafb', borderRadius: '8px', p: 1.5 }}>
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Wallet credit</Typography>
                <Typography variant="caption" fontWeight={600}>{sym}{taxPreview.base_amount.toLocaleString('en-IN')}</Typography>
              </Box>
              {hasTax && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">{taxPreview.tax_label}</Typography>
                  <Typography variant="caption" fontWeight={600} color="warning.main">+{sym}{taxPreview.tax_amount.toFixed(2)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" fontWeight={700}>Total charged</Typography>
                <Typography variant="caption" fontWeight={700} color="primary.main">{sym}{taxPreview.total_amount.toFixed(2)}</Typography>
              </Box>
            </Stack>
          </Box>
        )}
        {error && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleTopup} disabled={loading || !amount}>
          {loading ? <CircularProgress size={18} /> : `Pay ${taxPreview ? sym + taxPreview.total_amount.toFixed(2) : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const describeCharge = (row: any) => {
  if (row.type === 'TOPUP') return row.reason || 'Wallet Top-up';
  if (row.type === 'AI_CONVERSATION') return `AI reply (${row.ai_model || 'model'})`;
  return `Template ${row.template_name || ''}`.trim();
};

// Provider cost (Meta rate or AI raw cost) for a ledger row
const providerCost = (row: any) => Number(row.ai_amount || 0) + Number(row.template_amount || 0);

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  CAPTURED: 'success',
  HELD: 'warning',
  RELEASED: 'error',
};

const Wallet = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [topupOpen, setTopupOpen] = useState(false);

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.getWallet(),
  });

  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ['wallet-ledger', type, status, page],
    queryFn: () => walletService.getLedger({ type, status, limit: PAGE_SIZE, page }),
    staleTime: 0,
    gcTime: 0,
  });

  const rows: any[] = ledgerData?.ledger || [];
  const totals: any[] = ledgerData?.totals || [];
  const total: number = ledgerData?.total || 0;
  const totalPages: number = ledgerData?.totalPages || 1;

  const handleFilterChange = (setter: (v: string) => void) => (e: any) => {
    setter(e.target.value);
    setPage(1);
  };

  const wallet = walletData?.wallet;
  const availableBalance = walletData?.available_balance ?? 0;
  const currency = wallet?.currency || 'INR';

  const colCount = 7;

  return (
    <Box sx={{ px: 3, py: 3 }}>
      {/* ── Balance Card ── */}
      <Paper
        variant="outlined"
        sx={{
          p: 3, mb: 3, borderRadius: 3,
          background: 'linear-gradient(135deg, #1a1f4e 0%, #0d1232 100%)',
          border: '1px solid rgba(95,123,255,0.25)',
          color: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
          <Box>
            <Typography sx={{ fontSize: 13, opacity: 0.7, mb: 0.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Available Balance
            </Typography>
            {walletLoading ? (
              <CircularProgress size={28} sx={{ color: '#5f7bff' }} />
            ) : (
              <Typography sx={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {formatMoney(availableBalance, currency)}
              </Typography>
            )}
            <Typography sx={{ fontSize: 12, opacity: 0.55, mt: 0.5 }}>
              Currency: {currency} · Used for templates &amp; AI conversations
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => setTopupOpen(true)}
            sx={{
              bgcolor: '#5f7bff', '&:hover': { bgcolor: '#4a63e0' },
              fontWeight: 700, px: 3, borderRadius: 2, flexShrink: 0,
            }}
          >
            + Add Money
          </Button>
        </Stack>

        {!walletLoading && (
          <Stack direction="row" gap={3} sx={{ mt: 2.5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Box>
              <Typography sx={{ fontSize: 11, opacity: 0.55 }}>On Hold</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{formatMoney(wallet?.hold_balance || 0, currency)}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, opacity: 0.55 }}>Credit Limit</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{formatMoney(wallet?.credit_limit || 0, currency)}</Typography>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* ── Totals summary ── */}
      {totals.length > 0 && (
        <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ mb: 2 }}>
          {totals.map((total: any) => (
            <Paper key={total._id} variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 200 }}>
              <Typography fontSize={12} color="text.secondary">Total Spent ({total._id})</Typography>
              <Typography fontSize={20} fontWeight={800}>{formatMoney(total.charged_amount, total._id)}</Typography>
              {isSuperAdmin && (
                <Typography fontSize={12} color="text.secondary">
                  Cost {formatMoney(total.provider_cost, total._id)} · Profit {formatMoney(total.platform_profit, total._id)}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* ── Ledger header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
          Transaction History
          {total > 0 && (
            <Typography component="span" fontSize={13} fontWeight={400} color="text.secondary" sx={{ ml: 1 }}>
              ({((page - 1) * PAGE_SIZE + 1)}–{Math.min(page * PAGE_SIZE, total)} of {total})
            </Typography>
          )}
        </Typography>
        <Stack direction="row" gap={1}>
          <Select size="small" value={type} onChange={handleFilterChange(setType)}>
            <MenuItem value="ALL">All types</MenuItem>
            <MenuItem value="TOPUP">Top-up</MenuItem>
            <MenuItem value="AI_CONVERSATION">AI</MenuItem>
            <MenuItem value="TEMPLATE_MESSAGE">Templates</MenuItem>
          </Select>
          <Select size="small" value={status} onChange={handleFilterChange(setStatus)}>
            <MenuItem value="ALL">All status</MenuItem>
            <MenuItem value="CAPTURED">Captured</MenuItem>
            <MenuItem value="HELD">Held</MenuItem>
            <MenuItem value="RELEASED">Released</MenuItem>
          </Select>
        </Stack>
      </Stack>

      {/* ── Transaction Table ── */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                <Tooltip title="Meta's base template / AI cost">
                  <span>Meta Cost</span>
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>
                <Tooltip title="Platform commission charged on top of Meta cost">
                  <span>Commission</span>
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Amount</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {ledgerLoading ? (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No transactions yet
                </TableCell>
              </TableRow>
            ) : rows.map((row: any) => {
              const cur = row.currency || 'INR';
              const cost = providerCost(row);
              const commission = Number(row.commission_amount || 0);
              const contact = row.contact_id;
              const isTopup = row.type === 'TOPUP';

              return (
                <TableRow key={row._id} hover>
                  {/* Date */}
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>
                    {new Date(row.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Typography fontSize={13} fontWeight={600}>{describeCharge(row)}</Typography>
                    {row.template_category && (
                      <Typography fontSize={11} color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {row.template_category.toLowerCase()}
                      </Typography>
                    )}
                    {(row.input_tokens || row.output_tokens) ? (
                      <Typography fontSize={11} color="text.secondary">
                        {row.input_tokens || 0} in / {row.output_tokens || 0} out tokens
                      </Typography>
                    ) : null}
                  </TableCell>

                  {/* Contact */}
                  <TableCell sx={{ fontSize: 12.5 }}>
                    {contact?.name || contact?.phone || '—'}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.status}
                      color={STATUS_COLOR[row.status] || 'default'}
                      variant="outlined"
                      sx={{ fontSize: 11, height: 20 }}
                    />
                  </TableCell>

                  {/* Meta Cost */}
                  <TableCell align="right">
                    {isTopup ? (
                      <Typography fontSize={12} color="text.disabled">—</Typography>
                    ) : (
                      <Typography fontSize={12.5} color="text.secondary">
                        {formatMoney(cost, cur)}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Commission */}
                  <TableCell align="right">
                    {isTopup || commission === 0 ? (
                      <Typography fontSize={12} color="text.disabled">—</Typography>
                    ) : (
                      <Tooltip title={`${row.commission_percent ?? 0}% platform fee`}>
                        <Typography fontSize={12.5} color="warning.dark" fontWeight={600}>
                          +{formatMoney(commission, cur)}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* Total Amount */}
                  <TableCell align="right">
                    <Typography
                      fontSize={13}
                      fontWeight={700}
                      color={isTopup ? 'success.main' : 'text.primary'}
                    >
                      {isTopup ? '+' : '-'}{formatMoney(row.amount, cur)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <TopupModal open={topupOpen} onClose={() => setTopupOpen(false)} currency={currency} />
    </Box>
  );
};

export default Wallet;
