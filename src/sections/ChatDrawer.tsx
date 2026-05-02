import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  OutlinedInput,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { channelService } from 'service/channel.service';
import UserList from './UserList';
import { UserProfile } from 'types/user-profile';
import { CreateContactModal } from 'components/chat/CreateContactModel';
import { contactService } from 'service/contact.service';

interface ChatDrawerProps {
  setUser: (u: UserProfile) => void;
  selectedUserId?: string | null;
}

function ChatDrawer({ setUser, selectedUserId }: ChatDrawerProps) {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [channelId, setChannelId] = useState<string>('');

  const { data } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelService.getChannels(),
  });

  const {
    data: contactData,
    isLoading: contactLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: contactRefetch,
  } = useInfiniteQuery({
    queryKey: ['contacts', debouncedSearch, channelId],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const res = await contactService.getContacts(
        channelId,
        debouncedSearch,
        pageParam as string | undefined,
        20
      );
      return res;
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
    enabled: !!channelId,
  });

  const contacts = contactData?.pages?.flatMap((page: any) => page.data) || [];
  const channels = data?.data || [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (channels.length && !channelId) setChannelId(channels[0]._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels]);

  useEffect(() => {
    if (!selectedUserId || !contacts.length) return;
    const selected = contacts.find((c: any) => c._id === selectedUserId);
    if (selected) setUser(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, contactData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>

      {/* ── HEADER ── */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: -0.3 }}>Chats</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Tooltip title="Import contacts" arrow>
              <IconButton
                size="small"
                component="label"
                sx={{ color: '#6b7280', '&:hover': { color: '#374151', bgcolor: '#f3f4f6' }, borderRadius: '8px' }}
              >
                <FileUploadOutlinedIcon sx={{ fontSize: 18 }} />
                <input
                  type="file" hidden accept=".csv,.xlsx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !channelId) return;
                    await contactService.importContacts(channelId, file);
                    contactRefetch();
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export contacts" arrow>
              <IconButton
                size="small"
                onClick={async () => {
                  if (!channelId) return;
                  const res = await contactService.exportContacts(channelId);
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'contacts.csv');
                  document.body.appendChild(link);
                  link.click();
                }}
                sx={{ color: '#6b7280', '&:hover': { color: '#374151', bgcolor: '#f3f4f6' }, borderRadius: '8px' }}
              >
                <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="New contact" arrow>
              <IconButton
                size="small"
                onClick={() => setContactModalOpen(true)}
                sx={{
                  color: '#fff', bgcolor: '#25D366', '&:hover': { bgcolor: '#1db954' },
                  borderRadius: '8px', p: 0.7,
                }}
              >
                <PersonAddOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Channel selector */}
        <Autocomplete
          size="small"
          options={channels}
          value={channels.find((c: any) => c._id === channelId) || null}
          getOptionLabel={(option: any) => option?.channel_name || option?.display_phone_number || ''}
          onChange={(_e, value: any) => setChannelId(value?._id || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select channel..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12.5, bgcolor: '#f9fafb' } }}
            />
          )}
          sx={{ mb: 1.25 }}
        />

        {/* Search */}
        <OutlinedInput
          fullWidth
          size="small"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 17, color: '#9ca3af' }} />
            </InputAdornment>
          }
          sx={{
            borderRadius: '20px', fontSize: 13, bgcolor: '#f3f4f6',
            '& fieldset': { border: 'none' },
            '& .MuiOutlinedInput-input': { py: 0.75 },
          }}
        />
      </Box>

      {/* ── CONTACTS LIST ── */}
      <Box
        sx={{ flex: 1, overflowY: 'auto', borderTop: '1px solid #f3f4f6' }}
        onScroll={(e: any) => {
          const t = e.target;
          if (t.scrollTop + t.clientHeight >= t.scrollHeight - 50 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      >
        <UserList
          setUser={setUser}
          data={contacts}
          isLoading={contactLoading}
          refetch={contactRefetch}
          selectedUserId={selectedUserId || undefined}
        />
        {isFetchingNextPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
            <CircularProgress size={16} sx={{ color: '#25D366' }} />
          </Box>
        )}
      </Box>

      {contactModalOpen && (
        <CreateContactModal
          contactCreateRefresh={contactRefetch}
          contactModalOpen={contactModalOpen}
          handleClose={() => setContactModalOpen(false)}
          channelId={channelId}
        />
      )}
    </Box>
  );
}

export default ChatDrawer;
