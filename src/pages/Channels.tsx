import { Box, Button, CircularProgress, Fade, Grid, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useQuery } from '@tanstack/react-query';
import ChannelCard from 'components/ChannelCard';
import { channelService } from 'service/channel.service';
import { ChannelT } from 'types/channels';

const connectWhatsApp = () => {
  window.location.href =
    'https://business.facebook.com/messaging/whatsapp/onboard/?app_id=1577064810024190&config_id=1496415178861183&extras=%7B%22sessionInfoVersion%22%3A%223%22%2C%22version%22%3A%22v4%22%7D';
};

const Channels = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelService.getChannels(),
    select: (response) => response.data,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#25D366' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography color="error">{(error as Error).message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 3 }}>

      {/* ── PAGE HEADER ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: -0.4, mb: 0.5 }}>
            Channels
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: '#6b7280' }}>
            Manage your WhatsApp business channels
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
          onClick={connectWhatsApp}
          sx={{
            bgcolor: '#25D366',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            textTransform: 'none',
            boxShadow: '0 2px 10px rgba(37,211,102,0.35)',
            '&:hover': { bgcolor: '#1db954', boxShadow: '0 4px 14px rgba(37,211,102,0.45)' },
          }}
        >
          Connect WhatsApp
        </Button>
      </Box>

      {/* ── CHANNEL CARDS ── */}
      {data?.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography fontSize={48} lineHeight={1} mb={2}>📡</Typography>
          <Typography fontSize={16} fontWeight={700} color="#374151" mb={0.75}>No channels yet</Typography>
          <Typography fontSize={13} color="#9ca3af">Connect a WhatsApp number to get started</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {data?.map((channel: ChannelT, index: number) => (
            <Grid item xs={12} sm={6} lg={4} key={channel._id}>
              <Fade in timeout={350} style={{ transitionDelay: `${index * 80}ms` }}>
                <Box>
                  <ChannelCard channel={channel} />
                </Box>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Channels;
