import { Box, Button, Chip, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { useNavigate } from 'react-router-dom';
import { ChannelT } from 'types/channels';

const ChannelCard = ({ channel }: { channel: ChannelT }) => {
  const navigate = useNavigate();

  return (
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

        {/* Header: icon + name + status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 14.5, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}
                noWrap
              >
                {channel.channel_name}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.25 }} noWrap>
                WhatsApp Business
              </Typography>
            </Box>
          </Box>

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
              flexShrink: 0,
            }}
          />
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
      </Box>
    </Box>
  );
};

export default ChannelCard;
