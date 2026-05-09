import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';

const fetchTeam = async () => {
  const res = await axios.get('/team/');
  return res.data.users;
};

const fetchLimits = async () => {
  const res = await axios.get('/team/limits');
  return res.data;
};

const emptyForm = { name: '', email: '', phone: '', password: '' };

const UsersPage = () => {
  const qc = useQueryClient();
  const { impersonate } = useAuth() as any;

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const showToast = (message: string, severity: 'success' | 'error' = 'success') =>
    setToast({ open: true, message, severity });

  const { data: members = [], isLoading } = useQuery({ queryKey: ['team'], queryFn: fetchTeam });
  const { data: limits } = useQuery({ queryKey: ['account-limits'], queryFn: fetchLimits });

  const addUser = useMutation({
    mutationFn: (data: typeof form) => axios.post('/team/', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['account-limits'] });
      setAddOpen(false);
      setForm(emptyForm);
      showToast('User added successfully');
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to add user', 'error'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      axios.patch(`/team/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
    onError: () => showToast('Failed to update user', 'error'),
  });

  const removeUser = useMutation({
    mutationFn: (id: string) => axios.delete(`/team/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['account-limits'] });
      showToast('User removed');
    },
    onError: () => showToast('Failed to remove user', 'error'),
  });

  const handleImpersonate = async (userId: string, name: string) => {
    try {
      await impersonate(userId);
      showToast(`Now viewing as ${name}`);
    } catch {
      showToast('Failed to impersonate user', 'error');
    }
  };

  const maxUsers = limits?.limits?.users ?? null;
  const usedUsers = limits?.usage?.users ?? members.length;
  const atLimit = maxUsers !== null && maxUsers !== -1 && usedUsers >= maxUsers;

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Team Members</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users in your account
          </Typography>
        </Box>
        <Tooltip title={atLimit ? `User limit reached (${maxUsers}). Upgrade your plan to add more.` : ''}>
          <span>
            <Button
              variant="contained"
              onClick={() => setAddOpen(true)}
              disabled={atLimit}
            >
              + Add User
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* Plan Usage Bar */}
      {limits && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={4}>
            <UsageStat label="Users" used={limits.usage?.users} max={limits.limits?.users} />
            <UsageStat label="Channels" used={limits.usage?.channels} max={limits.limits?.channels} />
            <UsageStat label="Automations" used={limits.usage?.automations} max={limits.limits?.automations} />
            <Box>
              <Typography variant="caption" color="text.secondary">Plan</Typography>
              <Typography fontWeight={700} textTransform="capitalize">{limits.plan_type}</Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {isLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><b>Name</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Phone</b></TableCell>
                <TableCell align="center"><b>Active</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m: any) => (
                <TableRow key={m._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{m.name?.[0]}</Avatar>
                      <Box>
                        <Typography>{m.name}</Typography>
                        <Chip
                          label={m.role}
                          size="small"
                          color={m.role === 'owner' ? 'primary' : 'default'}
                          sx={{ height: 16, fontSize: 10 }}
                        />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.phone}</TableCell>
                  <TableCell align="center">
                    {m.role === 'user' ? (
                      <Switch
                        checked={m.is_active !== false}
                        size="small"
                        onChange={(e) => toggleActive.mutate({ id: m._id, is_active: e.target.checked })}
                      />
                    ) : (
                      <Chip label="Owner" size="small" color="primary" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {m.role === 'user' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleImpersonate(m._id, m.name)}
                          >
                            Login As
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => {
                              if (window.confirm(`Remove ${m.name} from the team?`)) {
                                removeUser.mutate(m._id);
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={3}>No team members yet. Add your first user.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add User Dialog */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setForm(emptyForm); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography variant="h5" fontWeight={700}>Add Team Member</Typography>
          <Typography variant="body2" color="text.secondary">They will be able to log in with these credentials.</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={2}>
            <TextField
              label="Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth required placeholder="e.g. Rahul Sharma"
              size="small"
            />
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                fullWidth required size="small"
              />
              <TextField
                label="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                fullWidth required size="small" placeholder="+91..."
              />
            </Stack>
            <TextField
              label="Password" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth required size="small"
              helperText="Minimum 8 characters recommended"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setAddOpen(false); setForm(emptyForm); }} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={addUser.isPending || !form.name || !form.email || !form.phone || !form.password}
            onClick={() => addUser.mutate(form)}
          >
            {addUser.isPending ? 'Adding…' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const UsageStat = ({ label, used, max }: { label: string; used: number; max: number }) => {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min((used / max) * 100, 100);
  return (
    <Box minWidth={120}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={700}>{used} / {unlimited ? '∞' : max}</Typography>
      {!unlimited && <LinearProgress variant="determinate" value={pct} sx={{ mt: 0.5, height: 4, borderRadius: 2 }} color={pct >= 90 ? 'error' : 'primary'} />}
    </Box>
  );
};

export default UsersPage;
