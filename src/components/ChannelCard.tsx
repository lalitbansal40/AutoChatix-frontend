import { useState, useRef } from 'react';
import { Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputBase, ListItemIcon, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChannelT } from 'types/channels';
import { channelService } from 'service/channel.service';
import useAuth from 'hooks/useAuth';

const ChannelCard = ({ channel }: { channel: ChannelT }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isImpersonating } = useAuth() as any;
  const isSuperAdmin = user?.role === 'superadmin' || isImpersonating;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(channel.channel_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // 3-dot menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  // Confirm dialogs
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleSyncHistory = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await channelService.syncHistory(channel._id);
      setSyncMsg(res.message || 'Triggered!');
    } catch (e: any) {
      setSyncMsg(e?.response?.data?.message || 'Failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 4000);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      await channelService.disconnectChannel(channel._id);
      await queryClient.invalidateQueries({ queryKey: ['channels'] });
      setConfirmDisconnect(false);
    } catch (e: any) {
      setActionError(e?.response?.data?.message || 'Failed to disconnect');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      await channelService.deleteChannel(channel._id);
      await queryClient.invalidateQueries({ queryKey: ['channels'] });
      setConfirmDelete(false);
    } catch (e: any) {
      setActionError(e?.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    setName(channel.channel_name);
    setError('');
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const cancelEdit = () => {
    setEditing(false);
    setName(channel.channel_name);
    setError('');
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Name cannot be empty'); return; }
    if (trimmed === channel.channel_name) { setEditing(false); return; }

    setSaving(true);
    try {
      await channelService.updateChannelName(channel._id, trimmed);
      await queryClient.invalidateQueries({ queryKey: ['channels'] });
      setEditing(false);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid #e5e7eb',
        bgcolor: '#fff',
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Green top accent bar */}
      <Box sx={{ height: 4, bgcolor: '#25D366' }} />

      <Box sx={{ p: 2.5 }}>

        {/* Header: icon + name + status + menu */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1, mr: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <WhatsAppIcon sx={{ color: '#25D366', fontSize: 24 }} />
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              {editing ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InputBase
                      inputRef={inputRef}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancelEdit(); }}
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#111827',
                        flex: 1,
                        border: '1px solid #25D366',
                        borderRadius: '6px',
                        px: 1,
                        py: 0.25,
                        '& input': { p: 0 },
                      }}
                      autoFocus
                    />
                    {saving ? (
                      <CircularProgress size={16} sx={{ color: '#25D366', mx: 0.5 }} />
                    ) : (
                      <>
                        <Tooltip title="Save">
                          <IconButton size="small" onClick={save} sx={{ color: '#25D366', p: 0.4 }}>
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton size="small" onClick={cancelEdit} sx={{ color: '#9ca3af', p: 0.4 }}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                  {error && <Typography sx={{ fontSize: 10.5, color: '#ef4444', mt: 0.25 }}>{error}</Typography>}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    sx={{ fontSize: 14.5, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}
                    noWrap
                  >
                    {channel.channel_name}
                  </Typography>
                  <Tooltip title="Edit name">
                    <IconButton size="small" onClick={startEdit} sx={{ color: '#9ca3af', p: 0.3, opacity: 0, '.MuiBox-root:hover &': { opacity: 1 }, '&:hover': { color: '#25D366' } }}>
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.25 }} noWrap>
                WhatsApp Business
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Chip
              label={channel.is_active ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: channel.is_active ? '#f0fdf4' : '#f9fafb',
                color: channel.is_active ? '#16a34a' : '#9ca3af',
                border: `1px solid ${channel.is_active ? '#bbf7d0' : '#e5e7eb'}`,
                borderRadius: '6px',
              }}
            />
            {(user?.role === 'admin' || user?.role === 'superadmin' || isImpersonating) && (
              <Tooltip title="More options">
                <IconButton
                  size="small"
                  onClick={(e) => { setMenuAnchor(e.currentTarget); setActionError(''); }}
                  sx={{ p: 0.3, color: '#9ca3af', '&:hover': { color: '#374151' } }}
                >
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Info rows */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 14, color: '#9ca3af', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
              {channel.display_phone_number}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
              Added {new Date(channel.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Typography>
          </Box>
        </Box>

        {/* Action */}
        <Stack gap={1}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => navigate(`/channels/${channel._id}`)}
            sx={{
              borderRadius: '8px',
              fontSize: 12.5,
              fontWeight: 700,
              textTransform: 'none',
              borderColor: '#25D366',
              color: '#25D366',
              py: 0.9,
              '&:hover': {
                bgcolor: '#f0fdf4',
                borderColor: '#1db954',
                color: '#1db954',
              },
            }}
          >
            Manage Templates
          </Button>

          {isSuperAdmin && (
            <>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                disabled={syncing}
                onClick={handleSyncHistory}
                startIcon={
                  <SyncIcon
                    sx={{
                      fontSize: '15px !important',
                      animation: syncing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                    }}
                  />
                }
                sx={{
                  borderRadius: '8px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  py: 0.9,
                  '&:hover': { bgcolor: '#eef2ff', borderColor: '#4f46e5', color: '#4f46e5' },
                  '&.Mui-disabled': { borderColor: '#c7d2fe', color: '#a5b4fc' },
                }}
              >
                {syncing ? 'Syncing…' : 'Sync History'}
              </Button>
              {syncMsg && (
                <Typography sx={{ fontSize: 11, textAlign: 'center', color: syncMsg === 'Failed' ? '#ef4444' : '#16a34a' }}>
                  {syncMsg}
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Box>

    {/* ── 3-dot Menu ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: '10px', minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => { setMenuAnchor(null); setConfirmDisconnect(true); }}
          sx={{ fontSize: 13, color: '#d97706', py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <LinkOffIcon sx={{ fontSize: 17, color: '#d97706' }} />
          </ListItemIcon>
          Disconnect
        </MenuItem>
        <MenuItem
          onClick={() => { setMenuAnchor(null); setConfirmDelete(true); }}
          sx={{ fontSize: 13, color: '#dc2626', py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <DeleteOutlineIcon sx={{ fontSize: 17, color: '#dc2626' }} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* ── Disconnect Confirm Dialog ── */}
      <Dialog open={confirmDisconnect} onClose={() => !actionLoading && setConfirmDisconnect(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
          Disconnect Channel?
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5} color="#374151" lineHeight={1.7}>
            <strong>{channel.channel_name}</strong> ({channel.display_phone_number}) will be deactivated.
            All data (messages, templates, contacts) will be kept — you can reconnect later.
          </Typography>
          {actionError && <Typography fontSize={12} color="#dc2626" mt={1}>{actionError}</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button size="small" onClick={() => setConfirmDisconnect(false)} disabled={actionLoading}
            sx={{ textTransform: 'none', color: '#6b7280' }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleDisconnect} disabled={actionLoading}
            sx={{ textTransform: 'none', bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' }, borderRadius: '8px' }}>
            {actionLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={confirmDelete} onClose={() => !actionLoading && setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1, color: '#dc2626' }}>
          Delete Channel?
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5} color="#374151" lineHeight={1.7}>
            This will <strong>permanently delete</strong> <strong>{channel.channel_name}</strong> ({channel.display_phone_number}) from the database.
            This action <strong>cannot be undone</strong>.
          </Typography>
          {actionError && <Typography fontSize={12} color="#dc2626" mt={1}>{actionError}</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button size="small" onClick={() => setConfirmDelete(false)} disabled={actionLoading}
            sx={{ textTransform: 'none', color: '#6b7280' }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleDelete} disabled={actionLoading}
            sx={{ textTransform: 'none', bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: '8px' }}>
            {actionLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChannelCard;
