import { Button, Stack, Typography, Chip, Avatar } from '@mui/material';
import {
  ApiOutlined,
  FileExcelOutlined,
  CarOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { IntegrationT } from 'types/integration';

type SlugMeta = {
  label: string;
  icon: React.ReactNode;
  color: string;
};

const SLUG_META: Record<string, SlugMeta> = {
  razorpay: {
    label: 'Razorpay',
    icon: <CreditCardOutlined style={{ fontSize: 20, color: '#2563eb' }} />,
    color: '#eff6ff',
  },
  borzo: {
    label: 'Borzo',
    icon: <CarOutlined style={{ fontSize: 20, color: '#16a34a' }} />,
    color: '#f0fdf4',
  },
  google_sheet: {
    label: 'Google Sheets',
    icon: <FileExcelOutlined style={{ fontSize: 20, color: '#15803d' }} />,
    color: '#f0fdf4',
  },
};

const DEFAULT_META: SlugMeta = {
  label: '',
  icon: <ApiOutlined style={{ fontSize: 20, color: '#6b7280' }} />,
  color: '#f9fafb',
};

const formatSlug = (slug: string) =>
  slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const IntegrationCard = ({
  integration,
  onDisconnect,
}: {
  integration: IntegrationT;
  onDisconnect: (id: string) => void;
}) => {
  const meta = SLUG_META[integration.slug] ?? DEFAULT_META;
  const displayName = meta.label || formatSlug(integration.slug);

  return (
    <MainCard
      sx={{
        height: 1,
        '& .MuiCardContent-root': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ bgcolor: meta.color, width: 40, height: 40 }}>
          {meta.icon}
        </Avatar>

        <Stack>
          <Typography variant="h6">{displayName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {integration.config?.environment ?? '—'}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" mt={2}>
        <Chip
          label={integration.is_active ? 'Connected' : 'Disconnected'}
          color={integration.is_active ? 'success' : 'default'}
          size="small"
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 'auto', pt: 2 }}
      >
        <Typography variant="caption" color="secondary">
          Added: {new Date(integration.createdAt).toLocaleDateString()}
        </Typography>

        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={() => onDisconnect(integration._id)}
        >
          Disconnect
        </Button>
      </Stack>
    </MainCard>
  );
};

export default IntegrationCard;
