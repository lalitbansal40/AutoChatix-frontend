import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
  useMediaQuery,
  Button
} from '@mui/material';

import { Autocomplete, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { channelService } from 'service/channel.service';
// project imports
import UserList from './UserList';
import MainCard from 'components/MainCard';
import SimpleBar from 'components/third-party/SimpleBar';
import { useInfiniteQuery } from '@tanstack/react-query';
// assets
import {
  SearchOutlined
} from '@ant-design/icons';

// types
import { UserProfile } from 'types/user-profile';
import { ThemeMode } from 'types/config';
import { CreateContactModal } from 'components/chat/CreateContactModel';
import { contactService } from 'service/contact.service';

// ==============================|| CHAT DRAWER ||============================== //

interface ChatDrawerProps {
  handleDrawerOpen: () => void;
  openChatDrawer: boolean | undefined;
  setUser: (u: UserProfile) => void;
  selectedUserId?: string | null; //   ADD
}

function ChatDrawer({ handleDrawerOpen, openChatDrawer, setUser, selectedUserId }: ChatDrawerProps) {
  const theme = useTheme();
  const matchDownLG = useMediaQuery(theme.breakpoints.down('lg'));
  const drawerBG = theme.palette.mode === ThemeMode.DARK ? 'dark.main' : 'white';
  const [contactModalOpen, setContactModalOpen] = useState(false);



  const [search, setSearch] = useState<string | undefined>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [channelId, setChannelId] = useState<string>('');

  const { data } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelService.getChannels()
  });

  const {
    data: contactData,
    isLoading: contactLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: contactRefetch
  } = useInfiniteQuery({
    queryKey: ['contacts', debouncedSearch, channelId],
    initialPageParam: null, // 🔥 THIS IS REQUIRED
    queryFn: async ({ pageParam }) => {
      const res = await contactService.getContacts(
        channelId,
        debouncedSearch,
        pageParam as string | undefined,
        20
      );
      return res;
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.nextCursor || undefined;
    },
    enabled: !!channelId
  });

  const contacts =
    contactData?.pages?.flatMap((page: any) => page.data) || [];
  const channels = data?.data || [];

  const handleSearch = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined) => {
    const newString = event?.target.value;
    setSearch(newString);
  };

  const handleOpen = () => setContactModalOpen(true);
  const handleClose = () => setContactModalOpen(false);


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search || "");
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (channels.length && !channelId) {
      setChannelId(channels[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels]);

  useEffect(() => {
    if (!selectedUserId || !contacts.length) return;

    const selected = contacts.find(
      (c: any) => c._id === selectedUserId
    );
    if (selected) {
      setUser(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, contactData]);

  return (
    <Drawer
      sx={{
        width: 320,
        flexShrink: 0,
        zIndex: { xs: 1100, lg: 0 },
        '& .MuiDrawer-paper': {
          height: matchDownLG ? '100%' : 'auto',
          width: 320,
          boxSizing: 'border-box',
          position: 'relative',
          border: 'none'
        }
      }}
      variant={matchDownLG ? 'temporary' : 'persistent'}
      anchor="left"
      open={openChatDrawer}
      ModalProps={{ keepMounted: true }}
      onClose={handleDrawerOpen}
    >
      <MainCard
        sx={{
          bgcolor: matchDownLG ? 'transparent' : drawerBG,
          borderRadius: '4px 0 0 4px',
          borderRight: 'none'
        }}
        border={!matchDownLG}
        content={false}
      >
        <Box sx={{ p: 3, pb: 1 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="h5" color="inherit">
                Messages
              </Typography>
            </Stack>

            <Stack spacing={2}>

              {/* CHANNEL SELECT */}
              <Autocomplete
                size="small"
                options={channels}
                value={channels.find((c: any) => c._id === channelId) || null}
                getOptionLabel={(option: any) =>
                  option?.channel_name || option?.display_phone_number || ''
                }
                onChange={(e, value: any) => {
                  setChannelId(value?._id || null);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Channel" />
                )}
              />

              <Button
                variant="contained"
                onClick={handleOpen}
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 2
                }}
              >
                + Add New Contact
              </Button>

              {/* SEARCH */}
              <OutlinedInput
                fullWidth
                placeholder="Search"
                value={search}
                onChange={handleSearch}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchOutlined style={{ fontSize: 'small' }} />
                  </InputAdornment>
                }
              />

              <Button variant="outlined" component="label" fullWidth>
                Import Contacts
                <input
                  type="file"
                  hidden
                  accept=".csv,.xlsx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !channelId) return;

                    await contactService.importContacts(channelId, file);
                    contactRefetch();
                  }}
                />
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={async () => {
                  if (!channelId) return;

                  const res = await contactService.exportContacts(channelId);

                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "contacts.csv");
                  document.body.appendChild(link);
                  link.click();
                }}
              >
                Export Contacts
              </Button>

            </Stack>
          </Stack>
        </Box>

        <SimpleBar
          onScroll={(e: any) => {
            const target = e.target;

            if (
              target.scrollTop + target.clientHeight >= target.scrollHeight - 50 &&
              hasNextPage &&
              !isFetchingNextPage
            ) {
              fetchNextPage(); // 🔥 pagination trigger
            }
          }}
          sx={{
            overflowX: 'hidden',
            height: matchDownLG ? 'calc(100vh - 120px)' : 'calc(100vh - 428px)',
            minHeight: matchDownLG ? 0 : 530
          }}
        >
          <Box sx={{ p: 3, pt: 0 }}>
            <UserList
              setUser={setUser}
              data={contacts} // 🔥 IMPORTANT
              isLoading={contactLoading}
              refetch={contactRefetch}
              selectedUserId={selectedUserId || undefined}
            />
          </Box>
        </SimpleBar>
      </MainCard>
      {contactModalOpen && <CreateContactModal contactCreateRefresh={contactRefetch} contactModalOpen={contactModalOpen} handleClose={handleClose} channelId={channelId} />}

    </Drawer>
  );
}

export default ChatDrawer;
