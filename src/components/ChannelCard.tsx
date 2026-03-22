import {
    Button,
    Stack,
    Typography,
    Chip
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useNavigate } from 'react-router-dom';
import MainCard from 'components/MainCard';
import { ChannelT } from 'types/channels';

const ChannelCard = ({ channel }: { channel: ChannelT }) => {
    const navigate = useNavigate();

    return (
        <MainCard
            sx={{
                height: 1,
                '& .MuiCardContent-root': {
                    height: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Top */}
            <Stack direction="row" spacing={1.5} alignItems="center">
                <WhatsAppIcon color="success" />

                <Stack>
                    <Typography variant="h6">
                        {channel.channel_name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        {channel.display_phone_number}
                    </Typography>
                </Stack>
            </Stack>

            {/* Status */}
            <Stack direction="row" mt={2}>
                <Chip
                    label={channel.is_active ? 'Active' : 'Inactive'}
                    color={channel.is_active ? 'success' : 'default'}
                    size="small"
                />
            </Stack>

            {/* Footer */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 'auto', pt: 2 }}
            >
                <Typography variant="caption" color="secondary">
                    Updated: {new Date(channel.createdAt).toLocaleDateString()}
                </Typography>

                <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                        navigate(`/channels/${channel._id}`)
                    }
                >
                    Manage Templates
                </Button>
            </Stack>
        </MainCard>
    );
};

export default ChannelCard;